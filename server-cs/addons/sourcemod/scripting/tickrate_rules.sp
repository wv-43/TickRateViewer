/*
 * TICKRATE — règles de match
 * --------------------------
 *  - anti-triche côté serveur : toutes les 15 s, vérifie chez chaque joueur des réglages protégés par
 *    sv_cheats (rendu des modèles, fumées, éclairage…). Une valeur anormale veut dire qu'un cheat a
 *    débloqué la commande : le joueur est déconnecté et c'est noté dans le log ;
 *  - anti-spam : un joueur qui envoie trop de commandes par seconde (exploit pour faire laguer
 *    ou planter le serveur) est déconnecté ;
 *  - pause technique : !pause (n'importe quel joueur), elle commence au prochain freeze time ;
 *    !unpause : la partie reprend quand un joueur de CHAQUE équipe l'a tapé ;
 *  - temps mort tactique : !tac lance le vote de temps mort du jeu (3 par équipe, 30 s, voir match.cfg) ;
 *  - rapport de dégâts à la fin de chaque round : pour chaque adversaire, dégâts infligés et reçus
 *    (nombre de coups) et ses PV restants.
 * Un plugin serveur ne remplace pas un anti-cheat installé chez le joueur : il bloque les triches
 * grossières et les exploits connus. Le reste : VAC, Vigie, signalements et demos.
 *
 * ConVars (cfg/sourcemod/tickrate_rules.cfg) :
 *   tr_rules_cvarcheck  1 = vérifier les réglages des joueurs
 *   tr_rules_maxcmd     commandes par seconde avant déconnexion (0 = pas de limite)
 */
#include <sourcemod>
#include <sdktools>
#include <cstrike>
#include <tickrate>
#pragma semicolon 1
#pragma newdecls required

public Plugin myinfo = { name = "TICKRATE rules", author = "TICKRATE", description = "Anti-triche serveur, pause technique, temps morts", version = "1.2.0", url = "" };

// réglages client protégés par sv_cheats et la valeur qu'ils doivent avoir
static const char CHECK_CVAR[][] = { "r_drawothermodels", "mat_wireframe", "mat_fullbright", "r_drawparticles", "cl_particles_show_bbox", "r_drawrenderboxes", "fog_enable", "mat_drawgray" };
static const float CHECK_VALUE[] = { 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0 };

ConVar g_cvCheck, g_cvMaxCmd;
int g_cmdCount[MAXPLAYERS + 1];
bool g_kicked[MAXPLAYERS + 1];
bool g_unpause[4];                 // index = équipe (2 = T, 3 = CT)
// dégâts du round : [attaquant][victime]
int g_dmg[MAXPLAYERS + 1][MAXPLAYERS + 1], g_hits[MAXPLAYERS + 1][MAXPLAYERS + 1], g_hp[MAXPLAYERS + 1];

public void OnPluginStart() {
	g_cvCheck  = CreateConVar("tr_rules_cvarcheck", "1", "Vérifier les réglages protégés des joueurs");
	g_cvMaxCmd = CreateConVar("tr_rules_maxcmd", "60", "Commandes par seconde avant déconnexion (0 = pas de limite)");
	AutoExecConfig(true, "tickrate_rules");
	LoadTranslations("tickrate.phrases");
	RegConsoleCmd("sm_pause", Cmd_Pause, "Pause technique (au prochain freeze time)");
	RegConsoleCmd("sm_unpause", Cmd_Unpause, "Reprendre (un joueur de chaque équipe)");
	RegConsoleCmd("sm_tac", Cmd_Tac, "Temps mort tactique (vote de l'équipe)");
	RegAdminCmd("sm_forceunpause", Cmd_ForceUnpause, ADMFLAG_GENERIC, "Reprendre la partie tout de suite");
	HookEvent("round_start", Ev_RoundStart, EventHookMode_PostNoCopy);
	HookEvent("round_end", Ev_RoundEnd, EventHookMode_PostNoCopy);
	HookEvent("player_spawn", Ev_Spawn);
	HookEvent("player_hurt", Ev_Hurt);
	CreateTimer(15.0, Timer_Check, _, TIMER_REPEAT);
	CreateTimer(1.0, Timer_ResetCmd, _, TIMER_REPEAT);
}
public void OnClientConnected(int client) { g_cmdCount[client] = 0; g_kicked[client] = false; }

// ---------- réglages protégés ----------
public Action Timer_Check(Handle t) {
	if (!g_cvCheck.BoolValue) return Plugin_Continue;
	for (int c = 1; c <= MaxClients; c++) {
		if (!IsClientInGame(c) || IsFakeClient(c) || IsClientSourceTV(c) || g_kicked[c]) continue;
		for (int i = 0; i < sizeof CHECK_CVAR; i++) QueryClientConVar(c, CHECK_CVAR[i], OnCvarValue, i);
	}
	return Plugin_Continue;
}
public void OnCvarValue(QueryCookie cookie, int client, ConVarQueryResult result, const char[] name, const char[] value, any idx) {
	if (result != ConVarQuery_Okay || !IsClientInGame(client) || g_kicked[client]) return;
	if (FloatAbs(StringToFloat(value) - CHECK_VALUE[idx]) < 0.001) return;
	g_kicked[client] = true;
	char sid[24];
	GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid);
	LogMessage("[TICKRATE] %N (%s) : %s = %s (attendu %.0f) -> déconnecté", client, sid, name, value, CHECK_VALUE[idx]);
	TrChatAll("%t", "Cvar kicked", client, name);
	KickClient(client, "%T", "Kick cvar", client, name);
}

