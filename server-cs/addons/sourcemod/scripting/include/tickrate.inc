/*
 * TICKRATE — messages en jeu traduits (fichier commun à tous les plugins)
 * Les textes sont dans translations/tickrate.phrases.txt (en, fr, ru). Chaque joueur les reçoit dans
 * la langue choisie sur le site (tickrate_match la règle avec SetClientLanguage), sinon dans celle de son jeu.
 * Couleurs dans les textes : {w} blanc, {r} rouge, {g} vert, {l} vert clair, {gy} gris, {y} jaune, {b} bleu, {o} orange.
 */
#if defined _tickrate_included
 #endinput
#endif
#define _tickrate_included

#define TR_TAG " \x04[TICKRATE]\x01 "

stock void TrColors(char[] s, int len) {
	ReplaceString(s, len, "{w}", "\x01");
	ReplaceString(s, len, "{r}", "\x02");
	ReplaceString(s, len, "{g}", "\x04");
	ReplaceString(s, len, "{l}", "\x05");
	ReplaceString(s, len, "{gy}", "\x08");
	ReplaceString(s, len, "{y}", "\x09");
	ReplaceString(s, len, "{b}", "\x0B");
	ReplaceString(s, len, "{o}", "\x10");
}

// message à un joueur : TrChat(client, "%t", "Phrase", args…)
stock void TrChat(int client, const char[] fmt, any ...) {
	if (client < 1 || !IsClientInGame(client) || IsFakeClient(client)) return;
	char buf[512];
	SetGlobalTransTarget(client);
	VFormat(buf, sizeof buf, fmt, 3);
	TrColors(buf, sizeof buf);
	PrintToChat(client, "%s%s", TR_TAG, buf);
}

// même chose sans le préfixe [TICKRATE] (lignes de suite d'une liste)
stock void TrChatRaw(int client, const char[] fmt, any ...) {
	if (client < 1 || !IsClientInGame(client) || IsFakeClient(client)) return;
	char buf[512];
	SetGlobalTransTarget(client);
	VFormat(buf, sizeof buf, fmt, 3);
	TrColors(buf, sizeof buf);
	PrintToChat(client, " %s", buf);
}

// message à tout le monde, chacun dans sa langue : TrChatAll("%t", "Phrase", args…)
stock void TrChatAll(const char[] fmt, any ...) {
	char buf[512];
	for (int c = 1; c <= MaxClients; c++) {
		if (!IsClientInGame(c) || IsFakeClient(c)) continue;
		SetGlobalTransTarget(c);
		VFormat(buf, sizeof buf, fmt, 2);
		TrColors(buf, sizeof buf);
		PrintToChat(c, "%s%s", TR_TAG, buf);
	}
}
