/* =====================================================
 * TICKRATE - Core : DOM, I18N, Maps CS:GO, Niveaux ELO, Trust Factor, Audio (core.js)
 * ===================================================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
window.PAYMENTS_COMING_SOON = true;
// Images cassées : remplace les anciens onerror="..." inline (interdits par la CSP stricte)
document.addEventListener('error',e=>{const im=e.target;if(!im||im.tagName!=='IMG'||!im.dataset.fb)return;if(im.dataset.fb==='noimg'&&im.parentNode)im.parentNode.classList.add('noimg');im.remove()},true);
const ICON={
  check:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>',
  x:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"/></svg>',
  leader:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>',
  shield:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M63.28 202a15.29 15.29 0 01-7.7-2 14.84 14.84 0 01-5.52-20.46C69.34 147.36 128 72.25 256 72.25c55.47 0 104.12 14.57 144.53 43.29 33.26 23.57 51.9 50.25 60.78 63.1a14.79 14.79 0 01-4 20.79 15.52 15.52 0 01-21.24-4C420 172.32 371 102 256 102c-112.25 0-163 64.71-179.53 92.46A15 15 0 0163.28 202z"/><path d="M320.49 496a15.31 15.31 0 01-3.79-.43c-92.85-23-127.52-115.82-128.93-119.68l-.22-.85c-.76-2.68-19.39-66.33 9.21-103.61 13.11-17 33.05-25.72 59.38-25.72 24.48 0 42.14 7.61 54.28 23.36 10 12.86 14 28.72 17.87 44 8.13 31.82 14 48.53 47.79 50.25 14.84.75 24.59-7.93 30.12-15.32 14.95-20.15 17.55-53 6.28-82C398 228.57 346.61 158 256 158c-38.68 0-74.22 12.43-102.72 35.79-23.59 19.35-42.28 46.67-51.28 74.75-16.69 52.28 5.2 134.46 5.41 135.21A14.83 14.83 0 0196.54 422a15.39 15.39 0 01-18.74-10.6c-1-3.75-24.38-91.4-5.1-151.82 21-65.47 85.81-131.47 183.33-131.47 45.07 0 87.65 15.32 123.19 44.25 27.52 22.5 50 52.72 61.76 82.93 14.95 38.57 10.94 81.86-10.19 110.14-14.08 18.86-34.13 28.72-56.34 27.65-57.86-2.9-68.26-43.29-75.84-72.75-7.8-30.22-12.79-44.79-42.58-44.79-16.36 0-27.85 4.5-35 13.82-9.75 12.75-10.51 32.68-9.43 47.14a152.44 152.44 0 005.1 29.79c2.38 6 33.37 82 107.59 100.39a14.88 14.88 0 0111 18.11 15.36 15.36 0 01-14.8 11.21z"/><path d="M201.31 489.14a15.5 15.5 0 01-11.16-4.71c-37.16-39-58.18-82.61-66.09-137.14V347c-4.44-36.1 2.06-87.21 33.91-122.35 23.51-25.93 56.56-39.11 98.06-39.11 49.08 0 87.65 22.82 111.7 65.89 17.45 31.29 20.91 62.47 21 63.75a15.07 15.07 0 01-13.65 16.4 15.26 15.26 0 01-16.79-13.29A154 154 0 00340.43 265c-18.64-32.89-47-49.61-84.51-49.61-32.4 0-57.75 9.75-75.19 29-25.14 27.75-30 70.5-26.55 98.78 6.93 48.22 25.46 86.58 58.18 120.86a14.7 14.7 0 01-.76 21.11 15.44 15.44 0 01-10.29 4z"/><path d="M372.5 446.18c-32.5 0-60.13-9-82.24-26.89-44.42-35.79-49.4-94.08-49.62-96.54a15.27 15.27 0 0130.45-2.36c.11.86 4.55 48.54 38.79 76 20.26 16.18 47.34 22.6 80.71 18.85a15.2 15.2 0 0116.91 13.18 14.92 14.92 0 01-13.44 16.5 187 187 0 01-21.56 1.26zM398.18 48.79C385.5 40.54 340.54 16 256 16c-88.74 0-133.81 27.11-143.78 34a11.59 11.59 0 00-1.84 1.4.36.36 0 01-.22.1 14.87 14.87 0 00-5.09 11.15 15.06 15.06 0 0015.31 14.85 15.56 15.56 0 008.88-2.79c.43-.32 39.22-28.82 126.77-28.82S382.58 74.29 383 74.5a15.25 15.25 0 009.21 3 15.06 15.06 0 0015.29-14.89 14.9 14.9 0 00-9.32-13.82z"/></svg>',
  flag:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M80 480a16 16 0 01-16-16V68.13a24 24 0 0111.9-20.72C88 40.38 112.38 32 160 32c37.21 0 78.83 14.71 115.55 27.68C305.12 70.13 333.05 80 352 80a183.84 183.84 0 0071-14.5 18 18 0 0125 16.58v219.36a20 20 0 01-12 18.31c-8.71 3.81-40.51 16.25-84 16.25-24.14 0-54.38-7.14-86.39-14.71C229.63 312.79 192.43 304 160 304c-36.87 0-55.74 5.58-64 9.11V464a16 16 0 01-16 16z"/></svg>',
  ok:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/></svg>',
  link:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M200.66 352H144a96 96 0 010-192h55.41M312.59 160H368a96 96 0 010 192h-56.66M169.07 256h175.86" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"/></svg>',
  edit:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/><path d="M386.34 193.66L264.45 315.79A41.08 41.08 0 01247.58 326l-25.9 8.67a35.92 35.92 0 01-44.33-44.33l8.67-25.9a41.08 41.08 0 0110.19-16.87l122.13-121.91a8 8 0 00-5.65-13.66H104a56 56 0 00-56 56v240a56 56 0 0056 56h240a56 56 0 0056-56V199.31a8 8 0 00-13.66-5.65z"/></svg>',
  ban:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><circle fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="48" cx="256" cy="256" r="200"/><path stroke="currentColor" stroke-miterlimit="10" stroke-width="48" d="M114.58 114.58l282.84 282.84"/></svg>',
  up:'<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M376 176H272v145a16 16 0 01-32 0V176H136a56.06 56.06 0 00-56 56v192a56.06 56.06 0 0056 56h240a56.06 56.06 0 0056-56V232a56.06 56.06 0 00-56-56zM272 86.63l52.69 52.68a16 16 0 0022.62-22.62l-80-80a16 16 0 00-22.62 0l-80 80a16 16 0 0022.62 22.62L240 86.63V176h32z"/></svg>'
};

/* =====================================================
   TRADUCTIONS FR / EN / RU
   ===================================================== */
