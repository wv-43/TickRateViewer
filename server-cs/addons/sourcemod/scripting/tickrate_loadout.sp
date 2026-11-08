/*
 * TICKRATE — armes du slot CT choisies sur le site
 * ------------------------------------------------
 * Sur le site (page Inventaire > Équipement), chaque joueur choisit, comme dans le casier de CS:GO :
 *   M4A4 ou M4A1-S, USP-S ou P2000, Desert Eagle ou R8 Revolver, Five-SeveN / Tec-9 ou CZ75-Auto, MP7 ou MP5-SD.
 * Ce plugin applique ce choix en jeu :
 *   - menu d'achat : acheter l'une des deux armes d'un même emplacement donne celle choisie (prix de l'arme donnée) ;
 *   - spawn côté CT : le pistolet de départ est l'USP-S ou le P2000 choisi ;
 *   - !ws (ou sm_ws) : recharge les choix après une modification sur le site.
 *
 * Dépendances : SourceMod 1.11+, REST in Pawn (ripext), cstrike.
 * ConVars (cfg/sourcemod/tickrate_loadout.cfg) :
 *   tr_loadout_url  URL de gameApi, ex. https://europe-west1-tickratecsgo.cloudfunctions.net/gameApi
 *   tr_loadout_key  SERVER_KEY du back-end
 */
#include <sourcemod>
#include <sdktools>
#include <cstrike>
#include <ripext>
#include <tickrate>
#pragma semicolon 1
#pragma newdecls required

#define DEF_P2000 32
#define DEF_USP   61

public Plugin myinfo = { name = "TICKRATE loadout", author = "TICKRATE", description = "Armes interchangeables (M4, USP, R8, CZ75, MP5-SD) choisies sur le site", version = "1.1.0", url = "" };

ConVar g_cvUrl, g_cvKey;
bool g_wantSilencedM4[MAXPLAYERS + 1];   // true = M4A1-S, false = M4A4
bool g_wantUsp[MAXPLAYERS + 1] = { true, ... };   // true = USP-S, false = P2000
bool g_wantR8[MAXPLAYERS + 1];           // true = R8 Revolver, false = Desert Eagle
bool g_wantCz[MAXPLAYERS + 1];           // true = CZ75-Auto à la place du Five-SeveN (CT) / Tec-9 (T)
bool g_wantMp5[MAXPLAYERS + 1];          // true = MP5-SD, false = MP7

public void OnPluginStart() {
	LoadTranslations("tickrate.phrases");
	g_cvUrl = CreateConVar("tr_loadout_url", "", "URL de gameApi (sans / à la fin)");
	g_cvKey = CreateConVar("tr_loadout_key", "", "SERVER_KEY du back-end", FCVAR_PROTECTED);
	AutoExecConfig(true, "tickrate_loadout");
	RegConsoleCmd("sm_ws", Cmd_Refresh, "Recharge les armes choisies sur le site");
	HookEvent("player_spawn", OnPlayerSpawn);
}

public void OnClientConnected(int client) { g_wantSilencedM4[client] = false; g_wantUsp[client] = true; g_wantR8[client] = false; g_wantCz[client] = false; g_wantMp5[client] = false; }
public void OnClientAuthorized(int client, const char[] auth) { if (!IsFakeClient(client)) FetchLoadout(client); }
public void OnClientPostAdminCheck(int client) { if (!IsFakeClient(client)) FetchLoadout(client); }

public Action Cmd_Refresh(int client, int args) {
	if (client > 0) { FetchLoadout(client); TrChat(client, "%t", "Loadout reloaded"); }
	return Plugin_Handled;
}

void FetchLoadout(int client) {
	char sid[24], url[320], key[128];
	if (!GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) return;
	g_cvUrl.GetString(url, sizeof url); g_cvKey.GetString(key, sizeof key);
	if (!url[0]) return;
	Format(url, sizeof url, "%s/loadout?steamId=%s", url, sid);
	HTTPRequest req = new HTTPRequest(url);
	req.SetHeader("X-Server-Key", key);
	req.Get(OnLoadout, GetClientUserId(client));
}

public void OnLoadout(HTTPResponse r, any userid, const char[] err) {
	int client = GetClientOfUserId(userid);
	if (client < 1 || r.Status != HTTPStatus_OK) return;
	JSONObject j = view_as<JSONObject>(r.Data);
	char m4[32], pistol[32];
	j.GetString("m4", m4, sizeof m4);
	j.GetString("ctPistol", pistol, sizeof pistol);
	g_wantSilencedM4[client] = StrEqual(m4, "weapon_m4a1_silencer");
	g_wantUsp[client] = !StrEqual(pistol, "weapon_hkp2000");
	char dg[32];
	if (j.HasKey("deagle")) { j.GetString("deagle", dg, sizeof dg); g_wantR8[client] = StrEqual(dg, "weapon_revolver"); }
	g_wantCz[client] = j.HasKey("cz") && j.GetBool("cz");
	g_wantMp5[client] = j.HasKey("mp5") && j.GetBool("mp5");
}

