/* =====================================================================
   TICKRATE — vocal en jeu (CS:GO legacy)
   tr_voice_mode :
     "rounds"  (défaut) : ton équipe pendant tout le match, morts compris (ils parlent à leur équipe) ;
                          LES DEUX ÉQUIPES s'entendent seulement à l'échauffement, à la mi-temps
                          (changement de côté) et en fin de match (sv_auto_full_alltalk_during_warmup_half_end).
     "team"             : identique (ancien nom).
     "alltalk"          : tout le monde s'entend tout le temps (comme l'alltalk de l'ancien CS:GO).
   Compiler : spcomp tickrate_voice.sp  ->  copier tickrate_voice.smx dans addons/sourcemod/plugins/
   ===================================================================== */
#include <sourcemod>
#include <sdktools>
#include <tickrate>

#pragma semicolon 1
#pragma newdecls required

public Plugin myinfo = {
    name = "TICKRATE Voice",
    author = "TICKRATE",
    description = "Vocal d'équipe pendant le match, alltalk à l'échauffement, à la mi-temps et en fin de match",
    version = "1.2.0",
    url = ""
};

ConVar g_cvMode;
ConVar g_cvFull, g_cvLiving, g_cvDead, g_cvDeadTalk, g_cvAutoAll;
bool g_bOpen = false;

public void OnPluginStart()
{
    g_cvMode     = CreateConVar("tr_voice_mode", "rounds", "Vocal en jeu : rounds | alltalk | team");
    g_cvFull     = FindConVar("sv_full_alltalk");
    g_cvLiving   = FindConVar("sv_talk_enemy_living");
    g_cvDead     = FindConVar("sv_talk_enemy_dead");
    g_cvDeadTalk = FindConVar("sv_deadtalk");
    g_cvAutoAll  = FindConVar("sv_auto_full_alltalk_during_warmup_half_end");

    HookEvent("round_start",      Ev_RoundStart,  EventHookMode_PostNoCopy);   // début du freeze time
    HookEvent("round_freeze_end", Ev_FreezeEnd,   EventHookMode_PostNoCopy);   // le round commence vraiment
    HookEvent("round_end",        Ev_RoundEnd,    EventHookMode_PostNoCopy);   // fin du round
    g_cvMode.AddChangeHook(OnModeChanged);
    AutoExecConfig(true, "tickrate_voice");
    LoadTranslations("tickrate.phrases");
}

public void OnConfigsExecuted()
{
    if (g_cvAutoAll != null) g_cvAutoAll.SetInt(1);
    ApplyMode();
}

void OnModeChanged(ConVar cv, const char[] oldV, const char[] newV) { ApplyMode(); }

bool InWarmup() { return GameRules_GetProp("m_bWarmupPeriod") == 1; }

void GetMode(char[] buf, int len) { g_cvMode.GetString(buf, len); }

// open = true : les deux équipes s'entendent ; fermé : équipe seulement, les morts parlent à leur équipe
void SetCrossTeam(bool open, bool announce)
{
    if (g_cvFull != null)   g_cvFull.SetInt(open ? 1 : 0);
    if (g_cvLiving != null) g_cvLiving.SetInt(open ? 1 : 0);
    if (g_cvDead != null)   g_cvDead.SetInt(open ? 1 : 0);
    if (g_cvDeadTalk != null) g_cvDeadTalk.SetInt(1);
    if (announce && open != g_bOpen)
        TrChatAll("%t", open ? "Voice open" : "Voice team");
    g_bOpen = open;
}

void ApplyMode()
{
    char mode[16]; GetMode(mode, sizeof(mode));
    if (StrEqual(mode, "alltalk"))   { SetCrossTeam(true, false);  return; }
    // "rounds" / "team" : équipe seulement ; échauffement, mi-temps et fin de match ouverts par le jeu lui-même
    SetCrossTeam(InWarmup(), false);
}

void Ev_RoundEnd(Event e, const char[] n, bool b)    { ApplyMode();  }
void Ev_RoundStart(Event e, const char[] n, bool b)  { ApplyMode();  }   // freeze time = entre les manches
void Ev_FreezeEnd(Event e, const char[] n, bool b)   { ApplyMode(); }
