#include <sourcemod>
#include <sdktools>
#include <sdkhooks>
#include <cstrike>
#include <ripext>
#include <tickrate>
#undef REQUIRE_EXTENSIONS
#include <PTaH>
#define REQUIRE_EXTENSIONS
#pragma semicolon 1
#pragma newdecls required

#define MAXW 48

public Plugin myinfo = { name = "TICKRATE skins", author = "TICKRATE", description = "Skins, couteau, gants et agents choisis sur le site", version = "1.6.2", url = "" };

ConVar g_cvUrl, g_cvKey, g_cvStickers, g_cvTest;
bool g_loaded[MAXPLAYERS + 1];
int g_n[MAXPLAYERS + 1];
int g_wDef[MAXPLAYERS + 1][MAXW], g_wPaint[MAXPLAYERS + 1][MAXW], g_wSeed[MAXPLAYERS + 1][MAXW], g_wTeam[MAXPLAYERS + 1][MAXW];
float g_wWear[MAXPLAYERS + 1][MAXW];
bool g_wSt[MAXPLAYERS + 1][MAXW];
char g_wTag[MAXPLAYERS + 1][MAXW][24];
char g_wSk[MAXPLAYERS + 1][MAXW][40];
int g_wStc[MAXPLAYERS + 1][MAXW], g_wPend[MAXPLAYERS + 1][MAXW];
int g_wStk[MAXPLAYERS + 1][MAXW][4];
float g_wStkWear[MAXPLAYERS + 1][MAXW][4];
int g_kDef[MAXPLAYERS + 1][2], g_kPaint[MAXPLAYERS + 1][2], g_kSeed[MAXPLAYERS + 1][2];
float g_kWear[MAXPLAYERS + 1][2];
bool g_kSt[MAXPLAYERS + 1][2];
char g_kTag[MAXPLAYERS + 1][2][24];
char g_kSk[MAXPLAYERS + 1][2][40];
int g_kStc[MAXPLAYERS + 1][2], g_kPend[MAXPLAYERS + 1][2];
int g_entAcc[2049], g_entSlot[2049];
int g_gDef[MAXPLAYERS + 1][2], g_gPaint[MAXPLAYERS + 1][2], g_gSeed[MAXPLAYERS + 1][2];
float g_gWear[MAXPLAYERS + 1][2];
char g_agent[MAXPLAYERS + 1][2][PLATFORM_MAX_PATH];
int g_itemId = 16384;
bool g_good[2049];
float g_spawnAt[MAXPLAYERS + 1];
bool g_giving;
bool g_ptahHooks;

public void OnPluginStart() {
	LoadTranslations("tickrate.phrases");
	g_cvUrl = CreateConVar("tr_skins_url", "", "URL de gameApi (sans / à la fin)");
	g_cvKey = CreateConVar("tr_skins_key", "", "SERVER_KEY du back-end", FCVAR_PROTECTED);
	g_cvStickers = CreateConVar("tr_skins_stickers", "1", "Autocollants sur les armes (extension PTaH requise)");
	g_cvTest = CreateConVar("tr_skins_test", "0", "Match de test : StatTrak affiché aussi sur les kills de bots (non enregistrés)");
	AutoExecConfig(true, "tickrate_skins");
	RegConsoleCmd("sm_ws", Cmd_Refresh, "Recharge les skins choisis sur le site");
	HookEvent("player_spawn", Ev_Spawn);
	HookEvent("player_death", Ev_Death);
	HookEvent("round_end", Ev_RoundEnd, EventHookMode_PostNoCopy);
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c)) { OnClientPutInServer(c); if (!IsFakeClient(c)) Fetch(c); }
}
public void OnAllPluginsLoaded() {
	if (GetFeatureStatus(FeatureType_Native, "PTaH") != FeatureStatus_Available) { LogMessage("[TICKRATE] PTaH absent : skins posés à l'équipement"); return; }
	g_ptahHooks = PTaH(PTaH_GiveNamedItemPre, Hook, GiveNamedItemPre) && PTaH(PTaH_GiveNamedItemPost, Hook, GiveNamedItemPost);
	LogMessage("[TICKRATE] PTaH %s", g_ptahHooks ? "chargé : skins posés à la création des armes" : "présent mais hooks refusés");
}

