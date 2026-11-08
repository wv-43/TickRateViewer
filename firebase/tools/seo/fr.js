// Pages FR. kw[0] = recherche principale visée (doit être dans le titre, le h1 et la description),
// les autres kw = variantes qui doivent apparaître au moins une fois dans la page.
// tags = thèmes : sert au choix automatique des liens « À lire aussi ».
module.exports = [
  {
    slug: 'serveur-csgo', alt: { en: 'en/csgo-server' }, main: true,
    nav: 'Serveurs CS:GO', short: 'Serveurs CS GO 128 tick dédiés en Europe',
    kw: ['serveur cs go', 'serveur csgo', 'serveurs 128 tick', 'serveur cs go gratuit', 'serveur dédié'],
    tags: ['serveur', 'tick', 'jouer'],
    title: 'Serveur CS GO 128 tick gratuit en Europe · TICKRATE',
    desc: 'Serveur CS GO 128 tick gratuit, hébergé à Francfort : matchmaking 5v5, Wingman et 1v1, ELO, veto des maps et anti-triche par revue de demos.',
    h1: 'Serveur CS GO 128 tick, gratuit, en Europe',
    lead: 'TICKRATE fait tourner ses propres serveurs CS:GO (version legacy) en 128 tick, à Francfort. Pas d\'IP à chercher : tu lances la recherche depuis le site, et CS:GO se connecte tout seul au bon serveur quand le match est prêt.',
    body: `  <div class="sx-facts">
    <div class="sx-fact"><b>128 tick</b><span>sur chaque serveur</span></div>
    <div class="sx-fact"><b>Francfort</b><span>serveurs dédiés en Allemagne</span></div>
    <div class="sx-fact"><b>Gratuit</b><span>tous les modes et le classement</span></div>
    <div class="sx-fact"><b>3 modes</b><span>5v5, Wingman 2v2, 1v1 Aim</span></div>
  </div>
  <h2>Pourquoi des serveurs 128 tick</h2>
  <p>Le <a href="/tickrate-csgo">tickrate</a> est le nombre de fois par seconde où le serveur calcule la partie. À 128 tick, il met à jour les positions, les tirs et les grenades deux fois plus souvent qu'à 64 tick. Les tirs sont enregistrés plus près du moment où tu cliques, et les trajectoires de grenades sont plus régulières d'une partie à l'autre.</p>
  <p>Ta connexion compte autant : un serveur en 128 tick ne compense pas un mauvais ping. C'est pour ça que nos serveurs sont à Francfort, un des points les mieux connectés d'Europe.</p>
  <h2>Un serveur dédié par match</h2>
  <ul>
    <li><b>Réservé aux joueurs du match :</b> 10 joueurs en 5v5, 4 en Wingman, 2 en 1v1.</li>
    <li><b>Configuration compétitive :</b> mêmes règles pour tout le monde, mi-temps, prolongations en 5v5.</li>
    <li><b>Connexion automatique :</b> quand le match est prêt, le bouton Connecter ouvre CS:GO sur le bon serveur, avec le mot de passe.</li>
    <li><b>GOTV :</b> chaque match a sa retransmission pour les spectateurs.</li>
  </ul>
  <h2>Serveur CS GO communautaire ou matchmaking ?</h2>
  <p>Un serveur CS GO communautaire classique se rejoint par son IP : tu tombes sur qui est là, sans niveau ni classement. Sur TICKRATE, chaque serveur csgo est attribué à un match : les joueurs ont un niveau proche, et le résultat compte pour ton ELO. Si tu veux plutôt héberger ton propre serveur, notre guide <a href="/creer-serveur-csgo">créer un serveur CS:GO</a> explique tout, de SteamCMD au jeton Steam.</p>
  <h2>Ce qui se passe quand tu lances une partie</h2>
  <ol>
    <li>Tu cherches un match, seul ou avec ton groupe.</li>
    <li>Quand 10 joueurs de niveau proche sont trouvés, chacun accepte le match.</li>
    <li>Les capitaines bannissent des maps à tour de rôle (veto) jusqu'à la dernière.</li>
    <li>Un serveur libre est attribué ; tu cliques sur Connecter.</li>
    <li>À la fin, ton ELO et tes statistiques sont mis à jour sur le site.</li>
  </ol>
  <h2>Les maps</h2>
  <p>Le pool compétitif du 5v5 compte 7 maps, choisies par les joueurs : chaque mois, tu votes, et les 7 plus votées forment la rotation du mois suivant. Détails sur la page <a href="/maps-csgo">maps CS:GO</a>.</p>
  <h2>Fair-play sans logiciel à installer</h2>
  <p>Pas d'anti-triche à installer sur ton PC. Le serveur relève des statistiques de tir pendant le match, les joueurs peuvent signaler un comportement suspect, et des joueurs fiables revoient la demo dans la Vigie avant toute sanction. Un tricheur confirmé est banni.</p>`,
    faq: [
      ['Les serveurs CS GO de TICKRATE sont-ils gratuits ?', 'Oui : un serveur cs go gratuit pour chaque match, les trois modes, le classement et la ligue. Les formules payantes ajoutent de la personnalisation et des outils d\'analyse, sans avantage en jeu.'],
      ['Où sont situés les serveurs ?', 'À Francfort, en Allemagne. Depuis la France, la Belgique, la Suisse ou l\'Europe centrale, le ping est en général bas.'],
      ['Faut-il CS2 ou CS:GO pour jouer ?', 'CS:GO, dans sa version legacy, gratuite dans Steam. Voir <a href="/csgo-legacy">CS:GO legacy</a> pour l\'installer.'],
      ['Y a-t-il une IP de serveur à rentrer ?', 'Non. Le bouton Connecter du site lance CS:GO directement sur le serveur de ton match.']
    ]
  },
  {
    slug: 'serveurs-csgo', alt: { en: 'en/csgo-server-list' }, main: true, script: 'srvlist.js',
    nav: 'Liste des serveurs', short: 'Nos serveurs CS GO en direct : état, map, score',
    kw: ['liste des serveurs cs go', 'serveurs csgo', 'serveurs cs go 128 tick', 'état des serveurs', '128 tick'],
    tags: ['serveur', 'jouer', 'tick'],
    title: 'Liste des serveurs CS GO 128 tick en direct · TICKRATE',
    desc: 'Liste des serveurs CS GO de TICKRATE en direct : état de chaque serveur, mode, map et score des matchs en cours. Serveurs csgo 128 tick à Francfort.',
    h1: 'Liste des serveurs CS GO en direct',
    lead: 'Tous les serveurs csgo de TICKRATE, en temps réel : lesquels sont libres, lesquels sont en match, sur quelle map et à quel score. Chaque serveur tourne en 128 tick, à Francfort.',
    body: `  <div class="sx-live" id="srvLive"><p>Chargement de l'état des serveurs…</p></div>
  <noscript><p>Active JavaScript pour voir l'état des serveurs en direct.</p></noscript>
  <h2>Comment lire la liste</h2>
  <ul>
    <li><b>Libre :</b> le serveur attend le prochain match. Il est attribué dès que des joueurs sont trouvés.</li>
    <li><b>Match en préparation :</b> les joueurs ont accepté, ils se connectent.</li>
    <li><b>Match en cours :</b> la partie a commencé ; la map et le score se mettent à jour à chaque round.</li>
    <li><b>Mode :</b> certains serveurs sont réservés au 5v5, au Wingman ou au 1v1, pour qu'une partie courte ne bloque jamais un serveur 5v5.</li>
  </ul>
  <p>La liste se rafraîchit toute seule toutes les 30 secondes. L'état des serveurs est recalculé chaque minute.</p>
  <h2>Pourquoi pas d'IP à copier ?</h2>
  <p>Sur une liste de serveurs CS GO classique, tu copies une IP et tu rejoins qui est là. Ici, chaque serveur est réservé aux joueurs d'un match, avec un mot de passe propre à la partie : un inconnu ne peut pas débarquer au milieu. Pour jouer, lance une recherche sur le site : quand le match est prêt, le bouton Connecter ouvre CS:GO directement sur le bon serveur. Tout le fonctionnement est détaillé sur la page <a href="/serveur-csgo">serveur CS GO 128 tick</a>.</p>
  <h2>Ce que les serveurs ont en commun</h2>
  <div class="sx-facts">
    <div class="sx-fact"><b>128 tick</b><span>sur tous les serveurs</span></div>
    <div class="sx-fact"><b>Francfort</b><span>machines dédiées</span></div>
    <div class="sx-fact"><b>GOTV</b><span>chaque match retransmis</span></div>
    <div class="sx-fact"><b>Gratuit</b><span>aucun abonnement requis</span></div>
  </div>
  <p>Le <a href="/tickrate-csgo">tickrate</a> de 128 est le même partout, tout comme la configuration compétitive : mêmes règles, même nombre de rounds pour un mode donné, même temps d'achat. Les maps du 5v5 suivent le <a href="/maps-csgo">pool voté chaque mois</a> par les joueurs.</p>
  <h2>Regarder un match en cours</h2>
  <p>Les matchs en direct sont visibles sur le site, avec le score round par round et le fil des éliminations, et peuvent être suivis dans CS:GO grâce à GOTV.</p>`,
    faq: [
      ['Comment rejoindre un serveur de la liste ?', 'Les serveurs sont réservés aux joueurs de chaque match. Lance une recherche sur le site : un serveur libre t\'est attribué et le bouton Connecter t\'y emmène.'],
      ['Les serveurs sont-ils tous en 128 tick ?', 'Oui, tous les serveurs TICKRATE tournent en 128 tick.'],
      ['Que veut dire « Libre » ?', 'Le serveur n\'a pas de match en cours et attend le prochain.'],
      ['L\'état est-il vraiment en direct ?', 'Il est recalculé chaque minute, et la page se rafraîchit toutes les 30 secondes.']
    ]
  },
  {
    slug: 'creer-serveur-csgo', alt: {},
    nav: 'Créer un serveur', short: 'Héberger un serveur CS:GO legacy : SteamCMD, jeton, config',
    kw: ['créer un serveur cs go', 'serveur dédié cs go', 'héberger un serveur csgo', 'steamcmd', 'gslt', 'server.cfg'],
    tags: ['serveur', 'technique', 'commandes'],
    title: 'Créer un serveur CS GO dédié (legacy) en 2026 · TICKRATE',
    desc: 'Créer un serveur CS GO dédié en 2026 : installer CS:GO legacy avec SteamCMD, jeton Steam (GSLT), paramètres de lancement, 128 tick et server.cfg.',
    h1: 'Créer un serveur CS GO dédié en 2026',
    lead: 'Le guide que nous suivons pour nos propres serveurs, simplifié : installer un serveur dédié CS GO (version legacy) sous Linux, obtenir un jeton Steam, le lancer en 128 tick et le configurer.',
    body: `  <h2>Ce qu'il faut</h2>
  <ul>
    <li><b>Une machine Linux</b> (un VPS suffit) avec une bonne connexion. Compte environ 40 Go de disque pour le jeu.</li>
    <li><b>SteamCMD</b>, l'outil en ligne de commande de Valve pour installer les serveurs de jeu.</li>
    <li><b>Un jeton de serveur Steam (GSLT)</b>, gratuit, lié à ton compte Steam.</li>
    <li><b>Les ports UDP ouverts</b> : 27015 par défaut pour le jeu, et un port pour GOTV si tu l'utilises.</li>
  </ul>
  <h2>1. Installer le serveur avec SteamCMD</h2>
  <p>Le serveur dédié de CS:GO s'installe avec SteamCMD, en connexion anonyme :</p>
  <pre><code>steamcmd +force_install_dir ~/csgo-ds +login anonymous +app_update 740 validate +quit</code></pre>
  <p>Depuis que CS:GO legacy est une application Steam à part (mars 2026), le serveur doit s'annoncer avec l'App ID de la version legacy, 4465480. Sur nos serveurs, nous écrivons cet App ID dans le fichier <code>steam_appid.txt</code> du dossier du serveur et dans la ligne <code>appID=</code> de <code>csgo/steam.inf</code>, avant chaque démarrage (une mise à jour peut remettre l'ancienne valeur).</p>
  <h2>2. Obtenir un jeton Steam (GSLT)</h2>
  <p>Sans jeton, ton serveur n'apparaît pas correctement aux joueurs. Va sur la page de gestion des serveurs de jeu de Steam (steamcommunity.com/dev/managegameservers), indique l'App ID <b>4465480</b> et génère un jeton. Il en faut un par serveur. Garde-le secret : il est lié à ton compte.</p>
  <h2>3. Lancer le serveur en 128 tick</h2>
  <pre><code>./srcds_run -game csgo -console -usercon -port 27015 -tickrate 128 +game_type 0 +game_mode 1 +map de_mirage +sv_setsteamaccount TON_JETON</code></pre>
  <p>Le paramètre <code>-tickrate 128</code> fait tourner le serveur à 128 tick (voir <a href="/tickrate-csgo">c'est quoi le tickrate</a>). Le couple <code>game_type</code> / <code>game_mode</code> choisit le mode :</p>
  <div class="sx-tbl"><table>
    <thead><tr><th>Mode</th><th>game_type</th><th>game_mode</th></tr></thead>
    <tbody>
      <tr><td>Occasionnel</td><td>0</td><td>0</td></tr>
      <tr><td>Compétitif</td><td>0</td><td>1</td></tr>
      <tr><td>Wingman</td><td>0</td><td>2</td></tr>
      <tr><td>Course à l'armement</td><td>1</td><td>0</td></tr>
      <tr><td>Deathmatch</td><td>1</td><td>2</td></tr>
    </tbody>
  </table></div>
  <h2>4. Le fichier server.cfg</h2>
  <p>Dans <code>csgo/cfg/server.cfg</code>, les réglages de base :</p>
  <pre><code>hostname "Mon serveur CS:GO 128 tick"
rcon_password "un_mot_de_passe_long"
sv_password ""            // mot de passe pour rejoindre, vide = public
sv_lan 0
sv_cheats 0</code></pre>
  <p>Pour la liste des commandes utiles en jeu et en console, voir notre page <a href="/commandes-csgo">commandes CS:GO</a>.</p>
  <h2>5. Faire tourner le serveur en continu</h2>
  <p>Lance le serveur comme un service (systemd sous Linux) pour qu'il redémarre tout seul après un plantage ou un redémarrage de la machine, et fais tourner SteamCMD régulièrement pour les mises à jour.</p>
  <h2>Ou jouer sans rien héberger</h2>
  <p>Héberger un serveur CS:GO coûte du temps et de l'argent, et il faut encore trouver des joueurs. Si tu veux juste jouer des matchs équilibrés, TICKRATE fournit un <a href="/serveur-csgo">serveur CS GO 128 tick</a> pour chaque partie, gratuitement.</p>`,
    faq: [
      ['Quel App ID pour le serveur CS:GO legacy ?', 'Le serveur dédié s\'installe avec SteamCMD sous l\'App ID 740. Le jeton de serveur (GSLT) se crée avec l\'App ID de CS:GO legacy, 4465480.'],
      ['Un serveur CS GO peut-il tourner sous Windows ?', 'Oui, le serveur dédié existe aussi pour Windows, mais la plupart des hébergeurs utilisent Linux, plus léger.'],
      ['Combien de joueurs par serveur ?', 'Un serveur compétitif accueille 10 joueurs. Le nombre maximum se règle avec le paramètre de lancement -maxplayers_override.'],
      ['Le 128 tick demande-t-il une grosse machine ?', 'Il demande plus de processeur que le 64 tick, surtout à 10 joueurs. Un cœur rapide par serveur est conseillé.']
    ]
  },
  {
    slug: 'tickrate-csgo', alt: { en: 'en/tickrate' }, main: true,
    nav: 'Tickrate', short: '64 ou 128 tick : ce que ça change vraiment',
    kw: ['tickrate', 'tick rate', '128 tick', '64 tick', 'tickrate cs go', 'cl_updaterate'],
    tags: ['tick', 'technique', 'commandes'],
    title: 'Tickrate CS GO : 64 ou 128 tick, ce que ça change · TICKRATE',
    desc: 'Le tickrate expliqué : ce qu\'est un tick, 64 tick contre 128 tick dans CS GO, effet sur les tirs et les grenades, réglages rate et cl_updaterate.',
    h1: 'Tickrate : 64 ou 128 tick, ce que ça change',
    lead: 'Le tickrate (ou tick rate) est le nombre de fois par seconde où un serveur de jeu calcule la partie. Dans CS:GO, c\'est 64 ou 128. Voici ce que ça change concrètement, et comment régler ton jeu.',
    body: `  <h2>C'est quoi un tick ?</h2>
  <p>À chaque tick, le serveur lit les actions des joueurs (mouvements, tirs, grenades), calcule le nouvel état de la partie et l'envoie aux joueurs. Un serveur à 64 tick le fait 64 fois par seconde, soit toutes les 15,6 millisecondes. À 128 tick, c'est toutes les 7,8 millisecondes.</p>
  <div class="sx-facts">
    <div class="sx-fact"><b>64 tick</b><span>une mise à jour toutes les 15,6 ms</span></div>
    <div class="sx-fact"><b>128 tick</b><span>une mise à jour toutes les 7,8 ms</span></div>
  </div>
  <h2>Ce que le 128 tick change en jeu</h2>
  <ul>
    <li><b>Les tirs :</b> ton clic est pris en compte plus tôt, et la position des adversaires est plus précise. Les échanges de tirs serrés sont plus justes.</li>
    <li><b>Les grenades :</b> leurs trajectoires sont calculées plus finement. Certaines smokes se lancent différemment à 64 et à 128 tick : un lineup appris à 64 tick peut tomber à côté à 128.</li>
    <li><b>Le mouvement :</b> les déplacements, les sauts et les air strafes paraissent plus fluides.</li>
  </ul>
  <h2>Ce que le tickrate ne change pas</h2>
  <p>Le 128 tick ne compense pas un mauvais ping : si tes paquets mettent 80 ms à arriver, le serveur les reçoit 80 ms plus tard, quel que soit son tickrate. Il ne compense pas non plus un PC qui affiche peu d'images par seconde : vise nettement plus de FPS que de ticks.</p>
  <h2>64 tick, 128 tick, et CS2</h2>
  <p>Dans CS:GO, le matchmaking officiel de Valve tournait en 64 tick, alors que les plateformes compétitives tiers jouaient en 128 tick. C'est ce qui a rendu le « 128 tick » si recherché. CS2 a changé d'approche : ses serveurs restent à 64 tick, mais le jeu enregistre le moment exact de tes actions entre deux ticks (le « sub-tick »). Sur CS:GO legacy, le tickrate fait donc toujours la différence.</p>
  <h2>Régler CS:GO pour un serveur 128 tick</h2>
  <p>Ces commandes se tapent dans la console (ou dans ton autoexec.cfg) :</p>
  <pre><code>rate 786432
cl_cmdrate 128
cl_updaterate 128
cl_interp 0
cl_interp_ratio 1</code></pre>
  <ul>
    <li><code>rate</code> : la quantité de données que ton jeu accepte de recevoir. 786432 est le maximum de CS:GO.</li>
    <li><code>cl_cmdrate</code> et <code>cl_updaterate</code> : combien de mises à jour tu envoies et reçois par seconde. À 128, tu profites de tout le serveur ; le serveur limite de lui-même s'il tourne à 64.</li>
    <li><code>cl_interp 0</code> avec <code>cl_interp_ratio 1</code> : l'interpolation la plus courte possible, calculée à partir de ton updaterate.</li>
  </ul>
  <h2>Vérifier le tickrate d'un serveur</h2>
  <p>Tape <code>net_graph 1</code> dans la console : la ligne du bas indique le tick du serveur et le nombre de mises à jour reçues. Pour t'entraîner seul en 128 tick (bots, maps d'entraînement), ajoute <code>-tickrate 128</code> aux options de lancement de CS:GO dans Steam.</p>
  <h2>Et le nom TICKRATE ?</h2>
  <p>C'est de là que vient le nom du site : chaque match TICKRATE se joue sur un <a href="/serveur-csgo">serveur CS GO 128 tick</a> dédié.</p>`,
    faq: [
      ['Le 128 tick est-il vraiment meilleur ?', 'Oui pour la précision des tirs et des grenades, à condition d\'avoir un bon ping et assez de FPS. La différence est surtout sensible dans les duels serrés.'],
      ['Comment jouer en 128 tick sur CS:GO ?', 'Sur un serveur qui tourne en 128 tick, comme ceux de TICKRATE. Hors ligne, ajoute -tickrate 128 aux options de lancement.'],
      ['Faut-il changer cl_updaterate sur un serveur 64 tick ?', 'Non, laisser 128 ne pose pas de problème : le serveur envoie au maximum son propre tickrate.'],
      ['Combien de FPS pour le 128 tick ?', 'Plus que 128, idéalement bien plus. Si tu tombes souvent sous ce seuil, baisse les réglages graphiques.']
    ]
  },
  {
    slug: 'csgo-legacy', alt: { en: 'en/csgo-legacy' }, main: true,
    nav: 'CS:GO legacy', short: 'Comment jouer à CS GO en 2026',
    kw: ['cs go legacy', 'jouer à cs go', 'cs go en 2026', 'installer cs go', 'cs go gratuit'],
    tags: ['jouer', 'legacy'],
    title: 'CS GO legacy : jouer à CS:GO en 2026 · TICKRATE',
    desc: 'CS GO legacy existe toujours sur Steam : comment installer CS:GO gratuitement en 2026, pourquoi y jouer, et où trouver des parties classées en 128 tick.',
    h1: 'CS GO legacy : jouer à CS:GO en 2026',
    lead: 'Counter-Strike 2 a remplacé CS:GO comme jeu principal, mais CS:GO reste disponible dans Steam en version legacy. Voici comment l\'installer et où trouver des parties classées.',
    body: `  <h2>CS:GO legacy, c'est quoi ?</h2>
  <p>C'est la dernière version de Counter-Strike: Global Offensive, conservée par Valve après la sortie de CS2. Le jeu est identique à celui que tu connais : mêmes armes, même mouvement, mêmes maps de l'époque. Depuis mars 2026, il s'installe comme une application Steam à part.</p>
  <h2>Installer CS GO en 3 étapes</h2>
  <ol>
    <li>Ouvre Steam et va dans ta bibliothèque.</li>
    <li>Cherche « Counter-Strike: Global Offensive » (version legacy) et installe-le. Sur un PC avec Steam, ce lien ouvre directement l'installation : <a href="steam://install/4465480">installer CS:GO legacy</a>.</li>
    <li>Lance le jeu une fois pour vérifier qu'il démarre.</li>
  </ol>
  <p>CS:GO legacy ne se joue que sur PC. Sur téléphone, tu peux consulter ton profil et le classement, mais pas jouer.</p>
  <h2>Pourquoi jouer à CS GO en 2026</h2>
  <ul>
    <li><b>Le mouvement et les sensations :</b> beaucoup de joueurs préfèrent le ressenti de CS:GO à celui de CS2.</li>
    <li><b>Les maps de l'époque :</b> certaines ne sont plus disponibles dans CS2.</li>
    <li><b>Les PC modestes :</b> CS:GO demande moins de ressources que CS2.</li>
    <li><b>Le 128 tick :</b> CS:GO se joue sur des serveurs à tickrate fixe, et le <a href="/tickrate-csgo">128 tick</a> y fait une vraie différence.</li>
  </ul>
  <h2>Le problème : trouver des parties</h2>
  <p>Le matchmaking officiel de Valve n'existe plus sur CS:GO legacy. Il reste des serveurs communautaires, mais pas de parties classées avec un niveau équilibré. C'est ce que TICKRATE propose : un <a href="/matchmaking-csgo">matchmaking CS GO</a> 5v5, Wingman et 1v1, avec ELO et classement, sur des <a href="/serveur-csgo">serveurs 128 tick</a>.</p>
  <h2>Commencer sur TICKRATE</h2>
  <ol>
    <li>Installe CS:GO legacy (étapes ci-dessus).</li>
    <li>Crée ton compte sur <a href="/">tickrate.eu</a> et lie ton compte Steam.</li>
    <li>Lance une recherche, accepte le match, fais le veto et clique sur Connecter.</li>
  </ol>`,
    faq: [
      ['CS:GO est-il encore jouable en 2026 ?', 'Oui. Valve garde la version legacy de CS:GO dans Steam. Le matchmaking officiel n\'existe plus, mais tu peux jouer sur des serveurs comme ceux de TICKRATE.'],
      ['CS GO legacy est-il gratuit ?', 'Oui, CS:GO legacy s\'installe gratuitement depuis Steam : c\'est un cs go gratuit, comme CS2.'],
      ['Mes skins CS:GO sont-ils toujours là ?', 'Ton inventaire Steam est partagé avec CS2. Sur nos serveurs, tu peux équiper tes skins depuis le site.'],
      ['Peut-on jouer à CS:GO legacy avec des amis ?', 'Oui. Sur TICKRATE, invite tes amis dans ton groupe (jusqu\'à 5 en 5v5) et lancez la recherche ensemble.']
    ]
  },
  {
    slug: 'matchmaking-csgo', alt: { en: 'en/csgo-matchmaking' }, main: true,
    nav: 'Matchmaking', short: '5v5, Wingman 2v2 et 1v1 Aim',
    kw: ['matchmaking cs go', 'matchmaking csgo', 'partie classée', 'elo', '5v5'],
    tags: ['jouer', 'mode', 'classement'],
    title: 'Matchmaking CS GO classé : 5v5, Wingman, 1v1 · TICKRATE',
    desc: 'Matchmaking CS GO legacy avec ELO : 5v5 compétitif avec veto des maps, Wingman 2v2 et 1v1 Aim, chacun avec son classement. Gratuit, serveurs 128 tick.',
    h1: 'Matchmaking CS GO : 5v5, Wingman et 1v1',
    lead: 'Trois modes classés, chacun avec son ELO. Le matchmaking regroupe des joueurs de niveau proche, sur des serveurs 128 tick dédiés.',
    body: `  <div class="sx-tbl"><table>
    <thead><tr><th>Mode</th><th>Joueurs</th><th>Maps</th><th>Classement</th></tr></thead>
    <tbody>
      <tr><td><b>5v5 Compétitif</b></td><td>10</td><td>Pool de 7 maps voté chaque mois, veto avant le match</td><td>ELO 5v5 et rangs</td></tr>
      <tr><td><b>Wingman 2v2</b></td><td>4</td><td>Maps 2v2 de CS:GO</td><td>ELO Wingman séparé</td></tr>
      <tr><td><b>1v1 Aim Arena</b></td><td>2</td><td>Maps aim</td><td>ELO 1v1 et rangs de l'arène</td></tr>
    </tbody>
  </table></div>
  <h2>5v5 Compétitif</h2>
  <p>Le mode principal du matchmaking csgo. Tu joues seul ou avec un groupe jusqu'à 5. Une fois les 10 joueurs trouvés et la partie classée acceptée, les deux capitaines bannissent des maps à tour de rôle. La dernière map restante est jouée.</p>
  <h2>Wingman 2v2</h2>
  <p>Des parties plus courtes sur des maps réduites, avec un seul site de bombe. Le Wingman a son propre ELO : il ne touche pas à ton classement 5v5. Tout est expliqué sur la page <a href="/wingman-csgo">Wingman CS:GO</a>.</p>
  <h2>1v1 Aim Arena</h2>
  <p>Un contre un sur des maps aim. L'arène a ses propres rangs, de Fer à Légende 128 : voir <a href="/1v1-csgo">1v1 CS:GO</a>.</p>
  <h2>Comment l'ELO est calculé</h2>
  <p>La victoire compte le plus, mais ta performance fait varier les points : ADR, kills, impact sur les rounds. Gagner contre une équipe mieux classée rapporte plus ; perdre contre une équipe moins bien classée coûte plus. Les rangs sont détaillés sur la page <a href="/classement-csgo">classement CS:GO</a>.</p>
  <h2>Un matchmaking équilibré</h2>
  <ul>
    <li><b>Niveau proche :</b> les joueurs sont regroupés selon leur ELO.</li>
    <li><b>Facteur de confiance :</b> les joueurs fiables jouent ensemble.</li>
    <li><b>Absences sanctionnées :</b> quitter ou ne pas se connecter entraîne un bannissement temporaire, de plus en plus long en cas de récidive.</li>
  </ul>`,
    faq: [
      ['Combien de temps dure une recherche ?', 'Ça dépend du nombre de joueurs connectés et de ton niveau. Le temps d\'attente estimé est affiché au moment de lancer la recherche.'],
      ['Peut-on jouer en groupe ?', 'Oui : jusqu\'à 5 en 5v5 et à 2 en Wingman. Seul le chef de groupe lance la recherche.'],
      ['Que se passe-t-il si je quitte un match ?', 'Tu reçois un bannissement temporaire du matchmaking, plus long à chaque récidive sur 7 jours.']
    ]
  },
  {
    slug: 'classement-csgo', alt: {}, main: true,
    nav: 'Classement', short: 'ELO, rangs et classements',
    kw: ['classement cs go', 'rangs cs go', 'elo', 'global elite'],
    tags: ['classement', 'mode'],
    title: 'Classement CS GO : ELO et rangs · TICKRATE',
    desc: 'Le classement CS GO de TICKRATE : ELO calculé sur tes performances, rangs de Silver à Global Elite en 5v5, classement Wingman et rangs de l\'arène 1v1.',
    h1: 'Classement CS GO : ELO et rangs',
    lead: 'Chaque match classé met à jour ton ELO. Le site affiche ton rang, ta progression et ta place dans le classement, mode par mode.',
    body: `  <h2>Trois classements séparés</h2>
  <ul>
    <li><b>5v5 :</b> le classement principal, avec les rangs CS GO de l'époque, de Silver à Global Elite.</li>
    <li><b>Wingman :</b> un ELO à part, pour ne pas mélanger le 2v2 et le 5v5.</li>
    <li><b>1v1 Aim Arena :</b> ses propres rangs, de Fer à Légende 128.</li>
  </ul>
  <h2>Les rangs du 5v5</h2>
  <p>Tu retrouves les rangs de CS:GO, calculés à partir de ton ELO :</p>
  <div class="sx-tbl"><table>
    <thead><tr><th>Famille</th><th>Rangs</th><th>ELO</th></tr></thead>
    <tbody>
      <tr><td>Silver</td><td>Silver I à Silver Elite Master</td><td>moins de 1100</td></tr>
      <tr><td>Gold Nova</td><td>Gold Nova I à Gold Nova Master</td><td>1100 à 1499</td></tr>
      <tr><td>Master Guardian</td><td>Master Guardian I à Distinguished Master Guardian</td><td>1500 à 1949</td></tr>
      <tr><td>Legendary Eagle</td><td>Legendary Eagle, Legendary Eagle Master</td><td>1950 à 2249</td></tr>
      <tr><td>Supreme</td><td>Supreme Master First Class</td><td>2250 à 2399</td></tr>
      <tr><td>Global Elite</td><td>The Global Elite</td><td>2400 et plus</td></tr>
    </tbody>
  </table></div>
  <h2>Les rangs de l'arène 1v1</h2>
  <p>Fer, Bronze, Argent, Or, Platine, Diamant, Mythique, puis Légende 128. Tu commences à 1000 ELO, en Bronze II.</p>
  <h2>Ligues et saisons</h2>
  <p>Les familles de rangs servent aussi de ligues sur la page Compétition, avec des récompenses de fin de saison. Les équipes ont leur propre ligue, avec défis et tournois organisés par les joueurs.</p>
  <h2>Suivre sa progression</h2>
  <p>Sur ton profil, le site trace la courbe de ton ELO match après match, avec ton meilleur ELO atteint, ton taux de victoire et tes statistiques moyennes (ADR, ratio kills/morts, rating). L'historique de tes matchs permet de revoir ce qui a marché ou non. C'est plus parlant qu'un simple rang : tu vois si tu progresses vraiment d'une semaine sur l'autre.</p>
  <h2>Un classement propre</h2>
  <p>Un tricheur confirmé par la Vigie est banni et disparaît du classement. Les reports abusifs comptent de moins en moins : un joueur qui signale à chaque défaite voit ses reports perdre du poids.</p>`,
    faq: [
      ['Comment monter de rang ?', 'En gagnant des matchs classés et en jouant bien : ta performance fait varier les points gagnés ou perdus.'],
      ['Le Wingman change-t-il mon rang 5v5 ?', 'Non. Le Wingman et le 1v1 ont chacun leur propre ELO.'],
      ['Où voir le classement ?', 'Dans la page Classement du site, après avoir créé ton compte.']
    ]
  },
  {
    slug: 'commandes-csgo', alt: {},
    nav: 'Commandes', short: 'Console, réseau, entraînement et binds',
    kw: ['commandes cs go', 'commande csgo', 'console cs go', 'config cs go', 'autoexec', 'bind'],
    tags: ['commandes', 'technique', 'tick'],
    title: 'Commandes CS GO : console, réseau et entraînement · TICKRATE',
    desc: 'Les commandes CS GO utiles : activer la console, net_graph et FPS, réglages réseau 128 tick, commandes d\'entraînement sv_cheats, binds et autoexec.',
    h1: 'Commandes CS GO utiles',
    lead: 'Les commandes de console de CS:GO qui servent vraiment : affichage, réseau, entraînement privé, binds et fichier autoexec. Toutes fonctionnent sur CS:GO legacy.',
    body: `  <h2>Activer la console</h2>
  <p>Dans les paramètres du jeu, onglet Jeu, active « Activer la console de développement ». La touche sous Échap (²) l'ouvre ensuite. Tu peux aussi ajouter <code>-console</code> aux options de lancement dans Steam.</p>
  <h2>Affichage et performances</h2>
  <div class="sx-tbl"><table>
    <thead><tr><th>Commande</th><th>Effet</th></tr></thead>
    <tbody>
      <tr><td><code>net_graph 1</code></td><td>Affiche FPS, ping, perte de paquets et tick du serveur</td></tr>
      <tr><td><code>cl_showfps 1</code></td><td>Affiche seulement les FPS</td></tr>
      <tr><td><code>fps_max 0</code></td><td>Retire la limite d'images par seconde</td></tr>
      <tr><td><code>viewmodel_fov 68</code></td><td>Éloigne l'arme de l'écran (54 à 68)</td></tr>
      <tr><td><code>cl_righthand 0</code></td><td>Arme tenue à gauche</td></tr>
      <tr><td><code>cl_radar_scale 0.4</code></td><td>Dézoome le radar</td></tr>
    </tbody>
  </table></div>
  <h2>Réseau (serveurs 128 tick)</h2>
  <pre><code>rate 786432
cl_cmdrate 128
cl_updaterate 128
cl_interp 0
cl_interp_ratio 1</code></pre>
  <p>Ces réglages sont expliqués en détail sur la page <a href="/tickrate-csgo">tickrate</a>.</p>
  <h2>Entraînement en partie privée</h2>
  <p>Ces commandes demandent <code>sv_cheats 1</code> et ne marchent que sur ton propre serveur ou en partie hors ligne :</p>
  <div class="sx-tbl"><table>
    <thead><tr><th>Commande</th><th>Effet</th></tr></thead>
    <tbody>
      <tr><td><code>sv_infinite_ammo 1</code></td><td>Munitions et grenades infinies</td></tr>
      <tr><td><code>sv_grenade_trajectory 1</code></td><td>Affiche la trajectoire des grenades</td></tr>
      <tr><td><code>sv_showimpacts 1</code></td><td>Montre où tes balles touchent</td></tr>
      <tr><td><code>noclip</code></td><td>Vol libre à travers les murs</td></tr>
      <tr><td><code>bot_kick</code></td><td>Retire tous les bots</td></tr>
      <tr><td><code>mp_roundtime_defuse 60</code></td><td>Rounds de 60 minutes</td></tr>
      <tr><td><code>mp_buy_anywhere 1</code></td><td>Acheter partout sur la map</td></tr>
      <tr><td><code>mp_maxmoney 60000</code> et <code>mp_startmoney 60000</code></td><td>Argent pour tout acheter</td></tr>
      <tr><td><code>mp_warmup_end</code></td><td>Termine l'échauffement</td></tr>
      <tr><td><code>mp_restartgame 1</code></td><td>Relance la partie (à taper après les réglages)</td></tr>
    </tbody>
  </table></div>
  <h2>Binds utiles</h2>
  <pre><code>bind "mwheeldown" "+jump"          // saut à la molette
bind "f" "use weapon_flashbang"     // flash directe
bind "c" "use weapon_smokegrenade"  // smoke directe</code></pre>
  <h2>Le fichier autoexec.cfg</h2>
  <p>Mets tes commandes dans un fichier <code>autoexec.cfg</code> du dossier <code>csgo/cfg</code> de ton installation, et ajoute <code>+exec autoexec</code> aux options de lancement : ta config CS GO se recharge à chaque démarrage. Termine le fichier par <code>host_writeconfig</code> pour enregistrer les réglages.</p>
  <h2>Sur un serveur TICKRATE</h2>
  <p>Les commandes d'entraînement sont désactivées pendant les matchs classés, comme sur tout <a href="/serveur-csgo">serveur CS GO</a> compétitif. Les commandes d'affichage, de réseau et les binds marchent partout.</p>`,
    faq: [
      ['Comment ouvrir la console CS GO ?', 'Active la console de développement dans les paramètres (onglet Jeu), puis appuie sur la touche ² sous Échap.'],
      ['Où mettre mon autoexec ?', 'Dans le dossier csgo/cfg de ton installation de CS:GO, avec +exec autoexec dans les options de lancement Steam.'],
      ['Pourquoi sv_cheats ne marche pas ?', 'Il ne fonctionne que sur un serveur dont tu es l\'hôte : partie hors ligne ou ton propre serveur.']
    ]
  },
  {
    slug: 'wingman-csgo', alt: {},
    nav: 'Wingman', short: 'Le 2v2 classé de CS:GO',
    kw: ['wingman cs go', '2v2 de cs go', 'wingman csgo', 'maps wingman'],
    tags: ['mode', 'jouer'],
    title: 'Wingman CS GO : le 2v2 classé en 128 tick · TICKRATE',
    desc: 'Wingman CS GO en 2v2 classé : règles, maps Wingman (Shortdust, Lake, Inferno, Nuke…), ELO séparé et serveurs 128 tick gratuits sur TICKRATE.',
    h1: 'Wingman CS GO : le 2v2 classé',
    lead: 'Le Wingman, c\'est le 2v2 de CS:GO : des parties courtes, un seul site de bombe, et un ELO à part. Idéal pour jouer à deux ou pour des sessions rapides.',
    body: `  <h2>Les règles du Wingman</h2>
  <ul>
    <li><b>2 contre 2</b>, sur une partie réduite de la map avec un seul site de bombe.</li>
    <li><b>Des rounds plus courts</b> qu'en 5v5, avec une économie adaptée.</li>
    <li><b>Mi-temps</b> : les équipes changent de camp au milieu du match.</li>
  </ul>
  <h2>Les maps Wingman</h2>
  <p>Le Wingman se joue sur les maps 2v2 de CS:GO. Les maps conçues pour le 2v2, comme Shortdust et Lake, et des versions réduites de maps 5v5 : Inferno, Nuke (dans sa version Shortnuke), Overpass, Vertigo et Train. Cache, Cobblestone et Tuscan peuvent s'y ajouter.</p>
  <h2>Un ELO Wingman séparé</h2>
  <p>Ton classement Wingman est indépendant : une mauvaise soirée en 2v2 ne fait pas baisser ton rang 5v5, et inversement. Les rangs suivent la même logique que le <a href="/classement-csgo">classement CS GO</a> du 5v5.</p>
  <h2>Jouer en duo</h2>
  <p>Invite un ami dans ton groupe et lancez la recherche à deux. Le matchmaking trouve un duo adverse de niveau proche, puis un <a href="/serveur-csgo">serveur CS GO 128 tick</a> est attribué au match.</p>
  <h2>Wingman ou 5v5 ?</h2>
  <p>Le 5v5 reste le cœur de CS:GO : stratégies d'équipe, économie sur toute la partie, veto des maps. Le Wingman est plus direct : moins de joueurs, moins d'attente, des rounds où chaque erreur se paie tout de suite. Beaucoup de joueurs alternent les deux : quelques parties de Wingman pour s'échauffer, puis un match 5v5. Comme les ELO sont séparés, tu peux le faire sans risque pour ton rang principal.</p>
  <h2>Pourquoi le 2v2 fait progresser</h2>
  <p>À deux, chaque duel compte : impossible de se cacher derrière ses coéquipiers. Le Wingman travaille l'aim, le placement et la communication en duo, et les parties courtes permettent d'enchaîner. Pour travailler uniquement le tir, l'<a href="/1v1-csgo">arène 1v1</a> va encore plus loin.</p>`,
    faq: [
      ['Le Wingman compte-t-il pour mon rang 5v5 ?', 'Non, le Wingman a son propre ELO.'],
      ['Peut-on jouer au Wingman seul ?', 'Oui, le matchmaking te trouve un coéquipier de niveau proche.'],
      ['Sur quelles maps se joue le Wingman ?', 'Sur les maps 2v2 de CS:GO : Shortdust, Lake et les versions réduites d\'Inferno, Nuke, Overpass, Vertigo et Train.']
    ]
  },
  {
    slug: '1v1-csgo', alt: {},
    nav: '1v1', short: 'Arène 1v1 sur maps aim, avec rangs',
    kw: ['1v1 cs go', 'aim map', '1v1 csgo', 'aim arena', 'serveur 1v1'],
    tags: ['mode', 'jouer', 'classement'],
    title: '1v1 CS GO : arène aim classée en 128 tick · TICKRATE',
    desc: '1v1 CS GO classé sur maps aim (aim_redline, aim_map, awp_lego_2…) : rangs de Fer à Légende 128, ELO dédié, serveurs 1v1 128 tick gratuits.',
    h1: '1v1 CS GO : l\'arène aim classée',
    lead: 'L\'Aim Arena de TICKRATE, c\'est du 1v1 CS:GO sur des maps aim, avec son propre ELO et ses propres rangs. Le meilleur moyen de mesurer ton tir contre un adversaire de ton niveau.',
    body: `  <h2>Comment ça marche</h2>
  <ol>
    <li>Tu lances la recherche en mode 1v1.</li>
    <li>Le matchmaking trouve un adversaire d'ELO proche.</li>
    <li>Un serveur 1v1 en 128 tick est attribué : tu cliques sur Connecter.</li>
    <li>Le premier à remporter le nombre de rounds requis gagne, et l'ELO des deux joueurs est mis à jour.</li>
  </ol>
  <h2>Les maps aim</h2>
  <p>Des maps courtes, symétriques, pensées pour le duel : aim_redline, aim_map et awp_lego_2, plus Shortdust et Lake pour des duels dans un décor de vraie map. Une aim map ne laisse pas de place aux grenades ni aux positions : seul le tir compte.</p>
  <h2>Les rangs de l'arène</h2>
  <div class="sx-tbl"><table>
    <thead><tr><th>Rang</th><th>ELO</th></tr></thead>
    <tbody>
      <tr><td>Fer</td><td>moins de 850</td></tr>
      <tr><td>Bronze I à III</td><td>850 à 1149</td></tr>
      <tr><td>Argent I à III</td><td>1150 à 1449</td></tr>
      <tr><td>Or I à III</td><td>1450 à 1774</td></tr>
      <tr><td>Platine I et II</td><td>1775 à 2024</td></tr>
      <tr><td>Diamant I et II</td><td>2025 à 2274</td></tr>
      <tr><td>Mythique</td><td>2275 à 2399</td></tr>
      <tr><td>Légende 128</td><td>2400 et plus</td></tr>
    </tbody>
  </table></div>
  <p>Tu commences à 1000 ELO, en Bronze II. L'arène a son propre classement, séparé du 5v5 et du Wingman.</p>
  <h2>Pourquoi le 1v1 en 128 tick</h2>
  <p>En duel, tout se joue en quelques millisecondes. Le <a href="/tickrate-csgo">128 tick</a> enregistre ton tir plus près du moment où tu cliques : c'est là qu'il fait la plus grande différence.</p>
  <h2>S'entraîner avant l'arène</h2>
  <p>Avant une série de duels, quelques minutes d'échauffement suffisent : une partie contre des bots, ou une map d'entraînement hors ligne avec <code>-tickrate 128</code> dans les options de lancement, pour retrouver les mêmes sensations que sur nos serveurs. Les commandes utiles sont sur la page <a href="/commandes-csgo">commandes CS:GO</a>.</p>
  <h2>Sur PC uniquement</h2>
  <p>Comme tout CS:GO, l'arène se joue sur PC. Installe d'abord <a href="/csgo-legacy">CS:GO legacy</a> si ce n'est pas fait.</p>`,
    faq: [
      ['Le 1v1 change-t-il mon rang 5v5 ?', 'Non, l\'arène 1v1 a son propre ELO et ses propres rangs.'],
      ['Quel est le rang le plus haut ?', 'Légende 128, à partir de 2400 ELO.'],
      ['Peut-on défier un ami en 1v1 ?', 'La recherche classée trouve un adversaire de ton niveau. Pour un duel entre amis, une partie privée sur ton propre serveur reste possible.']
    ]
  },
  {
    slug: 'maps-csgo', alt: {},
    nav: 'Maps', short: 'Le pool 5v5 voté chaque mois',
    kw: ['maps cs go', 'map pool', 'maps csgo', 'vote des maps', 'mirage'],
    tags: ['maps', 'mode'],
    title: 'Maps CS GO : le map pool voté par les joueurs · TICKRATE',
    desc: 'Les maps CS GO jouables sur TICKRATE : 12 maps candidates, un map pool 5v5 de 7 maps voté chaque mois par les joueurs, veto avant chaque match.',
    h1: 'Maps CS GO : un map pool voté chaque mois',
    lead: 'Sur TICKRATE, ce sont les joueurs qui choisissent les maps du 5v5. 12 maps sont candidates ; chaque mois, les 7 plus votées forment le map pool du mois suivant.',
    body: `  <h2>Comment marche le vote des maps</h2>
  <ol>
    <li>Pendant le mois, chaque joueur avec un compte Steam lié vote pour 1 à 7 maps.</li>
    <li>Tu peux changer ton vote jusqu'à la fin du mois.</li>
    <li>Le 1er du mois, les 7 maps les plus votées deviennent le pool du 5v5, s'il y a eu assez de votants.</li>
    <li>Avant chaque match, les capitaines bannissent des maps de ce pool jusqu'à la dernière.</li>
  </ol>
  <h2>Les 12 maps candidates</h2>
  <div class="sx-tbl"><table>
    <thead><tr><th>Map</th><th>En bref</th></tr></thead>
    <tbody>
      <tr><td><b>Mirage</b></td><td>La map la plus jouée de CS:GO, équilibrée, avec son milieu décisif</td></tr>
      <tr><td><b>Inferno</b></td><td>Village italien aux ruelles étroites, jeu d'utilitaires et de bananes</td></tr>
      <tr><td><b>Dust II</b></td><td>La classique, longues lignes de tir et duels à l'AWP</td></tr>
      <tr><td><b>Nuke</b></td><td>Centrale nucléaire, deux sites l'un au-dessus de l'autre</td></tr>
      <tr><td><b>Overpass</b></td><td>Parc et canaux, beaucoup de rotations</td></tr>
      <tr><td><b>Ancient</b></td><td>Temple dans la jungle, chemins serrés</td></tr>
      <tr><td><b>Anubis</b></td><td>Ville égyptienne traversée par un canal</td></tr>
      <tr><td><b>Vertigo</b></td><td>Chantier de gratte-ciel, sur deux étages</td></tr>
      <tr><td><b>Train</b></td><td>Gare de triage, wagons et lignes droites</td></tr>
      <tr><td><b>Cache</b></td><td>Ancien pilier du compétitif, rapide et lisible</td></tr>
      <tr><td><b>Cobblestone</b></td><td>Château aux grands espaces, jeu à l'AWP</td></tr>
      <tr><td><b>Tuscan</b></td><td>Remake de la map culte de CS 1.6</td></tr>
    </tbody>
  </table></div>
  <h2>Pourquoi laisser voter les joueurs</h2>
  <p>Un pool figé finit par lasser. Le vote garde les maps que la communauté veut vraiment jouer, et laisse revenir des classiques que Valve a retirés du compétitif.</p>
  <h2>Et le Wingman et le 1v1 ?</h2>
  <p>Le <a href="/wingman-csgo">Wingman</a> se joue sur les maps 2v2 de CS:GO, le <a href="/1v1-csgo">1v1</a> sur des aim maps. Le vote ne concerne que le 5v5.</p>
  <h2>Toutes les maps en 128 tick</h2>
  <p>Chaque map est jouée sur un <a href="/serveur-csgo">serveur CS GO 128 tick</a> dédié. Pour les lineups de grenades, pense à les apprendre en 128 tick : certaines smokes ne tombent pas au même endroit qu'en 64.</p>`,
    faq: [
      ['Qui peut voter pour les maps ?', 'Tout joueur avec un compte TICKRATE et un compte Steam lié.'],
      ['Quand le map pool change-t-il ?', 'Le 1er de chaque mois, à partir des votes du mois précédent.'],
      ['Combien de maps dans le pool 5v5 ?', '7 maps, choisies parmi 12 candidates.']
    ]
  }
];