const I18N={
fr:{
 nav_settings:'Paramètres',st_account:'Compte',st_audio:'Audio et vocal',st_notif:'Notifications',st_ui:'Interface',st_privacy:'Confidentialité',st_profile:'Profil',st_edit_profile:'Modifier pseudo, avatar et bannière',st_name_cd:'Le pseudo peut être changé une fois tous les 7 jours.',st_login:'Connexion',st_default:'Par défaut (système)',st_mic:'Micro',st_out:'Sortie',st_input:'Micro (entrée)',st_output:'Casque / haut-parleurs (sortie)',st_in_vol:'Volume du micro',st_out_vol:'Volume des autres joueurs',st_no_sink:'Ton navigateur ne permet pas de choisir la sortie : il utilise celle de Windows.',st_need_mic:'Lance le test du micro une fois pour voir le nom de tes appareils.',st_devices:'Appareils',st_test_out:'Tester la sortie',st_test_out_h:'Joue un petit son dans le casque choisi',st_play:'Jouer',st_mic_test:'Test du micro',st_vad:'Sensibilité',st_vad_h:'Le trait orange : au-dessus, tu es considéré comme en train de parler.',st_stop:'Arrêter',st_hear_me:'M\'entendre (mets un casque)',st_mic_test_go:'Tester mon micro',st_mode:'Mode de parole',st_ptt_key:'Touche pour parler',st_ptt_key_h:'Clique puis appuie sur la touche voulue (Échap pour annuler)',st_processing:'Traitement de la voix',st_ns:'Suppression du bruit',st_ns_h:'Filtre le clavier, la souris et le bruit de fond',st_ec:'Annulation d\'écho',st_ec_h:'Utile si tu joues sans casque',st_agc:'Gain automatique',st_agc_h:'Ajuste ton volume quand tu parles plus ou moins fort',st_sounds:'Sons du site',st_sounds_h:'Match trouvé, messages, bips d\'interface',st_dm:'Messages privés',st_dm_h:'Prévenir quand un ami t\'écrit',st_desk:'Notifications du bureau',st_desk_h:'Même quand l\'onglet est en arrière-plan',st_desk_denied:'Notifications refusées par le navigateur',st_rm:'Réduire les animations',st_rm_h:'Coupe les animations et transitions du site',st_online:'Afficher mon statut en ligne',st_online_h:'Tes amis voient quand tu es connecté',st_dmf:'Messages privés : amis uniquement',st_dmf_h:'Les autres joueurs ne peuvent pas t\'écrire',st_pub:'Profil public',st_pub_h:'Tout le monde peut voir tes stats et ton historique',st_saved:'Paramètre enregistré',st_all_audio:'Tous les réglages audio',
 fb_synced:'synchronisé {x}',fb_pending:'en attente',
 vc_empty:'personne pour l\'instant',vc_none:'Personne dans ce salon. Rejoins-le pour lancer la discussion.',vc_mate:'Équipe',vc_foe:'Adversaire',vc_mute_p1:'Rendre muet',vc_unmute_p:'Réactiver le son',vc_game_t:'Pendant le match : vocal CS:GO',vc_game_rounds:'Pendant les rounds tu entends ton équipe ; entre les manches (fin de round et freeze time), les deux équipes s\'entendent, comme dans l\'ancien CS:GO.',vc_game_alltalk:'Tout le monde s\'entend pendant tout le match (alltalk).',vc_game_team:'Équipe uniquement ; tout le monde s\'entend pendant l\'échauffement et la mi-temps.',
 rep_msg:'Signaler ce message',rep_done:'Message déjà signalé',rep_sent:'Message de {n} signalé à la modération',rep_limit:'Limite de signalements atteinte pour ce match',lvup_k:'RANG SUPÉRIEUR',lvup_t:'Nouveau rang : {n}',lvup_next:'Prochain rang : {n} à {e} ELO',lvup_max:'Rang maximum : direction la Pro League',lvup_close:'Clique pour continuer',
 rs_play:'Jouer',rs_items:'Objets',rs_social:'Social',ps_ph:'Rechercher un joueur…',ps_none:'Aucun joueur trouvé',leave_guard:'Tu es dans une room de match : quitter la page ?',
 launch_hint:'Ouvre CS:GO et te connecte directement, que le jeu soit ouvert ou fermé',copy_cmd:'Copier',copied_cmd:'Commande copiée : dans CS:GO, ouvre la console (²), colle (Ctrl+V) puis Entrée',ip_open_hint:'Si rien ne se passe : copie la commande et colle-la dans la console du jeu (²)',
 cp_teamlg:'Ligues d\'équipes',tn_need_team_lg:'Crée ta team 5v5 dans l\'onglet Ligues d\'équipes pour t\'inscrire',
 pp_pro:'Pro League · {n}e meilleur joueur du monde',pp_elite:'Ligue Élite · 2400 ELO et plus',
 place2:'2e',place3:'3e',tn_placed:'Ton équipe termine {p} de {n} : +{x}',
 nav_comp:'Compét',cp_title:'Compétition',cp_leagues:'Ligues',cp_tourneys:'Tournois',cp_teams:'Mon équipe',lg_season:'Saison {n}',lg_ends:'fin dans {d} j',lg_div:'Division {d}',lg_mine:'Ma division',lg_div_empty:'Aucun joueur dans cette division pour le moment.',lg_next:'{n} ELO avant {x}',lg_top:'Plus haute ligue : vise la Pro League',lg_your_div:'Ta division',lg_up:'Zone de promotion',lg_down:'Zone de relégation',lg_rewards:'Récompenses de fin de saison',lg_dist:'Répartition des joueurs',lg_pro:'Pro League',lg_pro_t:'Les 20 meilleurs joueurs du classement (Élite mondiale).',lg_world:'Meilleurs du monde',lg_all:'Monde',lg_badge:'badge + bannière',lg_you_pro:'Tu es dans la Pro League !',tn_all:'Tous',tn_open:'Inscriptions',tn_live:'En cours',tn_done:'Terminés',tn_mine:'Les miens',tn_create:'Créer un tournoi',tn_official:'Officiel',tn_comm:'Communauté',tn_by:'par {n}',tn_teams:'Équipes',tn_start:'Début',tn_entry:'Inscription',tn_free:'Gratuite',tn_minlvl:'ELO min.',tn_none:'Aucun tournoi ici pour le moment.',tn_prize:'Cagnotte',tn_back:'← Tournois',tn_reg:'Inscrire mon équipe',tn_unreg:'Désinscrire',tn_registered:'Équipe inscrite',tn_need_team:'Crée une équipe de 5 joueurs pour t\'inscrire',tn_need5:'Il faut au moins 5 joueurs dans ton équipe',tn_need_cap:'Seul le capitaine peut inscrire l\'équipe',tn_elo_low:'ELO moyen de l\'équipe trop bas ({n} min.)',tn_full:'Complet',tn_participants:'Équipes inscrites',tn_bracket:'Arbre du tournoi',tn_round:'Tour {n}',tn_final:'Finale',tn_semi:'Demi-finales',tn_quarter:'Quarts',tn_launch:'Lancer le tournoi (démo)',tn_next:'Jouer le tour suivant (démo)',tn_champion:'Champion',tn_rules:'Règlement',tn_format:'Format',tn_single:'Élimination directe · BO1, finale BO3',tn_status_open:'Inscriptions ouvertes',tn_status_live:'En cours',tn_status_done:'Terminé',tn_status_fund:'Cagnotte à déposer',tn_fund:'Déposer la cagnotte ({x})',tn_funded:'Cagnotte déposée : le tournoi est publié',tn_f_name:'Nom du tournoi',tn_f_size:'Nombre d\'équipes',tn_f_date:'Date et heure',tn_f_region:'Région',tn_f_minelo:'ELO moyen minimum',tn_f_entry:'Inscription (Tick Coins, 0 = gratuite)',tn_f_prize_type:'Type de récompense',tn_f_cash:'Cash prize (€)',tn_f_tc:'Tick Coins',tn_f_prize:'Montant de la cagnotte',tn_f_split:'Répartition',tn_f_rules:'Règlement (optionnel)',tn_f_legal:'Je m\'engage à respecter la réglementation des compétitions de jeux vidéo',tn_legal:'<b>Cash prize :</b> la cagnotte est déposée à l\'avance par l\'organisateur et bloquée jusqu\'à la fin du tournoi, pour que les gagnants soient sûrs d\'être payés. En France, une compétition avec cash prize doit être déclarée au ministère entre 1 an et 30 jours avant ; au-delà de 10 000 € une garantie de paiement est obligatoire ; pas de cash prize pour les moins de 12 ans, et une partie des gains des moins de 16 ans est versée à la Caisse des dépôts.',tn_e_name:'Nom : 4 à 40 caractères',tn_e_date:'Choisis une date au moins 30 min dans le futur',tn_e_prize:'Montant de cagnotte invalide',tn_e_legal:'Coche l\'engagement réglementaire',tn_created:'Tournoi créé !',tn_created_cash:'Tournoi créé : dépose la cagnotte pour le publier.',tn_won:'Ton équipe remporte {n} ! +{x}',tn_reg_toast:'{t} est inscrite à {n}',tn_out:'Ton équipe est éliminée de {n}.',tn_cancel_reg:'Inscription annulée (remboursée)',split_wta:'Le gagnant prend tout',split_top2:'1er 70 % · 2e 30 %',split_top4:'1er 50 % · 2e 25 % · 3e-4e 12,5 %',place:'{n}e',place1:'1er',team_create:'Créer mon équipe',team_name:'Nom de l\'équipe',team_tag:'Tag (2 à 5 caractères)',team_color:'Couleur',team_e_name:'Nom : 3 à 24 caractères',team_e_tag:'Tag : 2 à 5 lettres ou chiffres',team_avg:'ELO moyen',team_members:'Joueurs',team_record:'Tournois',team_captain:'Capitaine',team_player:'Joueur',team_sub:'Remplaçant',team_kick:'Exclure',team_leave:'Quitter l\'équipe',team_disband:'Dissoudre l\'équipe',team_invite:'Inviter des amis',team_invited:'Invitation envoyée à {n}',team_joined:'{n} a rejoint {t}',team_full:'Équipe complète (7 joueurs max)',team_none_inv:'Aucun ami en ligne à inviter',team_intro:'Une équipe fixe de 5 joueurs (+2 remplaçants) pour participer aux tournois.',team_created:'Équipe {n} créée !',team_left:'Tu as quitté l\'équipe',team_in_t:'Inscrite à {n} tournoi(s)',
 vc:'Vocal',vc_join:'Rejoindre le vocal',vc_leave:'Quitter',vc_all:'Tous',vc_team:'Équipe',vc_open:'Micro ouvert',vc_ptt:'Appuyer pour parler',vc_mute:'Couper le micro',vc_deaf:'Sourdine',vc_in:'{n} dans le vocal',vc_ingame:'Le match commence : le vocal passe en jeu (alltalk activé sur le serveur).',vc_denied:'Micro refusé : autorise-le dans ton navigateur.',vc_nomic:'Aucun micro détecté.',vc_err:'Impossible d\'activer le micro.',vc_demo:'Démo : ton micro est réel, les voix des autres joueurs sont simulées. En ligne, le son passe directement entre joueurs (WebRTC).',vc_mute_p:'Clique sur l\'icône d\'un joueur pour le rendre muet',
 chat:'Chat',ch_team:'Équipe',ch_all:'Tous',ch_team_to:'[Équipe]',ch_all_to:'[Tous]',chat_ph_team:'Écris à ton équipe…',chat_ph_all:'Écris à tout le monde…',chat_slow:'Doucement, tu envoies trop de messages.',sys_ban:'{x} a banni {m}',sys_pick:'La map sera {m}',sys_live:'Tout le monde est connecté, bon match !',sys_welcome:'Bienvenue dans la room. Restez respectueux : les messages peuvent être signalés.',messages:'Messages',dm_title:'Messages',dm_empty:'Aucun ami pour le moment',dm_none:'Pas encore de message',dm_ph:'Message à {n}…',dm_off_note:'{n} est hors ligne : il verra ton message à sa prochaine connexion.',dm_new:'{n} : {x}',dm_btn:'Message',today:'Aujourd\'hui',st_writing:'écrit…',
 n_read_all:'Tout marquer comme lu',n_clear:'Effacer',n_empty:'Aucune notification',n_now:'à l\'instant',n_min:'il y a {n} min',n_h:'il y a {n} h',n_d:'il y a {n} j',n_win:'Victoire sur {m} ({s}) · {d} ELO',n_loss:'Défaite sur {m} ({s}) · {d} ELO',n_tier:'Pass de combat : palier {n} atteint ! Récupère ta récompense.',n_mission:'Mission terminée : {x}. Récupère ton XP.',n_ban:'Ban de {x} : {r}',n_prio_kick:'{n} n\'a pas rejoint : match annulé, tu es prioritaire.',n_season:'La saison 1 du pass de combat est lancée : 30 paliers à débloquer.',n_shop_new:'Nouveaux objets dans la boutique.',n_friend_on:'{n} est en ligne.',vs_us:'Winrate de ton équipe',vs_them:'Winrate adverse',vs_us_s:'Nous',vs_them_s:'Eux',vs_rec:'À bannir',vs_tip:'Nous : {a} ({pa} matchs) · Eux : {b} ({pb} matchs)',
 connected_btn:'Connecté',
 decline_free:'Aucune sanction : tu sors juste de la file',declined_free:'Match refusé : pas de sanction, tu es sorti de la file.',not_accepted_free:'Match non accepté : tu as été retiré de la file.',prio:'Prioritaire',prio_requeue:'Un joueur n\'a pas accepté : tu repars en tête de file.',connected_srv:'Connecté au serveur',joining_srv:'Lancement de CS:GO et connexion au serveur…',join_title:'Rejoins le serveur',join_n:'{n}/{t} connectés',join_me:'Clique sur CONNECTER',join_all:'Tout le monde est connecté : le match commence !',join_wait_all:'En attente que tous les joueurs rejoignent le serveur',join_kick:'{n} n\'a pas rejoint le serveur : exclu et banni {x}. Match annulé, tu repars en tête de file.',join_kick_me:'Tu n\'as pas rejoint le serveur à temps : exclu du match, ban de {x}.',ban_r_no_show:'Absent au lancement du match',
 au_title:'Le 5v5 compétitif, sérieusement.',au_sub:'Serveurs 128 tick, ELO basé sur tes performances, trust factor et anti-cheat. Crée ton compte, lie Steam et lance ta première partie.',au_b1:'tick sur tous nos serveurs',au_b2:'qui suit ta vraie perf, pas que tes victoires',au_b3:'anti-cheat et trust factor actifs',au_login:'Connexion',au_register:'Créer un compte',au_welcome:'Bon retour',au_id:'E-mail ou pseudo',au_pw:'Mot de passe',au_pw2:'Confirme le mot de passe',au_remember:'Rester connecté',au_forgot:'Mot de passe oublié ?',au_login_btn:'Se connecter',au_or:'ou',au_no_acc:'Pas encore de compte ?',au_have_acc:'Déjà inscrit ?',au_create:'Créer ton compte',au_user:'Pseudo',au_user_h:'3 à 16 caractères : lettres, chiffres, _ . -',au_mail:'E-mail',au_cgu:'J\'accepte les conditions d\'utilisation et la politique de confidentialité',au_create_btn:'Créer mon compte',au_steam_reg:'S\'inscrire avec Steam',au_settings:'Paramètres du compte',au_logout:'Se déconnecter',au_logged_out:'Déconnecté',au_hello:'Bienvenue, {n} !',au_created:'Compte créé. Lie ton compte Steam pour jouer.',au_r_len:'8 caractères',au_r_let:'1 lettre',au_r_num:'1 chiffre',au_since:'Membre depuis',au_change_pw:'Changer de mot de passe',au_set_pw:'Définir un mot de passe',au_pw_cur:'Mot de passe actuel',au_pw_new:'Nouveau mot de passe',au_pw_saved:'Mot de passe modifié',au_save:'Enregistrer',au_forgot_t:'La réinitialisation par e-mail arrive bientôt. En attendant, connecte-toi avec Steam si ton compte est lié.',au_demo:'Mode démo : les comptes sont enregistrés dans ce navigateur. Lance le serveur Node pour de vrais comptes.',au_server:'Connecté au serveur TICKRATE',au_steam_taken:'Ce compte Steam est déjà lié à un autre compte TICKRATE.',au_steam_err:'Connexion Steam annulée ou échouée.',au_steam_need_http:'Steam ne peut pas revenir vers un fichier local : ouvre le site via http (serveur Node, ou « npx serve » dans le dossier).',au_none:'Aucun',e_bad_username:'Pseudo invalide : 3 à 16 caractères, lettres, chiffres, _ . -',e_bad_email:'Adresse e-mail invalide.',e_pw_short:'Mot de passe trop court (8 caractères minimum).',e_pw_long:'Mot de passe trop long.',e_pw_weak:'Le mot de passe doit contenir au moins une lettre et un chiffre.',e_must_accept:'Tu dois accepter les conditions d\'utilisation.',e_username_taken:'Ce pseudo est déjà pris.',e_email_taken:'Un compte existe déjà avec cet e-mail.',e_bad_credentials:'Identifiant ou mot de passe incorrect.',e_too_many_attempts:'Trop d\'essais. Réessaie dans 15 minutes.',e_missing_fields:'Remplis tous les champs.',e_server_error:'Erreur du serveur, réessaie.',e_pw_mismatch:'Les mots de passe ne correspondent pas.',e_set_password_first:'Définis d\'abord un mot de passe pour pouvoir délier Steam.',e_network:'Impossible de joindre le serveur.',
 missions:'Missions du jour',ms_reset:'Nouvelles missions dans {x}',ms_play:'Joue {n} matchs',ms_win:'Gagne {n} matchs',ms_kills:'Fais {n} kills',ms_mvp:'Sois MVP d\'un match',ms_rating:'Finis un match avec un rating ≥ {n}',ms_adr:'Fais un match à {n} ADR ou plus',ms_lock:'Mission bonus avec PLUS',shop_kg:'Couteaux et gants',shop_kg_t:'Réservés aux abonnés : tout le catalogue avec PLUS.',see_plus:'Voir PLUS',
 stickers:'Stickers',stk_pick:'Choisir un sticker',stk_search:'Rechercher un sticker…',stk_all:'Tous',stk_paper:'Papier',stk_scrape:'Grattage',stk_remove:'Retirer',stk_empty:'Clique sur un emplacement pour poser un sticker.',stk_slot_plus:'Emplacements 2 à 4 : PLUS',mm_sort:'Tri par ELO',mm_sort_hint:'Désactivé : on accepte tous les niveaux pour trouver une partie plus vite',mm_off:'Désactivé · tous niveaux', map_reserve:'Réserve',sort_l:'Trier',sort_def:'Par groupe',sort_wr:'Mon win rate',sel_active:'Active Duty seulement',sel_all:'Tout',
 elo_gap:'Écart d\'ELO max',elo_gap_real:'Écart réel',mm_quality:'Qualité du matchmaking',
 f_mm_free:'Matchmaking : écart d\'ELO jusqu\'à ±400',f_mm_plus:'Matchmaking précis : écart ±250',f_mm_prem:'Matchmaking premium : écart ±150, joueurs à trust élevé',
 cmp_gap:'Écart d\'ELO maximum',cmp_trust:'Joueurs à trust élevé garantis',
 rk_tab_elo:'ELO',rk_tab_ladder:'Ladder hebdo',ladder_ends:'Fin dans {x}',ladder_rules:'Victoire +30 pts, défaite +10 pts, bonus de performance jusqu\'à +15. Chaque dimanche à 23 h 59, les mieux classés gagnent des Tick Coins.',
 ladder_rewards:'Récompenses de la semaine',your_points:'Tes points : {n} · #{r}',points:'Points',th_reward:'Récompense',
 shop_feat:'À la une',shop_pass:'Pass de combat',shop_coins:'Tick Coins',refresh_in:'Nouveaux objets dans {x}',buy:'Acheter',bought:'Acheté',not_enough:'Pas assez de Tick Coins',
 bought_toast:'{x} ajouté à ton casier',coins_added:'+{n} Tick Coins',bonus:'+{n} % offerts',
 pass_season:'Saison 1 · {n} paliers',pass_tier:'Palier {n}',pass_free:'Gratuit',pass_prem:'Pass premium',pass_buy:'Débloquer le pass premium · {x} TC',pass_owned:'Pass premium débloqué',
 claim:'Récupérer',claimed:'Récupéré',pass_hint:'Gagne de l\'XP à chaque match : victoire 120 XP, défaite 60 XP, MVP +40 XP.',xp_gain:'+{n} XP de pass · +{p} pts ladder',
 r_agent:'Agent',shop_hint:'Les objets achetés restent dans ton casier, même sans abonnement.',wallet:'Solde',days_s:'{d} j {h} h', nav_loadout:'Inventaire',nav_premium:'Premium',go_premium:'Passer Premium',
 lo_sub:'Choisis tes skins : ils sont appliqués sur nos serveurs dès ta prochaine partie.',src_inv:'Mon inventaire Steam',src_cat:'Catalogue PLUS',
 inv_hint:'Les skins que tu possèdes vraiment sur Steam : gratuit pour tout le monde.',cat_hint:'Tout le catalogue de skins, couteaux et gants est inclus dans PLUS et PREMIUM.',
 cat_pistol:'Pistolets',cat_rifle:'Fusils',cat_smg:'SMG',cat_knife:'Couteaux',cat_gloves:'Gants',cat_agents:'Agents',
 default_skin:'Par défaut',search_skin:'Rechercher un skin…',owned:'Possédé',equipped:'Équipé',equip:'Équiper',unequip:'Retirer',
 wear:'Usure (float)',seed:'Pattern (seed)',nametag:'Name tag',nametag_ph:'Ex : clutch king',team_l:'Côté',team_both:'T et CT',
 need_plus:'Nécessite PLUS',need_prem:'Nécessite PREMIUM',unlock_plus:'Débloquer avec PLUS',unlock_prem:'Débloquer avec PREMIUM',
 equipped_toast:'{x} équipé : tape !ws en jeu pour l\'appliquer',unequipped_toast:'Skin retiré',no_owned:'Tu ne possèdes aucun skin pour cette arme sur Steam.',
 agent_T:'Agent T',agent_CT:'Agent CT',agent_hint:'Les skins d\'agents sont réservés à PREMIUM.',apply_hint:'Ton casier est lié à ton SteamID. En jeu, tape !ws pour rafraîchir tes skins.',skins_count:'{n} skins',select_skin:'Sélectionne un skin',
 w_fn:'Neuve',w_mw:'Très peu usée',w_ft:'Testée sur le terrain',w_ww:'Usée',w_bs:'Marquée par les combats',
 pr_title:'Abonnements',pr_sub:'Le matchmaking est gratuit pour tout le monde. Un abonnement donne des drops plus fréquents, plus de personnalisation et des outils d\'analyse. Il ne donne aucun avantage en jeu.',
 monthly:'Mensuel',yearly:'Annuel',per_month:'/mois',per_year:'/an',billed_year:'soit {x} €/mois',
 plan_free:'Gratuit',plan_plus:'PLUS',plan_premium:'PREMIUM',plan_free_d:'Pour jouer en compétitif.',plan_plus_d:'Pour jouer avec tes skins préférés.',plan_prem_d:'Pour progresser et te démarquer.',
 current_plan:'Formule actuelle',choose:'Choisir {x}',popular:'Le plus complet',included:'Inclus',
 f_mm:'Matchmaking 5v5 et Wingman',f_stats:'ELO, niveau et stats de base',f_inv:'Skins de ton inventaire Steam',f_hist:'Historique des 20 derniers matchs',
 f_skins:'Tous les skins d\'armes',f_knives:'Couteaux et gants',f_st:'StatTrak™, name tags, float et pattern',f_badge_plus:'Badge PLUS sur ton profil',
 f_agents:'Skins d\'agents T et CT',f_review:'Analyse de match avancée',f_demo:'Téléchargement des démos',f_hist_unl:'Historique illimité',f_profile:'Pseudo doré et badge PREMIUM',f_support:'Support prioritaire',
 f_all_free:'Tout le gratuit, et :',f_all_plus:'Tout PLUS, et :',compare:'Comparer les formules',faq:'Questions fréquentes',
 q1:'Payer donne-t-il un avantage en jeu ?',a1:'Non : dans la partie, tout le monde est à égalité. Les abonnés ont un matchmaking plus précis (écart d\'ELO plus serré, joueurs plus fiables), des cosmétiques et des outils d\'analyse.',
 q2:'Comment mes skins apparaissent en jeu ?',a2:'Ton casier est lié à ton SteamID. Le plugin du serveur lit tes choix quand tu rejoins un match, ou quand tu tapes !ws.',
 q3:'Je peux résilier quand je veux ?',a3:'Oui, en un clic depuis cette page. Tu gardes tes avantages jusqu\'à la fin de la période payée.',
 checkout:'Récapitulatif',total:'Total',period_l:'Période',secure:'Paiement sécurisé par Stripe : ta carte est saisie sur la page Stripe, jamais sur TICKRATE.',pay:'Payer avec Stripe',paying:'Redirection…',
 welcome:'Bienvenue dans {x} !',cancel_sub:'Résilier',cancel_title:'Résilier ton abonnement ?',cancel_text:'Tu repasses en formule gratuite. Les skins du catalogue et tes agents seront retirés de ton casier.',cancel_ok:'Abonnement résilié',keep:'Garder',
 rv_title:'Analyse du match',rv_lock_t:'Analyse avancée · PREMIUM',rv_lock_d:'Timeline des rounds, heatmap de tes duels, duels d\'ouverture, clutchs, utilitaires et téléchargement de la démo.',
 rv_rounds:'Rounds',rv_open:'Duels d\'ouverture',rv_clutch:'Clutchs',rv_multi:'Multi-kills',rv_util:'Utilitaires',rv_heat:'Heatmap de tes duels',rv_noradar:'Pas de radar officiel pour cette map : positions approximatives.',rv_kills:'Tes kills',rv_deaths:'Tes morts',
 rv_won_lost:'{w} gagnés · {l} perdus',rv_he:'dégâts HE',rv_flash:'flashs décisives',rv_blind:'ennemis aveuglés',rv_demo:'Télécharger la démo (.dem)',rv_demo_t:'La démo sera disponible quand le vrai serveur enverra le fichier',rv_2d:'Revoir en 2D',
 rv_elim:'Élimination',rv_bomb:'Bombe',rv_defuse:'Désamorçage',rv_time:'Temps écoulé',rv_none:'aucun',rv_h1:'1re mi-temps',rv_h2:'2e mi-temps',rv_tip:'Conseil', veto_title:'Veto des maps',veto_turn:'Tour de {x}',veto_your:'À toi : bannis une map',veto_wait:'{x} choisit…',veto_by:'Bannie par {x}',veto_auto:'Temps écoulé : {m} bannie automatiquement',
 veto_done:'Map choisie : {m}',veto_pending:'Veto en cours',veto_hint:'Les capitaines bannissent chacun leur tour. La dernière map restante est jouée.',veto_banned:'{x} a banni {m}',
 ranking_title:'Classement',ranking_region:'Europe · 5v5 compétitif · mis à jour en direct',your_rank:'Ta position : #{n}',th_rank:'#',th_country:'Pays',th_wr:'Win rate',th_level:'Niv.', friends_title:'Amis',friends_online:'{n} en ligne sur {t}',recent_players:'Joueurs récents',recent_hint:'Joueurs croisés en match ces 7 derniers jours',no_recent:'Aucun joueur récent. Lance un match !',
 fr_tab_friends:'Mes Amis',fr_tab_requests:'Demandes reçues',fr_tab_sent:'Demandes envoyées',fr_tab_add:'Ajouter un ami',fr_tab_recent:'Joueurs récents',fr_my_code:'Mon Code Ami',fr_copy_code:'Copier mon code',fr_code_copied:'Code ami copié !',fr_copy_link:'Copier le lien d\'ami',fr_link_copied:'Lien d\'ami copié !',fr_filter_ph:'Rechercher parmi mes amis...',fr_add_title:'Ajouter un nouvel ami',fr_add_sub:'Trouve un joueur grâce à son pseudo exact ou son Code Ami à 6 chiffres.',fr_add_ph:'Entre un pseudo ou un Code Ami (ex: TR-248102)...',fr_search_btn:'Rechercher',fr_send_req:'+ Envoyer une demande',fr_empty_title:'Tu n\'as pas encore d\'amis ajoutés',fr_empty_sub:'Partage ton code ami avec tes contacts Discord/Steam ou recherche un joueur ci-dessous.',fr_no_req:'Aucune demande d\'ami en attente.',fr_no_sent:'Aucune demande d\'ami envoyée.',fr_accept:'Accepter',fr_decline:'Refuser',fr_accepted_toast:'{n} est maintenant dans tes amis !',fr_declined_toast:'Demande de {n} refusée.',fr_remove:'Retirer de mes amis',fr_remove_confirm:'Retirer {n} de tes amis ?',fr_removed_toast:'{n} a été retiré de tes amis.',fr_already:'Ce joueur est déjà dans ta liste d\'amis.',fr_already_req:'Une demande d\'ami est déjà en attente pour {n}.',fr_self:'C\'est ton propre profil !',fr_not_found:'Aucun joueur trouvé avec ce pseudo ou Code Ami.',fr_req_sent_to:'Demande d\'ami envoyée à {n} !',fr_inv_banner:'{n} t\'invite à rejoindre son groupe ({m})',fr_inv_join:'Rejoindre le salon',fr_inv_decline:'Refuser',fr_status_ingame_map:'En match · {m}',pl_modal_title:'Inviter dans le salon',pl_modal_sub:'{m} · {c}/{max} joueurs',pl_link_box_t:'Lien d\'invitation direct',pl_link_box_h:'Envoie ce lien : en cliquant dessus, ton ami arrive directement dans ton salon.',pl_friends_box_t:'Mes amis connectés',pl_no_online:'Aucun ami en ligne pour le moment. Copie le lien ci-dessus ou ajoute des amis !',pl_btn_inv:'+ Inviter',pl_btn_in:'Dans le salon',pl_btn_invited:'Invité',pl_quick_ph:'Inviter par pseudo ou Code Ami...',
 st_online:'En ligne',st_ingame:'En match',st_offline:'Hors ligne',view_profile:'Profil',invite_party:'Inviter',in_party:'Dans le groupe',party_full:'Groupe complet',not_available:'Indisponible',
 no_friend_avail:'Aucun ami en ligne disponible',add_friend:'Ajouter en ami',friend_sent:'Demande envoyée',friend_sent_toast:"Demande d'ami envoyée à {n}",is_friend:'Ami',back:'Retour',
 played_with:'Dernier match ensemble : {d}',never_played:'Jamais joué ensemble',
 rep_need_match:'Tu ne peux signaler que des joueurs croisés en match ces 7 derniers jours',rep_cooldown:'Déjà signalé : prochain report possible dans {x}',rep_daily:'Limite atteinte : 5 reports par 24 h',
 reports_left:'{n}/5 reports restants (24 h)',dur_d:'{n} j', ban_title:'Ban temporaire du matchmaking',ban_find:'BANNI · {x}',ban_level:'Sanction {n}/4 sur 7 jours · prochaine : {x}',ban_level_max:'Sanction maximale atteinte ({x})',
 ban_applied:'Ban de {x} : {r}',ban_over:'Ban terminé, tu peux rejouer',ban_blocked:'Tu es banni du matchmaking encore {x}',ban_lift:'Lever le ban (démo)',ban_lifted:'Ban levé (démo)',ban_ends:'restant',
 ban_r_afk_accept:'Match non accepté (AFK)',ban_r_declined:'Match refusé',ban_r_left:'Lobby quitté, match annulé',ban_r_afk_match:'AFK pendant le match',
 dur_min:'{n} min',dur_h:'{n} h',decline:'REFUSER LE MATCH',decline_warn:'Refuser en compétitif = ban de {x}',
 leave_title:'Quitter le lobby ?',leave_text:'En compétitif, quitter <b>annule le match pour tous les joueurs</b>. Tu recevras un ban temporaire de <b>{x}</b>.',leave_confirm:'Quitter quand même',stay:'Rester',
 sim_afk:'Simuler un AFK (démo)',afk_penalty:'Exclu pour AFK : −{e} ELO et ban de {x}',
 sanctions:'Sanctions',sanctions_none:'Aucune sanction récente.',sanctions_rule:'Paliers sur 7 jours glissants : 5 min → 30 min → 2 h → 24 h. Uniquement en compétitif (5v5 classé et Wingman).',
 status_active:'En cours',status_done:'Terminé',th_reason:'Motif',th_duration:'Durée',th_status:'Statut',san_clean:'Aucun ban actif',offenses:'{n} sur 7 jours',casual_free:'Mode non classé : pas de sanction',language:'Langue',nav_play:'Jouer',nav_profile:'Profil',nav_ranking:'Classement',nav_shop:'Boutique',nav_friends:'Amis',notifications:'Notifications',online:'en ligne',my_profile:'Mon profil',
 searching_banner:"Recherche d'un match",cancel:'Annuler',your_team:'Ton équipe',avg_elo:'ELO moy.',in_queue:'En file',est_wait:'Attente estimée',anticheat:'Anti-cheat actif',
 map_pool:'Pool de maps',maps_selected:'{n}/{t} sélectionnées',match_ready:'Match prêt',leave_lobby:'Quitter le lobby',server:'Serveur',mode:'Mode',win_chance:'Chances de victoire',
 perf_note:"",connect:'CONNECTER',
 simulate:'Terminer la partie',match_running:'MATCH EN COURS…',play_again:'REJOUER',see_profile:'Voir mon profil',
 get_ready:'PRÉPARE-TOI',match_found:'MATCH TROUVÉ',waiting_players:'En attente des joueurs…',accept:'ACCEPTER',accepted:'ACCEPTÉ',n_accepted:'{n}/{t} joueurs ont accepté',
 all_ready:'Tous les joueurs sont prêts !',declined:'Un joueur a refusé le match',requeue:"Un joueur n'a pas accepté, retour en file prioritaire",match_cancelled:'Match annulé',
 not_accepted:'Match non accepté, tu as été retiré de la file',
 m_ranked_tag:'CLASSÉ',m_ranked:'5v5 Compétitif',m_ranked_d:'MR15 · 128 tick · Impact ELO',m_casual_tag:'PUG',m_casual:'5v5 Non classé',m_casual_d:'128 tick · Sans impact ELO',
 m_wing_tag:'DUO',m_wing:'2v2 Wingman',m_wing_d:'Maps réduites · MR8 · Impact ELO',
 m_duel_tag:'1v1 AIM',m_duel:'1v1 Aim Arena',m_duel_d:'Duels rapides 1v1 sur cartes Aim · 128-tick · MR9',
 shop_cards:'Cartes de profil',shop_bgs:'Fonds de profil',lg_top_cards_title:'Profils de la division',sh_open_bgs:'Fonds de profil',sh_open_cards:'Cartes de profil',sh_promo_badge:'',sh_dev_all_unlocked:'Accès Développeur Total · Tout est débloqué pour test',bg_equipped:'Fond de profil « {n} » équipé !',se_need_buy:'Débloque d\'abord cet élément.',sh_dev_card_access:'Accès développeur complet · Débloqué pour test',
 m_dz_tag:'SURVIE',m_dz:'Danger Zone',m_dz_d:'16–18 joueurs · Règles CS:GO · Serveurs dédiés',m_dz_soon:'FUTUR MODE',r_EU:'Europe',r_NA:'Amérique',r_AS:'Asie',
 remove:'Retirer',leader:'Chef de groupe',teammate:'Coéquipier',invite:'Inviter',searching_btn:'RECHERCHE',click_cancel:'Cliquer pour annuler',find_match:'TROUVER UN MATCH',
 locked:'Annule la recherche pour modifier',keep_map:'Garde au moins une map',left_party:'{n} a quitté le groupe',joined_party:'{n} a rejoint le groupe',search_cancelled:'Recherche annulée',
 link_to_search:'Lie ton compte Steam pour lancer une recherche',
 you:'Toi',your_party:'Ton groupe',captain:'Capitaine',player:'Joueur',team_avg:'{n} ELO moy.',unranked_match:'Match non classé',win:'Victoire',loss:'Défaite',
 left_lobby:'Tu as quitté le lobby',copied:'Commande copiée : {x}',
 victory:'VICTOIRE',defeat:'DÉFAITE',rounds:'{n} ROUNDS',your_elo:'Ton ELO',transparent:'Calcul transparent',base:'Base',vs_level:'selon le niveau adverse',rating:'Rating',
 multiplier:'Multiplicateur',perf_bonus:'bonus de perf',perf_malus:'malus de perf',perf_low:'perf faible',loss_reduced:'pertes réduites',mvp_title:'MVP du match',best_rating:'meilleur rating',
 your_team_s:'Ton équipe',enemy_team:'Équipe adverse',level_n:'Niveau {n}',level_max:'Niveau max',to_next:'{x} ELO avant niv. {n}',
 steam_linked:'Compte Steam lié',unlink:'Délier',no_steam:'Aucun compte Steam lié',steam_login:'Se connecter avec Steam',google_login:'Continuer avec Google',au_google_reg:'S\'inscrire avec Google',google_connecting:'Connexion Google en cours...',au_google_err:'Connexion Google annulée ou échouée.',
 member_since:'Membre depuis {d} · Serveur favori : EU-Frankfurt',since_date:'mars 2024',link_title:'Lie ton compte Steam',
 link_text:'Ton profil, tes stats et ton ELO sont rattachés à ton SteamID.<br>La connexion passe par Steam (OpenID) : on ne voit jamais ton mot de passe.',
 t_matches:'Matchs',total:'au total',peak:'pic {n}',t_winrate:'Win rate',wl:'{w}V / {l}D',kills:'{n} kills',headshots:'headshots',dmg_round:'dégâts / round',average:'moyenne',
 t_streak:'Série',max_wins:'victoires max',elo_evo:"Évolution de l'ELO",last_n:'{n} derniers matchs',map_stats:'Stats par map',winrate_s:'win rate',m_short:'{n} m.',
 history:'Historique des matchs',th_date:'Date',th_res:'Rés.',th_map:'Map',th_score:'Score',th_player:'Joueur',w:'V',l:'D',
 show_more:'Afficher plus',show_less:'Réduire',showing:'{a} sur {b} matchs',
 steam_unlinked:'Compte Steam délié',steam_connecting:'Connexion à Steam…',steam_linked_toast:'Compte Steam lié',soon:'Bientôt disponible',lang_changed:'Langue : Français',
 trust:'Trust factor',trust_pool:'File trust',pool_pill:'File : {x}',tier_high:'Élevé',tier_mid:'Moyen',tier_low:'Bas',tier_vlow:'Très bas',
 pool_lowered:'{n} a un trust {x} : ton groupe joue dans la file {x}',
 tf_reports:'<b>{r}</b> reports reçus sur <b>{m}</b> matchs',tf_formula:'Calcul : {f}',tf_example:'Exemple : 2 reports sur 10 matchs → −2 → trust 8/10',
 tf_pool_text:'Tu es placé avec et contre des joueurs du même niveau de trust (<b>{x}</b>). Les joueurs souvent signalés jouent entre eux.',
 tf_by_reason:'Reports par motif',tf_demo:'+1 report (démo)',tf_demo_done:'Report de test ajouté : trust {a} → {b}',
 report:'Signaler',report_title:'Signaler un joueur',r_cheat:'Triche',r_toxic:'Comportement toxique',r_grief:'AFK / sabotage',r_smurf:'Smurf',
 report_note_ph:'Détails (facultatif) : round, situation…',report_hint:'Anti-abus : 1 report par joueur tous les 7 jours, 5 reports max par 24 h, uniquement des joueurs croisés en match. Chaque report baisse le trust selon le nombre de matchs du joueur.',
 send_report:'Envoyer le report',choose_reason:'Choisis un motif',report_sent:'Report envoyé. Trust de {n} : {a} → {b}',already_reported:'Tu as déjà signalé ce joueur pour ce match',
 trust_short:'Trust',matches_n:'{n} matchs',
 edit_profile:'Personnaliser',customize:'Personnaliser le profil',avatar_l:'Photo de profil',banner_l:'Bannière',upload:'Importer une image',reset:'Réinitialiser',save:'Enregistrer',
 saved:'Profil mis à jour',banner_default:'Défaut',upload_hint:'Les images importées sont redimensionnées et gardées dans ce navigateur.',img_error:"Impossible de lire cette image",store_error:"Image trop lourde pour être gardée après rechargement",
 name_cd_ok:'Modifiable (1× / 7 j)',name_cd_lock:'Verrouillé · {x}',name_cd_hint:'3 à 16 caractères (lettres, chiffres, _ . -). Un changement de pseudo verrouille le suivant pendant 7 jours.',name_cd_wait:'Tu as déjà modifié ton pseudo récemment. Prochain changement possible dans {x}.',name_changed:'Pseudo modifié en « {n} » (verrouillé 7 jours)',
 nav_leagues:'Ligues & Teams',map_casual:'Classiques & Fun (Non classé)',comp_only_active:'{m} est jouable uniquement en 5v5 Non classé (hors rotation compétitive)'},

en:{
 nav_settings:'Settings',st_account:'Account',st_audio:'Audio & voice',st_notif:'Notifications',st_ui:'Interface',st_privacy:'Privacy',st_profile:'Profile',st_edit_profile:'Edit name, avatar and banner',st_name_cd:'Your username can be changed once every 7 days.',st_login:'Sign-in',st_default:'Default (system)',st_mic:'Microphone',st_out:'Output',st_input:'Microphone (input)',st_output:'Headset / speakers (output)',st_in_vol:'Microphone volume',st_out_vol:'Other players\' volume',st_no_sink:'Your browser cannot pick an output: it uses the Windows one.',st_need_mic:'Run the microphone test once to see your device names.',st_devices:'Devices',st_test_out:'Test output',st_test_out_h:'Plays a short sound on the selected headset',st_play:'Play',st_mic_test:'Microphone test',st_vad:'Sensitivity',st_vad_h:'Orange line: above it, you count as talking.',st_stop:'Stop',st_hear_me:'Hear myself (use a headset)',st_mic_test_go:'Test my microphone',st_mode:'Talk mode',st_ptt_key:'Push-to-talk key',st_ptt_key_h:'Click, then press the key you want (Esc to cancel)',st_processing:'Voice processing',st_ns:'Noise suppression',st_ns_h:'Filters keyboard, mouse and background noise',st_ec:'Echo cancellation',st_ec_h:'Useful if you play without a headset',st_agc:'Automatic gain',st_agc_h:'Evens out your volume when you talk louder or softer',st_sounds:'Site sounds',st_sounds_h:'Match found, messages, interface beeps',st_dm:'Private messages',st_dm_h:'Alert me when a friend writes',st_desk:'Desktop notifications',st_desk_h:'Even when the tab is in the background',st_desk_denied:'Notifications blocked by the browser',st_rm:'Reduce animations',st_rm_h:'Turns off site animations and transitions',st_online:'Show my online status',st_online_h:'Friends see when you are online',st_dmf:'Private messages: friends only',st_dmf_h:'Other players cannot message you',st_pub:'Public profile',st_pub_h:'Everyone can see your stats and history',st_saved:'Setting saved',st_all_audio:'All audio settings',
 fb_synced:'synced {x}',fb_pending:'pending',
 vc_empty:'nobody yet',vc_none:'Nobody in this channel. Join it to start talking.',vc_mate:'Team',vc_foe:'Opponent',vc_mute_p1:'Mute',vc_unmute_p:'Unmute',vc_game_t:'During the match: CS:GO voice',vc_game_rounds:'During rounds you hear your team; between rounds (round end and freeze time) both teams hear each other, like in old CS:GO.',vc_game_alltalk:'Everyone hears everyone for the whole match (alltalk).',vc_game_team:'Team only; everyone talks during warmup and halftime.',
 rep_msg:'Report this message',rep_done:'Message already reported',rep_sent:'Message from {n} reported to moderation',rep_limit:'Report limit reached for this match',lvup_k:'RANK UP',lvup_t:'New rank: {n}',lvup_next:'Next rank: {n} at {e} ELO',lvup_max:'Top rank: next stop, the Pro League',lvup_close:'Click to continue',
 rs_play:'Play',rs_items:'Items',rs_social:'Social',ps_ph:'Search for a player…',ps_none:'No player found',leave_guard:'You are in a match room: leave the page?',
 launch_hint:'Opens CS:GO and connects you directly, whether the game is open or closed',copy_cmd:'Copy',copied_cmd:'Command copied: in CS:GO, open the console (~), paste (Ctrl+V) then Enter',ip_open_hint:'Nothing happens? Copy the command and paste it into the game console (~)',
 cp_teamlg:'Team leagues',tn_need_team_lg:'Create your 5v5 team in the Team leagues tab to register',
 pp_pro:'Pro League · world rank #{n}',pp_elite:'Elite league · 2400+ ELO',
 place2:'2nd',place3:'3rd',tn_placed:'Your team finishes {p} in {n}: +{x}',
 nav_comp:'Compete',cp_title:'Competition',cp_leagues:'Leagues',cp_tourneys:'Tournaments',cp_teams:'My team',lg_season:'Season {n}',lg_ends:'ends in {d} d',lg_div:'Division {d}',lg_mine:'My division',lg_div_empty:'No players in this division yet.',lg_next:'{n} ELO to {x}',lg_top:'Highest league: aim for the Pro League',lg_your_div:'Your division',lg_up:'Promotion zone',lg_down:'Relegation zone',lg_rewards:'End of season rewards',lg_dist:'Player distribution',lg_pro:'Pro League',lg_pro_t:'The top 20 players of the ranking (Global Elite).',lg_world:'Best in the world',lg_all:'World',lg_badge:'badge + banner',lg_you_pro:'You are in the Pro League!',tn_all:'All',tn_open:'Open',tn_live:'Live',tn_done:'Finished',tn_mine:'Mine',tn_create:'Create a tournament',tn_official:'Official',tn_comm:'Community',tn_by:'by {n}',tn_teams:'Teams',tn_start:'Start',tn_entry:'Entry',tn_free:'Free',tn_minlvl:'Min ELO',tn_none:'No tournaments here yet.',tn_prize:'Prize pool',tn_back:'← Tournaments',tn_reg:'Register my team',tn_unreg:'Unregister',tn_registered:'Team registered',tn_need_team:'Create a 5-player team to register',tn_need5:'Your team needs at least 5 players',tn_need_cap:'Only the captain can register the team',tn_elo_low:'Team average ELO too low ({n} min.)',tn_full:'Full',tn_participants:'Registered teams',tn_bracket:'Bracket',tn_round:'Round {n}',tn_final:'Final',tn_semi:'Semi-finals',tn_quarter:'Quarter-finals',tn_launch:'Start tournament (demo)',tn_next:'Play next round (demo)',tn_champion:'Champion',tn_rules:'Rules',tn_format:'Format',tn_single:'Single elimination · BO1, BO3 final',tn_status_open:'Registration open',tn_status_live:'Live',tn_status_done:'Finished',tn_status_fund:'Prize pool to deposit',tn_fund:'Deposit the prize pool ({x})',tn_funded:'Prize pool deposited: tournament published',tn_f_name:'Tournament name',tn_f_size:'Number of teams',tn_f_date:'Date and time',tn_f_region:'Region',tn_f_minelo:'Minimum average ELO',tn_f_entry:'Entry fee (Tick Coins, 0 = free)',tn_f_prize_type:'Reward type',tn_f_cash:'Cash prize (€)',tn_f_tc:'Tick Coins',tn_f_prize:'Prize pool amount',tn_f_split:'Split',tn_f_rules:'Rules (optional)',tn_f_legal:'I commit to follow video game competition regulations',tn_legal:'<b>Cash prize:</b> the organizer deposits the prize pool upfront and it stays locked until the tournament ends, so winners are guaranteed to be paid. In France, a cash prize competition must be declared to the ministry between 1 year and 30 days before; above €10,000 a payment guarantee is mandatory; no cash prizes for under-12s, and part of under-16 winnings goes to the Caisse des dépôts.',tn_e_name:'Name: 4 to 40 characters',tn_e_date:'Pick a date at least 30 min in the future',tn_e_prize:'Invalid prize amount',tn_e_legal:'Tick the regulation commitment',tn_created:'Tournament created!',tn_created_cash:'Tournament created: deposit the prize pool to publish it.',tn_won:'Your team wins {n}! +{x}',tn_reg_toast:'{t} registered for {n}',tn_out:'Your team is out of {n}.',tn_cancel_reg:'Registration cancelled (refunded)',split_wta:'Winner takes all',split_top2:'1st 70% · 2nd 30%',split_top4:'1st 50% · 2nd 25% · 3rd-4th 12.5%',place:'{n}th',place1:'1st',team_create:'Create my team',team_name:'Team name',team_tag:'Tag (2 to 5 characters)',team_color:'Color',team_e_name:'Name: 3 to 24 characters',team_e_tag:'Tag: 2 to 5 letters or digits',team_avg:'Average ELO',team_members:'Players',team_record:'Tournaments',team_captain:'Captain',team_player:'Player',team_sub:'Substitute',team_kick:'Kick',team_leave:'Leave team',team_disband:'Disband team',team_invite:'Invite friends',team_invited:'Invite sent to {n}',team_joined:'{n} joined {t}',team_full:'Team full (7 players max)',team_none_inv:'No online friends to invite',team_intro:'A fixed team of 5 players (+2 subs) to enter tournaments.',team_created:'Team {n} created!',team_left:'You left the team',team_in_t:'Registered for {n} tournament(s)',
 vc:'Voice',vc_join:'Join voice',vc_leave:'Leave',vc_all:'All',vc_team:'Team',vc_open:'Open mic',vc_ptt:'Push to talk',vc_mute:'Mute mic',vc_deaf:'Deafen',vc_in:'{n} in voice',vc_ingame:'The match is starting: voice moves in-game (alltalk enabled on the server).',vc_denied:'Microphone blocked: allow it in your browser.',vc_nomic:'No microphone found.',vc_err:'Could not enable the microphone.',vc_demo:'Demo: your mic is real, other players\' voices are simulated. Online, audio goes straight between players (WebRTC).',vc_mute_p:'Click a player\'s icon to mute them',
 chat:'Chat',ch_team:'Team',ch_all:'All',ch_team_to:'[Team]',ch_all_to:'[All]',chat_ph_team:'Message your team…',chat_ph_all:'Message everyone…',chat_slow:'Slow down, you are sending too many messages.',sys_ban:'{x} banned {m}',sys_pick:'The map will be {m}',sys_live:'Everyone is connected, have a good game!',sys_welcome:'Welcome to the room. Stay respectful: messages can be reported.',messages:'Messages',dm_title:'Messages',dm_empty:'No friends yet',dm_none:'No messages yet',dm_ph:'Message {n}…',dm_off_note:'{n} is offline: they will see your message next time they log in.',dm_new:'{n}: {x}',dm_btn:'Message',today:'Today',st_writing:'typing…',
 n_read_all:'Mark all as read',n_clear:'Clear',n_empty:'No notifications',n_now:'just now',n_min:'{n} min ago',n_h:'{n} h ago',n_d:'{n} d ago',n_win:'Win on {m} ({s}) · {d} ELO',n_loss:'Loss on {m} ({s}) · {d} ELO',n_tier:'Battle pass: tier {n} reached! Claim your reward.',n_mission:'Mission complete: {x}. Claim your XP.',n_ban:'{x} ban: {r}',n_prio_kick:'{n} did not join: match cancelled, you have priority.',n_season:'Battle pass season 1 is live: 30 tiers to unlock.',n_shop_new:'New items in the shop.',n_friend_on:'{n} is online.',vs_us:'Your team win rate',vs_them:'Enemy win rate',vs_us_s:'Us',vs_them_s:'Them',vs_rec:'Ban this',vs_tip:'Us: {a} ({pa} matches) · Them: {b} ({pb} matches)',
 connected_btn:'Connected',
 decline_free:'No penalty: you just leave the queue',declined_free:'Match declined: no penalty, you left the queue.',not_accepted_free:'Match not accepted: you were removed from the queue.',prio:'Priority',prio_requeue:'A player did not accept: you are back at the front of the queue.',connected_srv:'Connected to the server',joining_srv:'Launching CS:GO and connecting to the server…',join_title:'Join the server',join_n:'{n}/{t} connected',join_me:'Click CONNECT',join_all:'Everyone is connected: the match is starting!',join_wait_all:'Waiting for every player to join the server',join_kick:'{n} did not join the server: kicked and banned for {x}. Match cancelled, you are back at the front of the queue.',join_kick_me:'You did not join the server in time: kicked from the match, {x} ban.',ban_r_no_show:'No-show at match start',
 au_title:'Competitive 5v5, done right.',au_sub:'128-tick servers, ELO based on your performance, trust factor and anti-cheat. Create your account, link Steam and play your first match.',au_b1:'tick on every server',au_b2:'that tracks real performance, not just wins',au_b3:'anti-cheat and trust factor on',au_login:'Log in',au_register:'Sign up',au_welcome:'Welcome back',au_id:'Email or username',au_pw:'Password',au_pw2:'Confirm password',au_remember:'Stay signed in',au_forgot:'Forgot password?',au_login_btn:'Log in',au_or:'or',au_no_acc:'No account yet?',au_have_acc:'Already registered?',au_create:'Create your account',au_user:'Username',au_user_h:'3 to 16 chars: letters, digits, _ . -',au_mail:'Email',au_cgu:'I accept the terms of use and the privacy policy',au_create_btn:'Create my account',au_steam_reg:'Sign up with Steam',au_settings:'Account settings',au_logout:'Log out',au_logged_out:'Logged out',au_hello:'Welcome, {n}!',au_created:'Account created. Link your Steam account to play.',au_r_len:'8 characters',au_r_let:'1 letter',au_r_num:'1 digit',au_since:'Member since',au_change_pw:'Change password',au_set_pw:'Set a password',au_pw_cur:'Current password',au_pw_new:'New password',au_pw_saved:'Password changed',au_save:'Save',au_forgot_t:'Email reset is coming soon. Meanwhile, sign in with Steam if your account is linked.',au_demo:'Demo mode: accounts are stored in this browser. Run the Node server for real accounts.',au_server:'Connected to the TICKRATE server',au_steam_taken:'This Steam account is already linked to another TICKRATE account.',au_steam_err:'Steam sign-in cancelled or failed.',au_steam_need_http:'Steam cannot return to a local file: open the site over http (Node server, or “npx serve” in the folder).',au_none:'None',e_bad_username:'Invalid username: 3 to 16 chars, letters, digits, _ . -',e_bad_email:'Invalid email address.',e_pw_short:'Password too short (8 characters minimum).',e_pw_long:'Password too long.',e_pw_weak:'Password needs at least one letter and one digit.',e_must_accept:'You must accept the terms of use.',e_username_taken:'This username is taken.',e_email_taken:'An account already uses this email.',e_bad_credentials:'Wrong login or password.',e_too_many_attempts:'Too many attempts. Try again in 15 minutes.',e_missing_fields:'Fill in every field.',e_server_error:'Server error, please retry.',e_pw_mismatch:'Passwords do not match.',e_set_password_first:'Set a password first so you can unlink Steam.',e_network:'Cannot reach the server.',
 missions:'Daily missions',ms_reset:'New missions in {x}',ms_play:'Play {n} matches',ms_win:'Win {n} matches',ms_kills:'Get {n} kills',ms_mvp:'Be MVP of a match',ms_rating:'Finish a match with a rating ≥ {n}',ms_adr:'Play a match with {n}+ ADR',ms_lock:'Bonus mission with PLUS',shop_kg:'Knives and gloves',shop_kg_t:'Subscribers only: the full catalog comes with PLUS.',see_plus:'See PLUS',
 stickers:'Stickers',stk_pick:'Pick a sticker',stk_search:'Search stickers…',stk_all:'All',stk_paper:'Paper',stk_scrape:'Scrape',stk_remove:'Remove',stk_empty:'Click a slot to apply a sticker.',stk_slot_plus:'Slots 2 to 4: PLUS',mm_sort:'ELO sorting',mm_sort_hint:'Off: any skill level is accepted so you find a match faster',mm_off:'Off · any level', map_reserve:'Reserve',sort_l:'Sort',sort_def:'By group',sort_wr:'My win rate',sel_active:'Active Duty only',sel_all:'All',
 elo_gap:'Max ELO gap',elo_gap_real:'Actual gap',mm_quality:'Matchmaking quality',
 f_mm_free:'Matchmaking: ELO gap up to ±400',f_mm_plus:'Precise matchmaking: ±250 gap',f_mm_prem:'Premium matchmaking: ±150 gap, high-trust players',
 cmp_gap:'Max ELO gap',cmp_trust:'Guaranteed high-trust players',
 rk_tab_elo:'ELO',rk_tab_ladder:'Weekly ladder',ladder_ends:'Ends in {x}',ladder_rules:'Win +30 pts, loss +10 pts, performance bonus up to +15. Every Sunday at 11:59 PM, top players earn Tick Coins.',
 ladder_rewards:'This week’s rewards',your_points:'Your points: {n} · #{r}',points:'Points',th_reward:'Reward',
 shop_feat:'Featured',shop_pass:'Battle pass',shop_coins:'Tick Coins',refresh_in:'New items in {x}',buy:'Buy',bought:'Owned',not_enough:'Not enough Tick Coins',
 bought_toast:'{x} added to your loadout',coins_added:'+{n} Tick Coins',bonus:'+{n}% bonus',
 pass_season:'Season 1 · {n} tiers',pass_tier:'Tier {n}',pass_free:'Free',pass_prem:'Premium pass',pass_buy:'Unlock premium pass · {x} TC',pass_owned:'Premium pass unlocked',
 claim:'Claim',claimed:'Claimed',pass_hint:'Earn XP every match: win 120 XP, loss 60 XP, MVP +40 XP.',xp_gain:'+{n} pass XP · +{p} ladder pts',
 r_agent:'Agent',shop_hint:'Purchased items stay in your loadout, even without a subscription.',wallet:'Balance',days_s:'{d}d {h}h', nav_loadout:'Inventory',nav_premium:'Premium',go_premium:'Go Premium',
 lo_sub:'Pick your skins: they apply on our servers from your next match.',src_inv:'My Steam inventory',src_cat:'PLUS catalog',
 inv_hint:'Skins you actually own on Steam: free for everyone.',cat_hint:'The full catalog of skins, knives and gloves is included in PLUS and PREMIUM.',
 cat_pistol:'Pistols',cat_rifle:'Rifles',cat_smg:'SMGs',cat_knife:'Knives',cat_gloves:'Gloves',cat_agents:'Agents',
 default_skin:'Default',search_skin:'Search skins…',owned:'Owned',equipped:'Equipped',equip:'Equip',unequip:'Unequip',
 wear:'Wear (float)',seed:'Pattern seed',nametag:'Name tag',nametag_ph:'e.g. clutch king',team_l:'Side',team_both:'T & CT',
 need_plus:'Requires PLUS',need_prem:'Requires PREMIUM',unlock_plus:'Unlock with PLUS',unlock_prem:'Unlock with PREMIUM',
 equipped_toast:'{x} equipped: type !ws in game to apply it',unequipped_toast:'Skin removed',no_owned:'You don’t own any skin for this weapon on Steam.',
 agent_T:'T agent',agent_CT:'CT agent',agent_hint:'Agent skins are PREMIUM only.',apply_hint:'Your loadout is tied to your SteamID. In game, type !ws to refresh your skins.',skins_count:'{n} skins',select_skin:'Select a skin',
 w_fn:'Factory New',w_mw:'Minimal Wear',w_ft:'Field-Tested',w_ww:'Well-Worn',w_bs:'Battle-Scarred',
 pr_title:'Subscriptions',pr_sub:'Matchmaking is free for everyone. A subscription gives more frequent drops, more customisation and analysis tools. It gives no in-game advantage.',
 monthly:'Monthly',yearly:'Yearly',per_month:'/mo',per_year:'/yr',billed_year:'{x} €/mo billed yearly',
 plan_free:'Free',plan_plus:'PLUS',plan_premium:'PREMIUM',plan_free_d:'To play competitive.',plan_plus_d:'To play with your favorite skins.',plan_prem_d:'To improve and stand out.',
 current_plan:'Current plan',choose:'Get {x}',popular:'Most complete',included:'Included',
 f_mm:'5v5 and Wingman matchmaking',f_stats:'ELO, level and basic stats',f_inv:'Skins from your Steam inventory',f_hist:'Last 20 matches history',
 f_skins:'Every weapon skin',f_knives:'Knives and gloves',f_st:'StatTrak™, name tags, float and pattern',f_badge_plus:'PLUS badge on your profile',
 f_agents:'T and CT agent skins',f_review:'Advanced match analysis',f_demo:'Demo downloads',f_hist_unl:'Unlimited history',f_profile:'Gold name and PREMIUM badge',f_support:'Priority support',
 f_all_free:'Everything in Free, plus:',f_all_plus:'Everything in PLUS, plus:',compare:'Compare plans',faq:'FAQ',
 q1:'Does paying give an in-game advantage?',a1:'No: inside the match everyone is equal. Subscribers get more precise matchmaking (tighter ELO gap, more reliable players), cosmetics and analysis tools.',
 q2:'How do my skins show up in game?',a2:'Your loadout is tied to your SteamID. The server plugin reads your choices when you join a match, or when you type !ws.',
 q3:'Can I cancel anytime?',a3:'Yes, in one click from this page. You keep your perks until the end of the paid period.',
 checkout:'Checkout',total:'Total',period_l:'Billing',secure:'Secure payment by Stripe: you enter your card on Stripe’s page, never on TICKRATE.',pay:'Pay with Stripe',paying:'Redirecting…',
 welcome:'Welcome to {x}!',cancel_sub:'Cancel',cancel_title:'Cancel your subscription?',cancel_text:'You go back to the free plan. Catalog skins and agents will be removed from your loadout.',cancel_ok:'Subscription cancelled',keep:'Keep it',
 rv_title:'Match analysis',rv_lock_t:'Advanced analysis · PREMIUM',rv_lock_d:'Round timeline, duel heatmap, opening duels, clutches, utility and demo download.',
 rv_rounds:'Rounds',rv_open:'Opening duels',rv_clutch:'Clutches',rv_multi:'Multi-kills',rv_util:'Utility',rv_heat:'Your duel heatmap',rv_noradar:'No official radar for this map: approximate positions.',rv_kills:'Your kills',rv_deaths:'Your deaths',
 rv_won_lost:'{w} won · {l} lost',rv_he:'HE damage',rv_flash:'flash assists',rv_blind:'enemies flashed',rv_demo:'Download demo (.dem)',rv_demo_t:'The demo will be available once the real server uploads the file',rv_2d:'2D replay',
 rv_elim:'Elimination',rv_bomb:'Bomb',rv_defuse:'Defuse',rv_time:'Time ran out',rv_none:'none',rv_h1:'1st half',rv_h2:'2nd half',rv_tip:'Tip', veto_title:'Map veto',veto_turn:'{x}’s turn',veto_your:'Your turn: ban a map',veto_wait:'{x} is choosing…',veto_by:'Banned by {x}',veto_auto:'Time’s up: {m} banned automatically',
 veto_done:'Map picked: {m}',veto_pending:'Veto in progress',veto_hint:'Captains take turns banning. The last remaining map is played.',veto_banned:'{x} banned {m}',
 ranking_title:'Leaderboard',ranking_region:'Europe · 5v5 competitive · live',your_rank:'Your rank: #{n}',th_rank:'#',th_country:'Country',th_wr:'Win rate',th_level:'Lvl', friends_title:'Friends',friends_online:'{n} online of {t}',recent_players:'Recent players',recent_hint:'Players you met in a match in the last 7 days',no_recent:'No recent players. Start a match!',
 fr_tab_friends:'Friends',fr_tab_requests:'Requests received',fr_tab_sent:'Requests sent',fr_tab_add:'Add a friend',fr_tab_recent:'Recent players',fr_my_code:'My Friend Code',fr_copy_code:'Copy code',fr_code_copied:'Friend code copied!',fr_copy_link:'Copy invite link',fr_link_copied:'Friend link copied!',fr_filter_ph:'Search friends...',fr_add_title:'Add a new friend',fr_add_sub:'Find a player with their exact username or 6-digit Friend Code.',fr_add_ph:'Enter a username or Friend Code (e.g. TR-248102)...',fr_search_btn:'Search',fr_send_req:'+ Send friend request',fr_empty_title:'No friends added yet',fr_empty_sub:'Share your friend code with your Discord/Steam contacts or find a player below.',fr_no_req:'No pending friend requests.',fr_no_sent:'No outgoing friend requests.',fr_accept:'Accept',fr_decline:'Decline',fr_accepted_toast:'{n} is now your friend!',fr_declined_toast:'Request from {n} declined.',fr_remove:'Remove friend',fr_remove_confirm:'Remove {n} from your friends?',fr_removed_toast:'{n} removed from friends.',fr_already:'This player is already your friend.',fr_already_req:'A friend request is already pending for {n}.',fr_self:'This is your own profile!',fr_not_found:'No player found with this username or code.',fr_req_sent_to:'Friend request sent to {n}!',fr_inv_banner:'{n} invites you to join their party ({m})',fr_inv_join:'Join party',fr_inv_decline:'Decline',fr_status_ingame_map:'In match · {m}',pl_modal_title:'Invite to party',pl_modal_sub:'{m} · {c}/{max} players',pl_link_box_t:'Direct party link',pl_link_box_h:'Send this link: clicking it puts your friend straight into your party.',pl_friends_box_t:'Online friends',pl_no_online:'No friends online right now. Copy the link above or add friends!',pl_btn_inv:'+ Invite',pl_btn_in:'In party',pl_btn_invited:'Invited',pl_quick_ph:'Invite by username or Friend Code...',
 st_online:'Online',st_ingame:'In match',st_offline:'Offline',view_profile:'Profile',invite_party:'Invite',in_party:'In party',party_full:'Party full',not_available:'Unavailable',
 no_friend_avail:'No online friend available',add_friend:'Add friend',friend_sent:'Request sent',friend_sent_toast:'Friend request sent to {n}',is_friend:'Friend',back:'Back',
 played_with:'Last match together: {d}',never_played:'Never played together',
 rep_need_match:'You can only report players you met in a match in the last 7 days',rep_cooldown:'Already reported: next report possible in {x}',rep_daily:'Limit reached: 5 reports per 24 h',
 reports_left:'{n}/5 reports left (24 h)',dur_d:'{n} d', ban_title:'Temporary matchmaking ban',ban_find:'BANNED · {x}',ban_level:'Offense {n}/4 in 7 days · next: {x}',ban_level_max:'Maximum penalty reached ({x})',
 ban_applied:'{x} ban: {r}',ban_over:'Ban over, you can play again',ban_blocked:'You are banned from matchmaking for {x} more',ban_lift:'Lift ban (demo)',ban_lifted:'Ban lifted (demo)',ban_ends:'remaining',
 ban_r_afk_accept:'Match not accepted (AFK)',ban_r_declined:'Match declined',ban_r_left:'Left lobby, match cancelled',ban_r_afk_match:'AFK during match',
 dur_min:'{n} min',dur_h:'{n} h',decline:'DECLINE MATCH',decline_warn:'Declining in competitive = {x} ban',
 leave_title:'Leave the lobby?',leave_text:'In competitive, leaving <b>cancels the match for every player</b>. You will receive a temporary <b>{x}</b> ban.',leave_confirm:'Leave anyway',stay:'Stay',
 sim_afk:'Simulate AFK (demo)',afk_penalty:'Kicked for AFK: −{e} ELO and {x} ban',
 sanctions:'Penalties',sanctions_none:'No recent penalties.',sanctions_rule:'Steps over a rolling 7 days: 5 min → 30 min → 2 h → 24 h. Competitive only (5v5 ranked and Wingman).',
 status_active:'Active',status_done:'Served',th_reason:'Reason',th_duration:'Duration',th_status:'Status',san_clean:'No active ban',offenses:'{n} in 7 days',casual_free:'Unranked mode: no penalty',language:'Language',nav_play:'Play',nav_profile:'Profile',nav_ranking:'Leaderboard',nav_shop:'Shop',nav_friends:'Friends',notifications:'Notifications',online:'online',my_profile:'My profile',
 searching_banner:'Searching for a match',cancel:'Cancel',your_team:'Your team',avg_elo:'Avg ELO',in_queue:'In queue',est_wait:'Est. wait',anticheat:'Anti-cheat active',
 map_pool:'Map pool',maps_selected:'{n}/{t} selected',match_ready:'Match ready',leave_lobby:'Leave lobby',server:'Server',mode:'Mode',win_chance:'Win probability',
 perf_note:'Base points depend on both teams’ level, then are adjusted by up to ±40% based on your performance (rating).',connect:'CONNECT',
 simulate:'SIMULATE MATCH <small>(demo)</small>',match_running:'MATCH IN PROGRESS…',play_again:'PLAY AGAIN',see_profile:'View my profile',
 get_ready:'GET READY',match_found:'MATCH FOUND',waiting_players:'Waiting for players…',accept:'ACCEPT',accepted:'ACCEPTED',n_accepted:'{n}/{t} players accepted',
 all_ready:'All players are ready!',declined:'A player declined the match',requeue:'A player didn’t accept, back in priority queue',match_cancelled:'Match cancelled',
 not_accepted:'Match not accepted, you were removed from the queue',
 m_ranked_tag:'RANKED',m_ranked:'5v5 Competitive',m_ranked_d:'MR15 · 128 tick · Affects ELO',m_casual_tag:'PUG',m_casual:'5v5 Unranked',m_casual_d:'128 tick · No ELO impact',
 m_wing_tag:'DUO',m_wing:'2v2 Wingman',m_wing_d:'Small maps · MR8 · Affects ELO',
 m_duel_tag:'1v1 AIM',m_duel:'1v1 Aim Arena',m_duel_d:'Fast 1v1 duels on Aim maps · 128-tick · MR9',
 shop_cards:'Profile Cards',shop_bgs:'Profile Backgrounds',lg_top_cards_title:'Division profiles',sh_open_bgs:'Profile Backgrounds',sh_open_cards:'Profile Cards',sh_promo_badge:'',sh_dev_all_unlocked:'Full Developer Access · Everything is unlocked for testing',bg_equipped:'Profile background "{n}" equipped!',se_need_buy:'Unlock this item first.',sh_dev_card_access:'Full developer access · Unlocked for testing',
 m_dz_tag:'SURVIVAL',m_dz:'Danger Zone',m_dz_d:'16–18 players · CS:GO rules · Custom servers',m_dz_soon:'UPCOMING',r_EU:'Europe',r_NA:'America',r_AS:'Asia',
 remove:'Remove',leader:'Party leader',teammate:'Teammate',invite:'Invite',searching_btn:'SEARCHING',click_cancel:'Click to cancel',find_match:'FIND MATCH',
 locked:'Cancel the search to make changes',keep_map:'Keep at least one map',left_party:'{n} left the party',joined_party:'{n} joined the party',search_cancelled:'Search cancelled',
 link_to_search:'Link your Steam account to start searching',
 you:'You',your_party:'Your party',captain:'Captain',player:'Player',team_avg:'{n} avg ELO',unranked_match:'Unranked match',win:'Win',loss:'Loss',
 left_lobby:'You left the lobby',copied:'Command copied: {x}',
 victory:'VICTORY',defeat:'DEFEAT',rounds:'{n} ROUNDS',your_elo:'Your ELO',transparent:'Transparent calculation',base:'Base',vs_level:'based on opponent level',rating:'Rating',
 multiplier:'Multiplier',perf_bonus:'performance bonus',perf_malus:'performance penalty',perf_low:'low performance',loss_reduced:'reduced loss',mvp_title:'Match MVP',best_rating:'best rating',
 your_team_s:'Your team',enemy_team:'Enemy team',level_n:'Level {n}',level_max:'Max level',to_next:'{x} ELO to level {n}',
 steam_linked:'Steam account linked',unlink:'Unlink',no_steam:'No Steam account linked',steam_login:'Sign in with Steam',google_login:'Continue with Google',au_google_reg:'Sign up with Google',google_connecting:'Connecting to Google...',au_google_err:'Google sign-in cancelled or failed.',
 member_since:'Member since {d} · Favorite server: EU-Frankfurt',since_date:'March 2024',link_title:'Link your Steam account',
 link_text:'Your profile, stats and ELO are tied to your SteamID.<br>Sign-in goes through Steam (OpenID): we never see your password.',
 t_matches:'Matches',total:'total',peak:'peak {n}',t_winrate:'Win rate',wl:'{w}W / {l}L',kills:'{n} kills',headshots:'headshots',dmg_round:'damage / round',average:'average',
 t_streak:'Streak',max_wins:'max wins',elo_evo:'ELO history',last_n:'last {n} matches',map_stats:'Map stats',winrate_s:'win rate',m_short:'{n} m.',
 history:'Match history',th_date:'Date',th_res:'Res.',th_map:'Map',th_score:'Score',th_player:'Player',w:'W',l:'L',
 show_more:'Show more',show_less:'Show less',showing:'{a} of {b} matches',
 steam_unlinked:'Steam account unlinked',steam_connecting:'Connecting to Steam…',steam_linked_toast:'Steam account linked',soon:'Coming soon',lang_changed:'Language: English',
 trust:'Trust factor',trust_pool:'Trust queue',pool_pill:'Queue: {x}',tier_high:'High',tier_mid:'Medium',tier_low:'Low',tier_vlow:'Very low',
 pool_lowered:'{n} has {x} trust: your party queues in the {x} pool',
 tf_reports:'<b>{r}</b> reports received over <b>{m}</b> matches',tf_formula:'Formula: {f}',tf_example:'Example: 2 reports over 10 matches → −2 → trust 8/10',
 tf_pool_text:'You are matched with and against players of the same trust level (<b>{x}</b>). Frequently reported players play each other.',
 tf_by_reason:'Reports by reason',tf_demo:'+1 report (demo)',tf_demo_done:'Test report added: trust {a} → {b}',
 report:'Report',report_title:'Report a player',r_cheat:'Cheating',r_toxic:'Toxic behaviour',r_grief:'AFK / griefing',r_smurf:'Smurfing',
 report_note_ph:'Details (optional): round, situation…',report_hint:'Anti-abuse: 1 report per player every 7 days, max 5 reports per 24 h, only players you met in a match. Each report lowers trust relative to the player’s match count.',
 send_report:'Send report',choose_reason:'Pick a reason',report_sent:'Report sent. {n}’s trust: {a} → {b}',already_reported:'You already reported this player for this match',
 trust_short:'Trust',matches_n:'{n} matches',
 edit_profile:'Customize',customize:'Customize profile',avatar_l:'Profile picture',banner_l:'Banner',upload:'Upload image',reset:'Reset',save:'Save',
 saved:'Profile updated',banner_default:'Default',upload_hint:'Uploaded images are resized and kept in this browser.',img_error:'Could not read this image',store_error:'Image too large to keep after reload',
 name_cd_ok:'Available (1× / 7d)',name_cd_lock:'Locked · {x}',name_cd_hint:'3 to 16 chars (letters, digits, _ . -). Changing your username locks it for 7 days.',name_cd_wait:'You recently changed your username. Next change available in {x}.',name_changed:'Username changed to "{n}" (locked for 7 days)',
 nav_leagues:'Leagues & Teams',map_casual:'Classics & Fun (Unranked)',comp_only_active:'{m} is only playable in 5v5 Unranked (outside the competitive rotation)'},

ru:{
 nav_settings:'Настройки',st_account:'Аккаунт',st_audio:'Звук и голос',st_notif:'Уведомления',st_ui:'Интерфейс',st_privacy:'Приватность',st_profile:'Профиль',st_edit_profile:'Изменить ник, аватар и баннер',st_name_cd:'Ник можно менять раз в 7 дней.',st_login:'Вход',st_default:'По умолчанию (система)',st_mic:'Микрофон',st_out:'Выход',st_input:'Микрофон (вход)',st_output:'Наушники / колонки (выход)',st_in_vol:'Громкость микрофона',st_out_vol:'Громкость других игроков',st_no_sink:'Браузер не позволяет выбрать выход: используется выход Windows.',st_need_mic:'Запусти проверку микрофона, чтобы увидеть названия устройств.',st_devices:'Устройства',st_test_out:'Проверить выход',st_test_out_h:'Проигрывает короткий звук в выбранных наушниках',st_play:'Играть',st_mic_test:'Проверка микрофона',st_vad:'Чувствительность',st_vad_h:'Оранжевая черта: выше неё считается, что ты говоришь.',st_stop:'Стоп',st_hear_me:'Слышать себя (надень наушники)',st_mic_test_go:'Проверить микрофон',st_mode:'Режим разговора',st_ptt_key:'Клавиша рации',st_ptt_key_h:'Нажми и затем нужную клавишу (Esc - отмена)',st_processing:'Обработка голоса',st_ns:'Шумоподавление',st_ns_h:'Убирает клавиатуру, мышь и фоновый шум',st_ec:'Эхоподавление',st_ec_h:'Полезно, если играешь без наушников',st_agc:'Автоусиление',st_agc_h:'Выравнивает громкость голоса',st_sounds:'Звуки сайта',st_sounds_h:'Матч найден, сообщения, сигналы интерфейса',st_dm:'Личные сообщения',st_dm_h:'Сообщать, когда пишет друг',st_desk:'Уведомления на рабочем столе',st_desk_h:'Даже когда вкладка в фоне',st_desk_denied:'Браузер запретил уведомления',st_rm:'Меньше анимаций',st_rm_h:'Отключает анимации и переходы',st_online:'Показывать мой статус',st_online_h:'Друзья видят, когда ты в сети',st_dmf:'Личные сообщения: только друзья',st_dmf_h:'Другие игроки не смогут тебе писать',st_pub:'Публичный профиль',st_pub_h:'Все видят твою статистику и историю',st_saved:'Настройка сохранена',st_all_audio:'Все настройки звука',
 fb_synced:'синхронизировано {x}',fb_pending:'ожидание',
 vc_empty:'пока никого',vc_none:'В этом канале никого. Зайди, чтобы начать разговор.',vc_mate:'Команда',vc_foe:'Соперник',vc_mute_p1:'Заглушить',vc_unmute_p:'Включить звук',vc_game_t:'Во время матча: голос CS:GO',vc_game_rounds:'Во время раунда слышно свою команду; между раундами (конец раунда и фризтайм) обе команды слышат друг друга, как в старом CS:GO.',vc_game_alltalk:'Все слышат всех весь матч (alltalk).',vc_game_team:'Только команда; все говорят на разминке и в перерыве.',
 rep_msg:'Пожаловаться на сообщение',rep_done:'Жалоба уже отправлена',rep_sent:'Жалоба на сообщение {n} отправлена модерации',rep_limit:'Лимит жалоб на этот матч исчерпан',lvup_k:'НОВЫЙ РАНГ',lvup_t:'Новый ранг: {n}',lvup_next:'Следующий ранг: {n} на {e} ELO',lvup_max:'Высший ранг: дальше - Pro League',lvup_close:'Нажми, чтобы продолжить',
 rs_play:'Игра',rs_items:'Предметы',rs_social:'Сообщество',ps_ph:'Найти игрока…',ps_none:'Игрок не найден',leave_guard:'Ты в комнате матча: покинуть страницу?',
 launch_hint:'Открывает CS:GO и сразу подключает, даже если игра уже запущена',copy_cmd:'Копировать',copied_cmd:'Команда скопирована: в CS:GO открой консоль (~), вставь (Ctrl+V) и нажми Enter',ip_open_hint:'Ничего не происходит? Скопируй команду и вставь её в консоль игры (~)',
 cp_teamlg:'Командные лиги',tn_need_team_lg:'Создай команду 5v5 во вкладке «Командные лиги», чтобы записаться',
 pp_pro:'Pro League · #{n} в мире',pp_elite:'Лига Элита · 2400+ ELO',
 place2:'2-е',place3:'3-е',tn_placed:'Твоя команда - {p} место в {n}: +{x}',
 nav_comp:'Турниры',cp_title:'Соревнования',cp_leagues:'Лиги',cp_tourneys:'Турниры',cp_teams:'Моя команда',lg_season:'Сезон {n}',lg_ends:'конец через {d} дн',lg_div:'Дивизион {d}',lg_mine:'Мой дивизион',lg_div_empty:'В этом дивизионе пока нет игроков.',lg_next:'{n} ELO до {x}',lg_top:'Высшая лига: цель - Pro League',lg_your_div:'Твой дивизион',lg_up:'Зона повышения',lg_down:'Зона вылета',lg_rewards:'Награды за сезон',lg_dist:'Распределение игроков',lg_pro:'Pro League',lg_pro_t:'20 лучших игроков рейтинга (Всемирная Элита).',lg_world:'Лучшие в мире',lg_all:'Мир',lg_badge:'значок + баннер',lg_you_pro:'Ты в Pro League!',tn_all:'Все',tn_open:'Регистрация',tn_live:'Идут',tn_done:'Завершены',tn_mine:'Мои',tn_create:'Создать турнир',tn_official:'Официальный',tn_comm:'Сообщество',tn_by:'от {n}',tn_teams:'Команды',tn_start:'Начало',tn_entry:'Взнос',tn_free:'Бесплатно',tn_minlvl:'Мин. ELO',tn_none:'Здесь пока нет турниров.',tn_prize:'Призовые',tn_back:'← Турниры',tn_reg:'Записать команду',tn_unreg:'Отменить запись',tn_registered:'Команда записана',tn_need_team:'Создай команду из 5 игроков, чтобы записаться',tn_need5:'В команде должно быть минимум 5 игроков',tn_need_cap:'Записать команду может только капитан',tn_elo_low:'Средний ELO команды слишком низкий (мин. {n})',tn_full:'Мест нет',tn_participants:'Записанные команды',tn_bracket:'Сетка',tn_round:'Раунд {n}',tn_final:'Финал',tn_semi:'Полуфиналы',tn_quarter:'Четвертьфиналы',tn_launch:'Запустить турнир (демо)',tn_next:'Сыграть следующий раунд (демо)',tn_champion:'Чемпион',tn_rules:'Правила',tn_format:'Формат',tn_single:'На выбывание · BO1, финал BO3',tn_status_open:'Регистрация открыта',tn_status_live:'Идёт',tn_status_done:'Завершён',tn_status_fund:'Нужно внести призовые',tn_fund:'Внести призовые ({x})',tn_funded:'Призовые внесены: турнир опубликован',tn_f_name:'Название турнира',tn_f_size:'Количество команд',tn_f_date:'Дата и время',tn_f_region:'Регион',tn_f_minelo:'Мин. средний ELO',tn_f_entry:'Взнос (Tick Coins, 0 = бесплатно)',tn_f_prize_type:'Тип награды',tn_f_cash:'Деньги (€)',tn_f_tc:'Tick Coins',tn_f_prize:'Сумма призовых',tn_f_split:'Распределение',tn_f_rules:'Правила (необязательно)',tn_f_legal:'Обязуюсь соблюдать правила проведения киберспортивных соревнований',tn_legal:'<b>Денежные призы:</b> организатор вносит призовой фонд заранее, он заблокирован до конца турнира - победители гарантированно получат выплату. Во Франции турнир с денежными призами нужно заявить в министерство за 1 год – 30 дней; свыше 10 000 € нужна гарантия выплаты; игрокам младше 12 лет денежные призы запрещены.',tn_e_name:'Название: от 4 до 40 символов',tn_e_date:'Выбери дату минимум через 30 мин',tn_e_prize:'Неверная сумма призовых',tn_e_legal:'Отметь согласие с правилами',tn_created:'Турнир создан!',tn_created_cash:'Турнир создан: внеси призовые, чтобы опубликовать.',tn_won:'Твоя команда выиграла {n}! +{x}',tn_reg_toast:'{t} записана на {n}',tn_out:'Твоя команда выбыла из {n}.',tn_cancel_reg:'Запись отменена (возврат)',split_wta:'Победитель забирает всё',split_top2:'1-е 70% · 2-е 30%',split_top4:'1-е 50% · 2-е 25% · 3-4 по 12,5%',place:'{n}-е',place1:'1-е',team_create:'Создать команду',team_name:'Название команды',team_tag:'Тег (2–5 символов)',team_color:'Цвет',team_e_name:'Название: 3–24 символа',team_e_tag:'Тег: 2–5 букв или цифр',team_avg:'Средний ELO',team_members:'Игроки',team_record:'Турниры',team_captain:'Капитан',team_player:'Игрок',team_sub:'Запасной',team_kick:'Исключить',team_leave:'Покинуть команду',team_disband:'Распустить команду',team_invite:'Пригласить друзей',team_invited:'Приглашение отправлено: {n}',team_joined:'{n} вступил в {t}',team_full:'Команда заполнена (макс. 7)',team_none_inv:'Нет друзей в сети',team_intro:'Постоянная команда из 5 игроков (+2 запасных) для турниров.',team_created:'Команда {n} создана!',team_left:'Ты покинул команду',team_in_t:'Записана на {n} турнир(ов)',
 vc:'Голос',vc_join:'Войти в голосовой',vc_leave:'Выйти',vc_all:'Все',vc_team:'Команда',vc_open:'Открытый микрофон',vc_ptt:'Нажми, чтобы говорить',vc_mute:'Выкл. микрофон',vc_deaf:'Заглушить',vc_in:'{n} в голосовом',vc_ingame:'Матч начинается: голос переходит в игру (alltalk на сервере).',vc_denied:'Микрофон запрещён: разреши его в браузере.',vc_nomic:'Микрофон не найден.',vc_err:'Не удалось включить микрофон.',vc_demo:'Демо: твой микрофон настоящий, голоса других игроков симулированы. Онлайн звук идёт напрямую между игроками (WebRTC).',vc_mute_p:'Нажми на значок игрока, чтобы заглушить его',
 chat:'Чат',ch_team:'Команда',ch_all:'Все',ch_team_to:'[Команда]',ch_all_to:'[Все]',chat_ph_team:'Напиши команде…',chat_ph_all:'Напиши всем…',chat_slow:'Помедленнее, слишком много сообщений.',sys_ban:'{x} забанил {m}',sys_pick:'Карта: {m}',sys_live:'Все подключены, удачной игры!',sys_welcome:'Добро пожаловать в комнату. Будьте вежливы: на сообщения можно пожаловаться.',messages:'Сообщения',dm_title:'Сообщения',dm_empty:'Пока нет друзей',dm_none:'Сообщений пока нет',dm_ph:'Сообщение для {n}…',dm_off_note:'{n} не в сети: увидит сообщение при следующем входе.',dm_new:'{n}: {x}',dm_btn:'Сообщение',today:'Сегодня',st_writing:'печатает…',
 n_read_all:'Прочитать все',n_clear:'Очистить',n_empty:'Нет уведомлений',n_now:'только что',n_min:'{n} мин назад',n_h:'{n} ч назад',n_d:'{n} дн назад',n_win:'Победа на {m} ({s}) · {d} ELO',n_loss:'Поражение на {m} ({s}) · {d} ELO',n_tier:'Боевой пропуск: уровень {n}! Забери награду.',n_mission:'Задание выполнено: {x}. Забери XP.',n_ban:'Бан на {x}: {r}',n_prio_kick:'{n} не зашёл: матч отменён, у тебя приоритет.',n_season:'Стартовал 1-й сезон боевого пропуска: 30 уровней.',n_shop_new:'Новые предметы в магазине.',n_friend_on:'{n} в сети.',vs_us:'Винрейт твоей команды',vs_them:'Винрейт соперника',vs_us_s:'Мы',vs_them_s:'Они',vs_rec:'Бан',vs_tip:'Мы: {a} ({pa} матчей) · Они: {b} ({pb} матчей)',
 connected_btn:'Подключён',
 decline_free:'Без наказания: ты просто выходишь из очереди',declined_free:'Матч отклонён: без наказания, ты вышел из очереди.',not_accepted_free:'Матч не принят: ты удалён из очереди.',prio:'Приоритет',prio_requeue:'Игрок не принял матч: ты снова в начале очереди.',connected_srv:'Подключён к серверу',joining_srv:'Запуск CS:GO и подключение к серверу…',join_title:'Зайди на сервер',join_n:'{n}/{t} подключено',join_me:'Нажми ПОДКЛЮЧИТЬСЯ',join_all:'Все подключены: матч начинается!',join_wait_all:'Ждём, пока все игроки зайдут на сервер',join_kick:'{n} не зашёл на сервер: кик и бан на {x}. Матч отменён, ты снова в начале очереди.',join_kick_me:'Ты не зашёл на сервер вовремя: кик из матча, бан на {x}.',ban_r_no_show:'Неявка на матч',
 au_title:'Соревновательный 5v5 всерьёз.',au_sub:'Серверы 128 тик, ELO по твоей игре, trust factor и античит. Создай аккаунт, привяжи Steam и сыграй первый матч.',au_b1:'тик на всех серверах',au_b2:'по реальной игре, а не только победам',au_b3:'античит и trust factor',au_login:'Вход',au_register:'Регистрация',au_welcome:'С возвращением',au_id:'E-mail или ник',au_pw:'Пароль',au_pw2:'Повтори пароль',au_remember:'Не выходить',au_forgot:'Забыл пароль?',au_login_btn:'Войти',au_or:'или',au_no_acc:'Нет аккаунта?',au_have_acc:'Уже есть аккаунт?',au_create:'Создай аккаунт',au_user:'Ник',au_user_h:'3–16 символов: буквы, цифры, _ . -',au_mail:'E-mail',au_cgu:'Я принимаю условия использования и политику конфиденциальности',au_create_btn:'Создать аккаунт',au_steam_reg:'Регистрация через Steam',au_settings:'Настройки аккаунта',au_logout:'Выйти',au_logged_out:'Ты вышел',au_hello:'Добро пожаловать, {n}!',au_created:'Аккаунт создан. Привяжи Steam, чтобы играть.',au_r_len:'8 символов',au_r_let:'1 буква',au_r_num:'1 цифра',au_since:'С нами с',au_change_pw:'Сменить пароль',au_set_pw:'Задать пароль',au_pw_cur:'Текущий пароль',au_pw_new:'Новый пароль',au_pw_saved:'Пароль изменён',au_save:'Сохранить',au_forgot_t:'Сброс по e-mail скоро появится. Пока войди через Steam, если он привязан.',au_demo:'Демо-режим: аккаунты хранятся в этом браузере. Запусти сервер Node для настоящих аккаунтов.',au_server:'Подключено к серверу TICKRATE',au_steam_taken:'Этот Steam уже привязан к другому аккаунту TICKRATE.',au_steam_err:'Вход через Steam отменён или не удался.',au_steam_need_http:'Steam не может вернуться в локальный файл: открой сайт через http (сервер Node или «npx serve» в папке).',au_none:'Нет',e_bad_username:'Неверный ник: 3–16 символов, буквы, цифры, _ . -',e_bad_email:'Неверный e-mail.',e_pw_short:'Пароль слишком короткий (минимум 8).',e_pw_long:'Пароль слишком длинный.',e_pw_weak:'Нужна хотя бы одна буква и одна цифра.',e_must_accept:'Нужно принять условия использования.',e_username_taken:'Ник уже занят.',e_email_taken:'Аккаунт с этим e-mail уже есть.',e_bad_credentials:'Неверный логин или пароль.',e_too_many_attempts:'Слишком много попыток. Попробуй через 15 минут.',e_missing_fields:'Заполни все поля.',e_server_error:'Ошибка сервера, попробуй ещё раз.',e_pw_mismatch:'Пароли не совпадают.',e_set_password_first:'Сначала задай пароль, чтобы отвязать Steam.',e_network:'Сервер недоступен.',
 missions:'Задания дня',ms_reset:'Новые задания через {x}',ms_play:'Сыграй {n} матча',ms_win:'Выиграй {n} матча',ms_kills:'Сделай {n} убийств',ms_mvp:'Стань MVP матча',ms_rating:'Заверши матч с рейтингом ≥ {n}',ms_adr:'Сыграй матч с ADR {n}+',ms_lock:'Бонусное задание с PLUS',shop_kg:'Ножи и перчатки',shop_kg_t:'Только для подписчиков: весь каталог в PLUS.',see_plus:'Смотреть PLUS',
 stickers:'Наклейки',stk_pick:'Выбрать наклейку',stk_search:'Поиск наклеек…',stk_all:'Все',stk_paper:'Бумажные',stk_scrape:'Потёртость',stk_remove:'Снять',stk_empty:'Нажми на слот, чтобы наклеить наклейку.',stk_slot_plus:'Слоты 2–4: PLUS',mm_sort:'Подбор по ELO',mm_sort_hint:'Выкл.: принимаются игроки любого уровня, матч находится быстрее',mm_off:'Выкл. · любой уровень', map_reserve:'Резерв',sort_l:'Сортировка',sort_def:'По группам',sort_wr:'Мой винрейт',sel_active:'Только Active Duty',sel_all:'Все',
 elo_gap:'Макс. разница ELO',elo_gap_real:'Фактическая разница',mm_quality:'Качество подбора',
 f_mm_free:'Подбор: разница ELO до ±400',f_mm_plus:'Точный подбор: разница ±250',f_mm_prem:'Премиум-подбор: разница ±150, игроки с высоким трастом',
 cmp_gap:'Макс. разница ELO',cmp_trust:'Гарантированно высокий траст игроков',
 rk_tab_elo:'ELO',rk_tab_ladder:'Недельная лестница',ladder_ends:'Конец через {x}',ladder_rules:'Победа +30 очков, поражение +10, бонус за игру до +15. Каждое воскресенье в 23:59 лучшие получают Tick Coins.',
 ladder_rewards:'Награды недели',your_points:'Твои очки: {n} · #{r}',points:'Очки',th_reward:'Награда',
 shop_feat:'Витрина',shop_pass:'Боевой пропуск',shop_coins:'Tick Coins',refresh_in:'Обновление через {x}',buy:'Купить',bought:'Куплено',not_enough:'Недостаточно Tick Coins',
 bought_toast:'{x} добавлен в снаряжение',coins_added:'+{n} Tick Coins',bonus:'+{n}% бонус',
 pass_season:'Сезон 1 · уровней: {n}',pass_tier:'Уровень {n}',pass_free:'Бесплатно',pass_prem:'Премиум-пропуск',pass_buy:'Открыть премиум-пропуск · {x} TC',pass_owned:'Премиум-пропуск открыт',
 claim:'Забрать',claimed:'Получено',pass_hint:'Получай XP за каждый матч: победа 120 XP, поражение 60 XP, MVP +40 XP.',xp_gain:'+{n} XP пропуска · +{p} очков лестницы',
 r_agent:'Агент',shop_hint:'Купленные предметы остаются в снаряжении даже без подписки.',wallet:'Баланс',days_s:'{d} д {h} ч', nav_loadout:'Инвентарь',nav_premium:'Премиум',go_premium:'Купить Премиум',
 lo_sub:'Выбери скины: они появятся на наших серверах со следующего матча.',src_inv:'Мой инвентарь Steam',src_cat:'Каталог PLUS',
 inv_hint:'Скины, которые у тебя действительно есть в Steam: бесплатно для всех.',cat_hint:'Весь каталог скинов, ножей и перчаток входит в PLUS и PREMIUM.',
 cat_pistol:'Пистолеты',cat_rifle:'Винтовки',cat_smg:'ПП',cat_knife:'Ножи',cat_gloves:'Перчатки',cat_agents:'Агенты',
 default_skin:'Стандартный',search_skin:'Поиск скина…',owned:'Есть',equipped:'Надет',equip:'Надеть',unequip:'Снять',
 wear:'Износ (float)',seed:'Паттерн (seed)',nametag:'Именной ярлык',nametag_ph:'Например: clutch king',team_l:'Сторона',team_both:'T и CT',
 need_plus:'Нужен PLUS',need_prem:'Нужен PREMIUM',unlock_plus:'Открыть с PLUS',unlock_prem:'Открыть с PREMIUM',
 equipped_toast:'{x} надет: введи !ws в игре, чтобы применить',unequipped_toast:'Скин снят',no_owned:'В твоём инвентаре Steam нет скинов для этого оружия.',
 agent_T:'Агент T',agent_CT:'Агент CT',agent_hint:'Скины агентов доступны только с PREMIUM.',apply_hint:'Снаряжение привязано к твоему SteamID. В игре введи !ws, чтобы обновить скины.',skins_count:'скинов: {n}',select_skin:'Выбери скин',
 w_fn:'Прямо с завода',w_mw:'Немного поношенное',w_ft:'После полевых испытаний',w_ww:'Поношенное',w_bs:'Закалённое в боях',
 pr_title:'Подписки',pr_sub:'Матчмейкинг бесплатный для всех. Подписка даёт более частые дропы, больше настроек и инструменты анализа. Преимуществ в игре она не даёт.',
 monthly:'Помесячно',yearly:'На год',per_month:'/мес',per_year:'/год',billed_year:'{x} €/мес при оплате за год',
 plan_free:'Бесплатно',plan_plus:'PLUS',plan_premium:'PREMIUM',plan_free_d:'Для соревновательной игры.',plan_plus_d:'Чтобы играть с любимыми скинами.',plan_prem_d:'Чтобы расти и выделяться.',
 current_plan:'Текущий план',choose:'Выбрать {x}',popular:'Самый полный',included:'Входит',
 f_mm:'Матчмейкинг 5v5 и Напарники',f_stats:'ELO, уровень и базовая статистика',f_inv:'Скины из инвентаря Steam',f_hist:'История последних 20 матчей',
 f_skins:'Все скины оружия',f_knives:'Ножи и перчатки',f_st:'StatTrak™, ярлыки, float и паттерн',f_badge_plus:'Значок PLUS в профиле',
 f_agents:'Скины агентов T и CT',f_review:'Расширенный анализ матчей',f_demo:'Скачивание демок',f_hist_unl:'Неограниченная история',f_profile:'Золотой ник и значок PREMIUM',f_support:'Приоритетная поддержка',
 f_all_free:'Всё бесплатное, а также:',f_all_plus:'Всё из PLUS, а также:',compare:'Сравнение планов',faq:'Частые вопросы',
 q1:'Даёт ли оплата преимущество в игре?',a1:'Нет: в самом матче все равны. Подписчики получают более точный подбор (меньше разница ELO, надёжнее игроки), косметику и аналитику.',
 q2:'Как скины появляются в игре?',a2:'Снаряжение привязано к твоему SteamID. Плагин сервера читает твой выбор, когда ты заходишь в матч или вводишь !ws.',
 q3:'Можно отменить в любой момент?',a3:'Да, в один клик на этой странице. Преимущества сохраняются до конца оплаченного периода.',
 checkout:'Оформление',total:'Итого',period_l:'Период',secure:'Безопасная оплата через Stripe: карта вводится на странице Stripe, а не на TICKRATE.',pay:'Оплатить через Stripe',paying:'Переход…',
 welcome:'Добро пожаловать в {x}!',cancel_sub:'Отменить',cancel_title:'Отменить подписку?',cancel_text:'Ты вернёшься на бесплатный план. Скины из каталога и агенты будут сняты.',cancel_ok:'Подписка отменена',keep:'Оставить',
 rv_title:'Анализ матча',rv_lock_t:'Расширенный анализ - PREMIUM',rv_lock_d:'Таймлайн раундов, тепловая карта дуэлей, первые дуэли, клатчи, гранаты и скачивание демо.',
 rv_rounds:'Раунды',rv_open:'Первые дуэли',rv_clutch:'Клатчи',rv_multi:'Мультикиллы',rv_util:'Гранаты',rv_heat:'Тепловая карта дуэлей',rv_noradar:'Для этой карты нет радара: позиции примерные.',rv_kills:'Твои убийства',rv_deaths:'Твои смерти',
 rv_won_lost:'{w} выиграно · {l} проиграно',rv_he:'урон HE',rv_flash:'флеш-ассисты',rv_blind:'ослеплено врагов',rv_demo:'Скачать демо (.dem)',rv_demo_t:'Демо станет доступно, когда настоящий сервер загрузит файл',rv_2d:'2D-повтор',
 rv_elim:'Уничтожение',rv_bomb:'Взрыв бомбы',rv_defuse:'Разминирование',rv_time:'Время вышло',rv_none:'нет',rv_h1:'1-й тайм',rv_h2:'2-й тайм',rv_tip:'Совет', veto_title:'Вето карт',veto_turn:'Ход: {x}',veto_your:'Твой ход: забань карту',veto_wait:'{x} выбирает…',veto_by:'Бан: {x}',veto_auto:'Время вышло: {m} забанена автоматически',
 veto_done:'Выбрана карта: {m}',veto_pending:'Идёт вето',veto_hint:'Капитаны по очереди банят карты. Играется последняя оставшаяся.',veto_banned:'{x} забанил {m}',
 ranking_title:'Рейтинг',ranking_region:'Европа · 5v5 соревновательный · в реальном времени',your_rank:'Твоё место: #{n}',th_rank:'#',th_country:'Страна',th_wr:'Винрейт',th_level:'Ур.', friends_title:'Друзья',friends_online:'онлайн: {n} из {t}',recent_players:'Недавние игроки',recent_hint:'Игроки из твоих матчей за последние 7 дней',no_recent:'Недавних игроков нет. Сыграй матч!',
 fr_tab_friends:'Друзья',fr_tab_requests:'Заявки',fr_tab_sent:'Исходящие',fr_tab_add:'Добавить друга',fr_tab_recent:'Недавние игроки',fr_my_code:'Мой код друга',fr_copy_code:'Скопировать код',fr_code_copied:'Код скопирован!',fr_copy_link:'Скопировать ссылку',fr_link_copied:'Ссылка скопирована!',fr_filter_ph:'Поиск по друзьям...',fr_add_title:'Добавить друга',fr_add_sub:'Найди игрока по нику или коду друга.',fr_add_ph:'Введи ник или код (например, TR-248102)...',fr_search_btn:'Найти',fr_send_req:'+ Отправить заявку',fr_empty_title:'У тебя пока нет друзей',fr_empty_sub:'Поделись кодом друга или найди игрока ниже.',fr_no_req:'Нет входящих заявок.',fr_no_sent:'Нет исходящих заявок.',fr_accept:'Принять',fr_decline:'Отклонить',fr_accepted_toast:'{n} теперь в друзьях!',fr_declined_toast:'Заявка от {n} отклонена.',fr_remove:'Удалить из друзей',fr_remove_confirm:'Удалить {n} из друзей?',fr_removed_toast:'{n} удалён из друзей.',fr_already:'Этот игрок уже в друзьях.',fr_already_req:'Заявка уже отправлена игроку {n}.',fr_self:'Это твой собственный профиль!',fr_not_found:'Игрок не найден.',fr_req_sent_to:'Заявка отправлена {n}!',fr_inv_banner:'{n} приглашает тебя в группу ({m})',fr_inv_join:'Войти в группу',fr_inv_decline:'Отклонить',fr_status_ingame_map:'В матче · {m}',pl_modal_title:'Пригласить в лобби',pl_modal_sub:'{m} · {c}/{max} игроков',pl_link_box_t:'Прямая ссылка на группу',pl_link_box_h:'Отправь эту ссылку: открыв её, друг сразу попадет в твою группу.',pl_friends_box_t:'Друзья онлайн',pl_no_online:'Никого нет онлайн. Скопируй ссылку выше!',pl_btn_inv:'+ Пригласить',pl_btn_in:'В группе',pl_btn_invited:'Приглашён',pl_quick_ph:'Пригласить по нику или коду...',
 st_online:'Онлайн',st_ingame:'В матче',st_offline:'Не в сети',view_profile:'Профиль',invite_party:'Пригласить',in_party:'В группе',party_full:'Группа заполнена',not_available:'Недоступен',
 no_friend_avail:'Нет свободных друзей онлайн',add_friend:'Добавить в друзья',friend_sent:'Заявка отправлена',friend_sent_toast:'Заявка в друзья отправлена: {n}',is_friend:'Друг',back:'Назад',
 played_with:'Последний совместный матч: {d}',never_played:'Ещё не играли вместе',
 rep_need_match:'Жаловаться можно только на игроков из твоих матчей за последние 7 дней',rep_cooldown:'Жалоба уже отправлена: следующая возможна через {x}',rep_daily:'Лимит: 5 жалоб за 24 ч',
 reports_left:'Осталось жалоб: {n}/5 (24 ч)',dur_d:'{n} дн.', ban_title:'Временный бан матчмейкинга',ban_find:'БАН · {x}',ban_level:'Нарушение {n}/4 за 7 дней · следующее: {x}',ban_level_max:'Максимальное наказание ({x})',
 ban_applied:'Бан на {x}: {r}',ban_over:'Бан закончился, можно играть',ban_blocked:'Ты забанен в матчмейкинге ещё {x}',ban_lift:'Снять бан (демо)',ban_lifted:'Бан снят (демо)',ban_ends:'осталось',
 ban_r_afk_accept:'Матч не принят (АФК)',ban_r_declined:'Матч отклонён',ban_r_left:'Выход из лобби, матч отменён',ban_r_afk_match:'АФК во время матча',
 dur_min:'{n} мин',dur_h:'{n} ч',decline:'ОТКЛОНИТЬ МАТЧ',decline_warn:'Отказ в соревновательном = бан на {x}',
 leave_title:'Покинуть лобби?',leave_text:'В соревновательном режиме выход <b>отменяет матч для всех игроков</b>. Ты получишь временный бан на <b>{x}</b>.',leave_confirm:'Всё равно выйти',stay:'Остаться',
 sim_afk:'Симулировать АФК (демо)',afk_penalty:'Исключён за АФК: −{e} ELO и бан на {x}',
 sanctions:'Наказания',sanctions_none:'Недавних наказаний нет.',sanctions_rule:'Ступени за последние 7 дней: 5 мин → 30 мин → 2 ч → 24 ч. Только в соревновательных режимах (5v5 рейтинг и Напарники).',
 status_active:'Активен',status_done:'Отбыт',th_reason:'Причина',th_duration:'Длительность',th_status:'Статус',san_clean:'Активных банов нет',offenses:'{n} за 7 дней',casual_free:'Режим без рейтинга: без наказания',language:'Язык',nav_play:'Играть',nav_profile:'Профиль',nav_ranking:'Рейтинг',nav_shop:'Магазин',nav_friends:'Друзья',notifications:'Уведомления',online:'онлайн',my_profile:'Мой профиль',
 searching_banner:'Поиск матча',cancel:'Отмена',your_team:'Твоя команда',avg_elo:'Ср. ELO',in_queue:'В очереди',est_wait:'Ожидание',anticheat:'Античит активен',
 map_pool:'Пул карт',maps_selected:'выбрано {n}/{t}',match_ready:'Матч готов',leave_lobby:'Покинуть лобби',server:'Сервер',mode:'Режим',win_chance:'Шанс на победу',
 perf_note:'Базовые очки зависят от уровня команд и корректируются до ±40% в зависимости от твоей игры (рейтинга).',connect:'ПОДКЛЮЧИТЬСЯ',
 simulate:'СИМУЛИРОВАТЬ МАТЧ <small>(демо)</small>',match_running:'МАТЧ ИДЁТ…',play_again:'ИГРАТЬ СНОВА',see_profile:'Мой профиль',
 get_ready:'ПРИГОТОВЬСЯ',match_found:'МАТЧ НАЙДЕН',waiting_players:'Ожидание игроков…',accept:'ПРИНЯТЬ',accepted:'ПРИНЯТО',n_accepted:'Приняли: {n}/{t}',
 all_ready:'Все игроки готовы!',declined:'Игрок отклонил матч',requeue:'Игрок не принял матч - возврат в приоритетную очередь',match_cancelled:'Матч отменён',
 not_accepted:'Матч не принят - ты удалён из очереди',
 m_ranked_tag:'РЕЙТИНГ',m_ranked:'5v5 Соревновательный',m_ranked_d:'MR15 · 128 тик · Влияет на ELO',m_casual_tag:'PUG',m_casual:'5v5 Без рейтинга',m_casual_d:'128 тик · Без влияния на ELO',
 m_wing_tag:'ДУО',m_wing:'2v2 Напарники',m_wing_d:'Малые карты · MR8 · Влияет на ELO',
 m_duel_tag:'1v1 AIM',m_duel:'1v1 Арена Aim',m_duel_d:'Быстрые дуэли 1v1 на Aim-картах · 128-tick · MR9',
 shop_cards:'Карточки профиля',shop_bgs:'Фоны профиля',lg_top_cards_title:'Профили дивизиона',sh_open_bgs:'Фоны профиля',sh_open_cards:'Карточки профиля',sh_promo_badge:'',bg_equipped:'Фон профиля «{n}» применён!',se_need_buy:'Сначала разблокируй этот предмет.',sh_dev_card_access:'Полный доступ разработчика · Разблокировано для тестов',
 m_dz_tag:'ВЫЖИВАНИЕ',m_dz:'Danger Zone',m_dz_d:'16–18 игроков · Правила CS:GO · Наши серверы',m_dz_soon:'СКОРО',r_EU:'Европа',r_NA:'Америка',r_AS:'Азия',
 remove:'Убрать',leader:'Лидер группы',teammate:'Тиммейт',invite:'Пригласить',searching_btn:'ПОИСК',click_cancel:'Нажми, чтобы отменить',find_match:'НАЙТИ МАТЧ',
 locked:'Отмени поиск, чтобы изменить',keep_map:'Оставь хотя бы одну карту',left_party:'{n} покинул группу',joined_party:'{n} присоединился к группе',search_cancelled:'Поиск отменён',
 link_to_search:'Привяжи Steam, чтобы начать поиск',
 you:'Ты',your_party:'Твоя группа',captain:'Капитан',player:'Игрок',team_avg:'Ср. ELO {n}',unranked_match:'Матч без рейтинга',win:'Победа',loss:'Поражение',
 left_lobby:'Ты покинул лобби',copied:'Команда скопирована: {x}',
 victory:'ПОБЕДА',defeat:'ПОРАЖЕНИЕ',rounds:'РАУНДОВ: {n}',your_elo:'Твой ELO',transparent:'Прозрачный расчёт',base:'База',vs_level:'по уровню соперника',rating:'Рейтинг',
 multiplier:'Множитель',perf_bonus:'бонус за игру',perf_malus:'штраф за игру',perf_low:'слабая игра',loss_reduced:'меньше потерь',mvp_title:'MVP матча',best_rating:'лучший рейтинг',
 your_team_s:'Твоя команда',enemy_team:'Команда соперника',level_n:'Уровень {n}',level_max:'Макс. уровень',to_next:'{x} ELO до ур. {n}',
 steam_linked:'Steam привязан',unlink:'Отвязать',no_steam:'Steam не привязан',steam_login:'Войти через Steam',google_login:'Продолжить через Google',au_google_reg:'Регистрация через Google',google_connecting:'Вход через Google...',au_google_err:'Вход через Google отменен или не удался.',
 member_since:'Участник с {d} · Любимый сервер: EU-Frankfurt',since_date:'марта 2024',link_title:'Привяжи аккаунт Steam',
 link_text:'Профиль, статистика и ELO привязаны к твоему SteamID.<br>Вход через Steam (OpenID): мы никогда не видим твой пароль.',
 t_matches:'Матчи',total:'всего',peak:'пик {n}',t_winrate:'Винрейт',wl:'{w}В / {l}П',kills:'{n} убийств',headshots:'в голову',dmg_round:'урон / раунд',average:'в среднем',
 t_streak:'Серия',max_wins:'макс. побед подряд',elo_evo:'Динамика ELO',last_n:'последние {n} матчей',map_stats:'Статистика по картам',winrate_s:'винрейт',m_short:'{n} м.',
 history:'История матчей',th_date:'Дата',th_res:'Итог',th_map:'Карта',th_score:'Счёт',th_player:'Игрок',w:'В',l:'П',
 show_more:'Показать ещё',show_less:'Свернуть',showing:'{a} из {b} матчей',
 steam_unlinked:'Steam отвязан',steam_connecting:'Подключение к Steam…',steam_linked_toast:'Steam привязан',soon:'Скоро',lang_changed:'Язык: Русский',
 trust:'Траст-фактор',trust_pool:'Траст-очередь',pool_pill:'Очередь: {x}',tier_high:'Высокий',tier_mid:'Средний',tier_low:'Низкий',tier_vlow:'Очень низкий',
 pool_lowered:'У {n} траст «{x}»: твоя группа играет в очереди «{x}»',
 tf_reports:'<b>{r}</b> жалоб за <b>{m}</b> матчей',tf_formula:'Формула: {f}',tf_example:'Пример: 2 жалобы за 10 матчей → −2 → траст 8/10',
 tf_pool_text:'Ты играешь с игроками того же уровня траста (<b>{x}</b>) и против них. Игроки с частыми жалобами играют между собой.',
 tf_by_reason:'Жалобы по причинам',tf_demo:'+1 жалоба (демо)',tf_demo_done:'Тестовая жалоба добавлена: траст {a} → {b}',
 report:'Пожаловаться',report_title:'Жалоба на игрока',r_cheat:'Читы',r_toxic:'Токсичность',r_grief:'АФК / саботаж',r_smurf:'Смурф',
 report_note_ph:'Подробности (необязательно): раунд, ситуация…',report_hint:'Защита от злоупотреблений: 1 жалоба на игрока раз в 7 дней, не больше 5 жалоб за 24 ч, только на игроков из твоих матчей. Каждая жалоба снижает траст с учётом числа матчей игрока.',
 send_report:'Отправить жалобу',choose_reason:'Выбери причину',report_sent:'Жалоба отправлена. Траст {n}: {a} → {b}',already_reported:'Ты уже пожаловался на этого игрока в этом матче',
 trust_short:'Траст',matches_n:'матчей: {n}',
 edit_profile:'Настроить',customize:'Настройка профиля',avatar_l:'Аватар',banner_l:'Баннер',upload:'Загрузить изображение',reset:'Сбросить',save:'Сохранить',
 saved:'Профиль обновлён',banner_default:'Стандарт',upload_hint:'Загруженные изображения уменьшаются и хранятся в этом браузере.',img_error:'Не удалось прочитать изображение',store_error:'Изображение слишком большое для сохранения',
 name_cd_ok:'Доступно (1× / 7 дн.)',name_cd_lock:'Закрыто · {x}',name_cd_hint:'От 3 до 16 символов (буквы, цифры, _ . -). Смена ника возможна раз в 7 дней.',name_cd_wait:'Ник недавно менялся. Следующая смена возможна через {x}.',name_changed:'Ник изменён на «{n}» (заблокировано на 7 дней)',
 nav_leagues:'Лиги и команды',map_casual:'Классика и фан (Без ранга)',comp_only_active:'Карта {m} доступна только в 5v5 Без рейтинга'}
};
const LANGS=[{id:'fr',name:'Français'},{id:'en',name:'English'},{id:'ru',name:'Русский'}];
const LOC={fr:'fr-FR',en:'en-GB',ru:'ru-RU'};
let lang=(()=>{try{const v=localStorage.getItem('cs_lang');if(I18N[v])return v}catch(e){}
  const n=(navigator.language||'fr').slice(0,2);return I18N[n]?n:'fr'})();