int DefOfClass(const char[] cls) {
	if (StrContains(cls, "weapon_") != 0) return 0;
	CSWeaponID id = CS_AliasToWeaponID(cls[7]);
	return id == CSWeapon_NONE ? 0 : CS_WeaponIDToItemDefIndex(id);
}
int SkinIndex(int client, int def, int tm) {
	int team = tm == 0 ? 2 : 3;
	for (int i = 0; i < g_n[client]; i++) if (g_wDef[client][i] == def && (g_wTeam[client][i] == 0 || g_wTeam[client][i] == team)) return i;
	return -1;
}
public Action GiveNamedItemPre(int client, char cls[64], CEconItemView &view, bool &ignoredView, bool &originNull, float origin[3]) {
	if (client < 1 || client > MaxClients || !IsClientInGame(client) || IsFakeClient(client) || !g_loaded[client]) return Plugin_Continue;
	int tm = CampOf(client);
	if (tm < 0) return Plugin_Continue;
	if (IsKnifeClass(cls)) {
		char want[64];
		if (!g_kDef[client][tm] || !KnifeClass(g_kDef[client][tm], want, sizeof want)) return Plugin_Continue;
		ignoredView = true;
		strcopy(cls, sizeof cls, want);
		return Plugin_Changed;
	}
	int def = DefOfClass(cls);
	if (def && SkinIndex(client, def, tm) >= 0) { ignoredView = true; return Plugin_Changed; }
	return Plugin_Continue;
}
public void GiveNamedItemPost(int client, const char[] cls, const CEconItemView view, int entity, bool originNull, const float origin[3]) {
	if (client < 1 || client > MaxClients || !IsClientInGame(client) || IsFakeClient(client) || !g_loaded[client] || entity == -1 || !IsValidEntity(entity)) return;
	int tm = CampOf(client);
	if (tm < 0) return;
	char real[64];
	GetEntityClassname(entity, real, sizeof real);
	if (IsKnifeClass(real)) {
		if (!g_kDef[client][tm]) return;
		EquipPlayerWeapon(client, entity);
		Apply(client, entity, g_kPaint[client][tm], g_kWear[client][tm], g_kSeed[client][tm], g_kSt[client][tm], g_kTag[client][tm], true);
		StatTrakOn(client, entity, -1 - tm);
		g_good[entity] = true;
		return;
	}
	int i = SkinIndex(client, GetEntProp(entity, Prop_Send, "m_iItemDefinitionIndex"), tm);
	if (i < 0) return;
	Apply(client, entity, g_wPaint[client][i], g_wWear[client][i], g_wSeed[client][i], g_wSt[client][i], g_wTag[client][i], false);
	ApplyStickers(client, entity, i);
	StatTrakOn(client, entity, i);
	g_good[entity] = true;
}

public void OnClientPutInServer(int client) {
	g_loaded[client] = false;
	SDKHook(client, SDKHook_WeaponEquipPost, OnWeaponEquip);
}
public void OnClientAuthorized(int client, const char[] auth) {
	if (!IsFakeClient(client)) Fetch(client);
}
public void OnClientPostAdminCheck(int client) {
	if (!IsFakeClient(client) && !g_loaded[client]) Fetch(client);
}
public void OnClientDisconnect(int client) { FlushStatTrak(client); g_loaded[client] = false; }

public Action Cmd_Refresh(int client, int args) {
	if (client > 0) { Fetch(client); TrChat(client, "%t", "Skins reloaded"); }
	return Plugin_Handled;
}

void Fetch(int client) {
	char sid[24], url[320], key[128];
	if (!GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) return;
	g_cvUrl.GetString(url, sizeof url); g_cvKey.GetString(key, sizeof key);
	if (!url[0]) return;
	Format(url, sizeof url, "%s/skins?steamId=%s", url, sid);
	HTTPRequest req = new HTTPRequest(url);
	req.SetHeader("X-Server-Key", key);
	req.Get(OnSkins, GetClientUserId(client));
}

