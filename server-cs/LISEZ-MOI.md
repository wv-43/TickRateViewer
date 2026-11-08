# Serveur CS:GO — fichiers de config TICKRATE

> Les 5 plugins sont **déjà compilés** dans `addons/sourcemod/plugins/` (SourceMod 1.11, REST in Pawn 1.3.2).
> Après une modification d'un `.sp`, recompiler avec `spcomp`. Sur le serveur, installer aussi l'extension
> REST in Pawn (version Linux ou Windows selon le serveur) : https://github.com/ErikMinekus/sm-ripext/releases

## Installation automatique sur un VPS Ubuntu 24.04 (recommandé)

`install/install.sh` installe tout : SteamCMD, serveur CS:GO, Metamod, SourceMod, REST in Pawn, plugins,
réglages, un service par serveur (s1, s2…), pare-feu et ménage des vieilles demos.
1. Créer un jeton Steam par serveur (App ID **4465480**, celui de CS:GO legacy ; un jeton 730 ne marche plus) : https://steamcommunity.com/dev/managegameservers
2. Depuis Windows (PowerShell), copier ce dossier sur le VPS : `scp -r H:\CSGOServ\server-cs root@IP_DU_VPS:/root/`
3. Se connecter : `ssh root@IP_DU_VPS`, puis lancer : `bash /root/server-cs/install/install.sh`
4. Le script demande : nombre de serveurs, SERVER_KEY, les jetons Steam, ton SteamID64 (admin).
5. À la fin, il affiche les lignes à ajouter dans `servers/` de la base Firebase.

Commandes utiles : `systemctl status csgo@s1`, `journalctl -u csgo@s1 -f`, `systemctl restart csgo@s1`.

**Mettre à jour les plugins** (après une modification) : recopier le dossier (`scp -r …` comme ci-dessus),
puis sur le VPS `bash /root/server-cs/install/update.sh`. Clés, jetons et admins ne sont pas touchés.

## Optimisation RAM pour VPS 4 vCœurs / 4 Go RAM en 128 tick (ZAP-Hosting)

Pourquoi la RAM monte vite à ~90 % en 128 tick avec des bots :
1. **Tampon GOTV (`tv_delay 90`) en 128 tick** : dès que des bots bougent sur la carte, SourceTV garde 90 secondes d'états complets en RAM (~300 à 450 Mo par serveur).
2. **Maillage IA (`.nav`) + banques audio radio des bots** : le chargement des bots charge le fichier `.nav` (~150 Mo) et toutes les voix radio en mémoire.
3. **Fragmentation `glibc` 32 bits (`srcds_linux`)** : sur un CPU 4 vCœurs, `glibc` ouvre jusqu'à 32 arènes mémoire par processus, ce qui gonfle la RAM résidente (RSS) de 200 à 300 Mo.

Ce que font automatiquement `install/install.sh`, `install/update.sh`, `cfg/tickrate/match.cfg` et `tickrate_match.sp` **tout en gardant le 128 tick intégral** :
- **`MALLOC_ARENA_MAX=2` + `-nominidumps -nobreakpad` + `MemoryHigh=1650M`** dans `csgo@.service` : supprime la fragmentation `glibc` 32 bits (-200 à -300 Mo de RAM par serveur).
- **`tv_delay 0` pendant les parties bots / hors match** (et `tv_snapshotrate 16` + `tv_deltacache 2` en match réel) : économise ~350 Mo de RAM immédiatement dès que tu joues avec des bots, sans toucher au 128 tick des joueurs.
- **`bot_chatter off` & `sv_forcepreload 0`** : coupe le préchargement des banques radio des bots et des assets inutilisés (~80 à 120 Mo gagnés).
- **Compression RAM `zram` (`lz4`, 50 % RAM) + Swap 2 Go** : compresse les pages mémoire froides directement en RAM à la volée (~3:1) avant tout recours au disque.
- **Redémarrage rapide en 5 s après chaque match** (`Timer_Restart` à 5 s) : purge immédiatement le `.nav` des bots dès la fin de la partie.

## En match : ce que voient les joueurs