function t(k,v={}){let s=(I18N[lang]&&I18N[lang][k])??I18N.fr[k]??k;for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s}

/* =====================================================
   DONNÉES
   ===================================================== */
const mkMode=(id,k,soon=false)=>({id,soon,get tag(){return t(k+'_tag')},get n(){return t(k)},get d(){return t(k+'_d')}});
const MODES=[mkMode('ranked','m_ranked'),mkMode('wingman','m_wing'),mkMode('duel','m_duel'),mkMode('dz','m_dz',true)];
/* Images : dossier maps/ à côté du fichier. Fond de secours si l'image manque. */
const MAPS=[
  ['Mirage','mirage','#8a6235','active',null],
  ['Inferno','inferno','#7f3a26','active',{bsp:'de_inferno',site:'Bombsite A'}],
  ['Dust II','dust2','#8d7547','active',null],
  ['Nuke','nuke','#2f5d78','active',{bsp:'de_shortnuke',site:'Bombsite B',slug:'shortnuke'}],
  ['Overpass','overpass','#4b6b3b','active',{bsp:'de_overpass',site:'Bombsite B'}],
  ['Ancient','ancient','#2f6b57','active',null],
  ['Anubis','anubis','#3d6a7a','active',null],
  ['Cache','cache','#6b6a3a','reserve',null],
  ['Train','train','#5c6168','reserve',{bsp:'de_train',site:'Bombsite A'}],
  ['Vertigo','vertigo','#56677f','reserve',{bsp:'de_vertigo',site:'Bombsite A'}],
  ['Cobblestone','cbble','#5a634c','reserve',null],
  ['Tuscan','tuscan','#8c6239','reserve',null],
  ['Office','office','#4c6278','casual',null],
  ['Agency','agency','#3d5166','casual',null],
  ['Italy','italy','#7d5835','casual',null],
  ['Assault','assault','#49525e','casual',null],
  ['Shortdust','shortdust','#967846','wingman',{bsp:'de_shortdust',site:'Bombsite'}],
  ['Lake','lake','#2f5c6e','wingman',{bsp:'de_lake',site:'Bombsite'}],
  ['Boyard','boyard','#566343','wingman',null],     // maps d'opération retirées du Wingman (absentes des serveurs)
  ['Chalice','chalice','#4c4668','wingman',null],
  ['Aim Redline','aim_redline','#8a2b2b','duel',{bsp:'aim_redline'}],
  ['Aim Map','aim_map','#8d7547','duel',{bsp:'aim_map'}],
  ['AWP Lego 2','awp_lego_2','#3b6fd6','duel',{bsp:'awp_lego_2'}]
].map(([n,slug,c,g,wm])=>({n,slug,c,g,wm}));
const COMP_ROTATIONS=[
  {id:'s1',label:'Pool compétitif · Saison 1',next:'+Cache, +Train / -Anubis, -Overpass',maps:['Mirage','Inferno','Dust II','Nuke','Overpass','Ancient','Anubis']},
  {id:'s2',label:'Pool compétitif · Saison 2',next:'+Cobblestone, +Overpass / -Dust II, -Mirage',maps:['Mirage','Inferno','Dust II','Nuke','Ancient','Cache','Train']}
];
let rotIdx=0;
const curRot=()=>COMP_ROTATIONS[rotIdx];
const isCompMap=m=>curRot().maps.includes(m.n);
// maps 5v5 jouables sur nos serveurs (Cache, Cobblestone et Tuscan : server-cs/install/add-maps.sh) : celles qu'on peut voter pour la rotation (même liste que le serveur, lib/core.js)
const COMP_CANDIDATES=['Mirage','Inferno','Dust II','Nuke','Overpass','Ancient','Anubis','Vertigo','Train','Cache','Cobblestone','Tuscan'];
const isVoteMap=m=>COMP_CANDIDATES.includes(m.n);
const isWingmanMap=m=>!!m.wm;
const isAimMap=m=>m&&(m.g==='duel'||['Shortdust','Lake'].includes(m.n));
const canPlayMap=m=>state.mode==='wingman'?isWingmanMap(m):state.mode==='duel'?isAimMap(m):state.mode==='casual'?m.g!=='wingman'&&m.g!=='duel':isCompMap(m);
let mapSort='def',mapsMore=false;
const mapBg=m=>{const s=state.mode==='wingman'&&m.wm?.slug?m.wm.slug:m.slug;return `url('maps/${s}.jpg?v=2.50') center/cover no-repeat, linear-gradient(135deg,${m.c},#141518 80%)`};
// ping : mesuré par js/ping.js (null tant qu'aucun serveur n'a répondu)
const REGIONS=[{id:'EU',city:'Frankfurt',ping:null},{id:'NA',city:'Chicago',ping:null},{id:'AS',city:'Singapore',ping:null}];
REGIONS.forEach(r=>Object.defineProperty(r,'name',{get(){return t('r_'+r.id)}}));
const NAMES=['Nox','Rykov','Valk','Mizu','Tempest','KRONOS','lilith','Bastion','Echo','zenith','Raptor','Orca','Vex','Hyuga','Pyro','Saber','frost','Kaida','Juno','Ronin','Atlas','Shiba','Gl1tch','Nero','Sora','Viper','dmitry','b1ade','Sanya','Lynx','Hexa','ozzy',
  'mezii','Krest','vortex','Ankh','Drago','sh1ro','Polar','Fenrir','Maverick','yuki','Grom','Zaxx','Koda','Merc','Nightz','Ozone','Paxi','qwerty','Rook','Sly','T0xin','Ulti','Volt','Wraith','Xeno','Yarik','Zed','aleks','Borz','c0bra','Dusk','Ember','Flick','Ghost','Havok','Ion','Jinx','Kami','Lucid','Mamba','Noxi','Onyx','Phant','Quill','Rasko','Spectre','Tundra','Umbra','Vandal','Wolfie','Xray','Yeti','Zorya','Artyom','Bodya','Clutchy','Deagle','Elixir','Fury','Gambit','Hydra','Ivan','Jolt','Kiro','Loki','Maxim','Nikita','Oleg','Pasha','Riko','Stas','Tima','Vova','Zhenya'];
