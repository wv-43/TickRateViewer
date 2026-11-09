#include <sourcemod>
#include <sdktools>
#include <sdkhooks>
#include <cstrike>
#include <ripext>
#include <tickrate>
#pragma semicolon 1
#pragma newdecls required

#define MAXROSTER 10
#define FEED_MAX 16
#define TRADE_SEC 5.0

public Plugin myinfo = { name = "TICKRATE match", author = "TICKRATE", description = "Lance, suit et termine les matchs créés sur le site", version = "1.20.0", url = "" };

enum MatchState { S_Idle, S_Warmup, S_Knife, S_Live, S_Over }

ConVar g_cvUrl, g_cvKey, g_cvServer, g_cvVoice, g_cvAdmins, g_cvKnife, g_cvPassword, g_cvRestart;
Handle g_restartTimer;
MatchState g_state = S_Idle;

char g_matchId[40], g_map[64], g_mode[16];
bool g_test;
int g_testRounds = 2;
bool g_room;
bool g_fill;
int g_slots = 10;
char g_password[32];
bool g_warmupReady;
int g_rosterN;
char g_rSteam[MAXROSTER][24], g_rName[MAXROSTER][64];
int g_rTeam[MAXROSTER];
int g_rElo[MAXROSTER];
bool g_rJoined[MAXROSTER];
char g_rLang[MAXROSTER][4];
char g_rClan[MAXROSTER][8];
bool g_welcomed[MAXROSTER];
float g_fbAt[MAXPLAYERS + 1];
bool g_ready[MAXROSTER];
float g_allInAt;
#define AUTO_READY 120.0
int g_leftAt[MAXROSTER];
char g_botName[MAXROSTER][40];
int g_botPending = -1;
int g_clientIdx[MAXPLAYERS + 1] = { -1, ... };
int g_sideA = CS_TEAM_CT;

int g_k[MAXROSTER], g_a[MAXROSTER], g_d[MAXROSTER], g_dmg[MAXROSTER], g_hs[MAXROSTER], g_kast[MAXROSTER], g_rounds;
bool g_rndKast[MAXROSTER];
int g_hp[MAXPLAYERS + 1];
int g_killedBy[MAXROSTER];
float g_killedAt[MAXROSTER];
float g_ignoreUntil;

int g_knifeWinner = -1;
Handle g_knifeTimer;
int g_oldButtons[MAXPLAYERS + 1];

int g_feedN;
char g_feedK[FEED_MAX][24], g_feedV[FEED_MAX][24], g_feedW[FEED_MAX][32];
bool g_feedHs[FEED_MAX];

public void OnPluginStart() {
	g_cvUrl    = CreateConVar("tr_match_url", "", "URL de gameApi (sans / à la fin)");
	g_cvKey    = CreateConVar("tr_match_key", "", "SERVER_KEY du back-end", FCVAR_PROTECTED);
	g_cvServer = CreateConVar("tr_server_id", "s1", "Identifiant de ce serveur dans servers/<id>");
	g_cvVoice  = CreateConVar("tr_match_voice", "rounds", "Vocal en jeu : rounds | alltalk | team");
	g_cvAdmins = CreateConVar("tr_match_admins", "1", "Les admins SourceMod peuvent entrer en spectateur");
	g_cvKnife  = CreateConVar("tr_match_knife", "1", "Knife round avant le match (l'équipe gagnante choisit son côté)");
	g_cvPassword = CreateConVar("tr_match_password", "0", "1 = mot de passe serveur en plus de la liste blanche des SteamID");
	g_cvRestart = CreateConVar("tr_match_restart", "1", "Redémarrer le serveur quand il est vide après un match (libère la RAM)");
	AutoExecConfig(true, "tickrate_match");

	HookEvent("round_start", Ev_RoundStart, EventHookMode_PostNoCopy);
	HookEvent("round_end", Ev_RoundEnd);
	HookEvent("player_spawn", Ev_Spawn);
	HookEvent("player_hurt", Ev_Hurt);
	HookEvent("player_death", Ev_Death);
	HookEvent("cs_win_panel_match", Ev_MatchEnd, EventHookMode_PostNoCopy);
	AddCommandListener(Cmd_JoinTeam, "jointeam");
	RegConsoleCmd("sm_r", Cmd_Ready, "Prêt : le match démarre quand tout le monde l'est");
	RegConsoleCmd("sm_ready", Cmd_Ready, "Prêt : le match démarre quand tout le monde l'est");
	RegConsoleCmd("sm_ur", Cmd_Unready, "Plus prêt");
	RegConsoleCmd("sm_unready", Cmd_Unready, "Plus prêt");
	RegAdminCmd("sm_ranktest", Cmd_RankTest, ADMFLAG_GENERIC, "Test de l'annonce de rang : sm_ranktest <ancien 1-18> <nouveau 1-18> [wingman]");
	RegAdminCmd("sm_forcestart", Cmd_ForceStart, ADMFLAG_GENERIC, "Lance le match sans attendre les !r");
	RegConsoleCmd("sm_stay", Cmd_Stay, "Knife round gagné : garder ce côté");
	RegConsoleCmd("sm_switch", Cmd_Switch, "Knife round gagné : changer de côté");
	RegConsoleCmd("sm_help", Cmd_Help, "Liste des commandes TICKRATE");
	RegConsoleCmd("sm_commands", Cmd_Help, "Liste des commandes TICKRATE");
	RegConsoleCmd("sm_feedback", Cmd_Feedback, "Envoyer un avis ou un bug à l'équipe TICKRATE");
	RegConsoleCmd("sm_fb", Cmd_Feedback, "Envoyer un avis ou un bug à l'équipe TICKRATE");
	LoadTranslations("tickrate.phrases");
	RegAdminCmd("sm_tr_status", Cmd_Status, ADMFLAG_GENERIC, "État du match TICKRATE");
	RegAdminCmd("sm_tr_reset", Cmd_Reset, ADMFLAG_ROOT, "Abandonne le match en cours et libère le serveur");

	CreateTimer(5.0, Timer_Poll, _, TIMER_REPEAT);
	CreateTimer(1.0, Timer_HookRanks);
	RandomPassword();
}

public void OnConfigsExecuted() {
	ConVar port = FindConVar("hostport");
	if (port != null) ServerCommand("exec sourcemod/tickrate_match_%d.cfg", port.IntValue);
	EnforcePassword();
	SetHostname();
}
void EnforcePassword() {
	if (g_state == S_Idle) return;
	ConVar cv = FindConVar("sv_password");
	if (cv == null) return;
	char cur[64];
	cv.GetString(cur, sizeof cur);
	if (StrEqual(cur, g_password)) return;
	LogMessage("[TICKRATE] sv_password avait changé (« %s », attendu « %s ») : réappliqué", cur, g_password);
	cv.SetString(g_password);
}