// ---------- anti-spam de commandes ----------
public Action OnClientCommand(int client, int args) {
	int max = g_cvMaxCmd.IntValue;
	if (client < 1 || max <= 0 || g_kicked[client]) return Plugin_Continue;
	if (++g_cmdCount[client] > max) {
		g_kicked[client] = true;
		LogMessage("[TICKRATE] %N : plus de %d commandes par seconde -> déconnecté", client, max);
		KickClient(client, "%T", "Kick spam", client);
		return Plugin_Handled;
	}
	return Plugin_Continue;
}
public Action Timer_ResetCmd(Handle t) {
	for (int c = 1; c <= MaxClients; c++) g_cmdCount[c] = 0;
	return Plugin_Continue;
}

// ---------- pause technique ----------
bool IsPlayer(int client) { return client > 0 && IsClientInGame(client) && (GetClientTeam(client) == CS_TEAM_T || GetClientTeam(client) == CS_TEAM_CT); }
bool Paused() { return GameRules_GetProp("m_bMatchWaitingForResume") != 0; }

public Action Cmd_Pause(int client, int args) {
	if (!IsPlayer(client)) return Plugin_Handled;
	if (GameRules_GetProp("m_bWarmupPeriod")) { TrChat(client, "%t", "Pause warmup"); return Plugin_Handled; }
	if (Paused()) { TrChat(client, "%t", "Pause already"); return Plugin_Handled; }
	g_unpause[CS_TEAM_T] = false; g_unpause[CS_TEAM_CT] = false;
	ServerCommand("mp_pause_match");
	TrChatAll("%t", "Pause asked", client);
	return Plugin_Handled;
}
public Action Cmd_Unpause(int client, int args) {
	if (!IsPlayer(client)) return Plugin_Handled;
	if (!Paused()) { TrChat(client, "%t", "Not paused"); return Plugin_Handled; }
	int team = GetClientTeam(client);
	g_unpause[team] = true;
	if (g_unpause[CS_TEAM_T] && g_unpause[CS_TEAM_CT]) {
		ServerCommand("mp_unpause_match");
		TrChatAll("%t", "Unpause both");
	} else TrChatAll("%t", "Unpause wait", team == CS_TEAM_T ? "T" : "CT");
	return Plugin_Handled;
}
public Action Cmd_ForceUnpause(int client, int args) {
	ServerCommand("mp_unpause_match");
	TrChatAll("%t", "Admin unpause");
	return Plugin_Handled;
}

// ---------- temps mort tactique ----------
public Action Cmd_Tac(int client, int args) {
	if (!IsPlayer(client)) return Plugin_Handled;
	FakeClientCommand(client, "callvote StartTimeOut");    // vote de l'équipe, compté par le jeu (mp_team_timeout_max)
	return Plugin_Handled;
}

// ---------- rapport de dégâts en fin de round ----------
public void Ev_RoundStart(Event e, const char[] name, bool dontBroadcast) {
	for (int a = 0; a <= MaxClients; a++) for (int v = 0; v <= MaxClients; v++) { g_dmg[a][v] = 0; g_hits[a][v] = 0; }
}
public void Ev_Spawn(Event e, const char[] name, bool dontBroadcast) {
	int c = GetClientOfUserId(e.GetInt("userid"));
	if (c > 0) g_hp[c] = 100;
}
public void Ev_Hurt(Event e, const char[] name, bool dontBroadcast) {
	int v = GetClientOfUserId(e.GetInt("userid")), a = GetClientOfUserId(e.GetInt("attacker"));
	if (v < 1) return;
	int dmg = e.GetInt("dmg_health");
	if (dmg > g_hp[v]) dmg = g_hp[v];                    // dégâts réels, pas l'excédent
	g_hp[v] = e.GetInt("health");
	if (a < 1 || a == v) return;
	g_dmg[a][v] += dmg;
	g_hits[a][v]++;
}
public void Ev_RoundEnd(Event e, const char[] name, bool dontBroadcast) {
	if (GameRules_GetProp("m_bWarmupPeriod")) return;
	CreateTimer(0.2, Timer_Report, _, TIMER_FLAG_NO_MAPCHANGE);
}
public Action Timer_Report(Handle t) {
	for (int c = 1; c <= MaxClients; c++) {
		if (!IsPlayer(c) || IsFakeClient(c)) continue;
		bool head = false;
		for (int o = 1; o <= MaxClients; o++) {
			if (o == c || !IsClientInGame(o) || GetClientTeam(o) == GetClientTeam(c) || (GetClientTeam(o) != CS_TEAM_T && GetClientTeam(o) != CS_TEAM_CT)) continue;
			if (!g_dmg[c][o] && !g_dmg[o][c]) continue;
			if (!head) { head = true; TrChat(c, "%t", "Damage title"); }
			int hp = IsPlayerAlive(o) ? GetClientHealth(o) : 0;
			TrChatRaw(c, "%t", "Damage line", g_dmg[c][o], g_hits[c][o], g_dmg[o][c], g_hits[o][c], o, hp);
			PrintToConsole(c, "[TICKRATE] infligés %d en %d coups · reçus %d en %d coups · %N (%d PV)", g_dmg[c][o], g_hits[c][o], g_dmg[o][c], g_hits[o][c], o, hp);
		}
	}
	return Plugin_Stop;
}