const COLORS=['#3b6fd6','#7a5cc4','#2e9d6c','#c9424d','#c08a1e','#2b8f80','#b0447a','#4f63d9','#c4562a','#5d6775'];
const REASONS=['cheat','toxic','grief','smurf'];

const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const LV=[0,801,951,1101,1251,1401,1551,1701,1851,2001];
const lvl=e=>LV.filter(x=>e>=x).length;
const lvlColor=l=>l===1?'#cfd3da':l<=3?'#3fcf8e':l<=7?'#f2b632':l<=9?'#ff8a3d':'#ef5560';
const isCalib=p=>!!(p&&p.me&&ME.calib&&!ME.calib.done);
const lvlHTML=(e,big=false,calib=false)=>{
  if(calib||(e===ME?.elo&&isCalib(ME))){
    const played=ME.calib?ME.calib.played:0,wins=ME.calib?ME.calib.wins:0;
    const R=15.0,C=2*Math.PI*R,arc=Math.max(0.12,played/3)*C,dash=`${arc.toFixed(1)} ${(C+2).toFixed(1)}`;
    return `<div class="lvl lvl-calib${big?' lvl-lg':''}" style="color:#ffb21f" title="${t('calib_tip',{p:played,w:wins})}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16.6" fill="#0b0c0e"/><circle cx="18" cy="18" r="${R}" fill="none" stroke="#22252d" stroke-width="2.8" stroke-dasharray="3.5 2.5"/><circle cx="18" cy="18" r="${R}" fill="none" stroke="#ffb21f" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="${dash}" transform="rotate(-90 18 18)"/><text x="18" y="23.88" text-anchor="middle" fill="currentColor" font-family="Rajdhani,sans-serif" font-weight="800" font-size="16.8">?</text></svg></div>`;
  }
  // le niveau 1-10 reste utilisé par le matchmaking ; à l'écran on montre le rang façon CS:GO + pastille niveau 1-10
  const r=rankOf(e),l=lvl(e),lc=lvlColor(l);
  return `<div class="lvl rk-lvl rk-${r.fam.id}${big?' lvl-lg':''}" title="${r.name} · Niv. ${l} · ${e} ELO">${rankSVG(r.fam,r.step,r.steps)}<span class="rk-lv-tag lv-c${l}" style="--lv-c:${lc}">${l}</span></div>`;
};
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const modeObj=()=>MODES.find(m=>m.id===state.mode);
const regObj=()=>REGIONS.find(r=>r.id===state.region);
const BASE_TITLE=document.title;

