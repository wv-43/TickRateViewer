// English pages (same rules as fr.js). alt.fr = the French page they translate (hreflang).
module.exports = [
  {
    slug: 'en/csgo-server', alt: { fr: 'serveur-csgo' }, main: true,
    nav: 'CS:GO servers', short: '128 tick dedicated CS GO servers in Europe',
    kw: ['cs go server', 'csgo server', '128 tick server', 'free cs go server', 'dedicated server'],
    tags: ['serveur', 'tick', 'jouer'],
    title: 'Free 128 tick CS GO server in Europe · TICKRATE',
    desc: 'Free 128 tick CS GO server hosted in Frankfurt: ranked 5v5, Wingman and 1v1 matchmaking, ELO, map veto and demo-reviewed anti-cheat.',
    h1: 'Free 128 tick CS GO server in Europe',
    lead: 'TICKRATE runs its own CS:GO (legacy) servers at 128 tick in Frankfurt. No IP to look up: you queue on the website, and CS:GO connects you to the right server when your match is ready.',
    body: `  <div class="sx-facts">
    <div class="sx-fact"><b>128 tick</b><span>on every server</span></div>
    <div class="sx-fact"><b>Frankfurt</b><span>dedicated servers in Germany</span></div>
    <div class="sx-fact"><b>Free</b><span>every mode and the ladder</span></div>
    <div class="sx-fact"><b>3 modes</b><span>5v5, Wingman 2v2, 1v1 Aim</span></div>
  </div>
  <h2>Why 128 tick servers</h2>
  <p>The <a href="/en/tickrate">tickrate</a> is how many times per second the server simulates the game. At 128 tick it updates positions, shots and grenades twice as often as at 64 tick. Shots register closer to the moment you click, and grenade trajectories are more consistent from one game to the next.</p>
  <p>Your connection matters just as much: a 128 tick server can't make up for a bad ping. That's why our servers are in Frankfurt, one of the best-connected hubs in Europe.</p>
  <h2>One dedicated server per match</h2>
  <ul>
    <li><b>Reserved for the match players:</b> 10 in 5v5, 4 in Wingman, 2 in 1v1.</li>
    <li><b>Competitive config:</b> same rules for everyone, halftime, overtime in 5v5.</li>
    <li><b>Automatic connection:</b> when the match is ready, the Connect button launches CS:GO on the right server with the password.</li>
    <li><b>GOTV:</b> every match can be watched live.</li>
  </ul>
  <h2>Community CS GO server or matchmaking?</h2>
  <p>A regular community csgo server is joined by IP: you play with whoever is there, with no skill level and no ranking. On TICKRATE, each dedicated server is assigned to one match: players are close in skill and the result counts for your ELO.</p>
  <h2>What happens when you queue</h2>
  <ol>
    <li>You search for a match, solo or with your party.</li>
    <li>When 10 players of similar level are found, everyone accepts.</li>
    <li>Captains take turns banning maps (veto) until one is left.</li>
    <li>A free server is assigned; you click Connect.</li>
    <li>When the match ends, your ELO and stats update on the site.</li>
  </ol>
  <h2>Maps voted by players</h2>
  <p>The 5v5 pool has 7 maps chosen by the players: every month you vote, and the 7 most voted maps make up next month's rotation.</p>
  <h2>Fair play without installing anything</h2>
  <p>No anti-cheat client to install. The server records aim statistics during the match, players can report suspicious behaviour, and trusted players review the demo before any ban. Confirmed cheaters are banned.</p>`,
    faq: [
      ['Are TICKRATE CS GO servers free?', 'Yes: a free cs go server for every match, all three modes, the ladder and the league. Paid plans only add cosmetics and analysis tools, with no in-game advantage.'],
      ['Where are the servers?', 'In Frankfurt, Germany, with low ping from most of western and central Europe.'],
      ['Do I need CS2 or CS:GO?', 'CS:GO legacy, free on Steam. See <a href="/en/csgo-legacy">CS:GO legacy</a> to install it.'],
      ['Is there a server IP to enter?', 'No. The Connect button on the site launches CS:GO straight onto your match server.']
    ]
  },
  {
    slug: 'en/csgo-server-list', alt: { fr: 'serveurs-csgo' }, main: true, script: 'srvlist.js',
    nav: 'Server list', short: 'Our CS GO servers live: status, map, score',
    kw: ['cs go server list', 'csgo servers', 'live servers', 'server status', '128 tick'],
    tags: ['serveur', 'jouer', 'tick'],
    title: 'Live CS GO server list, 128 tick · TICKRATE',
    desc: 'Live CS GO server list from TICKRATE: status of every server, game mode, map and score of matches in progress. 128 tick csgo servers in Frankfurt.',
    h1: 'Live CS GO server list',
    lead: 'Every TICKRATE csgo server in real time: which ones are available, which are hosting a match, on which map and at what score. Every server runs at 128 tick in Frankfurt.',
    body: `  <div class="sx-live" id="srvLive"><p>Loading server status…</p></div>
  <noscript><p>Enable JavaScript to see live server status.</p></noscript>
  <h2>Reading the list</h2>
  <ul>
    <li><b>Available:</b> the server is waiting for the next match and gets assigned as soon as players are found.</li>
    <li><b>Starting a match:</b> players have accepted and are connecting.</li>
    <li><b>Match in progress:</b> the game is on; map and score update every round.</li>
    <li><b>Mode:</b> some servers are reserved for 5v5, Wingman or 1v1, so a short game never blocks a 5v5 server.</li>
  </ul>
  <p>The list refreshes every 30 seconds, and server status is recomputed every minute.</p>
  <h2>Why no IP to copy?</h2>
  <p>On a classic CS GO server list you copy an IP and join whoever is there. Here, each server is reserved for one match, with a password unique to that game, so nobody can drop in halfway. To play, queue on the site: when your match is ready, the Connect button launches CS:GO straight onto the right server. See <a href="/en/csgo-server">128 tick CS GO server</a> for how it all works.</p>
  <h2>What every server has in common</h2>
  <div class="sx-facts">
    <div class="sx-fact"><b>128 tick</b><span>on every server</span></div>
    <div class="sx-fact"><b>Frankfurt</b><span>dedicated machines</span></div>
    <div class="sx-fact"><b>GOTV</b><span>every match broadcast</span></div>
    <div class="sx-fact"><b>Free</b><span>no subscription needed</span></div>
  </div>
  <p>The <a href="/en/tickrate">tickrate</a> is 128 everywhere, and so is the competitive config: same rules, same buy time, same round count for a given mode. 5v5 maps follow the pool players vote for every month.</p>
  <h2>Watching a live match</h2>
  <p>Live matches are shown on the site with the round-by-round score and kill feed, and can be watched in CS:GO through GOTV.</p>`,
    faq: [
      ['How do I join a server from the list?', 'Servers are reserved for each match\'s players. Queue on the site: a free server is assigned and the Connect button takes you there.'],
      ['Are all servers 128 tick?', 'Yes, every TICKRATE server runs at 128 tick.'],
      ['Is the status really live?', 'It is recomputed every minute, and the page refreshes every 30 seconds.']
    ]
  },
  {
    slug: 'en/tickrate', alt: { fr: 'tickrate-csgo' }, main: true,
    nav: 'Tickrate', short: '64 vs 128 tick: what actually changes',
    kw: ['tickrate', 'tick rate', '128 tick', '64 tick', 'cs go tickrate', 'cl_updaterate'],
    tags: ['tick', 'technique'],
    title: 'CS GO tickrate: 64 vs 128 tick explained · TICKRATE',
    desc: 'Tickrate explained: what a tick is, 64 tick vs 128 tick in CS GO, how it affects shots and grenades, and the rate and cl_updaterate settings to use.',
    h1: 'Tickrate: 64 vs 128 tick explained',
    lead: 'The tickrate (or tick rate) is how many times per second a game server simulates the match. In CS:GO it is 64 or 128. Here is what that changes in practice, and how to set up your game.',
    body: `  <h2>What is a tick?</h2>
  <p>On every tick, the server reads player input (movement, shots, grenades), computes the new game state and sends it to the players. A 64 tick server does this 64 times per second, every 15.6 milliseconds. At 128 tick, it's every 7.8 milliseconds.</p>
  <div class="sx-facts">
    <div class="sx-fact"><b>64 tick</b><span>one update every 15.6 ms</span></div>
    <div class="sx-fact"><b>128 tick</b><span>one update every 7.8 ms</span></div>
  </div>
  <h2>What 128 tick changes in game</h2>
  <ul>
    <li><b>Shooting:</b> your click is processed sooner and enemy positions are more precise, so close duels are fairer.</li>
    <li><b>Grenades:</b> trajectories are computed more finely. Some smokes are thrown differently at 64 and 128 tick: a lineup learned at 64 tick can miss at 128.</li>
    <li><b>Movement:</b> strafing, jumping and air strafes feel smoother.</li>
  </ul>
  <h2>What tickrate doesn't change</h2>
  <p>128 tick doesn't fix a bad ping: if your packets take 80 ms to arrive, the server gets them 80 ms late whatever its tickrate. It doesn't fix low FPS either: aim for well above 128 frames per second.</p>
  <h2>64 tick, 128 tick and CS2</h2>
  <p>In CS:GO, Valve's official matchmaking ran at 64 tick while third-party competitive platforms played at 128 tick, which is why "128 tick" became so sought after. CS2 changed approach: its servers stay at 64 tick, but the game records the exact moment of your actions between ticks ("sub-tick"). On CS:GO legacy, the tickrate still makes the difference.</p>
  <h2>Setting up CS:GO for 128 tick</h2>
  <p>Type these in the console (or put them in your autoexec.cfg):</p>
  <pre><code>rate 786432
cl_cmdrate 128
cl_updaterate 128
cl_interp 0
cl_interp_ratio 1</code></pre>
  <ul>
    <li><code>rate</code>: how much data your game accepts. 786432 is the CS:GO maximum.</li>
    <li><code>cl_cmdrate</code> and <code>cl_updaterate</code>: how many updates you send and receive per second. The server caps them at its own tickrate.</li>
    <li><code>cl_interp 0</code> with <code>cl_interp_ratio 1</code>: the shortest interpolation, derived from your updaterate.</li>
  </ul>
  <h2>Checking a server's tickrate</h2>
  <p>Type <code>net_graph 1</code> in the console: the bottom line shows the server tick and the updates you receive. To practise offline at 128 tick (bots, training maps), add <code>-tickrate 128</code> to CS:GO's launch options in Steam.</p>
  <h2>And the name TICKRATE?</h2>
  <p>That's where the site's name comes from: every TICKRATE match is played on a dedicated <a href="/en/csgo-server">128 tick CS GO server</a>.</p>`,
    faq: [
      ['Is 128 tick really better?', 'Yes for shot and grenade precision, as long as you have a good ping and enough FPS. The difference shows most in close duels.'],
      ['How do I play CS:GO at 128 tick?', 'On a server running at 128 tick, like TICKRATE\'s. Offline, add -tickrate 128 to your launch options.'],
      ['Should I change cl_updaterate on 64 tick servers?', 'No, leaving it at 128 is fine: the server never sends more than its own tickrate.']
    ]
  },
  {
    slug: 'en/csgo-legacy', alt: { fr: 'csgo-legacy' }, main: true,
    nav: 'CS:GO legacy', short: 'How to play CS GO in 2026',
    kw: ['cs go legacy', 'play cs go', 'cs go in 2026', 'install cs go', 'free cs go'],
    tags: ['jouer', 'legacy'],
    title: 'CS GO legacy: how to play CS:GO in 2026 · TICKRATE',
    desc: 'CS GO legacy is still on Steam: how to install CS:GO for free in 2026, why people still play it, and where to find ranked 128 tick matches.',
    h1: 'CS GO legacy: playing CS:GO in 2026',
    lead: 'Counter-Strike 2 replaced CS:GO as the main game, but CS:GO is still available on Steam as a legacy version. Here is how to install it and where to find ranked matches.',
    body: `  <h2>What is CS:GO legacy?</h2>
  <p>It's the final build of Counter-Strike: Global Offensive, kept by Valve after CS2 launched. Same weapons, same movement, same maps from that era. Since March 2026 it installs as a separate Steam app.</p>
  <h2>Install CS GO in 3 steps</h2>
  <ol>
    <li>Open Steam and go to your library.</li>
    <li>Look for "Counter-Strike: Global Offensive" (legacy version) and install it. On a PC with Steam, this link opens the install directly: <a href="steam://install/4465480">install CS:GO legacy</a>.</li>
    <li>Launch it once to check it starts.</li>
  </ol>
  <p>CS:GO legacy is PC only. On a phone you can check your profile and the ladder, but not play.</p>
  <h2>Why play CS GO in 2026</h2>
  <ul>
    <li><b>Movement and feel:</b> many players prefer how CS:GO feels compared to CS2.</li>
    <li><b>Classic maps:</b> some of them are no longer in CS2.</li>
    <li><b>Lower-end PCs:</b> CS:GO needs fewer resources than CS2.</li>
    <li><b>128 tick:</b> CS:GO runs on fixed-tickrate servers, where <a href="/en/tickrate">128 tick</a> really matters.</li>
  </ul>
  <h2>The problem: finding matches</h2>
  <p>Valve's official matchmaking is gone from CS:GO legacy. Community servers remain, but without ranked, balanced games. That's what TICKRATE offers: <a href="/en/csgo-matchmaking">CS GO matchmaking</a> in 5v5, Wingman and 1v1 with ELO and a ladder, on <a href="/en/csgo-server">128 tick servers</a>.</p>
  <h2>Legacy vs CS2: what's different</h2>
  <p>CS:GO legacy keeps the gameplay of the final CS:GO build: the old movement, the classic smokes and the fixed-tickrate servers. CS2 runs on the Source 2 engine, with volumetric smokes, redesigned maps and sub-tick servers at 64 tick. Both use the same Steam inventory. Which one feels better is a matter of taste; plenty of players simply never got used to CS2.</p>
  <h2>Getting started on TICKRATE</h2>
  <ol>
    <li>Install CS:GO legacy (steps above).</li>
    <li>Create your account on <a href="/">tickrate.eu</a> and link Steam.</li>
    <li>Queue, accept the match, do the veto and click Connect.</li>
  </ol>`,
    faq: [
      ['Is CS:GO still playable in 2026?', 'Yes. Valve keeps the legacy version of CS:GO on Steam. Official matchmaking is gone, but you can play on servers like TICKRATE\'s.'],
      ['Is CS GO legacy free?', 'Yes, it installs for free from Steam: free cs go, just like CS2.'],
      ['Are my CS:GO skins still there?', 'Your Steam inventory is shared with CS2. On our servers you can equip your skins from the site.']
    ]
  },
  {
    slug: 'en/csgo-matchmaking', alt: { fr: 'matchmaking-csgo' }, main: true,
    nav: 'Matchmaking', short: '5v5, Wingman 2v2 and 1v1 Aim',
    kw: ['cs go matchmaking', 'csgo matchmaking', 'ranked', 'elo', '5v5'],
    tags: ['jouer', 'mode', 'classement'],
    title: 'Ranked CS GO matchmaking: 5v5, Wingman, 1v1 · TICKRATE',
    desc: 'Ranked CS GO matchmaking for CS:GO legacy: competitive 5v5 with map veto, Wingman 2v2 and 1v1 Aim, each with its own ELO ladder. Free, 128 tick.',
    h1: 'CS GO matchmaking: 5v5, Wingman and 1v1',
    lead: 'Three ranked modes, each with its own ELO. Matchmaking groups players of similar skill on dedicated 128 tick servers.',
    body: `  <div class="sx-tbl"><table>
    <thead><tr><th>Mode</th><th>Players</th><th>Maps</th><th>Ranking</th></tr></thead>
    <tbody>
      <tr><td><b>5v5 Competitive</b></td><td>10</td><td>7-map pool voted monthly, veto before the match</td><td>5v5 ELO and ranks</td></tr>
      <tr><td><b>Wingman 2v2</b></td><td>4</td><td>CS:GO 2v2 maps</td><td>Separate Wingman ELO</td></tr>
      <tr><td><b>1v1 Aim Arena</b></td><td>2</td><td>Aim maps</td><td>1v1 ELO and arena ranks</td></tr>
    </tbody>
  </table></div>
  <h2>5v5 Competitive</h2>
  <p>The main csgo matchmaking mode. Play solo or with a party of up to 5. Once 10 players are found and everyone accepts the ranked match, the two captains take turns banning maps. The last one left is played.</p>
  <h2>Wingman 2v2</h2>
  <p>Shorter games on smaller maps with a single bombsite. Wingman has its own ELO and doesn't affect your 5v5 rank.</p>
  <h2>1v1 Aim Arena</h2>
  <p>One versus one on aim maps, with its own ranks from Iron to 128 Legend.</p>
  <h2>How ELO is calculated</h2>
  <p>Winning matters most, but your performance changes the points: ADR, kills, round impact. Beating a higher-rated team earns more; losing to a lower-rated team costs more. The 5v5 ranks follow the CS:GO ranks, from Silver to Global Elite.</p>
  <h2>Playing with your party</h2>
  <p>Invite friends from the site and queue together: up to 5 in 5v5, 2 in Wingman. Matchmaking takes the party's average ELO into account and looks for opponents at a similar level. When the match is ready, every member gets the Connect button and joins the same server.</p>
  <h2>Balanced matchmaking</h2>
  <ul>
    <li><b>Similar skill:</b> players are grouped by ELO.</li>
    <li><b>Trust factor:</b> reliable players play together.</li>
    <li><b>Abandons punished:</b> leaving or not connecting means a temporary queue ban, longer for repeat offences.</li>
  </ul>`,
    faq: [
      ['How long is the queue?', 'It depends on how many players are online and your level. The estimated wait is shown when you start searching.'],
      ['Can I play with friends?', 'Yes: up to 5 in 5v5 and 2 in Wingman. The party leader starts the search.'],
      ['What if I leave a match?', 'You get a temporary matchmaking ban, longer for each repeat within 7 days.']
    ]
  }
];

// --- News (content in tools/seo/news.js)
const NEWS = require('./news');
const enDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
module.exports.push({
  slug: 'en/news', alt: { fr: 'actualites' }, script: 'news.js',
  nav: 'News', short: 'Site updates and map rotation',
  kw: ['tickrate news', 'updates', 'map rotation', 'cs go'],
  tags: ['maps', 'jouer'],
  title: 'TICKRATE news: updates and CS GO map rotation',
  desc: 'TICKRATE news: site updates, monthly map vote results and the CS GO map rotation, new game modes and new pages.',
  h1: 'TICKRATE news',
  lead: 'Site updates, and every month the result of the players\' vote: which maps join the CS GO rotation and which ones leave.',
  body: `  <h2>Map rotation</h2>
  <div class="sx-live" id="newsMaps" data-lang="en"><p>The first player-voted rotation happens on December 1.</p></div>
  <h2>Updates</h2>
${NEWS.map(n => `  <article class="sx-news"><time datetime="${n.date}">${enDate(n.date)}</time><h3>${n.en.title}</h3><p>${n.en.body}</p></article>`).join('\n')}
  <p>For day-to-day updates, join the Discord or follow TICKRATE on Instagram and TikTok (links at the bottom of the page).</p>`,
  faq: []
});