public void OnSkins(HTTPResponse r, any userid, const char[] err) {
	int client = GetClientOfUserId(userid);
	if (client < 1 || r.Status != HTTPStatus_OK) return;
	JSONObject j = view_as<JSONObject>(r.Data);
	if (!j.HasKey("ok") || !j.GetBool("ok")) return;

	g_n[client] = 0;
	JSONArray w = view_as<JSONArray>(j.Get("w"));
	for (int i = 0; i < w.Length && g_n[client] < MAXW; i++) {
		JSONObject e = view_as<JSONObject>(w.Get(i));
		int n = g_n[client];
		g_wDef[client][n] = e.GetInt("d");
		g_wPaint[client][n] = e.GetInt("p");
		g_wWear[client][n] = float(e.GetInt("f")) / 1000000.0;
		g_wSeed[client][n] = e.GetInt("s");
		g_wSt[client][n] = e.GetBool("st");
		e.GetString("tag", g_wTag[client][n], sizeof g_wTag[][]);
		g_wTeam[client][n] = e.GetInt("t");
		e.GetString("sk", g_wSk[client][n], sizeof g_wSk[][]);
		g_wStc[client][n] = e.GetInt("stc"); g_wPend[client][n] = 0;
		for (int s = 0; s < 4; s++) { g_wStk[client][n][s] = 0; g_wStkWear[client][n][s] = 0.0; }
		if (e.HasKey("stk")) {
			JSONArray st = view_as<JSONArray>(e.Get("stk"));
			for (int s = 0; s < st.Length && s < 4; s++) {
				JSONArray x = view_as<JSONArray>(st.Get(s));
				g_wStk[client][n][s] = x.GetInt(0);
				g_wStkWear[client][n][s] = float(x.GetInt(1)) / 1000000.0;
				delete x;
			}
			delete st;
		}
		g_n[client]++;
		delete e;
	}
	delete w;

	static const char camps[][] = { "T", "CT" };
	JSONObject k = view_as<JSONObject>(j.Get("k")), g = view_as<JSONObject>(j.Get("g")), a = view_as<JSONObject>(j.Get("a"));
	for (int tm = 0; tm < 2; tm++) {
		g_kDef[client][tm] = 0; g_gDef[client][tm] = 0; g_agent[client][tm][0] = '\0';
		if (k.HasKey(camps[tm])) {
			JSONObject e = view_as<JSONObject>(k.Get(camps[tm]));
			g_kDef[client][tm] = e.GetInt("d"); g_kPaint[client][tm] = e.GetInt("p"); g_kSeed[client][tm] = e.GetInt("s");
			g_kWear[client][tm] = float(e.GetInt("f")) / 1000000.0; g_kSt[client][tm] = e.GetBool("st");
			e.GetString("tag", g_kTag[client][tm], sizeof g_kTag[][]);
			e.GetString("sk", g_kSk[client][tm], sizeof g_kSk[][]);
			g_kStc[client][tm] = e.GetInt("stc"); g_kPend[client][tm] = 0;
			delete e;
		}
		if (g.HasKey(camps[tm])) {
			JSONObject e = view_as<JSONObject>(g.Get(camps[tm]));
			g_gDef[client][tm] = e.GetInt("d"); g_gPaint[client][tm] = e.GetInt("p"); g_gSeed[client][tm] = e.GetInt("s");
			g_gWear[client][tm] = float(e.GetInt("f")) / 1000000.0;
			delete e;
		}
		if (a.HasKey(camps[tm])) a.GetString(camps[tm], g_agent[client][tm], sizeof g_agent[][]);
	}
	delete k; delete g; delete a;
	g_loaded[client] = true;
	LogMessage("[TICKRATE] skins de %N : %d armes, couteau T=%d CT=%d, gants T=%d CT=%d", client, g_n[client], g_kDef[client][0], g_kDef[client][1], g_gDef[client][0], g_gDef[client][1]);

	if (IsClientInGame(client) && IsPlayerAlive(client)) {
		int tm = CampOf(client);
		if (tm >= 0) {
			RefreshSpawnWeapons(client, tm);
			if (g_agent[client][tm][0]) {
				if (!IsModelPrecached(g_agent[client][tm])) PrecacheModel(g_agent[client][tm]);
				SetEntityModel(client, g_agent[client][tm]);
			}
			if (g_gDef[client][tm]) {
				GiveGloves(client, tm);
			}
			for (int slot = 0; slot <= CS_SLOT_KNIFE; slot++) {
				int w = GetPlayerWeaponSlot(client, slot);
				if (w != -1 && IsValidEntity(w)) OnWeaponEquip(client, w);
			}
		}
	}
}