HTTPRequest Api(const char[] path) {
	char url[320], key[128];
	g_cvUrl.GetString(url, sizeof url); g_cvKey.GetString(key, sizeof key);
	if (!url[0]) return null;
	Format(url, sizeof url, "%s%s", url, path);
	HTTPRequest req = new HTTPRequest(url);
	req.SetHeader("X-Server-Key", key);
	return req;
}
void Post(const char[] path, JSONObject body) {
	HTTPRequest req = Api(path);
	if (req != null) req.Post(body, OnPosted);
	delete body;
}
public void OnPosted(HTTPResponse r, any data, const char[] err) {
	if (r.Status != HTTPStatus_OK) LogError("[TICKRATE] réponse %d %s", view_as<int>(r.Status), err);
}

int g_pollTick;
public Action Timer_Poll(Handle t) {
	EnforcePassword();
	if (g_state == S_Over) return Plugin_Continue;
	if ((g_state == S_Knife || g_state == S_Live) && ++g_pollTick % 6 != 0) return Plugin_Continue;
	char path[96], sid[32];
	g_cvServer.GetString(sid, sizeof sid);
	Format(path, sizeof path, "/assignment?server=%s", sid);
	HTTPRequest req = Api(path);
	if (req != null) req.Get(OnAssignment);
	return Plugin_Continue;
}

public void OnAssignment(HTTPResponse r, any data, const char[] err) {
	if (r.Status == HTTPStatus_NoContent) {
		if (g_state == S_Warmup) EndAndFree("Kick cancelled missing");
		else if (g_state == S_Knife || g_state == S_Live) EndAndFree("Kick cancelled");
		return;
	}
	if (r.Status != HTTPStatus_OK || g_state == S_Knife || g_state == S_Live || g_state == S_Over) return;
	JSONObject j = view_as<JSONObject>(r.Data);
	char mid[40];
	j.GetString("matchId", mid, sizeof mid);
	if (!mid[0] || StrEqual(mid, g_matchId)) return;
	LoadMatch(j);
}

void SetHostname() {
	char name[128], map[64];
	if (g_state == S_Idle) { ServerCommand("hostname \"TICKRATE | Matchmaking\""); return; }
	strcopy(map, sizeof map, g_map);
	ReplaceString(map, sizeof map, "de_", "");
	ReplaceString(map, sizeof map, "gd_", "");
	if (map[0] >= 'a' && map[0] <= 'z') map[0] -= 32;
	Format(name, sizeof name, "TICKRATE | %s%s · %s", StrEqual(g_mode, "wingman") ? "Wingman 2v2" : StrEqual(g_mode, "duel") ? "Aim 1v1" : "5v5 Compétitif",
		g_room ? " · Match privé" : g_test ? " · Test" : "", map);
	ServerCommand("hostname \"%s\"", name);
}

void LoadMatch(JSONObject j) {
	char pw[32];
	j.GetString("matchId", g_matchId, sizeof g_matchId);
	j.GetString("map", g_map, sizeof g_map);
	j.GetString("mode", g_mode, sizeof g_mode);
	j.GetString("password", pw, sizeof pw);
	g_test = j.HasKey("test") && j.GetBool("test");
	g_testRounds = j.HasKey("rounds") && j.GetInt("rounds") >= 2 ? j.GetInt("rounds") : 2;
	g_room = j.HasKey("fill");
	g_fill = g_room && j.GetBool("fill");
	g_slots = j.HasKey("slots") ? j.GetInt("slots") : 10;

	JSONArray roster = view_as<JSONArray>(j.Get("roster"));
	g_rosterN = 0;
	for (int i = 0; i < roster.Length && g_rosterN < MAXROSTER; i++) {
		JSONObject p = view_as<JSONObject>(roster.Get(i));
		char team[4];
		p.GetString("steamId", g_rSteam[g_rosterN], sizeof g_rSteam[]);
		p.GetString("name", g_rName[g_rosterN], sizeof g_rName[]);
		p.GetString("team", team, sizeof team);
		if (!p.HasKey("lang") || !p.GetString("lang", g_rLang[g_rosterN], sizeof g_rLang[])) g_rLang[g_rosterN][0] = '\0';
		if (!p.HasKey("clan") || !p.GetString("clan", g_rClan[g_rosterN], sizeof g_rClan[])) g_rClan[g_rosterN][0] = '\0';
		g_welcomed[g_rosterN] = false;
		g_rTeam[g_rosterN] = StrEqual(team, "B") ? 1 : 0;
		g_rElo[g_rosterN] = p.HasKey("elo") ? p.GetInt("elo") : 0;
		g_rJoined[g_rosterN] = false;
		g_ready[g_rosterN] = false;
		g_leftAt[g_rosterN] = -1; g_botName[g_rosterN][0] = '\0';
		g_rosterN++;
		delete p;
	}
	delete roster;
	ResetStats();
	g_sideA = CS_TEAM_CT;
	g_state = S_Warmup;
	g_warmupReady = false;
	g_allInAt = 0.0;
	LogMessage("[TICKRATE] match %s : %s (%s), %d joueurs", g_matchId, g_map, g_mode, g_rosterN);

	strcopy(g_password, sizeof g_password, g_cvPassword.BoolValue ? pw : "");
	ServerCommand("sv_password \"%s\"", g_password);
	ServerCommand("tr_match_id %s", g_matchId);
	SetHostname();
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && !IsFakeClient(c)) CheckClient(c);

	bool wingman = StrEqual(g_mode, "wingman"), duel = StrEqual(g_mode, "duel");
	char want[64];
	strcopy(want, sizeof want, g_map);
	if (wingman && StrEqual(want, "de_nuke")) strcopy(want, sizeof want, "de_shortnuke");
	if (wingman && StrEqual(want, "de_cbble")) strcopy(want, sizeof want, "gd_cbble");
	if (!IsMapValid(want)) {
		static const char WM_SAFE[][] = { "de_shortdust", "de_lake", "de_inferno", "de_overpass", "de_vertigo" };
		static const char CO_SAFE[][] = { "de_mirage", "de_inferno", "de_dust2" };
		static const char DU_SAFE[][] = { "de_shortdust", "de_lake", "de_vertigo" };
		LogError("[TICKRATE] map %s introuvable sur ce serveur : remplacée", want);
		if (duel) { for (int i = 0; i < sizeof DU_SAFE; i++) if (IsMapValid(DU_SAFE[i])) { strcopy(want, sizeof want, DU_SAFE[i]); break; } }
		else if (wingman) { for (int i = 0; i < sizeof WM_SAFE; i++) if (IsMapValid(WM_SAFE[i])) { strcopy(want, sizeof want, WM_SAFE[i]); break; } }
		else { for (int i = 0; i < sizeof CO_SAFE; i++) if (IsMapValid(CO_SAFE[i])) { strcopy(want, sizeof want, CO_SAFE[i]); break; } }
	}
	ConVar gm = FindConVar("game_mode");
	int mode = (wingman || duel) ? 2 : 1;
	char cur[64];
	GetCurrentMap(cur, sizeof cur);
	if (!StrEqual(cur, want) || (gm != null && gm.IntValue != mode)) {
		ServerCommand("game_type 0; game_mode %d", mode);
		ServerCommand("changelevel %s", want);
	} else StartWarmup();
}

