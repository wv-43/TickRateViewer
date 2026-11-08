# Back-end TICKRATE sur Firebase

Le site parle directement à Firebase (pas de serveur Node à héberger) :
- **Authentication** : comptes e-mail / mot de passe, et connexion **Steam** (vérifiée côté serveur).
- **Realtime Database** : profils, file d'attente, matchs, historique, bans, Vigie, chat, présence.
- **Cloud Functions** (`functions/`) : tout ce qu'un joueur ne doit pas pouvoir trafiquer
  (ELO, création des matchs, veto, bans, verdicts Vigie). Les règles de sécurité interdisent
  au navigateur d'écrire ces données.

## Ce qui est prêt
| Partie | État |
|---|---|
| Comptes e-mail + Steam, profil, pseudo unique | ✅ branché sur le site (dès que la clé est mise) |
| Classement « Joueurs inscrits » (vrais ELO) | ✅ branché |
| File d'attente, matchmaking (parties gardées ensemble, écart d'ELO qui s'élargit, file « faible confiance ») | ✅ côté serveur, testé |
| Accepter / refuser (pas de ban), veto des capitaines, attribution d'un serveur libre | ✅ côté serveur, testé |
| Absent au lancement → kick + ban 5 min, les autres repassent en tête de file | ✅ testé |
| Fin de match → ELO (même formule que le site), historique, niveau | ✅ testé |
| Reports pondérés, télémétrie Vigie, revue communautaire, ban 30 j / définitif | ✅ testé |
| Écran « Trouver un match » du site relié à la vraie file | ⏳ dès que le serveur CS:GO répond (voir plus bas) |

Tests sans réseau : `cd functions && npm install && npm test` (11 tests).

## Mise en place (une seule fois)
1. **Plan Blaze** (Console Firebase > ⚙ > Utilisation et facturation). Obligatoire pour les Cloud Functions
   et pour que la fonction Steam puisse joindre steamcommunity.com. Gratuit tant qu'on reste dans les
   quotas (2 millions d'appels / mois) ; mets une **alerte de budget** à 5 €.
2. **Authentication** > Sign-in method > activer **E-mail/Mot de passe** ainsi que le fournisseur **Google** (avec ton e-mail de support).
3. ⚙ Paramètres du projet > Général > copier la **Clé API Web** et la coller dans `tickrate.html` :
   `var FB_API_KEY='…';` (cette clé n'est pas secrète, c'est normal qu'elle soit dans le site).
4. Sur ton PC :
   ```
   npm install -g firebase-tools
   firebase login
   cd firebase/functions
   npm install
   copy .env.example .env      (puis adapter SITE_URLS)
   firebase functions:secrets:set SERVER_KEY      (un long mot de passe, à donner au serveur CS:GO)
   firebase functions:secrets:set STEAM_API_KEY   (facultatif : https://steamcommunity.com/dev/apikey)
   cd ..
   firebase deploy --only database,functions
   ```
5. **Connexion Steam** : Google Cloud Console > IAM > le compte de service
   `…-compute@developer.gserviceaccount.com` > ajouter le rôle **Créateur de jetons du compte de service**
   (nécessaire pour créer la session Firebase après Steam).
6. **Héberger le site** (facultatif) : `./prepare-public.sh` puis `firebase deploy --only hosting`
   → https://tickratecsgo.web.app

## Pour le serveur CS:GO (ton ami)
Chaque serveur est déclaré dans la base, à la main : `servers/<id>` =
`{ "ip": "1.2.3.4", "port": 27015, "gotvPort": 27020, "region": "EU", "status": "free" }`

API : `https://europe-west1-tickratecsgo.cloudfunctions.net/gameApi` avec l'en-tête `X-Server-Key: <SERVER_KEY>`
| Appel | Quand |
|---|---|
| `GET /assignment?server=<id>` | toutes les 5 s : renvoie le match à lancer (map, mot de passe, joueurs + équipes par SteamID) ou 204 |
| `POST /joined {matchId, steamId}` | quand un joueur se connecte (quand les 10 sont là, le match passe « live ») |
| `POST /end {matchId, scoreA, scoreB, players:[{steamId,k,a,d,adr,hs,kast}]}` | fin du match → ELO + historique, le serveur redevient libre |
| `POST /telemetry {…}` | envoyé par le plugin `tickrate_vigie.sp` |

Le plugin doit refuser les SteamID absents du `roster` et mettre les joueurs dans la bonne équipe.

## Données (Realtime Database)
`profiles/<uid>` public (ELO, niveau, trust… écrit par le serveur) · `private/<uid>` réglages du joueur ·
`usernames/` pseudos réservés · `steamIndex/<steamId>` → uid · `queue/<région>/<uid>` · `userMatch/<uid>` ·
`matches/<id>` · `matchSecrets/<id>` mot de passe du serveur (lisible seulement par les 10 joueurs) ·
`history/<uid>/<match>` · `bans/<uid>` · `reports/`, `reportsOn/<uid>` · `telemetry/<uid>/<match>` ·
`vigie/cases|votes|people|baseline` · `servers/<id>` (jamais lisible par le site).

Fichiers de règles : `database.rules.json` = version finale (avec ce back-end).
`database.rules.etape1.json` reste utilisable en attendant, avec le site en mode démo.