int CampOf(int client) {
	int t = GetClientTeam(client);
	return t == CS_TEAM_T ? 0 : t == CS_TEAM_CT ? 1 : -1;
}
bool IsKnifeClass(const char[] cls) { return StrContains(cls, "weapon_knife") == 0 || StrEqual(cls, "weapon_bayonet"); }

public void OnWeaponEquip(int client, int weapon) {
	if (!g_loaded[client] || IsFakeClient(client) || !IsValidEntity(weapon)) return;
	if (GetEntPropEnt(weapon, Prop_Send, "m_hPrevOwner") > 0) return;
	if (weapon < sizeof g_good && g_good[weapon]) return;
	int tm = CampOf(client);
	if (tm < 0) return;
	char cls[64];
	GetEntityClassname(weapon, cls, sizeof cls);
	int def = GetEntProp(weapon, Prop_Send, "m_iItemDefinitionIndex");
	if (IsKnifeClass(cls)) {
		int want = g_kDef[client][tm];
		if (!want) return;
		if (def != want) SetEntProp(weapon, Prop_Send, "m_iItemDefinitionIndex", want);
		Apply(client, weapon, g_kPaint[client][tm], g_kWear[client][tm], g_kSeed[client][tm], g_kSt[client][tm], g_kTag[client][tm], true);
		StatTrakOn(client, weapon, -1 - tm);
		MarkGood(client, weapon, def == want);
		return;
	}
	int team = tm == 0 ? 2 : 3;
	for (int i = 0; i < g_n[client]; i++) {
		if (g_wDef[client][i] != def || (g_wTeam[client][i] != 0 && g_wTeam[client][i] != team)) continue;
		Apply(client, weapon, g_wPaint[client][i], g_wWear[client][i], g_wSeed[client][i], g_wSt[client][i], g_wTag[client][i], false);
		ApplyStickers(client, weapon, i);
		StatTrakOn(client, weapon, i);
		MarkGood(client, weapon, true);
		return;
	}
}

bool StickersOn() {
	return g_cvStickers.BoolValue && GetFeatureStatus(FeatureType_Native, "PTaH_GetEconItemViewFromEconEntity") == FeatureStatus_Available;
}
void ApplyStickers(int client, int weapon, int i) {
	if (!StickersOn()) return;
	bool any = false;
	for (int s = 0; s < 4; s++) if (g_wStk[client][i][s]) any = true;
	if (!any) return;
	CEconItemView view = PTaH_GetEconItemViewFromEconEntity(weapon);
	if (view == CEconItemView_NULL) return;
	CAttributeList list = view.NetworkedDynamicAttributesForDemos;
	if (list == CAttributeList_NULL) return;
	for (int s = 0; s < 4; s++) {
		if (!g_wStk[client][i][s]) continue;
		list.SetOrAddAttributeValue(113 + s * 4, g_wStk[client][i][s]);
		list.SetOrAddAttributeValue(114 + s * 4, g_wStkWear[client][i][s]);
	}
}

void MarkGood(int client, int weapon, bool real) {
	if (weapon > 0 && weapon < sizeof g_good) g_good[weapon] = real && (g_giving || GetGameTime() - g_spawnAt[client] > 0.25);
}
public void OnEntityDestroyed(int entity) { if (entity > 0 && entity < sizeof g_good) { g_good[entity] = false; g_entAcc[entity] = 0; } }