- **Knife round** au début (`tr_match_knife 1`) : l'équipe gagnante tape `!stay` ou `!switch` (20 s, sinon elle reste).
- **Rangs dans le TAB** : l'icône de rang CS:GO (Silver I à Global Elite) suit l'ELO TICKRATE
  (600 → Silver I, 2100+ → Global Elite). Le tag de clan reste celui du joueur.
- **Pause technique** : `!pause` (au prochain freeze time), `!unpause` par un joueur de chaque équipe ;
  admins : `!forceunpause`.
- **Temps mort tactique** : `!tac` (vote de l'équipe, 3 par équipe, 30 s).
- **Plugin `tickrate_rules`** : déconnecte un joueur dont un réglage protégé par sv_cheats a une valeur anormale
  (cheat qui débloque les commandes : wallhack par le rendu, fumées retirées…) ou qui spamme les commandes.
  Pas d'envoi de fichiers (sprays), votes limités aux temps morts.

## Installation à la main

À copier dans le dossier du serveur : `csgo/cfg/tickrate/`

## Vocal
| Fichier | Effet |
|---|---|
| `voice_rounds.cfg` | **Par défaut.** Ton équipe pendant les rounds ; les deux équipes s'entendent entre les manches (fin de round + freeze time), à l'échauffement, à la mi-temps et en fin de match. Nécessite le plugin `tickrate_voice.smx` |
| `voice_alltalk.cfg` | Tout le monde s'entend, les deux équipes, vivants et morts (comme l'ancien CS:GO) |
| `voice_team.cfg` | Équipe uniquement (règle compétitive classique) |

- **Avant le match** (room du site) : vocal web (WebRTC, `voice.js`), canal « Tous » ou « Équipe ».
- **Dès que les 10 joueurs sont connectés au serveur** : le vocal du site se coupe tout seul,
  c'est le vocal **du jeu** qui prend le relais, réglé par ces fichiers.
- Choix du mode côté back-end : variable `VOICE_MODE=rounds` (défaut), `alltalk` ou `team` dans `backend/.env`.

## Plugin `tickrate_voice` (SourceMod)
Source : `addons/sourcemod/scripting/tickrate_voice.sp`. Il bascule le vocal à chaque round :
fin du round → les deux équipes s'entendent ; fin du freeze time → retour au vocal d'équipe.
1. Installer Metamod:Source + SourceMod sur le serveur CS:GO.
2. Compiler : `spcomp tickrate_voice.sp` (ou le compilateur en ligne de SourceMod).
3. Copier `tickrate_voice.smx` dans `csgo/addons/sourcemod/plugins/`.
4. Réglage : `tr_voice_mode rounds | alltalk | team` (fichier `cfg/sourcemod/tickrate_voice.cfg` créé au 1er lancement).

## Déroulé d'un match : `tickrate_match.sp` (indispensable)

C'est le plugin qui relie le serveur au matchmaking du site. Sans lui, aucun match ne peut aller au bout.
1. Toutes les 5 s, il demande au site s'il a un match à lancer (`GET /assignment?server=<id>`).
2. Match reçu : mot de passe du match, changement de map (et passage en mode Wingman si besoin), échauffement.
   **Seuls les 10 SteamID du match peuvent entrer** ; chacun est placé dans son équipe et ne peut pas en changer.
3. Chaque joueur qui entre est signalé au site (`POST /joined`) : la ligne du salon passe à « connecté ».
4. Tout le monde est là : fin de l'échauffement, vocal `voice_<mode>.cfg`, Vigie démarrée (`tr_vigie_start`).
5. Chaque fin de round : score et stats envoyés au site (`POST /round`, section « Matchs en direct »).
6. Fin du match : résultat envoyé (`POST /end` : ELO, historique, drops), puis le serveur se vide au bout de 30 s
   et redevient libre. Si le site annule le match pendant l'échauffement (joueur absent après 2 min),
   le serveur prévient tout le monde, vide la partie et redevient libre.

Serveur libre : mot de passe aléatoire, seuls les admins SourceMod peuvent entrer.