// ---------- menu d'achat ----------
public Action CS_OnBuyCommand(int client, const char[] weapon) {
	char want[32];
	if (StrEqual(weapon, "m4a1") || StrEqual(weapon, "m4a1_silencer"))
		strcopy(want, sizeof want, g_wantSilencedM4[client] ? "m4a1_silencer" : "m4a1");
	else if (StrEqual(weapon, "hkp2000") || StrEqual(weapon, "usp_silencer"))
		strcopy(want, sizeof want, g_wantUsp[client] ? "usp_silencer" : "hkp2000");
	else if (StrEqual(weapon, "deagle") || StrEqual(weapon, "revolver"))
		strcopy(want, sizeof want, g_wantR8[client] ? "revolver" : "deagle");
	else if (StrEqual(weapon, "fiveseven") || StrEqual(weapon, "tec9") || StrEqual(weapon, "cz75a"))
		strcopy(want, sizeof want, g_wantCz[client] ? "cz75a" : GetClientTeam(client) == CS_TEAM_T ? "tec9" : "fiveseven");
	else if (StrEqual(weapon, "mp7") || StrEqual(weapon, "mp5sd"))
		strcopy(want, sizeof want, g_wantMp5[client] ? "mp5sd" : "mp7");
	else return Plugin_Continue;
	if (StrEqual(weapon, want)) return Plugin_Continue;    // déjà la bonne arme : achat normal
	return BuyInstead(client, want) ? Plugin_Handled : Plugin_Continue;
}

// achète « want » à la place (mêmes règles que le jeu : zone d'achat, temps d'achat, argent)
bool BuyInstead(int client, const char[] want) {
	if (!IsPlayerAlive(client) || !GetEntProp(client, Prop_Send, "m_bInBuyZone")) return false;
	int team = GetClientTeam(client);
	if (GameRules_GetProp(team == CS_TEAM_CT ? "m_bCTCantBuy" : "m_bTCantBuy")) return false;
	CSWeaponID id = CS_AliasToWeaponID(want);
	if (id == CSWeapon_NONE) return false;
	int price = CS_GetWeaponPrice(client, id), money = GetEntProp(client, Prop_Send, "m_iAccount");
	if (money < price) { PrintCenterText(client, "%t", "No money"); return true; }
	bool primary = StrContains(want, "m4a1") == 0 || StrEqual(want, "mp5sd") || StrEqual(want, "mp7");
	int old = GetPlayerWeaponSlot(client, primary ? CS_SLOT_PRIMARY : CS_SLOT_SECONDARY);
	if (old != -1) CS_DropWeapon(client, old, true, false);   // comme un achat normal : l'ancienne arme tombe au sol
	SetEntProp(client, Prop_Send, "m_iAccount", money - price);
	char cls[40]; Format(cls, sizeof cls, "weapon_%s", want);
	GivePlayerItem(client, cls);
	return true;
}

// ---------- pistolet de départ CT ----------
public void OnPlayerSpawn(Event e, const char[] name, bool dontBroadcast) {
	int userid = e.GetInt("userid");
	CreateTimer(0.2, Timer_FixPistol, userid, TIMER_FLAG_NO_MAPCHANGE);   // laisse le jeu donner l'équipement d'abord
}
public Action Timer_FixPistol(Handle t, any userid) {
	int client = GetClientOfUserId(userid);
	if (client < 1 || !IsPlayerAlive(client) || GetClientTeam(client) != CS_TEAM_CT) return Plugin_Stop;
	int w = GetPlayerWeaponSlot(client, CS_SLOT_SECONDARY);
	if (w == -1) return Plugin_Stop;
	// USP-S et P2000 ont la même classe (weapon_hkp2000) : on les distingue par l'index d'objet
	int def = GetEntProp(w, Prop_Send, "m_iItemDefinitionIndex");
	if (def != DEF_P2000 && def != DEF_USP) return Plugin_Stop;   // pistolet acheté (Five-SeveN, Deagle…) : on n'y touche pas
	if ((def == DEF_USP) == g_wantUsp[client]) return Plugin_Stop;
	RemovePlayerItem(client, w);
	AcceptEntityInput(w, "Kill");
	GivePlayerItem(client, g_wantUsp[client] ? "weapon_usp_silencer" : "weapon_hkp2000");
	return Plugin_Stop;
}