bool StOf(int client, int slot) { return slot >= 0 ? g_wSt[client][slot] : g_kSt[client][-1 - slot]; }
int StCount(int client, int slot) { return slot >= 0 ? g_wStc[client][slot] : g_kStc[client][-1 - slot]; }
void StatTrakOn(int client, int weapon, int slot) {
	if (weapon <= 0 || weapon >= sizeof g_entAcc) return;
	if (!StOf(client, slot)) { g_entAcc[weapon] = 0; return; }
	g_entAcc[weapon] = GetSteamAccountID(client); g_entSlot[weapon] = slot;
	SetEntProp(weapon, Prop_Send, "m_nFallbackStatTrak", StCount(client, slot));
}
public void Ev_Death(Event e, const char[] name, bool dontBroadcast) {
	if (GameRules_GetProp("m_bWarmupPeriod")) return;
	int v = GetClientOfUserId(e.GetInt("userid")), a = GetClientOfUserId(e.GetInt("attacker"));
	if (a < 1 || v < 1 || a == v || IsFakeClient(a) || GetClientTeam(a) == GetClientTeam(v)) return;
	bool bot = IsFakeClient(v);
	if (bot && !g_cvTest.BoolValue) return;
	char wpn[32];
	e.GetString("weapon", wpn, sizeof wpn);
	if (StrContains(wpn, "grenade") != -1 || StrContains(wpn, "inferno") != -1 || StrContains(wpn, "molotov") != -1 || StrEqual(wpn, "world")) return;
	int w = GetEntPropEnt(a, Prop_Send, "m_hActiveWeapon");
	if (w <= 0 || w >= sizeof g_entAcc || !g_entAcc[w] || g_entAcc[w] != GetSteamAccountID(a)) return;
	int slot = g_entSlot[w], n;
	if (slot >= 0) { n = ++g_wStc[a][slot]; if (!bot) g_wPend[a][slot]++; }
	else { n = ++g_kStc[a][-1 - slot]; if (!bot) g_kPend[a][-1 - slot]++; }
	SetEntProp(w, Prop_Send, "m_nFallbackStatTrak", n);
}
public void Ev_RoundEnd(Event e, const char[] name, bool dontBroadcast) {
	for (int c = 1; c <= MaxClients; c++) if (IsClientInGame(c) && !IsFakeClient(c)) FlushStatTrak(c);
}
void FlushStatTrak(int client) {
	if (!g_loaded[client]) return;
	JSONObject kills = new JSONObject();
	int n = 0;
	for (int i = 0; i < g_n[client]; i++) if (g_wPend[client][i] && g_wSk[client][i][0]) { kills.SetInt(g_wSk[client][i], g_wPend[client][i]); g_wPend[client][i] = 0; n++; }
	for (int tm = 0; tm < 2; tm++) if (g_kPend[client][tm] && g_kSk[client][tm][0]) { kills.SetInt(g_kSk[client][tm], g_kPend[client][tm]); g_kPend[client][tm] = 0; n++; }
	char sid[24], url[320], key[128];
	if (!n || !GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) { delete kills; return; }
	g_cvUrl.GetString(url, sizeof url); g_cvKey.GetString(key, sizeof key);
	if (!url[0]) { delete kills; return; }
	Format(url, sizeof url, "%s/stattrak", url);
	JSONObject body = new JSONObject();
	body.SetString("steamId", sid);
	body.Set("kills", kills); delete kills;
	HTTPRequest req = new HTTPRequest(url);
	req.SetHeader("X-Server-Key", key);
	req.Post(body, OnStatTrakSent);
	delete body;
}
public void OnStatTrakSent(HTTPResponse r, any data, const char[] err) {
	if (r.Status != HTTPStatus_OK) LogError("[TICKRATE] StatTrak non enregistré : %d %s", view_as<int>(r.Status), err);
}