**Installation**
1. Dépendances : SourceMod 1.11+ et l'extension REST in Pawn (`ripext`).
2. Copier `addons/sourcemod/plugins/tickrate_match.smx` (déjà compilé, SourceMod 1.11) dans `csgo/addons/sourcemod/plugins/`.
3. Copier `cfg/tickrate/` (match.cfg + voice_*.cfg) dans `csgo/cfg/tickrate/`.
4. Régler `csgo/cfg/sourcemod/tickrate_match.cfg` (créé au premier lancement) :
   - `tr_match_url` = `https://europe-west1-tickratecsgo.cloudfunctions.net/gameApi`
   - `tr_match_key` = la valeur de `SERVER_KEY`
   - `tr_server_id` = l'identifiant du serveur dans la base (ex. `s1`)
   - `tr_match_voice` = `rounds` (défaut), `alltalk` ou `team`
5. Lancer le serveur en 128 tick avec GOTV : `-tickrate 128 +tv_enable 1` (GOTV doit être activé au démarrage).
6. **En dernier**, déclarer le serveur dans la base (console Firebase > Realtime Database), dans `servers/s1` :
   `{ "ip": "1.2.3.4", "port": 27015, "gotvPort": 27020, "region": "EU", "status": "free" }`
   Ne pas le faire avant que le plugin tourne : sinon les joueurs seraient bannis pour absence.

Commandes admin : `sm_tr_status` (état du match), `sm_tr_reset` (abandonne le match et vide le serveur ;
il faut alors remettre `servers/<id>/status` à `free` dans la base si le site attend encore ce match).

## Vigie : `tickrate_vigie.sp`

Plugin de collecte de stats pour le fair-play (rien n'est installé chez les joueurs). Nécessite **SourceMod 1.11+** et l'extension **REST in Pawn (ripext)**.
Non compilé ici : `spcomp tickrate_vigie.sp` puis copier le `.smx` dans `addons/sourcemod/plugins/`.

- `tr_vigie_url` : URL du site (ex. `https://tickrate.gg`) ; `tr_vigie_key` : la même valeur que `SERVER_KEY` du backend.
- `tickrate_match` pose `tr_match_id <id>` puis lance `tr_vigie_start` quand le match démarre. `tr_vigie_url` = l'URL de gameApi (le plugin ajoute `/api/server/telemetry`, accepté par gameApi).
- `tr_vigie_start` démarre aussi l'enregistrement GOTV (`tv_enable 1` requis) : la demo sert de preuve aux examinateurs.
- À la fin (`cs_win_panel_match` ou `tr_vigie_stop`), le plugin envoie la télémétrie à `/api/server/telemetry`.
Coût : quelques dizaines de traces de rayons par tick, uniquement pour les ennemis dans le champ de vision ou à moins de 2600 unités.

## Serveur de test « CS:GO installé ? » : `tickrate_check.sp`

Petit serveur à part (1 slot suffit, ex. port 27016). Depuis la page **Comment jouer**, le joueur clique
« Lancer le test » : CS:GO s'ouvre et se connecte à ce serveur, le plugin appelle `POST /check` sur `gameApi`,
et le site affiche « CS:GO est prêt ✓ ». Le joueur est déconnecté au bout de 8 s.
- `tr_check_url` = `https://europe-west1-<projet>.cloudfunctions.net/gameApi`, `tr_check_key` = SERVER_KEY.
- Sur le site : renseigner `var CSGO_TEST_SERVER='ip:port'` dans `tickrate.html`.
Sans ce serveur, le test se fait « à la main » : le site lance CS:GO et le joueur confirme qu'il s'est ouvert.

## Armes du slot CT : `tickrate_loadout.sp`

Sur le site (page **Inventaire**), chaque joueur choisit **M4A4 ou M4A1-S** et **USP-S ou P2000**
(équiper un skin de M4A1-S ou de P2000 change aussi ce choix). Ce plugin l'applique en jeu :
- **menu d'achat** : acheter la M4 donne celle choisie, au prix de l'arme donnée ;
- **spawn CT** : le pistolet de départ est remplacé par l'USP-S ou le P2000 choisi ;
- **`!ws`** : recharge les choix après une modification sur le site.

Dépendances : SourceMod 1.11+, REST in Pawn (ripext). Non compilé ici : `spcomp tickrate_loadout.sp`,
puis copier le `.smx` dans `addons/sourcemod/plugins/`.
- `tr_loadout_url` : `https://europe-west1-tickratecsgo.cloudfunctions.net/gameApi`
- `tr_loadout_key` : la valeur de `SERVER_KEY`