public void OnMapStart() {
	CreateTimer(1.0, Timer_HookRanks, _, TIMER_FLAG_NO_MAPCHANGE);
	if (g_state == S_Warmup) CreateTimer(3.0, Timer_Warmup, _, TIMER_FLAG_NO_MAPCHANGE);
	else if (g_state != S_Idle) FreeServer();
}
public Action Timer_Warmup(Handle t) { if (g_state == S_Warmup) StartWarmup(); return Plugin_Stop; }

void ExecModeRules() {
	bool small = StrEqual(g_mode, "wingman") || StrEqual(g_mode, "duel");
	ServerCommand("exec %s", small ? "gamemode_competitive2v2" : "gamemode_competitive");
	ServerCommand("exec tickrate/match.cfg");
	ServerCommand("exec tickrate/live.cfg");
	if (StrEqual(g_mode, "wingman")) ServerCommand("mp_roundtime 1.5; mp_roundtime_defuse 1.5");
	if (StrEqual(g_mode, "duel")) ServerCommand("exec tickrate/duel.cfg");
}

void StartWarmup() {
	ExecModeRules();
	ServerCommand("mp_warmup_pausetimer 1; mp_warmup_start");
	CreateTimer(15.0, Timer_WaitMsg, _, TIMER_REPEAT | TIMER_FLAG_NO_MAPCHANGE);
	CreateTimer(5.0, Timer_AutoReady, _, TIMER_REPEAT | TIMER_FLAG_NO_MAPCHANGE);
	g_warmupReady = true;
	CheckAllJoined();
}
public Action Timer_WaitMsg(Handle t) {
	if (g_state != S_Warmup) return Plugin_Stop;
	if (JoinedCount() < g_rosterN) TrChatAll("%t", "Waiting players", JoinedCount(), g_rosterN);
	else ReadyMessage();
	return Plugin_Continue;
}

bool AllPresent() {
	if (!g_warmupReady || g_rosterN == 0 || JoinedCount() < g_rosterN) return false;
	for (int i = 0; i < g_rosterN; i++) if (ClientOf(i) == -1) return false;
	return true;
}
public Action Timer_AutoReady(Handle t) {
	if (g_state != S_Warmup) return Plugin_Stop;
	if (!AllPresent()) { g_allInAt = 0.0; return Plugin_Continue; }
	if (g_allInAt == 0.0) { g_allInAt = GetGameTime(); TrChatAll("%t", "Auto ready", RoundToNearest(AUTO_READY)); return Plugin_Continue; }
	if (GetGameTime() - g_allInAt < AUTO_READY) return Plugin_Continue;
	for (int i = 0; i < g_rosterN; i++) g_ready[i] = true;
	TrChatAll("%t", "Auto start");
	CheckAllJoined();
	return Plugin_Stop;
}

public void OnClientPostAdminCheck(int client) {
	if (IsFakeClient(client) || IsClientSourceTV(client)) return;
	CheckClient(client);
}
public void OnClientDisconnect(int client) {
	int idx = g_clientIdx[client];
	g_clientIdx[client] = -1;
	if (idx < 0 || IsFakeClient(client) || (g_state != S_Warmup && g_state != S_Knife && g_state != S_Live)) return;
	g_rJoined[idx] = false;
	g_ready[idx] = false;
	if (g_state == S_Live && !g_test) g_leftAt[idx] = g_rounds;
	JSONObject b = new JSONObject();
	b.SetString("matchId", g_matchId);
	b.SetString("steamId", g_rSteam[idx]);
	Post("/left", b);
	if (g_state != S_Warmup) TrChatAll("%t", "Player left", g_rName[idx]);
}

void CheckClient(int client) {
	g_clientIdx[client] = -1;
	if (g_state == S_Idle) {
		if (!IsAdmin(client)) KickClient(client, "%T", "Kick no match", client);
		return;
	}
	char sid[24];
	if (!GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) { KickClient(client, "%T", "Kick no steamid", client); return; }
	int idx = -1;
	for (int i = 0; i < g_rosterN; i++) if (StrEqual(g_rSteam[i], sid)) { idx = i; break; }
	if (idx == -1) {
		if (IsAdmin(client)) { CreateTimer(1.0, Timer_Spec, GetClientUserId(client), TIMER_FLAG_NO_MAPCHANGE); return; }
		KickClient(client, "%T", "Kick not in match", client);
		return;
	}
	g_clientIdx[client] = idx;
	ApplyLang(client);
	ApplyClan(client);
	if (!g_welcomed[idx]) { g_welcomed[idx] = true; CreateTimer(4.0, Timer_Welcome, GetClientUserId(client), TIMER_FLAG_NO_MAPCHANGE); }
	if (g_botName[idx][0]) {
		ServerCommand("bot_kick \"%s\"", g_botName[idx]);
		TrChatAll("%t", "Player back", g_rName[idx]);
		g_botName[idx][0] = '\0';
	}
	g_leftAt[idx] = -1;
	if (!g_rJoined[idx]) {
		g_rJoined[idx] = true;
		JSONObject b = new JSONObject();
		b.SetString("matchId", g_matchId);
		b.SetString("steamId", sid);
		Post("/joined", b);
		TrChatAll("%t", "Player connected", g_rName[idx], JoinedCount(), g_rosterN);
	}
	CreateTimer(1.0, Timer_Team, GetClientUserId(client), TIMER_FLAG_NO_MAPCHANGE);
	CheckAllJoined();
}
void ApplyLang(int client) {
	int idx = g_clientIdx[client];
	if (idx < 0 || !g_rLang[idx][0]) return;
	int l = GetLanguageByCode(g_rLang[idx]);
	if (l >= 0 && GetClientLanguage(client) != l) SetClientLanguage(client, l);
}
void ApplyClan(int client) {
	int idx = g_clientIdx[client];
	if (idx < 0 || !g_rClan[idx][0] || !IsClientInGame(client) || IsFakeClient(client)) return;
	char tag[12];
	Format(tag, sizeof tag, "[%s]", g_rClan[idx]);
	CS_SetClientClanTag(client, tag);
}
public Action Timer_Welcome(Handle t, any userid) {
	int c = GetClientOfUserId(userid);
	if (c < 1) return Plugin_Stop;
	TrChat(c, "%t", "Welcome 1");
	TrChat(c, "%t", "Welcome 2");
	TrChat(c, "%t", "Welcome 3");
	return Plugin_Stop;
}
bool IsAdmin(int client) { return g_cvAdmins.BoolValue && CheckCommandAccess(client, "sm_tr_status", ADMFLAG_GENERIC); }