/* =====================================================
   TRUST FACTOR
   trust = 10 − (reports ÷ matchs × 10)   (sur 10)
   ex. 2 reports sur 10 matchs → −2 → 8/10
   ===================================================== */
const TIERS=[{id:'high',min:8,c:'var(--green)'},{id:'mid',min:6,c:'var(--blue)'},{id:'low',min:4,c:'var(--orange)'},{id:'vlow',min:0,c:'var(--red)'}];
const trust=p=>Math.max(0,Math.min(10,10-(p.reports/Math.max(1,p.matches))*10));
const tierOf=p=>TIERS.find(x=>trust(p)>=x.min);
const tierIdx=p=>TIERS.indexOf(tierOf(p));
const tierName=tr=>t('tier_'+tr.id);
const tfHTML=p=>{const tr=tierOf(p);return `<span class="tf" style="--c:${tr.c}" title="${t('trust')} ${trust(p).toFixed(1)}/10 · ${tierName(tr)}">${ICON.shield}${trust(p).toFixed(1)}</span>`};
const partyTier=()=>TIERS[Math.max(...state.party.map(tierIdx))];

const ME={name:'Joueur',elo:1000,color:'#c4562a',me:true,plan:'free',career:0,reports:0,reasons:{cheat:0,toxic:0,grief:0,smurf:0},
  steam:{linked:false,id:null},history:[],avatar:null,banner:{type:'map',slug:'mirage'},since:new Date(),country:'FR'};