void Apply(int client, int weapon, int paint, float wear, int seed, bool st, const char[] tag, bool knife) {
	SetEntProp(weapon, Prop_Send, "m_iItemIDLow", -1);
	SetEntProp(weapon, Prop_Send, "m_iItemIDHigh", g_itemId++);
	SetEntProp(weapon, Prop_Send, "m_nFallbackPaintKit", paint);
	SetEntPropFloat(weapon, Prop_Send, "m_flFallbackWear", wear < 0.00001 ? 0.00001 : wear);
	SetEntProp(weapon, Prop_Send, "m_nFallbackSeed", seed);
	SetEntProp(weapon, Prop_Send, "m_nFallbackStatTrak", st ? 0 : -1);
	SetEntProp(weapon, Prop_Send, "m_iEntityQuality", knife ? 3 : st ? 9 : 4);
	if (tag[0]) SetEntPropString(weapon, Prop_Send, "m_szCustomName", tag);
	SetEntProp(weapon, Prop_Send, "m_iAccountID", GetSteamAccountID(client));
	SetEntPropEnt(weapon, Prop_Send, "m_hOwnerEntity", client);
	SetEntPropEnt(weapon, Prop_Send, "m_hPrevOwner", -1);
}

public void Ev_Spawn(Event e, const char[] name, bool dontBroadcast) {
	int userid = e.GetInt("userid"), c = GetClientOfUserId(userid);
	if (c > 0) g_spawnAt[c] = GetGameTime();
	CreateTimer(0.3, Timer_Dress, userid, TIMER_FLAG_NO_MAPCHANGE);
}
public Action Timer_Dress(Handle t, any userid) {
	int client = GetClientOfUserId(userid);
	if (client < 1 || !IsPlayerAlive(client) || IsFakeClient(client) || !g_loaded[client]) return Plugin_Stop;
	int tm = CampOf(client);
	if (tm < 0) return Plugin_Stop;
	RefreshSpawnWeapons(client, tm);
	if (g_agent[client][tm][0]) {
		if (!IsModelPrecached(g_agent[client][tm])) PrecacheModel(g_agent[client][tm]);
		SetEntityModel(client, g_agent[client][tm]);
	}
	if (g_gDef[client][tm]) {
		int active = GetEntPropEnt(client, Prop_Send, "m_hActiveWeapon");
		if (active != -1) SetEntPropEnt(client, Prop_Send, "m_hActiveWeapon", -1);
		GiveGloves(client, tm);
		if (active != -1) {
			DataPack dp = new DataPack();
			dp.WriteCell(GetClientUserId(client));
			dp.WriteCell(EntIndexToEntRef(active));
			CreateTimer(0.1, Timer_Reactive, dp, TIMER_FLAG_NO_MAPCHANGE | TIMER_DATA_HNDL_CLOSE);
		}
	}
	return Plugin_Stop;
}

void RefreshSpawnWeapons(int client, int tm) {
	int team = tm == 0 ? 2 : 3;
	for (int slot = 0; slot <= CS_SLOT_KNIFE; slot++) {
		int w = GetPlayerWeaponSlot(client, slot);
		if (w == -1 || GetEntPropEnt(w, Prop_Send, "m_hPrevOwner") > 0 || g_good[w]) continue;
		char cls[64];
		GetEntityClassname(w, cls, sizeof cls);
		int def = GetEntProp(w, Prop_Send, "m_iItemDefinitionIndex");
		bool knife = IsKnifeClass(cls), want = false;
		if (knife) want = g_kDef[client][tm] != 0;
		else for (int i = 0; i < g_n[client]; i++) if (g_wDef[client][i] == def && (g_wTeam[client][i] == 0 || g_wTeam[client][i] == team)) { want = true; break; }
		if (!want) continue;
		char give[64];
		if (knife && !KnifeClass(g_kDef[client][tm], give, sizeof give)) continue;
		if (!knife && !ClassOfDef(def, cls, give, sizeof give)) continue;
		RemovePlayerItem(client, w);
		AcceptEntityInput(w, "Kill");
		g_giving = true;
		int nw = GivePlayerItem(client, give);
		if (nw == -1 && knife) nw = GivePlayerItem(client, tm == 0 ? "weapon_knife_t" : "weapon_knife");
		if (nw != -1 && knife) EquipPlayerWeapon(client, nw);
		g_giving = false;
	}
}
bool KnifeClass(int def, char[] out, int len) {
	switch (def) {
		case 500: strcopy(out, len, "weapon_bayonet");
		case 503: strcopy(out, len, "weapon_knife_css");
		case 505: strcopy(out, len, "weapon_knife_flip");
		case 506: strcopy(out, len, "weapon_knife_gut");
		case 507: strcopy(out, len, "weapon_knife_karambit");
		case 508: strcopy(out, len, "weapon_knife_m9_bayonet");
		case 509: strcopy(out, len, "weapon_knife_tactical");
		case 512: strcopy(out, len, "weapon_knife_falchion");
		case 514: strcopy(out, len, "weapon_knife_survival_bowie");
		case 515: strcopy(out, len, "weapon_knife_butterfly");
		case 516: strcopy(out, len, "weapon_knife_push");
		case 517: strcopy(out, len, "weapon_knife_cord");
		case 518: strcopy(out, len, "weapon_knife_canis");
		case 519: strcopy(out, len, "weapon_knife_ursus");
		case 520: strcopy(out, len, "weapon_knife_gypsy_jackknife");
		case 521: strcopy(out, len, "weapon_knife_outdoor");
		case 522: strcopy(out, len, "weapon_knife_stiletto");
		case 523: strcopy(out, len, "weapon_knife_widowmaker");
		case 525: strcopy(out, len, "weapon_knife_skeleton");
		default: return false;
	}
	return true;
}