int SideOf(int idx) { return g_rTeam[idx] == 0 ? g_sideA : (g_sideA == CS_TEAM_CT ? CS_TEAM_T : CS_TEAM_CT); }
public Action Timer_Team(Handle t, any userid) {
	int client = GetClientOfUserId(userid);
	if (client < 1 || g_clientIdx[client] < 0) return Plugin_Stop;
	int side = SideOf(g_clientIdx[client]);
	if (GetClientTeam(client) != side) ChangeClientTeam(client, side);
	return Plugin_Stop;
}
public Action Timer_Spec(Handle t, any userid) {
	int client = GetClientOfUserId(userid);
	if (client > 0) ChangeClientTeam(client, CS_TEAM_SPECTATOR);
	return Plugin_Stop;
}
public Action Cmd_JoinTeam(int client, const char[] cmd, int argc) {
	if (client < 1 || g_state == S_Idle) return Plugin_Continue;
	if (g_clientIdx[client] < 0) return IsAdmin(client) ? Plugin_Continue : Plugin_Handled;
	int side = SideOf(g_clientIdx[client]);
	if (GetClientTeam(client) != side) ChangeClientTeam(client, side);
	return Plugin_Handled;
}

int JoinedCount() { int n = 0; for (int i = 0; i < g_rosterN; i++) if (g_rJoined[i]) n++; return n; }

void CheckAllJoined() {
	if (g_state != S_Warmup || !g_warmupReady || g_rosterN == 0 || JoinedCount() < g_rosterN) return;
	for (int i = 0; i < g_rosterN; i++) if (ClientOf(i) == -1) return;
	if (ReadyCount() < g_rosterN) { ReadyMessage(); return; }
	if (g_test) { StartTest(); return; }
	if (g_cvKnife.BoolValue && !StrEqual(g_mode, "duel")) { StartKnife(); return; }
	TrChatAll("%t", "Match starts");
	ServerCommand("mp_warmup_pausetimer 0; mp_warmup_end");
	StartLive();
}
#define END_DELAY 30
void StartLive() {
	g_state = S_Live;
	ServerCommand("tv_delay 90");
	ServerCommand("mp_match_restart_delay %d", END_DELAY);
	ResetStats();
	g_ignoreUntil = GetGameTime() + 6.0;
	char voice[16];
	g_cvVoice.GetString(voice, sizeof voice);
	ServerCommand("exec tickrate/voice_%s.cfg", voice);
	ServerCommand("tr_vigie_start");
}

void StartTest() {
	int half = StrEqual(g_mode, "duel") ? 1 : StrEqual(g_mode, "wingman") ? 2 : 5;
	LogMessage("[TICKRATE] match de test %s : %d bots côté %s", g_matchId, half, g_sideA == CS_TEAM_CT ? "T" : "CT");
	if (g_room) TrChatAll("%t", "Private match", g_testRounds);
	else TrChatAll("%t", "Test match", g_testRounds);
	ServerCommand("tv_stoprecord; tv_delay 0; bot_chatter off; sv_forcepreload 0");
	ServerCommand("mp_maxrounds %d; mp_overtime_enable 1; mp_overtime_maxrounds 2; mp_overtime_limit 0; mp_halftime %d; mp_freezetime 15", g_testRounds, g_testRounds >= 4 ? 1 : 0);
	if (g_room && g_fill)
		ServerCommand("bot_difficulty 1; bot_join_after_player 0; bot_join_team any; bot_quota_mode fill; bot_quota %d", g_slots);
	else if (g_room)
		ServerCommand("bot_quota 0; bot_kick");
	else
		ServerCommand("bot_difficulty 1; bot_join_after_player 0; bot_join_team %s; bot_quota_mode normal; bot_quota %d", g_sideA == CS_TEAM_CT ? "T" : "CT", half);
	ServerCommand("mp_warmup_pausetimer 0; mp_warmup_end");
	ServerCommand("tr_skins_test 1");
	ServerCommand("mp_match_restart_delay %d", END_DELAY);
	g_state = S_Live;
	ResetStats();
	g_ignoreUntil = GetGameTime() + 6.0;
}

void StartKnife() {
	g_state = S_Knife; g_knifeWinner = -1;
	g_ignoreUntil = GetGameTime() + 6.0;
	TrChatAll("%t", "Knife start");
	ServerCommand("exec tickrate/knife.cfg");
	ServerCommand("mp_warmup_pausetimer 0; mp_warmup_end");
}
public Action Timer_KnifeOnly(Handle t, any userid) {
	int c = GetClientOfUserId(userid);
	if (c < 1 || g_state != S_Knife || !IsPlayerAlive(c)) return Plugin_Stop;
	for (int slot = 0; slot < 5; slot++) {
		if (slot == CS_SLOT_KNIFE) continue;
		int w;
		while ((w = GetPlayerWeaponSlot(c, slot)) != -1) { RemovePlayerItem(c, w); AcceptEntityInput(w, "Kill"); }
	}
	int knife = GetPlayerWeaponSlot(c, CS_SLOT_KNIFE);
	if (knife != -1) EquipPlayerWeapon(c, knife);
	return Plugin_Stop;
}
void KnifeRoundWon(int winnerSide) {
	UpdateSideA();
	g_knifeWinner = winnerSide == g_sideA ? 0 : 1;
	ServerCommand("mp_pause_match");
	char cap[64];
	CaptainName(g_knifeWinner, cap, sizeof cap);
	TrChatAll("%t", "Knife won", cap);
	delete g_knifeTimer;
	g_knifeTimer = CreateTimer(20.0, Timer_KnifeChoice, _, TIMER_FLAG_NO_MAPCHANGE);
}
public Action Timer_KnifeChoice(Handle t) {
	g_knifeTimer = null;
	if (g_state == S_Knife) KnifeDecide(false);
	return Plugin_Stop;
}
public Action Cmd_Stay(int client, int args) { KnifeVote(client, false); return Plugin_Handled; }
public Action Cmd_Switch(int client, int args) { KnifeVote(client, true); return Plugin_Handled; }
void KnifeVote(int client, bool sw) {
	if (client < 1 || g_state != S_Knife || g_knifeWinner < 0) return;
	int idx = g_clientIdx[client];
	if (idx < 0 || g_rTeam[idx] != g_knifeWinner) { TrChat(client, "%t", "Knife only winner"); return; }
	TrChatAll("%t", sw ? "Knife chose switch" : "Knife chose stay", client);
	KnifeDecide(sw);
}
void KnifeDecide(bool sw) {
	delete g_knifeTimer;
	if (sw) g_sideA = g_sideA == CS_TEAM_CT ? CS_TEAM_T : CS_TEAM_CT;
	ExecModeRules();
	if (sw) ServerCommand("mp_swapteams");
	ServerCommand("mp_unpause_match; mp_restartgame 3");
	TrChatAll("%t", "Live in 3");
	StartLive();
}
void CaptainName(int team, char[] name, int len) {
	strcopy(name, len, "?");
	int best = -1;
	for (int i = 0; i < g_rosterN; i++) if (g_rTeam[i] == team && (best == -1 || g_rElo[i] > g_rElo[best])) best = i;
	if (best != -1) strcopy(name, len, g_rName[best]);
}

