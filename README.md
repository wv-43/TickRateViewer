# TICKRATE

Plateforme de matchmaking pour CS:GO Legacy : [tickrate.eu](https://tickrate.eu).

Ce dépôt publie le code du site, des fonctions serveur et des serveurs de jeu, pour que chacun puisse voir comment la plateforme fonctionne.

## Contenu

| Dossier | Rôle |
|---|---|
| `firebase/public` | Le site |
| `firebase/functions` | Matchmaking, classement, inventaire, ouverture des caisses, sanctions |
| `firebase/database.rules.json` | Règles d'accès à la base de données |
| `server-cs/addons/sourcemod/scripting` | Sources des plugins installés sur les serveurs de jeu |
| `server-cs/cfg`, `server-cs/install` | Réglages et scripts d'installation des serveurs |

Rien de ce code ne s'installe sur le PC des joueurs : les plugins tournent uniquement sur les serveurs de jeu.

## Ce qui n'est pas publié

- Les clés et mots de passe de production.
- Le détail de la détection anti-triche (`vigie.js`, `tickrate_vigie.sp`), car connaître les seuils permettrait de les contourner.
- Les maps et les plugins compilés.

Le dépôt seul ne suffit donc pas à faire tourner une copie complète de la plateforme.

## Sécurité

Pour signaler une faille, écris à contact@tickrate.eu plutôt que d'ouvrir une issue publique.