bool ClassOfDef(int def, const char[] cls, char[] out, int len) {
	switch (def) {
		case 61: strcopy(out, len, "weapon_usp_silencer");
		case 60: strcopy(out, len, "weapon_m4a1_silencer");
		case 63: strcopy(out, len, "weapon_cz75a");
		case 64: strcopy(out, len, "weapon_revolver");
		case 23: strcopy(out, len, "weapon_mp5sd");
		default: strcopy(out, len, cls);
	}
	return out[0] != '\0';
}

void GiveGloves(int client, int tm) {
	int old = GetEntPropEnt(client, Prop_Send, "m_hMyWearables");
	if (old != -1 && IsValidEntity(old)) AcceptEntityInput(old, "KillHierarchy");
	char arms[4];
	GetEntPropString(client, Prop_Send, "m_szArmsModel", arms, sizeof arms);
	if (arms[0]) SetEntPropString(client, Prop_Send, "m_szArmsModel", "");
	int ent = CreateEntityByName("wearable_item");
	if (ent == -1) return;
	SetEntProp(ent, Prop_Send, "m_iItemIDLow", -1);
	SetEntProp(ent, Prop_Send, "m_iItemIDHigh", g_itemId++);
	SetEntProp(ent, Prop_Send, "m_iItemDefinitionIndex", g_gDef[client][tm]);
	SetEntProp(ent, Prop_Send, "m_nFallbackPaintKit", g_gPaint[client][tm]);
	SetEntPropFloat(ent, Prop_Send, "m_flFallbackWear", g_gWear[client][tm] < 0.00001 ? 0.00001 : g_gWear[client][tm]);
	SetEntProp(ent, Prop_Send, "m_nFallbackSeed", g_gSeed[client][tm]);
	SetEntProp(ent, Prop_Send, "m_iAccountID", GetSteamAccountID(client));
	SetEntPropEnt(ent, Prop_Data, "m_hOwnerEntity", client);
	SetEntPropEnt(ent, Prop_Data, "m_hParent", client);
	SetEntPropEnt(ent, Prop_Data, "m_hMoveParent", client);
	SetEntProp(ent, Prop_Send, "m_bInitialized", 1);
	DispatchSpawn(ent);
	SetEntPropEnt(client, Prop_Send, "m_hMyWearables", ent);
	SetEntProp(client, Prop_Send, "m_nBody", 1);
	LogMessage("[TICKRATE] gants %d (skin %d) posés sur %N", g_gDef[client][tm], g_gPaint[client][tm], client);
}
public Action Timer_Reactive(Handle t, DataPack dp) {
	dp.Reset();
	int client = GetClientOfUserId(dp.ReadCell()), w = EntRefToEntIndex(dp.ReadCell());
	if (client > 0 && IsPlayerAlive(client) && w != INVALID_ENT_REFERENCE) SetEntPropEnt(client, Prop_Send, "m_hActiveWeapon", w);
	return Plugin_Stop;
}