int g_rankMin[18] = { 0, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1950, 2100, 2250, 2400 };
int RankOf(int elo) {
	if (elo <= 0) return 0;
	int r = 1;
	for (int k = 1; k < 18; k++) if (elo >= g_rankMin[k]) r = k + 1;
	return r;
}
void RankAnnounce(int c, int rOld, int rNew) {
	if (rOld == rNew || rNew < 1) return;
	char rk[16];
	Format(rk, sizeof rk, "Rank %d", rNew);
	ClientCommand(c, "play %s", rNew > rOld ? "ui/armsrace_level_up" : "ui/armsrace_demoted");
	char tag[32];
	Format(tag, sizeof tag, "%T", rNew > rOld ? "Rank up" : "Rank down", c);
	TrChat(c, "%t", "Rank chat", tag, rk);
}
public Action Cmd_RankTest(int client, int args) {
	if (client < 1) return Plugin_Handled;
	int a = args >= 1 ? GetCmdArgInt(1) : 6, b = args >= 2 ? GetCmdArgInt(2) : 7;
	if (a < 1 || a > 18 || b < 1 || b > 18) { ReplyToCommand(client, "[TICKRATE] sm_ranktest <ancien 1-18> <nouveau 1-18> [wingman]"); return Plugin_Handled; }
	char m[16]; if (args >= 3) GetCmdArg(3, m, sizeof m);
	char keep[16]; strcopy(keep, sizeof keep, g_mode);
	strcopy(g_mode, sizeof g_mode, StrEqual(m, "wingman") ? "wingman" : "ranked");
	RankAnnounce(client, a, b);
	int cl[1]; cl[0] = client;
	Protobuf ranks = view_as<Protobuf>(StartMessage("ServerRankUpdate", cl, 1, USERMSG_RELIABLE));
	if (ranks != null) {
		Protobuf ru = ranks.AddMessage("rank_update");
		ru.SetInt("account_id", GetSteamAccountID(client));
		ru.SetInt("rank_old", a); ru.SetInt("rank_new", b); ru.SetInt("num_wins", 10);
		ru.SetFloat("rank_change", b > a ? 25.0 : -25.0);
		if (StrEqual(g_mode, "wingman")) ru.SetInt("rank_type_id", 7);
		EndMessage();
	}
	strcopy(g_mode, sizeof g_mode, keep);
	return Plugin_Handled;
}
public Action Timer_HookRanks(Handle t) {
	int ent = GetPlayerResourceEntity();
	if (ent != -1) { SDKUnhook(ent, SDKHook_ThinkPost, OnResourceThink); SDKHook(ent, SDKHook_ThinkPost, OnResourceThink); }
	else LogError("[TICKRATE] rangs du TAB : entité des joueurs introuvable");
	return Plugin_Stop;
}
public void OnResourceThink(int ent) {
	if (g_state == S_Idle) return;
	bool wingman = StrEqual(g_mode, "wingman") && HasEntProp(ent, Prop_Send, "m_iCompetitiveRankType");
	for (int c = 1; c <= MaxClients; c++) {
		if (!IsClientInGame(c) || g_clientIdx[c] < 0) continue;
		int rank = RankOf(g_rElo[g_clientIdx[c]]);
		if (!rank) continue;
		if (GetEntProp(ent, Prop_Send, "m_iCompetitiveRanking", _, c) != rank) SetEntProp(ent, Prop_Send, "m_iCompetitiveRanking", rank, _, c);
		if (wingman && GetEntProp(ent, Prop_Send, "m_iCompetitiveRankType", _, c) != 7) SetEntProp(ent, Prop_Send, "m_iCompetitiveRankType", 7, _, c);
	}
}
public Action OnPlayerRunCmd(int client, int &buttons, int &impulse, float vel[3], float angles[3], int &weapon, int &subtype, int &cmdnum, int &tickcount, int &seed, int mouse[2]) {
	if ((buttons & IN_SCORE) && !(g_oldButtons[client] & IN_SCORE) && g_state != S_Idle && !IsFakeClient(client)) {
		Handle msg = StartMessageOne("ServerRankRevealAll", client, USERMSG_BLOCKHOOKS);
		if (msg != null) EndMessage();
	}
	g_oldButtons[client] = buttons;
	return Plugin_Continue;
}
void AddBot(int i) {
	UpdateSideA();
	g_botPending = i;
	ServerCommand("bot_add_%s", SideOf(i) == CS_TEAM_CT ? "ct" : "t");
	CreateTimer(3.0, Timer_BotPendingClear, _, TIMER_FLAG_NO_MAPCHANGE);
}
public Action Timer_BotPendingClear(Handle t) { g_botPending = -1; return Plugin_Stop; }
public void OnClientPutInServer(int client) {
	if (g_botPending < 0 || !IsFakeClient(client) || IsClientSourceTV(client)) return;
	int i = g_botPending;
	g_botPending = -1;
	Format(g_botName[i], sizeof g_botName[], "BOT %s", g_rName[i]);
	g_botName[i][31] = '\0';
	SetClientName(client, g_botName[i]);
	TrChatAll("%t", "Bot replaces", g_rName[i], g_botName[i]);
}