Object.defineProperty(ME,'matches',{get(){return ME.career+ME.history.length}});

function resetMeDefaults(){
  ME.name='Joueur';
  ME.elo=1000;
  ME.eloWm=1000;
  ME.eloDuel=1000;
  ME.color='#c4562a';
  ME.plan='free';
  ME.planSource=null;
  ME.influencer=null;
  ME.career=0;
  ME.reports=0;
  ME.reasons={cheat:0,toxic:0,grief:0,smurf:0};
  ME.steam={linked:false,id:null};
  ME.history=[];
  ME.avatar=null;
  ME.steamAvatar=null;
  ME.banner={type:'map',slug:'mirage'};
  ME.cardStyle='default';
  ME.bgStyle='default';
  ME.since=new Date();
  ME.country='FR';
  ME.dev=false;
  ME.beta=false;
  ME.email=null;
  ME.nameChangedAt=0;
  ME.calib={done:false,played:0,wins:0};
  try{localStorage.removeItem('cs_profile')}catch(_){}
  try{localStorage.removeItem('tr_pending_name')}catch(_){}
  try{sessionStorage.removeItem('tr_pending_name')}catch(_){}
  if(typeof LOOKC!=='undefined'&&LOOKC.clear)try{LOOKC.clear()}catch(_){}
  if(typeof FBS!=='undefined'){FBS.loaded=false;FBS.lastHash='';}
  const setEl=(id,val,prop='textContent')=>{const el=document.getElementById(id);if(el)el[prop]=val};
  setEl('topName','');
  setEl('topAv','','innerHTML');
  setEl('topElo','');
  setEl('topLvl','','innerHTML');
  setEl('umName','');
  setEl('umMail','');
  setEl('topBadges','','innerHTML');
  setEl('liLogin','','value');
  setEl('liPass','','value');
  setEl('reUser','','value');
  setEl('reMail','','value');
  setEl('rePass','','value');
  setEl('rePass2','','value');
}
window.resetMeDefaults=resetMeDefaults;
let mmSort=true;try{mmSort=localStorage.getItem('tr_mmsort')!=='0'}catch(e){}
const state={mode:'ranked',maps:new Set(MAPS.filter(m=>m.g==='active').map(m=>m.n)),region:'EU',party:[ME],searching:false};
let used=new Set([ME.name]);
/* Registre : chaque joueur garde la même identité (profil, trust, historique) */
const REG=new Map();
const COUNTRIES=['FR','RU','DE','UA','PL','KZ','SE','ES','BY','RS','CZ','BE'];
function makePlayer(name,base,tierId,spread=180,minTrust=0){
  const matches=0;
  const reports=0;
  const reasons={cheat:0,toxic:0,grief:0,smurf:0};
  return {name,elo:Math.max(600,Math.min(2600,base+rnd(-spread,spread))),color:pick(COLORS),matches,reports,reasons,
    banner:{type:'map',slug:pick(MAPS).slug},steamId:null,
    since:new Date(),plan:'free',country:pick(COUNTRIES),lastPlayed:0,history:[]};
}
function newPlayer(base,tierId,spread=180,minTrust=0){
  const reuse=[...REG.values()].filter(p=>!p.me&&!p.friend&&!used.has(p.name)&&tierOf(p).id===tierId&&Math.abs(p.elo-base)<=spread&&trust(p)>=minTrust);
  if(reuse.length&&Math.random()<.35){const p=pick(reuse);used.add(p.name);return p}
  let n=pick(NAMES),guard=0;
  while((REG.has(n)||used.has(n))&&guard++<80)n=pick(NAMES);
  while(REG.has(n)||used.has(n))n=pick(NAMES)+rnd(10,999);
  used.add(n);
  const p=makePlayer(n,base,tierId,spread,minTrust);REG.set(n,p);return p;
}
const randomTier=()=>{const r=Math.random();return r<.72?'high':r<.86?'mid':r<.95?'low':'vlow'};
const maxParty=()=>state.mode==='duel'?2:state.mode==='wingman'?2:5;
const FRIENDS=[];
function initFriends(){
  REG.set(ME.name,ME);
  used=new Set([ME.name]);
  FRIENDS.length=0;
  try{
    const saved=JSON.parse(localStorage.getItem('tr_friends')||'[]');
    if(Array.isArray(saved)){
      saved.forEach(f=>{
        const p=makePlayer(f.name,+f.elo||1500,'high',0);
        p.elo=+f.elo||1500;p.color=f.color||COLORS[0];p.friend=true;p.status=f.status||'offline';
        REG.set(p.name,p);FRIENDS.push(p);
      });
    }
  }catch(e){}
}
function invite(p){
  if(locked()||!p)return;
  if(typeof sendPartyInvite==='function')return sendPartyInvite(p.name);   // vraie invitation (boîte du joueur, groupe créé si besoin)
  if(state.party.includes(p))return toast(t('in_party'));
  if(state.party.length>=maxParty())return toast(t('party_full'));
  if(typeof fbReq==='function'&&typeof PL!=='undefined'&&PL.code){
    const tBox=typeof fbMailbox==='function'?fbMailbox(p.name):p.name.toLowerCase();
    fbReq(`invites/${tBox}/${PL.code}`,'PUT',{from:ME.name,mode:state.mode,code:PL.code,at:Date.now()});
    if(typeof triggerFastInvitePoll==='function')triggerFastInvitePoll(15000);
  }
  toast(t('invited',{n:p.name}));
}