// --- Actualités (contenu dans tools/seo/news.js)
const NEWS = require('./news');
const frDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
module.exports.push({
  slug: 'actualites', alt: { en: 'en/news' }, script: 'news.js',
  nav: 'Actualités', short: 'Nouveautés du site et rotation des maps',
  kw: ['actualités tickrate', 'nouveautés', 'rotation des maps', 'cs go'],
  tags: ['maps', 'jouer'],
  title: 'Actualités TICKRATE : nouveautés et rotation des maps CS GO',
  desc: 'Actualités TICKRATE : nouveautés du site, résultat du vote mensuel et rotation des maps CS GO, nouveaux modes et nouvelles pages.',
  h1: 'Actualités TICKRATE',
  lead: 'Les nouveautés du site, et chaque mois le résultat du vote des joueurs : quelles maps entrent dans la rotation CS GO, lesquelles en sortent.',
  body: `  <h2>Rotation des maps</h2>
  <div class="sx-live" id="newsMaps" data-lang="fr"><p>La première rotation votée par les joueurs aura lieu le 1er décembre. <a href="/maps-csgo">Comment marche le vote</a>.</p></div>
  <h2>Nouveautés</h2>
${NEWS.map(n => `  <article class="sx-news"><time datetime="${n.date}">${frDate(n.date)}</time><h3>${n.fr.title}</h3><p>${n.fr.body}</p></article>`).join('\n')}
  <p>Pour suivre les nouveautés au jour le jour, rejoins le Discord ou suis TICKRATE sur Instagram et TikTok (liens en bas de page).</p>`,
  faq: []
});