int ReadyCount() { int n = 0; for (int i = 0; i < g_rosterN; i++) if (g_ready[i]) n++; return n; }
void ReadyMessage() {
	char wait[256];
	for (int i = 0; i < g_rosterN; i++) if (!g_ready[i]) Format(wait, sizeof wait, "%s%s%s", wait, wait[0] ? ", " : "", g_rName[i]);
	if (wait[0]) TrChatAll("%t", "Ready prompt wait", ReadyCount(), g_rosterN, wait);
	if (g_allInAt > 0.0) TrChatAll("%t", "Auto ready left", RoundToCeil(AUTO_READY - (GetGameTime() - g_allInAt)));
	else TrChatAll("%t", "Ready prompt", ReadyCount(), g_rosterN);
}
public Action Cmd_Ready(int client, int args) {
	if (client < 1 || g_state != S_Warmup) return Plugin_Handled;
	int idx = g_clientIdx[client];
	if (idx < 0) { TrChat(client, "%t", "Not in match"); return Plugin_Handled; }
	if (!g_ready[idx]) { g_ready[idx] = true; TrChatAll("%t", "Is ready", g_rName[idx], ReadyCount(), g_rosterN); }
	CheckAllJoined();
	return Plugin_Handled;
}
public Action Cmd_Unready(int client, int args) {
	if (client < 1 || g_state != S_Warmup) return Plugin_Handled;
	int idx = g_clientIdx[client];
	if (idx >= 0 && g_ready[idx]) { g_ready[idx] = false; TrChatAll("%t", "Not ready", g_rName[idx], ReadyCount(), g_rosterN); }
	return Plugin_Handled;
}
public Action Cmd_ForceStart(int client, int args) {
	if (g_state != S_Warmup) { ReplyToCommand(client, "[TICKRATE] pas de match en attente."); return Plugin_Handled; }
	for (int i = 0; i < g_rosterN; i++) g_ready[i] = true;
	TrChatAll("%t", "Admin start");
	CheckAllJoined();
	return Plugin_Handled;
}

int ClientOf(int idx) {
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && g_clientIdx[c] == idx) return c;
	return -1;
}

void ResetStats() {
	g_rounds = 0; g_feedN = 0;
	for (int i = 0; i < MAXROSTER; i++) { g_k[i] = 0; g_a[i] = 0; g_d[i] = 0; g_dmg[i] = 0; g_hs[i] = 0; g_kast[i] = 0; g_rndKast[i] = false; g_killedBy[i] = -1; }
}
public void Ev_RoundStart(Event e, const char[] name, bool dontBroadcast) {
	for (int i = 0; i < MAXROSTER; i++) { g_rndKast[i] = false; g_killedBy[i] = -1; }
}
public void Ev_Spawn(Event e, const char[] name, bool dontBroadcast) {
	int c = GetClientOfUserId(e.GetInt("userid"));
	if (c > 0) g_hp[c] = 100;
	if (c > 0 && g_clientIdx[c] >= 0) { ApplyLang(c); ApplyClan(c); }
	if (c > 0 && g_state == S_Knife) CreateTimer(0.2, Timer_KnifeOnly, e.GetInt("userid"), TIMER_FLAG_NO_MAPCHANGE);
}
public void Ev_Hurt(Event e, const char[] name, bool dontBroadcast) {
	if (g_state != S_Live || GameRules_GetProp("m_bWarmupPeriod") || GetGameTime() < g_ignoreUntil) return;
	int v = GetClientOfUserId(e.GetInt("userid")), a = GetClientOfUserId(e.GetInt("attacker"));
	if (v < 1) return;
	int dmg = e.GetInt("dmg_health");
	if (dmg > g_hp[v]) dmg = g_hp[v];
	g_hp[v] = e.GetInt("health");
	if (a < 1 || a == v || g_clientIdx[a] < 0 || GetClientTeam(a) == GetClientTeam(v)) return;
	g_dmg[g_clientIdx[a]] += dmg;
}
public void Ev_Death(Event e, const char[] name, bool dontBroadcast) {
	if (g_state != S_Live || GameRules_GetProp("m_bWarmupPeriod") || GetGameTime() < g_ignoreUntil) return;
	int v = GetClientOfUserId(e.GetInt("userid")), a = GetClientOfUserId(e.GetInt("attacker")), sa = GetClientOfUserId(e.GetInt("assister"));
	int vi = v > 0 ? g_clientIdx[v] : -1, ai = a > 0 ? g_clientIdx[a] : -1, si = sa > 0 ? g_clientIdx[sa] : -1;
	if (vi >= 0) g_d[vi]++;
	bool enemy = ai >= 0 && vi >= 0 && a != v && GetClientTeam(a) != GetClientTeam(v);
	if (enemy) {
		g_k[ai]++; g_rndKast[ai] = true;
		if (e.GetBool("headshot")) g_hs[ai]++;
		float now = GetGameTime();
		for (int i = 0; i < g_rosterN; i++)
			if (g_killedBy[i] == vi && g_rTeam[i] == g_rTeam[ai] && now - g_killedAt[i] <= TRADE_SEC) g_rndKast[i] = true;
		g_killedBy[vi] = ai; g_killedAt[vi] = now;
		if (g_feedN < FEED_MAX) {
			strcopy(g_feedK[g_feedN], sizeof g_feedK[], g_rSteam[ai]);
			strcopy(g_feedV[g_feedN], sizeof g_feedV[], g_rSteam[vi]);
			e.GetString("weapon", g_feedW[g_feedN], sizeof g_feedW[]);
			g_feedHs[g_feedN] = e.GetBool("headshot");
			g_feedN++;
		}
	}
	if (si >= 0 && si != vi && sa != a) { g_a[si]++; g_rndKast[si] = true; }
}
public void Ev_RoundEnd(Event e, const char[] name, bool dontBroadcast) {
	if (GameRules_GetProp("m_bWarmupPeriod") || GetGameTime() < g_ignoreUntil) return;
	if (g_state == S_Knife) {
		int w = e.GetInt("winner");
		if (g_knifeWinner < 0 && (w == CS_TEAM_T || w == CS_TEAM_CT)) KnifeRoundWon(w);
		return;
	}
	if (g_state != S_Live) return;
	g_rounds++;
	for (int i = 0; i < g_rosterN; i++) {
		int c = ClientOf(i);
		if (g_rndKast[i] || (c != -1 && IsPlayerAlive(c))) g_kast[i]++;
	}
	CreateTimer(0.5, Timer_SendRound, _, TIMER_FLAG_NO_MAPCHANGE);
	if (!g_test) for (int i = 0; i < g_rosterN; i++)
		if (g_leftAt[i] >= 0 && !g_botName[i][0] && g_botPending == -1 && ClientOf(i) == -1 && g_rounds - g_leftAt[i] >= 2) AddBot(i);
}
public Action Timer_SendRound(Handle t) { if (g_state == S_Live) SendRound(); return Plugin_Stop; }

