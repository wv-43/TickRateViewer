/*
 * TICKRATE — serveur de test « CS:GO installé ? »
 * -----------------------------------------------
 * À lancer sur un petit serveur séparé (ex. port 27016, map de_mirage, 1 slot suffit).
 * Quand un joueur se connecte depuis le site (bouton « Lancer le test »), le plugin
 * prévient le back-end : le site affiche alors « CS:GO est prêt ✓ ».
 * Le joueur reçoit un message puis est déconnecté au bout de 8 s.
 *
 * Dépendances : SourceMod 1.11+, REST in Pawn (ripext).
 * ConVars : tr_check_url (ex. https://europe-west1-<projet>.cloudfunctions.net/gameApi), tr_check_key (= SERVER_KEY)
 */
#include <sourcemod>
#include <ripext>
#include <tickrate>
#pragma semicolon 1
#pragma newdecls required

public Plugin myinfo = { name = "TICKRATE check", author = "TICKRATE", description = "Vérifie que le joueur a bien CS:GO", version = "1.0.0", url = "" };

ConVar g_cvUrl, g_cvKey;

public void OnPluginStart() {
	LoadTranslations("tickrate.phrases");
	g_cvUrl = CreateConVar("tr_check_url", "", "URL de gameApi (sans / à la fin)");
	g_cvKey = CreateConVar("tr_check_key", "", "SERVER_KEY du back-end", FCVAR_PROTECTED);
	AutoExecConfig(true, "tickrate_check");
}

public void OnClientPostAdminCheck(int client) {
	if (IsFakeClient(client)) return;
	char sid[24], url[256], key[128];
	if (!GetClientAuthId(client, AuthId_SteamID64, sid, sizeof sid)) return;
	g_cvUrl.GetString(url, sizeof url); g_cvKey.GetString(key, sizeof key);
	StrCat(url, sizeof url, "/check");
	JSONObject body = new JSONObject();
	body.SetString("steamId", sid);
	body.SetString("client", "csgo");
	HTTPRequest req = new HTTPRequest(url);
	req.SetHeader("X-Server-Key", key);
	req.Post(body, OnChecked, GetClientUserId(client));
	delete body;
}

public void OnChecked(HTTPResponse r, any userid, const char[] err) {
	int client = GetClientOfUserId(userid);
	if (client < 1) return;
	bool ok = r.Status == HTTPStatus_OK && view_as<JSONObject>(r.Data).GetBool("ok");
	TrChat(client, "%t", ok ? "Check ok" : "Check not linked");
	CreateTimer(8.0, Kick, userid);
}
public Action Kick(Handle t, any userid) {
	int client = GetClientOfUserId(userid);
	if (client > 0) KickClient(client, "%T", "Kick check done", client);
	return Plugin_Stop;
}