/* ---------- Avatars / bannières ---------- */
// données d'autres joueurs injectées dans un style : seules une image (data:/https) ou une couleur #hex passent
const safeImg=u=>typeof u==='string'&&/^(data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|https:\/\/[^'"()<>\s\\]+)$/.test(u)?u:null;
const safeCol=c=>typeof c==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(c)?c:'#3b3f47';
function bannerCSS(b){
  if(b&&b.type==='img'&&safeImg(b.data))return `url('${b.data}') center/cover`;
  if(b&&b.type==='map'){const m=MAPS.find(x=>x.slug===b.slug);if(m)return `linear-gradient(135deg,${m.c} 0%,#141518 85%)`}
  return 'linear-gradient(135deg,#23262d,#16171b)';
}
// photo choisie sur le site (avatar, data:) puis photo Steam (steamAvatar) : deux champs séparés, jamais écrasés l'un par l'autre
const avSrc=p=>p?(safeImg(p.avatar)||safeImg(p.steamAvatar)):null;
function putAv(p,a){if(!p||typeof a!=='string')return;if(/^data:image\//.test(a)){if(safeImg(a))p.avatar=a}else if(safeImg(a))p.steamAvatar=a}
// liste venue de profiles/ (avatar = photo Steam) : on la range dans steamAvatar
const steamRows=rows=>{(rows||[]).forEach(r=>{if(r&&r.avatar&&!/^data:image\//.test(r.avatar)){r.steamAvatar=r.avatar;r.avatar=null}});return rows};
function avStyle(p){const a=avSrc(p);return a?`background-image:url('${a}');background-color:#222;background-size:cover;background-position:center;background-repeat:no-repeat`:`background:${safeCol(p&&p.color)}`}
const avInner=p=>avSrc(p)?'':escA(String((p&&p.name)||'?')[0].toUpperCase());
const ANIM_CARD_IDS=new Set(['radar','sakura','aurora','cyberpunk','retrowave','toxic','storm','frost','magma','oni','hyperdrive','dark_matter','singularity','sovereign','blood_moon','void_walker','solar_flare','neon_tokyo']);
function getAvatarFrame(p){
  if(!p)return '';
  let cs='default';
  if(typeof cardStyleOf==='function')cs=cardStyleOf(p);
  else if(p.cardStyle)cs=p.cardStyle;
  else if(typeof ME!=='undefined'&&ME&&(p===ME||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())))cs=ME.cardStyle||'default';
  if(!cs||cs==='default')return '';
  const anim=ANIM_CARD_IDS.has(cs)?' av-anim':'';
  return ` av-frame av-frame-${cs}${anim}`;
}
const avHTML=(p,sz)=>{
  const pr=prestigeOf(p),frame=getAvatarFrame(p);
  const s=sz?`;width:${sz}px;height:${sz}px;min-width:${sz}px;min-height:${sz}px;max-width:${sz}px;max-height:${sz}px;flex:0 0 ${sz}px;`:'';
  return `<div class="avatar${pr?' pr-'+pr.k:''}${frame}" style="${avStyle(p)}${s}">${avInner(p)}</div>`;
};

/* ---------- Son ---------- */
let AC;
function beep(f=880,d=.12,delay=0,type='sine',vol=.05){
  if(typeof SET!=='undefined'&&SET&&SET.notif&&!SET.notif.sounds)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const tm=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,tm);g.gain.linearRampToValueAtTime(vol,tm+.01);g.gain.exponentialRampToValueAtTime(.0001,tm+d);
    o.connect(g).connect(AC.destination);o.start(tm);o.stop(tm+d+.05);}catch(e){}
}