void UpdateSideA() {
	int ct = 0, tt = 0;
	for (int i = 0; i < g_rosterN; i++) {
		if (g_rTeam[i] != 0) continue;
		int c = ClientOf(i);
		if (c == -1) continue;
		int tm = GetClientTeam(c);
		if (tm == CS_TEAM_CT) ct++; else if (tm == CS_TEAM_T) tt++;
	}
	if (ct != tt) g_sideA = ct > tt ? CS_TEAM_CT : CS_TEAM_T;
}
void Scores(int &a, int &b) {
	UpdateSideA();
	a = CS_GetTeamScore(g_sideA);
	b = CS_GetTeamScore(g_sideA == CS_TEAM_CT ? CS_TEAM_T : CS_TEAM_CT);
}
JSONArray PlayersJSON(bool isEnd) {
	JSONArray arr = new JSONArray();
	int R = g_rounds > 0 ? g_rounds : 1;
	for (int i = 0; i < g_rosterN; i++) {
		JSONObject p = new JSONObject();
		p.SetString("steamId", g_rSteam[i]);
		p.SetInt("k", g_k[i]); p.SetInt("a", g_a[i]); p.SetInt("d", g_d[i]);
		if (isEnd) {
			p.SetInt("adr", g_dmg[i] / R);
			p.SetInt("hs", g_k[i] > 0 ? g_hs[i] * 100 / g_k[i] : 0);
			p.SetInt("kast", g_kast[i] * 100 / R);
		} else { p.SetInt("dmg", g_dmg[i]); p.SetInt("hs", g_hs[i]); }
		arr.Push(p);
		delete p;
	}
	return arr;
}
void SendRound() {
	int a, b;
	Scores(a, b);
	JSONObject body = new JSONObject();
	body.SetString("matchId", g_matchId);
	body.SetInt("scoreA", a); body.SetInt("scoreB", b);
	ConVar tvc = FindConVar("tv_enable");
	if (tvc != null && tvc.BoolValue) body.SetInt("viewers", CountSpectators());
	JSONArray players = PlayersJSON(false);
	body.Set("players", players); delete players;
	JSONArray kills = new JSONArray();
	for (int i = 0; i < g_feedN; i++) {
		JSONObject k = new JSONObject();
		k.SetString("killer", g_feedK[i]); k.SetString("victim", g_feedV[i]);
		k.SetString("weapon", g_feedW[i]); k.SetBool("hs", g_feedHs[i]);
		kills.Push(k); delete k;
	}
	g_feedN = 0;
	body.Set("kills", kills); delete kills;
	Post("/round", body);
}
int CountSpectators() {
	int n = 0;
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && !IsFakeClient(c) && GetClientTeam(c) == CS_TEAM_SPECTATOR) n++;
	return n;
}

public void Ev_MatchEnd(Event e, const char[] name, bool dontBroadcast) {
	if (g_state != S_Live) return;
	g_state = S_Over;
	CreateTimer(1.0, Timer_SendEnd, _, TIMER_FLAG_NO_MAPCHANGE);
}
public Action Timer_SendEnd(Handle t) {
	int a, b;
	Scores(a, b);
	JSONObject body = new JSONObject();
	body.SetString("matchId", g_matchId);
	body.SetInt("scoreA", a); body.SetInt("scoreB", b);
	JSONArray players = PlayersJSON(true);
	body.Set("players", players); delete players;
	HTTPRequest req = Api("/end");
	if (req != null) req.Post(body, OnEndPosted);
	delete body;
	TrChatAll("%t", "Match over", a, b);
	ConVar rd = FindConVar("mp_match_restart_delay");
	float wait = (rd != null ? rd.FloatValue : float(END_DELAY)) - 3.0;
	CreateTimer(wait < 8.0 ? 8.0 : wait, Timer_Free);
	return Plugin_Stop;
}
public void OnEndPosted(HTTPResponse r, any data, const char[] err) {
	if (r.Status != HTTPStatus_OK) { LogError("[TICKRATE] fin de match refusée : %d %s", view_as<int>(r.Status), err); return; }
	JSONObject j = view_as<JSONObject>(r.Data);
	if (!j.HasKey("screen")) return;
	JSONObject sc = view_as<JSONObject>(j.Get("screen"));
	Protobuf drops = view_as<Protobuf>(StartMessageAll("SendPlayerItemDrops", USERMSG_RELIABLE));
	int nDrops = 0;
	for (int i = 0; i < g_rosterN; i++) {
		int c = ClientOf(i);
		if (c == -1 || !sc.HasKey(g_rSteam[i])) continue;
		JSONObject e = view_as<JSONObject>(sc.Get(g_rSteam[i]));
		if (drops != null && e.HasKey("found")) {
			JSONArray fd = view_as<JSONArray>(e.Get("found"));
			for (int k = 0; k < fd.Length; k++) {
				JSONObject it = view_as<JSONObject>(fd.Get(k));
				Protobuf info = drops.AddMessage("entity_updates");
				int id[2];
				id[0] = GetRandomInt(100000, 2000000000); id[1] = 0;
				info.SetInt("accountid", GetSteamAccountID(c));
				info.SetInt64("itemid", id);
				info.SetInt("defindex", it.GetInt("d"));
				info.SetInt("paintindex", it.GetInt("p"));
				info.SetInt("rarity", it.GetInt("r"));
				info.SetInt("quality", it.GetInt("q"));
				info.SetInt("paintwear", view_as<int>(float(it.GetInt("f")) / 1000000.0));
				info.SetInt("paintseed", it.GetInt("s"));
				info.SetInt("inventory", 0);
				info.SetInt("entindex", c);
				nDrops++;
				delete it;
			}
			delete fd;
		}
		delete e;
	}
	if (drops != null) EndMessage();
	Protobuf ranks = view_as<Protobuf>(StartMessageAll("ServerRankUpdate", USERMSG_RELIABLE));
	if (ranks != null) {
		for (int i = 0; i < g_rosterN; i++) {
			int c = ClientOf(i);
			if (c == -1 || !sc.HasKey(g_rSteam[i])) continue;
			JSONObject e = view_as<JSONObject>(sc.Get(g_rSteam[i]));
			int delta = e.GetInt("delta"), elo = e.GetInt("elo");
			Protobuf ru = ranks.AddMessage("rank_update");
			ru.SetInt("account_id", GetSteamAccountID(c));
			ru.SetInt("rank_old", RankOf(elo - delta));
			ru.SetInt("rank_new", RankOf(elo));
			int wins = e.HasKey("wins") ? e.GetInt("wins") : 0;
			ru.SetInt("num_wins", wins < 10 ? 10 : wins);
			g_rElo[i] = elo;
			ru.SetFloat("rank_change", float(delta));
			if (StrEqual(g_mode, "wingman")) ru.SetInt("rank_type_id", 7);
			delete e;
		}
		EndMessage();
		Handle rv = StartMessageAll("ServerRankRevealAll", USERMSG_RELIABLE);
		if (rv != null) EndMessage();
	}
	LogMessage("[TICKRATE] écran de fin : %d drops affichés", nDrops);
	for (int i = 0; i < g_rosterN; i++) {
		int c = ClientOf(i);
		if (c == -1 || !sc.HasKey(g_rSteam[i])) continue;
		JSONObject e = view_as<JSONObject>(sc.Get(g_rSteam[i]));
		bool won = e.GetBool("won");
		int delta = e.GetInt("delta"), elo = e.GetInt("elo"), level = e.GetInt("level");
		char sd[16];
		Format(sd, sizeof sd, "%s%d", delta >= 0 ? "+" : "", delta);
		TrChat(c, "%t", won ? "Result win" : "Result loss", sd, elo - delta, elo, level);
		JSONArray dr = view_as<JSONArray>(e.Get("drops"));
		char name[96], hint[512], list[256];
		for (int k = 0; k < dr.Length; k++) {
			dr.GetString(k, name, sizeof name);
			TrChatAll("%t", "Drop all", g_rName[i], name);
			if (k < 2) Format(list, sizeof list, "%s<br>%T", list, "Hint drop", c, name);
		}
		if (!dr.Length) TrChat(c, "%t", "No drop");
		Format(hint, sizeof hint, "<font color='%s'>%T</font> · <font color='#ffcc00'>%s ELO</font> (%d)%s", won ? "#3fb950" : "#f85149", won ? "Hint win" : "Hint loss", c, sd, elo, list);
		PrintHintText(c, "%s", hint);
		RankAnnounce(c, RankOf(elo - delta), RankOf(elo));
		delete dr;
		delete e;
		list[0] = '\0';
	}
	delete sc;
}

public Action Timer_Free(Handle t) { if (g_state == S_Over) EndAndFree("Kick match over", true); return Plugin_Stop; }

void EndAndFree(const char[] phrase, bool kickAdmins = false) {
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && !IsFakeClient(c) && !IsClientSourceTV(c) && (kickAdmins || !IsAdmin(c))) KickClient(c, "%T", phrase, c);
	FreeServer();
}
void FreeServer() {
	LogMessage("[TICKRATE] serveur libéré (match %s)", g_matchId);
	g_state = S_Idle; g_matchId[0] = '\0'; g_rosterN = 0; g_knifeWinner = -1; g_test = false; g_room = false; g_fill = false; g_password[0] = '\0'; g_warmupReady = false;
	ServerCommand("bot_quota 0; bot_kick; bot_join_team any; tr_skins_test 0; tv_stoprecord; tv_delay 0");
	delete g_knifeTimer;
	for (int c = 0; c <= MaxClients; c++) g_clientIdx[c] = -1;
	ServerCommand("tr_match_id \"\"");
	SetHostname();
	RandomPassword();
	if (g_cvRestart.BoolValue && g_restartTimer == null) g_restartTimer = CreateTimer(5.0, Timer_Restart, _, TIMER_REPEAT);
}
public Action Timer_Restart(Handle t) {
	if (g_state != S_Idle) { g_restartTimer = null; return Plugin_Stop; }
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && !IsFakeClient(c) && !IsClientSourceTV(c)) return Plugin_Continue;
	LogMessage("[TICKRATE] serveur vide après le match : redémarrage pour libérer la RAM");
	g_restartTimer = null;
	ServerCommand("quit");
	return Plugin_Stop;
}

void RandomPassword() {
	if (g_cvPassword == null || !g_cvPassword.BoolValue) { ServerCommand("sv_password \"\""); return; }
	char pw[17];
	for (int i = 0; i < 16; i++) pw[i] = 'a' + GetRandomInt(0, 25);
	pw[16] = '\0';
	ServerCommand("sv_password \"%s\"", pw);
}

public Action Cmd_Help(int client, int args) {
	if (client < 1) return Plugin_Handled;
	TrChat(client, "%t", "Help title");
	TrChatRaw(client, "%t", "Help ready");
	TrChatRaw(client, "%t", "Help knife");
	TrChatRaw(client, "%t", "Help pause");
	TrChatRaw(client, "%t", "Help tac");
	TrChatRaw(client, "%t", "Help ws");
	TrChatRaw(client, "%t", "Help feedback");
	if (CheckCommandAccess(client, "sm_forcestart", ADMFLAG_GENERIC)) TrChatRaw(client, "%t", "Help admin");
	return Plugin_Handled;
}

public Action Cmd_Feedback(int client, int args) {
	if (client < 1) return Plugin_Handled;
	char text[300], sid[24];
	GetCmdArgString(text, sizeof text);
	StripQuotes(text); TrimString(text);
	if (strlen(text) < 3) { TrChat(client, "%t", "Feedback usage"); return Plugin_Handled; }
	if (g_fbAt[client] > 0.0 && GetEngineTime() - g_fbAt[client] < 60.0) { TrChat(client, "%t", "Feedback wait"); return Plugin_Handled; }
	if (!GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) return Plugin_Handled;
	g_fbAt[client] = GetEngineTime();
	char srv[32], lang[8];
	g_cvServer.GetString(srv, sizeof srv);
	GetLanguageInfo(GetClientLanguage(client), lang, sizeof lang);
	JSONObject b = new JSONObject();
	b.SetString("steamId", sid);
	b.SetString("text", text);
	b.SetString("matchId", g_matchId);
	b.SetString("server", srv);
	b.SetString("lang", lang);
	HTTPRequest req = Api("/feedback");
	if (req != null) req.Post(b, OnFeedback, GetClientUserId(client));
	else TrChat(client, "%t", "Feedback failed");
	delete b;
	return Plugin_Handled;
}
public void OnFeedback(HTTPResponse r, any userid, const char[] err) {
	int c = GetClientOfUserId(userid);
	if (c < 1) return;
	if (r.Status == HTTPStatus_OK) TrChat(c, "%t", "Feedback sent");
	else if (r.Status == HTTPStatus_TooManyRequests) TrChat(c, "%t", "Feedback wait");
	else { TrChat(c, "%t", "Feedback failed"); LogError("[TICKRATE] feedback refusé : %d %s", view_as<int>(r.Status), err); }
}
public void OnClientConnected(int client) { g_fbAt[client] = 0.0; }

public Action Cmd_Status(int client, int args) {
	static const char names[][] = { "libre", "échauffement", "knife round", "en cours", "terminé" };
	char mid[40] = "-";
	if (g_matchId[0]) strcopy(mid, sizeof mid, g_matchId);
	ReplyToCommand(client, "[TICKRATE] état : %s · match %s · %s · %d/%d connectés · %d rounds", names[view_as<int>(g_state)], mid, g_map, JoinedCount(), g_rosterN, g_rounds);
	return Plugin_Handled;
}
public Action Cmd_Reset(int client, int args) {
	EndAndFree("Kick admin abort");
	ReplyToCommand(client, "[TICKRATE] serveur libéré. Pense à libérer aussi servers/<id> dans la base si le site attend encore ce match.");
	return Plugin_Handled;
}
