(function(){
  const KEY='tr_music',NOW='tr_music_now',MAX_LINKS=30;
  const LAYOUTS=[['bar','mu_l_bar','left:0;right:0;bottom:0;height:5px'],['bl','mu_l_bl','left:2px;bottom:2px;width:12px;height:6px'],['br','mu_l_br','right:2px;bottom:2px;width:12px;height:6px'],['tl','mu_l_tl','left:2px;top:2px;width:12px;height:6px'],['tr','mu_l_tr','right:2px;top:2px;width:12px;height:6px'],['side','mu_l_side','right:0;top:0;bottom:0;width:9px'],['free','mu_l_free','left:9px;top:6px;width:12px;height:7px']];
  const SC_API='https://w.soundcloud.com/player/api.js';
  const I={
    fr:{mu_title:'Musique',mu_open:'Ouvrir le lecteur',mu_close:'Réduire le lecteur',mu_play:'Lecture ou pause',mu_prev:'Morceau précédent',mu_next:'Morceau suivant',mu_seek:'Position dans le morceau',mu_vol:'Volume',mu_ph:'Lien SoundCloud ou titre à chercher',mu_add:'Lire',mu_remove:'Retirer ce lien',mu_bad:'Ce lien n\'est pas un lien SoundCloud valide',mu_fail:'Ce lecteur n\'a pas pu se charger',mu_note:'Morceau, playlist ou profil. Ajoute plusieurs liens : ils s\'enchaînent tout seuls. SoundCloud n\'est contacté qu\'une fois un lien collé.',mu_loop:'Lecture en continu',mu_mduck:'Baisser la musique quand un match est trouvé',mu_mpause:'Mettre en pause quand le match commence',mu_level:'Égaliser le volume entre les morceaux',mu_window:'Placement du lecteur',mu_l_bar:'Barre en bas',mu_l_bl:'En bas à gauche',mu_l_br:'En bas à droite',mu_l_tr:'En haut à droite',mu_l_tl:'En haut à gauche',mu_l_side:'Colonne à droite',mu_l_free:'Fenêtre libre',mu_discover:'SoundCloud ne permet pas de lire ses mixes personnels sur un autre site. Utilise une playlist publique.',mu_nolink:'SoundCloud ne donne aucun morceau pour ce lien : il est privé ou ne peut pas être lu ici',mu_search:'Recherche ouverte sur SoundCloud : colle ici le lien du morceau choisi',mu_show:'Lecteur de musique',mu_show_h:'Affiche le lecteur SoundCloud et son entrée dans le menu'},
    en:{mu_title:'Music',mu_open:'Open the player',mu_close:'Collapse the player',mu_play:'Play or pause',mu_prev:'Previous track',mu_next:'Next track',mu_seek:'Track position',mu_vol:'Volume',mu_ph:'SoundCloud link or title to search',mu_add:'Play',mu_remove:'Remove this link',mu_bad:'This is not a valid SoundCloud link',mu_fail:'This player could not load',mu_note:'Track, playlist or profile. Add several links and they play one after another. SoundCloud is only contacted once you paste a link.',mu_loop:'Continuous playback',mu_mduck:'Lower the music when a match is found',mu_mpause:'Pause when the match starts',mu_level:'Even out volume between tracks',mu_window:'Player position',mu_l_bar:'Bottom bar',mu_l_bl:'Bottom left',mu_l_br:'Bottom right',mu_l_tr:'Top right',mu_l_tl:'Top left',mu_l_side:'Right column',mu_l_free:'Free window',mu_discover:'SoundCloud does not allow its personal mixes to play on other sites. Use a public playlist.',mu_nolink:'SoundCloud returns no track for this link: it is private or cannot be played here',mu_search:'Search opened on SoundCloud: paste the link of the track you pick here',mu_show:'Music player',mu_show_h:'Show the SoundCloud player and its menu entry'},
    ru:{mu_title:'Музыка',mu_open:'Открыть плеер',mu_close:'Свернуть плеер',mu_play:'Воспроизведение или пауза',mu_prev:'Предыдущий трек',mu_next:'Следующий трек',mu_seek:'Позиция в треке',mu_vol:'Громкость',mu_ph:'Ссылка SoundCloud или название для поиска',mu_add:'Играть',mu_remove:'Удалить ссылку',mu_bad:'Это неверная ссылка SoundCloud',mu_fail:'Не удалось загрузить плеер',mu_note:'Трек, плейлист или профиль. Добавь несколько ссылок, и они будут играть одна за другой. SoundCloud подключается только после вставки ссылки.',mu_loop:'Непрерывное воспроизведение',mu_mduck:'Приглушать музыку, когда матч найден',mu_mpause:'Ставить на паузу при начале матча',mu_level:'Выравнивать громкость треков',mu_window:'Положение плеера',mu_l_bar:'Панель внизу',mu_l_bl:'Внизу слева',mu_l_br:'Внизу справа',mu_l_tr:'Вверху справа',mu_l_tl:'Вверху слева',mu_l_side:'Колонка справа',mu_l_free:'Свободное окно',mu_discover:'SoundCloud не разрешает воспроизводить личные миксы на других сайтах. Используйте публичный плейлист.',mu_nolink:'SoundCloud не вернул треков по этой ссылке: она закрыта или не воспроизводится здесь',mu_search:'Поиск открыт на SoundCloud: вставьте сюда ссылку на выбранный трек',mu_show:'Музыкальный плеер',mu_show_h:'Показывать плеер SoundCloud и его пункт в меню'}
  };
  for(const l in I)Object.assign(I18N[l],I[l]);

  const ic=(d,s=18)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  const IC={note:'M9 18.5a3 3 0 1 1-2-2.83V5l12-2.5v12.99a3 3 0 1 1-2-2.83V7.4L9 9.07z',play:'M8 5v14l11-7z',pause:'M7 5h3.5v14H7zm6.5 0H17v14h-3.5z',prev:'M6 5h2.2v14H6zm3.8 7L19 5.5v13z',next:'M15.8 5H18v14h-2.2zM5 5.5 14.2 12 5 18.5z',chev:'M7.4 15.4 12 10.8l4.6 4.6L18 14l-6-6-6 6z',win:'M4 5h16v14H4V5zm2 4v8h12V9H6z',heart:'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'};

  const CSS=`
#trMusic{position:fixed;left:var(--trm-left,0px);right:0;bottom:0;z-index:70;color:var(--text);font-size:13px;background:#0b0e13;border-top:1px solid var(--line2);transform:translateY(105%);visibility:hidden;transition:transform .3s cubic-bezier(.32,.72,0,1),visibility .3s}
#trMusic.docked{transform:none;visibility:visible}
#trMusic{container-type:inline-size}
#trMusic.float{left:0;top:0;right:auto;bottom:auto;z-index:90;width:var(--trm-w,460px);border:1px solid var(--line2);border-radius:10px;overflow:hidden;box-shadow:0 14px 36px rgba(0,0,0,.5);transform:translate3d(var(--trm-x,0px),var(--trm-y,0px),0);visibility:visible}
#trMusic.dragging{transition:none!important;opacity:.94}
#trMusic.dragging iframe{pointer-events:none}
#trmSnap{position:fixed;left:0;top:0;z-index:85;pointer-events:none;opacity:0;border:1px solid rgba(var(--acc-rgb),.75);background:rgba(var(--acc-rgb),.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:20px;transition:transform .24s cubic-bezier(.32,.72,0,1),width .24s cubic-bezier(.32,.72,0,1),height .24s cubic-bezier(.32,.72,0,1),border-radius .24s,opacity .16s}
#trmSnap.on{opacity:1}
#trMusic[hidden]{display:none}
#trMusic button{background:none;border:none;color:inherit;cursor:pointer;font:inherit}
.app>.main::after{content:'';display:block;height:var(--trm-h,0px)}
.app{padding-right:var(--trm-side,0px);transition:padding-right .28s cubic-bezier(.32,.72,0,1)}
#trMusic.side{left:auto;right:0;top:0;bottom:0;width:340px;transform:none;visibility:visible;border-top:none;border-left:1px solid var(--line2);overflow-y:auto}
#trMusic.side .trm-panel{grid-template-rows:1fr}
#trMusic.side .trm-toggle{display:none}
#trMusic.side .trm-bar{cursor:default}
#trMusic.side .trm-cols{display:block;max-height:none;padding:2px 12px 14px}
#trMusic.side .trm-col-tracks,#trMusic.side .trm-col-links{max-height:none;margin-top:10px}
@keyframes trmFade{from{opacity:0}to{opacity:1}}
.trm-moved{animation:trmFade .28s ease-out}
#trmLayout{position:fixed;z-index:95;width:210px;padding:6px;background:#0f1218;border:1px solid var(--line2);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.5);animation:trmRise .2s ease-out}
#trmLayout button{display:flex;align-items:center;gap:10px;width:100%;padding:7px 8px;background:none;border:none;border-radius:5px;color:var(--muted);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;transition:color .15s,background .15s}
#trmLayout button:hover{background:var(--panel3);color:var(--text)}
#trmLayout button.on{color:var(--text);font-weight:600}
.trm-mi{position:relative;flex:none;width:30px;height:20px;border:1px solid var(--line2);border-radius:3px;overflow:hidden}
.trm-mi i{position:absolute;background:var(--muted)}
#trmLayout button.on .trm-mi i{background:var(--acc)}
.dock{bottom:calc(18px + var(--trm-h,0px));right:calc(18px + var(--trm-side,0px));transition:bottom .28s cubic-bezier(.32,.72,0,1),right .28s cubic-bezier(.32,.72,0,1)}
.toast{bottom:calc(24px + var(--trm-h,0px))}
.upd-bar{bottom:calc(18px + var(--trm-h,0px))}
.rail .rail-btn.trm-on,.rail .rail-btn.trm-live{color:var(--acc)}
@keyframes trmSwap{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.trm-swap{animation:trmSwap .22s ease-out}
.trm-aura{position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:0}
.trm-line,.trm-bar,.trm-panel{position:relative;z-index:1}
.trm-grip{z-index:2}
@keyframes trmRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
#trMusic.open .trm-col{animation:trmRise .5s cubic-bezier(.32,.72,0,1) backwards}
#trMusic.open .trm-col-tracks{animation-delay:.07s}
#trMusic.open .trm-col-links{animation-delay:.14s}
@keyframes trmBreath{0%,100%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),.28)}50%{box-shadow:0 0 0 7px rgba(var(--acc-rgb),0)}}
#trMusic.playing .trm-play{animation:trmBreath 3.6s ease-in-out infinite}
.trm-line{display:none;position:relative;height:18px;background:transparent;touch-action:pan-y;cursor:pointer}
.trm-line::before{content:'';position:absolute;left:10px;right:10px;top:8px;height:2px;border-radius:2px;background:var(--line2)}
.trm-line i{position:absolute;left:10px;top:8px;display:block;height:2px;width:0;border-radius:2px;background:var(--acc);pointer-events:none}
.trm-line:focus-visible{outline:2px solid var(--acc);outline-offset:-2px;border-radius:4px}
.trm-bar{cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr) minmax(0,1fr);align-items:center;gap:16px;height:68px;padding:0 16px}
.trm-left,.trm-center,.trm-right{display:flex;align-items:center;min-width:0}
.trm-left{gap:10px}
.trm-center{gap:14px}
.trm-right{justify-content:flex-end;gap:10px}
#trMusic .trm-art{position:relative;flex:0 0 44px;width:44px;height:44px;display:grid;place-items:center;overflow:hidden;border-radius:6px;color:var(--muted);background:var(--panel3)}
.trm-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
#trMusic.playing .trm-art img{transform:scale(1.08)}
#trMusic.float .trm-cols{max-height:var(--trm-win-h,300px);overflow-y:auto}
#trMusic.float .trm-col-tracks,#trMusic.float .trm-col-links{max-height:none}
.trm-grip{display:none;position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 55%,var(--line2) 55%,var(--line2) 65%,transparent 65%,transparent 78%,var(--line2) 78%)}
#trMusic.free .trm-grip{display:block}
.trm-art img[hidden]{display:none}
.trm-eq{position:absolute;inset:0;display:none;align-items:flex-end;justify-content:center;gap:3px;padding-bottom:10px;background:rgba(0,0,0,.5)}
#trMusic.playing .trm-eq{display:flex}
.trm-eq i{width:3px;height:20px;background:var(--acc);transform-origin:bottom;animation:trmEq .9s ease-in-out infinite alternate}
.trm-eq i:nth-child(2){animation-delay:-.45s}
.trm-eq i:nth-child(3){animation-delay:-.7s}
@keyframes trmEq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.trm-info{min-width:0;line-height:1.3}
.trm-t,.trm-s{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trm-t{color:var(--text);font-weight:600;text-decoration:none}
a.trm-t:hover{color:var(--acc)}
.trm-s{color:var(--muted);font-size:11.5px}
.trm-c{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:6px;color:var(--muted)!important;transition:color .15s,background .15s,transform .1s}
.trm-c:hover{color:var(--text)!important;background:var(--panel3)!important}
.trm-c:active{transform:scale(.88)}
#trMusic .trm-play{width:36px;height:36px;color:var(--on-acc)!important;background:var(--acc);border-radius:50%}
#trMusic .trm-play:hover{color:var(--on-acc)!important;background:var(--acc-h)!important}
.trm-toggle svg{transition:transform .24s ease}
#trMusic.open .trm-toggle svg{transform:rotate(180deg)}
.trm-transport{display:flex;align-items:center;gap:4px;flex:none}
.trm-v{-webkit-appearance:none;appearance:none;width:100%;height:4px;margin:0;border-radius:2px;background:linear-gradient(var(--acc),var(--acc)) no-repeat,var(--line2);background-size:var(--p,0%) 100%;cursor:pointer}
.trm-v::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--text)}
.trm-v::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:var(--text)}
.trm-vol{display:flex;align-items:center;width:110px;flex:none}
.trm-vol[hidden]{display:none}
.trm-seek{flex:1;display:flex;align-items:center;gap:8px;min-width:0;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
.trm-wave-box{position:relative;flex:1;min-width:0;height:32px}
.trm-wave-box canvas{position:absolute;inset:0;width:100%;height:100%}
.trm-range{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.trm-wave-box:has(:focus-visible){outline:1px solid var(--acc);outline-offset:2px}
#trMusic.is-empty .trm-center,#trMusic.is-empty .trm-s{display:none}
.trm-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s cubic-bezier(.32,.72,0,1)}
#trMusic.open .trm-panel{grid-template-rows:1fr}
.trm-panel-in{min-height:0;overflow:hidden}
.trm-cols{display:grid;grid-template-columns:minmax(260px,320px) minmax(0,1fr) minmax(260px,360px);gap:20px;padding:2px 16px 14px}
#trMusic.no-tracks .trm-cols{grid-template-columns:minmax(260px,320px) minmax(0,460px)}
#trMusic.no-tracks .trm-col-tracks{display:none}
#trMusic.is-empty .trm-cols{grid-template-columns:minmax(0,460px)}
#trMusic.is-empty .trm-col-player{display:none}
.trm-col-tracks,.trm-col-links{max-height:170px;overflow-y:auto}
.trm-frame iframe{display:block;width:100%;border:0;border-radius:6px}
#trMusic .trm-track{display:flex;gap:8px;width:100%;padding:5px 8px;border-radius:5px;text-align:left;color:var(--muted);font-size:12px;transition:color .15s,background .15s}
#trMusic .trm-track[hidden]{display:none}
#trMusic .trm-track:hover{background:var(--panel3);color:var(--text)}
#trMusic .trm-track.on{color:var(--acc);font-weight:600;background:var(--panel2)}
.trm-track i{flex:none;width:18px;text-align:right;font-style:normal;font-variant-numeric:tabular-nums;color:var(--dim)}
.trm-track span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trm-tracks{position:relative}
.trm-form{display:flex;gap:6px}
.trm-form input{flex:1;min-width:0;height:34px;padding:0 10px;color:var(--text);background:var(--bg2);border:1px solid var(--line2);border-radius:6px;font:inherit}
.trm-form input:focus{outline:none;border-color:var(--acc)}
#trMusic .trm-add{flex:none;height:34px;padding:0 14px;color:var(--on-acc);background:var(--acc);border-radius:6px;font-weight:700}
.trm-list{margin-top:8px}
.trm-row{display:flex;align-items:center;border-radius:5px;animation:trmSwap .2s ease-out}
.trm-row:hover{background:var(--panel3)}
.trm-row.on{background:var(--panel2)}
#trMusic .trm-go{flex:1;min-width:0;padding:6px 8px;text-align:left;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#trMusic .trm-row.on .trm-go{color:var(--acc);font-weight:600}
#trMusic .trm-x{flex:none;width:26px;height:26px;color:var(--dim);font-size:15px;line-height:1}
#trMusic .trm-x:hover{color:var(--red)}
.trm-loop{display:flex;align-items:center;gap:8px;margin-top:8px;color:var(--muted);font-size:12px;cursor:pointer}
.trm-loop[hidden]{display:none}
.trm-loop+.trm-loop{margin-top:4px}
.trm-loop input{accent-color:var(--acc)}
.trm-like[hidden]{display:none}
#trMusic .trm-like.on{color:var(--red)!important}
@keyframes trmPop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
.trm-like.pop svg{animation:trmPop .34s cubic-bezier(.3,1.5,.5,1)}
.trm-acct{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;margin-top:8px;font-size:12px;color:var(--muted)}
#trMusic .trm-a{padding:0;color:var(--text);font-size:12px;font-weight:600;transition:color .15s}
#trMusic .trm-a:hover{color:var(--acc)}
#trMusic .trm-a.cta{padding:6px 12px;border:1px solid var(--line2);border-radius:6px}
.trm-results{margin-top:8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.trm-results:empty{display:none}
.trm-hit{display:flex;align-items:center;border-radius:5px;animation:trmSwap .2s ease-out}
.trm-hit:hover{background:var(--panel3)}
#trMusic .trm-hit-go{flex:1;min-width:0;padding:5px 8px;text-align:left;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trm-hit-go small{color:var(--muted);font-size:11px;margin-left:6px}
.trm-ext{flex:none;width:24px;text-align:center;color:var(--dim);font-size:12px;text-decoration:none}
.trm-ext:hover{color:var(--acc)}
.trm-track{align-items:center}
.trm-note{margin-top:8px;font-size:11.5px;line-height:1.45;color:var(--dim)}
/* ---------- Matières iOS ---------- */
#trMusic{font-family:var(--font-main);letter-spacing:-.01em;background:rgba(28,28,30,.78);backdrop-filter:saturate(180%) blur(28px);-webkit-backdrop-filter:saturate(180%) blur(28px);border-top:.5px solid rgba(255,255,255,.14)}
#trMusic.float{border:.5px solid rgba(255,255,255,.16);border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.55)}
#trMusic.side{border-top:none;border-left:.5px solid rgba(255,255,255,.14)}
#trMusic .trm-art{border-radius:10px}
#trMusic .trm-c{border-radius:50%}
#trMusic .trm-play{background:#f5f5f7;color:#000!important;box-shadow:0 2px 8px rgba(0,0,0,.35)}
#trMusic .trm-play:hover{background:#fff!important;color:#000!important}
.trm-frame iframe{border-radius:14px}
.trm-col-tracks,.trm-col-links{padding:8px;border-radius:14px;background:rgba(118,118,128,.12)}
#trMusic.no-tracks .trm-col-tracks{padding:0}
.trm-col-tracks:empty{display:none}
.trm-form input{height:36px;border:none;border-radius:10px;background:rgba(118,118,128,.24);padding:0 12px}
.trm-form input:focus{background:rgba(118,118,128,.32);box-shadow:0 0 0 2px rgba(var(--acc-rgb),.55)}
#trMusic .trm-add{height:36px;border-radius:10px;background:#f5f5f7;color:#000}
#trMusic .trm-a.cta{border:none;border-radius:10px;background:rgba(118,118,128,.24);padding:8px 14px}
#trMusic .trm-track,.trm-row,.trm-hit{border-radius:10px}
#trMusic .trm-track.on,.trm-row.on{background:rgba(118,118,128,.28)}
.trm-results{border-bottom:.5px solid rgba(255,255,255,.12)}
.trm-v{height:4px;background:linear-gradient(#f5f5f7,#f5f5f7) no-repeat,rgba(120,120,128,.36);background-size:var(--p,0%) 100%}
.trm-v::-webkit-slider-thumb{width:18px;height:18px;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.45)}
.trm-v::-moz-range-thumb{width:18px;height:18px;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.45)}
.trm-loop{justify-content:space-between;flex-direction:row-reverse;margin-top:10px}
.trm-loop input{-webkit-appearance:none;appearance:none;position:relative;flex:none;width:40px;height:24px;margin:0;border-radius:999px;background:rgba(120,120,128,.36);cursor:pointer;transition:background .25s}
.trm-loop input::after{content:'';position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.35);transition:transform .28s cubic-bezier(.32,.72,0,1)}
.trm-loop input:checked{background:#34c759}
.trm-loop input:checked::after{transform:translateX(16px)}
#trmLayout{width:230px;padding:0;overflow:hidden;background:rgba(40,40,42,.82);backdrop-filter:saturate(180%) blur(28px);-webkit-backdrop-filter:saturate(180%) blur(28px);border:.5px solid rgba(255,255,255,.16);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);transform-origin:bottom right;animation:trmMenu .24s cubic-bezier(.32,.72,0,1)}
@keyframes trmMenu{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:none}}
#trmLayout button{padding:11px 14px;border-radius:0;color:var(--text);font-size:13.5px;border-bottom:.5px solid rgba(255,255,255,.1)}
#trmLayout button:last-child{border-bottom:none}
#trmLayout button.on::after{content:'✓';margin-left:auto;color:var(--text);font-weight:600}
@media(prefers-reduced-motion:reduce){#trMusic,#trMusic *,.dock{animation:none!important;transition:none!important}.trm-eq i{transform:scaleY(.6)}}
html.rm #trMusic,html.rm #trMusic *,html.rm .dock{animation:none!important;transition:none!important}
@container (max-width:1000px){
  .trm-vol{display:none}
  .trm-cols,#trMusic.no-tracks .trm-cols{grid-template-columns:minmax(220px,300px) minmax(0,1fr)}
  .trm-col-player{grid-row:1/3}
  .trm-col-tracks{max-height:90px}
  .trm-col-links{max-height:120px}
}
@container (max-width:620px){
  .trm-bar{grid-template-columns:minmax(0,1fr) auto;height:auto;gap:6px 10px;padding:8px 12px}
  .trm-center{grid-column:1/-1;grid-row:2}
  .trm-cols,#trMusic.no-tracks .trm-cols,#trMusic.is-empty .trm-cols{display:block;padding:2px 12px 12px}
  .trm-col-tracks,.trm-col-links{max-height:none;margin-top:10px}
}
@media(max-width:720px){
  #trMusic{left:0;bottom:calc(var(--mnav-h,60px) + var(--safe-b,0px))}
  .dock{bottom:calc(var(--mnav-h) + var(--safe-b) + 12px + var(--trm-h,0px))}
  .toast{bottom:calc(var(--mnav-h) + var(--safe-b) + 14px + var(--trm-h,0px))}
  .trm-line{display:block}
  .trm-bar{grid-template-columns:minmax(0,1fr) auto auto;gap:6px;height:58px;padding:0 10px}
  .trm-center{gap:0}
  .trm-seek,.trm-prev,.trm-win{display:none!important}
  .trm-bar{cursor:default;touch-action:auto;grid-template-columns:minmax(0,1fr) auto auto;height:58px;padding:0 10px}
  .trm-center{grid-column:auto;grid-row:auto}
  .trm-cols,#trMusic.no-tracks .trm-cols,#trMusic.is-empty .trm-cols{display:block;max-height:56vh;overflow-y:auto;padding:2px 10px 12px}
  .trm-col-tracks,.trm-col-links{max-height:none;margin-top:10px}
  .trm-col-player{grid-row:auto}
}

`;

  const clampVol=v=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(100,Math.max(0,n)):60};
  function readCfg(){
    let c=null;
    try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    c=c&&typeof c==='object'?c:{};
    const raw=Array.isArray(c.list)?c.list:c.url?[{url:c.url}]:[];
    const list=raw.map(x=>({url:parse(x&&x.url),title:String(x&&x.title||'').slice(0,120)})).filter(x=>x.url).slice(0,MAX_LINKS);
    const at=Math.floor(Number(c.at))||0;
    const wn=c.win&&typeof c.win==='object'?c.win:{},num=(v,min,max,d)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):d};
    const win={mode:LAYOUTS.some(l=>l[0]===wn.mode)?wn.mode:wn.on?'free':'bar',x:num(wn.x,-1,9999,-1),y:num(wn.y,-1,9999,-1),w:num(wn.w,320,1100,460),h:num(wn.h,160,700,300)};
    return {list,win,level:c.level!==false,matchDuck:c.matchDuck!==false,matchPause:c.matchPause!==false,at:Math.min(Math.max(0,list.length-1),Math.max(0,at)),loop:c.loop!==false,open:!!c.open,vol:clampVol(c.vol),hidden:!!c.hidden};
  }
  const cur=()=>cfg.list[cfg.at]||null;
  const writeCfg=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};

  function parse(raw){
    let u;
    try{u=new URL(String(raw||'').trim())}catch(e){return null}
    if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
    const host=u.hostname.toLowerCase().replace(/^(www|m)\./,'');
    if((host==='soundcloud.com'||host==='on.soundcloud.com')&&/^\/[\w%./-]+$/.test(u.pathname))
      return `https://${host}${u.pathname.replace(/\/$/,'')}`;
    return null;
  }

  let cfg,box,$q,railBtn=null,engine=null,gen=0,seeking=false,alertPaused=false,wave=[],waveUrl='',waveGrow=1,trackSig='',trackAt=-1,artist=null,curId=null,hits=null,likeChecked=null;
  let savedAt=0,pendingSeek=null,resume=null;
  function saveNow(force){
    const n=performance.now();
    if(!force&&n-savedAt<1000)return;
    const item=cur();
    if(!item)return;
    savedAt=n;
    try{sessionStorage.setItem(NOW,JSON.stringify({url:item.url,idx:Math.max(0,trackAt),pos:S.pos,playing:S.playing,at:Date.now()}))}catch(e){}
  }
  function readNow(){
    try{
      const v=JSON.parse(sessionStorage.getItem(NOW)||'null');
      return v&&v.playing&&v.url&&Date.now()-v.at<3*3600e3?v:null;
    }catch(e){return null}
  }
  let trackGain=1,fade=0,duck=1,fadeGoal=null,softBusy=false,softT=0,matchLow=false;
  const ramps={};
  const applyVol=()=>{if(engine&&engine.vol)engine.vol(Math.round(cfg.vol*trackGain*fade*duck))};
  function ramp(name,to,ms){
    clearInterval(ramps[name]);
    const from=name==='fade'?fade:duck,t0=performance.now();
    ramps[name]=setInterval(()=>{
      const k=Math.min(1,(performance.now()-t0)/ms),v=from+(to-from)*k;
      if(name==='fade')fade=v;else duck=v;
      applyVol();
      if(k>=1){clearInterval(ramps[name]);ramps[name]=null}
    },70);
  }
  function fadeTo(to,ms){if(fadeGoal!==to){fadeGoal=to;ramp('fade',to,ms)}}
  function fadeThen(action,ms=340){
    if(!S.playing||!engine||fade<.02)return action();
    softBusy=true;fadeTo(0,ms);
    clearTimeout(softT);
    softT=setTimeout(()=>{softBusy=false;action()},ms+50);
  }
  const S={playing:false,pos:0,dur:0};
  const fmt=ms=>{const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

  function loadScript(src){
    return new Promise((ok,ko)=>{
      const old=document.querySelector(`script[src="${src}"]`);
      if(old){if(old.dataset.ready)return ok();old.addEventListener('load',ok);old.addEventListener('error',ko);return}
      const s=document.createElement('script');s.src=src;s.async=true;
      s.onload=()=>{s.dataset.ready='1';ok()};s.onerror=ko;
      document.head.appendChild(s);
    });
  }
  function setPlaying(on){
    S.playing=on;
    box.classList.toggle('playing',on);
    if(railBtn)railBtn.classList.toggle('trm-live',on);
    $q('.trm-play').innerHTML=ic(on?IC.pause:IC.play);
  }
  const fill=(r,part)=>r.style.setProperty('--p',(part*100).toFixed(1)+'%');
  function showTime(){
    const part=S.dur?Math.min(1,S.pos/S.dur):0;
    const line=$q('.trm-line'),lineWidth=Math.max(0,line.clientWidth-20);
    line.querySelector('i').style.width=(lineWidth*part).toFixed(1)+'px';
    line.setAttribute('aria-valuemax',String(Math.max(1,Math.floor(S.dur/1000))));
    line.setAttribute('aria-valuenow',String(Math.floor(S.pos/1000)));
    line.setAttribute('aria-valuetext',`${fmt(S.pos)} / ${fmt(S.dur)}`);
    $q('.trm-now').textContent=fmt(S.pos);
    $q('.trm-len').textContent=fmt(S.dur);
    if(!seeking){const r=$q('.trm-range');r.max=Math.max(1,Math.floor(S.dur/1000));r.value=Math.floor(S.pos/1000);drawWave()}
  }
  const calm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||!!(typeof SET!=='undefined'&&SET&&SET.ui&&SET.ui.reduceMotion);
  function drawWave(pos=S.pos){
    const cv=$q('.trm-wave'),W=cv.clientWidth,H=cv.clientHeight;
    if(!W||!H)return;
    const dpr=window.devicePixelRatio||1,pw=Math.round(W*dpr),ph=Math.round(H*dpr);
    if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph}
    const g=cv.getContext('2d'),css=getComputedStyle(box),acc=css.getPropertyValue('--acc').trim()||'#ffab1a',off=css.getPropertyValue('--line2').trim()||'#333';
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    const bars=Math.floor(W/3),part=S.dur?pos/S.dur:0;
    for(let i=0;i<bars;i++){
      const lvl=wave.length?wave[Math.floor(i/bars*wave.length)]:.15,h=Math.max(2,lvl*H*waveGrow);
      g.fillStyle=i/bars<part?acc:off;
      g.fillRect(i*3,(H-h)/2,2,h);
    }
  }
  function growWave(){
    if(calm()){waveGrow=1;return drawWave()}
    const t0=performance.now();
    (function step(now){
      const k=Math.min(1,(now-t0)/380);
      waveGrow=1-Math.pow(1-k,3);
      drawWave();
      if(k<1)requestAnimationFrame(step);
    })(t0);
  }
  async function loadWave(raw,my){
    const u=String(raw||'').replace(/\.png$/,'.json');
    if(u===waveUrl)return;
    waveUrl=u;wave=[];trackGain=1;applyVol();
    if(!/^https:\/\/wave\.sndcdn\.com\/[\w-]+\.json$/.test(u))return drawWave();
    try{
      const data=await (await fetch(u)).json(),all=data.samples,N=140,chunk=all.length/N,out=[];
      if(cfg.level&&u===waveUrl&&my===gen){
        const mean=all.reduce((a,b)=>a+b,0)/all.length/(data.height||140);
        trackGain=Math.min(1,Math.max(.6,.62/(mean||.62)));
        applyVol();
      }
      for(let i=0;i<N;i++){
        const from=Math.floor(i*chunk),part=all.slice(from,Math.max(from+1,Math.floor((i+1)*chunk)));
        out.push(part.reduce((a,b)=>a+b,0)/part.length);
      }
      const top=Math.max(...out)||1;
      if(my!==gen||u!==waveUrl)return;
      wave=out.map(v=>v/top);
      growWave();
    }catch(e){}
  }
  const aura={run:false,t:0,last:0,energy:0,glow:0,color:'255,171,26',colorAt:0,raf:0};
  function auraLevel(now){
    if(!S.playing||!wave.length||!S.dur)return .12;
    const pos=Math.min(S.dur,S.pos+Math.max(0,now-(aura.posAt||now)));
    const at=pos/S.dur*wave.length,i=Math.floor(at),k=at-i,a=wave[Math.min(wave.length-1,i)],b=wave[Math.min(wave.length-1,i+1)];
    return a+(b-a)*k;
  }
  function auraFrame(now){
    if(!aura.run)return;
    aura.raf=requestAnimationFrame(auraFrame);
    if(document.hidden||now-aura.last<33)return;
    const dt=Math.min(100,now-aura.last);aura.last=now;
    const cv=$q('.trm-aura'),bar=$q('.trm-bar'),W=box.clientWidth,H=bar.offsetHeight;
    if(!W||!H)return;
    const dpr=Math.min(2,window.devicePixelRatio||1),pw=Math.round(W*dpr),ph=Math.round(H*dpr);
    if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;cv.style.height=H+'px'}
    if(now-aura.colorAt>2000){aura.colorAt=now;aura.color=(getComputedStyle(box).getPropertyValue('--acc-rgb').trim()||'255,171,26').replace(/\s/g,'')}
    aura.energy+=(auraLevel(now)-aura.energy)*Math.min(1,dt/420);
    aura.glow+=((S.playing?1:.35)-aura.glow)*Math.min(1,dt/900);
    aura.t+=dt*(S.playing?.00042:.00014);
    const g=cv.getContext('2d');
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    const ribbons=[[1.1,.0,.09,1],[1.7,2.1,.07,.72],[2.6,4.3,.05,.48]];
    for(const [freq,phase,alpha,size] of ribbons){
      const amp=(4+aura.energy*H*.3)*size,mid=H*.62;
      const y=x=>mid+Math.sin(x/W*Math.PI*2*freq+aura.t*freq*3+phase)*amp+Math.sin(x/W*Math.PI*2*freq*2.3-aura.t*2+phase)*amp*.35;
      g.beginPath();g.moveTo(0,H);
      for(let x=0;x<=W;x+=8)g.lineTo(x,y(x));
      g.lineTo(W,H);g.closePath();
      const fill=g.createLinearGradient(0,mid-amp,0,H);
      fill.addColorStop(0,'rgba('+aura.color+','+(alpha*aura.glow*1.5).toFixed(3)+')');
      fill.addColorStop(1,'rgba('+aura.color+',0)');
      g.fillStyle=fill;g.fill();
      g.beginPath();
      for(let x=0;x<=W;x+=8)x?g.lineTo(x,y(x)):g.moveTo(x,y(x));
      g.strokeStyle='rgba('+aura.color+','+(alpha*aura.glow*2.2).toFixed(3)+')';g.lineWidth=1;g.stroke();
    }
  }
  function auraSync(){
    const want=!calm()&&box.classList.contains('docked')&&!box.hidden;
    if(want===aura.run)return;
    aura.run=want;cancelAnimationFrame(aura.raf);
    if(want){aura.last=performance.now()-40;aura.raf=requestAnimationFrame(auraFrame)}
    else{const cv=$q('.trm-aura');cv.getContext('2d').clearRect(0,0,cv.width,cv.height)}
  }
  function swap(el){el.classList.remove('trm-swap');void el.offsetWidth;el.classList.add('trm-swap')}
  function setInfo(title,sub,href){
    const a=$q('.trm-t'),changed=a.textContent!==title;
    a.textContent=title;
    if(href)a.href=href;else a.removeAttribute('href');
    $q('.trm-s').textContent=sub;
    if(changed){swap(a);swap($q('.trm-s'))}
  }
  function setArt(url){
    const img=$q('.trm-art img'),ok=/^https:\/\/[a-z0-9-]+\.sndcdn\.com\//.test(url||'');
    if(ok&&img.getAttribute('src')!==url){img.onload=()=>swap(img);img.src=url}
    if(!ok)img.removeAttribute('src');
    img.hidden=!ok;
  }

  function advance(dir,ended){
    const last=ended&&cfg.loop&&cfg.at===cfg.list.length-1;
    if(!last||!TRSc.connected()||!curId)return step(dir,ended);
    const my=gen;
    TRSc.related(curId).then(list=>{
      if(my!==gen)return;
      const next=list.filter(x=>!cfg.list.some(y=>y.url===x.url)).slice(0,5);
      if(next.length)addAndPlay(next);else step(dir,ended);
    }).catch(()=>{if(my===gen)step(dir,ended)});
  }
  function addAndPlay(items){
    let first=-1;
    for(const x of items){
      let i=cfg.list.findIndex(y=>y.url===x.url);
      if(i<0){
        if(cfg.list.length>=MAX_LINKS){cfg.list.shift();cfg.at=Math.max(0,cfg.at-1);if(first>0)first--}
        cfg.list.push({url:x.url,title:x.title});
        i=cfg.list.length-1;
      }
      if(first<0)first=i;
    }
    if(first<0)return;
    cfg.at=first;writeCfg();start(true);
  }
  function step(dir,ended){
    const n=cfg.list.length;
    if(!n||!engine)return;
    if(ended&&cfg.loop&&cfg.at===n-1&&artist&&!cfg.list.some(x=>x.url===artist.url)){
      if(n>=MAX_LINKS){cfg.list.shift();cfg.at--}
      cfg.list.push(artist);cfg.at=cfg.list.length-1;writeCfg();start(true);
      return;
    }
    if(n===1){
      if(!ended||cfg.loop)engine.restart();
      return;
    }
    let to=cfg.at+dir;
    if(to>=n){if(ended&&!cfg.loop)return;to=0}
    if(to<0)to=n-1;
    cfg.at=to;writeCfg();start(true);
  }
  function readTracks(w,my){
    w.getSounds(list=>{
      if(my!==gen)return;
      box.classList.toggle('no-tracks',!(list||[]).length||list.length<2);
      const items=(list||[]).length>1?list:[],sig=items.map(x=>x.id+':'+(x.title?1:0)).join();
      if(sig!==trackSig){
        trackSig=sig;trackAt=-1;
        const el=$q('.trm-tracks');
        el.textContent='';
        items.forEach((x,i)=>{
          const b=document.createElement('button');b.type='button';b.className='trm-track';b.dataset.t=i;
          const n=document.createElement('i');n.textContent=i+1;
          const name=document.createElement('span');name.textContent=x.title||'…';
          b.append(n,name);
          if(/^https:\/\/soundcloud\.com\//.test(x.permalink_url||'')){const out=extLink(x.permalink_url);out.style.marginLeft='auto';b.appendChild(out)}
          el.appendChild(b);
        });
      }
      w.getCurrentSoundIndex(i=>{if(my===gen)markTrack(i)});
    });
  }
  function markTrack(i){
    if(i===trackAt)return;
    trackAt=i;
    const el=$q('.trm-tracks');
    el.querySelectorAll('.trm-track').forEach((b,n)=>b.classList.toggle('on',n===i));
    const row=el.children[i];
    if(row)el.scrollTo({top:Math.max(0,row.offsetTop-el.offsetTop-el.clientHeight/2+row.offsetHeight/2),behavior:calm()?'auto':'smooth'});
  }
  const linkName=url=>{
    const m=url.match(/\/sets\/([^/]+)/);
    if(!m)return '';
    try{return decodeURIComponent(m[1]).replace(/-/g,' ')}catch(e){return m[1]}
  };
  async function startSoundCloud(url,my,holder,auto){
    await loadScript(SC_API);
    if(my!==gen)return;
    const fr=document.createElement('iframe');
    fr.title='SoundCloud';fr.allow='autoplay;encrypted-media';fr.height=166;
    fr.src='https://w.soundcloud.com/player/?'+new URLSearchParams({url,auto_play:'false',visual:'false',show_comments:'false',hide_related:'true',show_teaser:'false',show_reposts:'false',color:'#ffab1a'});
    holder.appendChild(fr);
    const w=SC.Widget(fr),E=SC.Widget.Events;
    const readSound=()=>w.getCurrentSound(s=>{
      if(my!==gen||!s)return;
      const link=/^https:\/\/soundcloud\.com\//.test(s.permalink_url||'')?s.permalink_url:'';
      setInfo(String(s.title||''),String(s.user&&s.user.username||'SoundCloud'),link);
      setArt(s.artwork_url||(s.user&&s.user.avatar_url));
      if(s.duration){S.dur=s.duration;showTime()}
      curId=s.id||null;paintLike();refreshLike();
      const it=cur();
      if(it&&!it.title){it.title=(linkName(it.url)||String(s.title||'')).slice(0,120);writeCfg();paintList()}
      const home=s.user&&parse(s.user.permalink_url);
      artist=home?{url:home,title:String(s.user.username||'').slice(0,120)}:null;
      loadWave(s.waveform_url,my);
    });
    w.bind(E.READY,()=>{
      if(my!==gen)return;
      applyVol();readSound();
      setTimeout(()=>w.getSounds(l=>{if(my===gen&&!(l&&l.length)&&typeof toast==='function')toast(t('mu_nolink'))}),3500);
      readTracks(w,my);
      setTimeout(()=>{if(my===gen)readTracks(w,my)},1500);
      if(auto)w.play();
      if(resume&&resume.url===url){
        const back=resume;resume=null;pendingSeek=back.pos;
        setTimeout(()=>{if(my!==gen)return;if(back.idx>0)w.skip(back.idx);w.play()},back.idx>0?900:0);
      }
    });
    w.bind(E.PLAY,()=>{if(my!==gen)return;setPlaying(true);readSound();readTracks(w,my);fadeTo(1,700);if(pendingSeek!=null){const p=pendingSeek;pendingSeek=null;w.seekTo(p)}});
    w.bind(E.PAUSE,()=>{if(my===gen){setPlaying(false);saveNow(true)}});
    w.bind(E.FINISH,()=>{
      if(my!==gen)return;
      setTimeout(()=>w.isPaused(paused=>{if(my===gen&&paused){setPlaying(false);advance(1,true)}}),1200);
    });
    w.bind(E.PLAY_PROGRESS,e=>{
      if(my!==gen)return;
      S.pos=e.currentPosition||0;aura.posAt=performance.now();showTime();saveNow();
      const left=S.dur-S.pos;
      if(softBusy)return;
      if(S.dur>15000&&left<2500)fadeTo(0,Math.max(200,left));else fadeTo(1,400);
    });
    engine={toggle:()=>w.toggle(),pause:()=>w.pause(),resume:()=>w.play(),seek:s=>w.seekTo(s*1000),vol:v=>w.setVolume(v),
      restart(){w.skip(0);w.seekTo(0);w.play()},
      swap(next){w.load(next,{auto_play:true,visual:false,show_comments:false,hide_related:true,show_teaser:false,show_reposts:false,color:'#ffab1a'})},
      skip(i){fadeThen(()=>{w.skip(i);w.play()})},
      next:()=>w.getSounds(l=>w.getCurrentSoundIndex(i=>{if(my!==gen)return;if(l&&i<l.length-1)fadeThen(()=>w.next());else advance(1,false)})),
      prev:()=>w.getCurrentSoundIndex(i=>{if(my!==gen)return;if(i>0)fadeThen(()=>w.prev());else advance(-1,false)}),
     destroy:()=>w.unbind&&[E.READY,E.PLAY,E.PAUSE,E.FINISH,E.PLAY_PROGRESS].forEach(x=>w.unbind(x))};
  }

  function unload(){
    gen++;
    if(engine){try{engine.destroy()}catch(e){}engine=null}
    $q('.trm-frame').textContent='';
    S.pos=0;S.dur=0;alertPaused=false;wave=[];waveUrl='';waveGrow=1;trackSig='';trackAt=-1;artist=null;curId=null;paintLike();trackGain=1;fade=0;duck=1;fadeGoal=null;pendingSeek=null;clearTimeout(softT);softBusy=false;clearInterval(ramps.fade);clearInterval(ramps.duck);$q('.trm-tracks').textContent='';box.classList.add('no-tracks');setPlaying(false);setArt('');showTime();
  }
  function start(auto){
    if(auto===true&&S.playing)return fadeThen(()=>load(true));
    load(auto);
  }
  function load(auto){
    const next=cur();
    if(auto===true&&engine&&engine.swap&&next&&!cfg.hidden){
      clearTimeout(softT);softBusy=false;clearInterval(ramps.fade);
      S.pos=0;S.dur=0;fade=0;fadeGoal=null;trackGain=1;wave=[];waveUrl='';waveGrow=1;trackSig='';trackAt=-1;artist=null;curId=null;pendingSeek=null;
      $q('.trm-tracks').textContent='';box.classList.add('no-tracks');
      setArt('');paintLike();showTime();paint();
      setInfo(next.title||'SoundCloud','');
      engine.swap(next.url);
      return;
    }
    unload();
    const my=gen;
    paint();
    const item=cur();
    if(!item||cfg.hidden)return;
    setInfo(item.title||'SoundCloud','');
    startSoundCloud(item.url,my,$q('.trm-frame'),auto===true).catch(()=>{if(my===gen&&typeof toast==='function')toast(t('mu_fail'))});
  }
  function paint(){
    const has=!!cur(),label=t(cfg.open?'mu_close':'mu_open');
    box.hidden=cfg.hidden;
    const lite=document.documentElement.classList.contains('trm-lite');
    box.classList.toggle('docked',(has||(cfg.open&&!lite))&&!cfg.hidden);
    const lay=layout(),shown=has||cfg.open;
    box.classList.toggle('float',floating()&&shown);
    box.classList.toggle('side',lay==='side'&&shown);
    box.classList.toggle('free',lay==='free'&&shown);
    box.style.setProperty('--trm-w',(lay==='free'?cfg.win.w:340)+'px');
    box.style.setProperty('--trm-win-h',(lay==='free'?cfg.win.h:Math.max(160,Math.min(320,innerHeight-240)))+'px');
    $q('.trm-lv').checked=cfg.level;
    $q('.trm-lvl').hidden=!has;
    $q('.trm-md').hidden=!has;$q('.trm-mp').hidden=!has;
    $q('.trm-md input').checked=cfg.matchDuck;$q('.trm-mp input').checked=cfg.matchPause;
    if(railBtn){railBtn.style.display=cfg.hidden?'none':'';railBtn.classList.toggle('trm-on',cfg.open)}
    box.classList.toggle('open',cfg.open);
    box.classList.toggle('is-empty',!has);
    $q('.trm-panel-in').inert=!cfg.open&&layout()!=='side';
    for(const b of [$q('.trm-toggle'),$q('.trm-art')]){b.title=label;b.setAttribute('aria-label',label)}
    if(!has)setInfo(t('mu_title'),'');
    $q('.trm-vol').hidden=!has;
    $q('.trm-loop').hidden=!has;
    $q('.trm-l').checked=cfg.loop;
    paintList();
    syncSpace();
    auraSync();
    const v=$q('.trm-v');v.value=cfg.vol;fill(v,cfg.vol/100);
  }
  function extLink(url){
    const a=document.createElement('a');a.className='trm-ext';a.href=url;a.target='_blank';a.rel='noopener';a.textContent='↗';a.title=t('sc_open');a.setAttribute('aria-label',t('sc_open'));
    a.addEventListener('click',e=>e.stopPropagation());
    return a;
  }
  function releaseDuck(){if(alertPaused){alertPaused=false;ramp('duck',1,700)}}
  function watchMatch(){
    const found=document.getElementById('found'),lobby=document.getElementById('lobby');
    const inLobby=()=>!!lobby&&!lobby.hidden;
    const matchStart=()=>{
      if(!cfg.matchPause||!S.playing)return releaseDuck();
      fadeThen(()=>{
        if(engine)engine.pause();
        alertPaused=false;clearInterval(ramps.duck);duck=1;
      },700);
    };
    if(found)new MutationObserver(()=>{
      const on=found.classList.contains('on');
      if(on&&!matchLow){
        matchLow=true;
        if(cfg.matchDuck&&engine&&S.playing){alertPaused=true;ramp('duck',.12,700)}
      }else if(!on&&matchLow){
        matchLow=false;
        if(inLobby())matchStart();else releaseDuck();
      }
    }).observe(found,{attributes:true,attributeFilter:['class']});
    if(lobby)new MutationObserver(()=>{if(inLobby()&&!matchLow)matchStart()}).observe(lobby,{attributes:true,attributeFilter:['hidden']});
  }
  function paintLike(){
    const b=$q('.trm-like'),show=TRSc.connected()&&!!curId;
    b.hidden=!show;
    if(!show)return;
    const on=TRSc.isLiked(curId);
    b.classList.toggle('on',on);
    b.title=t(on?'sc_unlike':'sc_like');b.setAttribute('aria-label',b.title);
  }
  function refreshLike(){
    if(!TRSc.connected()||!curId||likeChecked===curId)return;
    const id=curId;likeChecked=id;
    TRSc.checkLiked(id).then(()=>{if(id===curId)paintLike()}).catch(()=>{likeChecked=null});
  }
  function button(cls,label,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=fn;return b}
  function paintAccount(){
    const el=$q('.trm-acct');
    el.textContent='';
    if(!TRSc.connected()){
      hits=null;paintHits();
      el.appendChild(button('trm-a cta',t('sc_connect'),()=>TRSc.connect().catch(e=>{if(typeof toast==='function')toast(t(e.message==='popup'?'sc_popup':'sc_fail'))})));
      return;
    }
    const who=document.createElement('span');who.textContent=t('sc_as',{n:TRSc.name()||'…'});
    el.append(who,
      button('trm-a',t('sc_likes'),()=>fetchHits(()=>TRSc.likes(),'likes')),
      button('trm-a',t('sc_related'),()=>{if(curId)fetchHits(()=>TRSc.related(curId),'add')}),
      button('trm-a',t('sc_off'),()=>TRSc.disconnect()));
  }
  async function fetchHits(load,kind){
    try{
      const items=await load();
      hits={items,kind};
      if(!items.length&&typeof toast==='function')toast(t('sc_none'));
    }catch(e){hits=null;if(e.message!=='off'&&typeof toast==='function')toast(t('sc_err'))}
    paintHits();paintLike();
  }
  function paintHits(){
    const el=$q('.trm-results');
    el.textContent='';
    if(!hits)return;
    hits.items.forEach((x,i)=>{
      const row=document.createElement('div');row.className='trm-hit';
      const go=document.createElement('button');go.type='button';go.className='trm-hit-go';go.dataset.h=i;go.textContent=x.title;
      const by=document.createElement('small');by.textContent=x.artist;go.appendChild(by);
      row.append(go,extLink(x.url));el.appendChild(row);
    });
  }
  function paintList(){
    const el=$q('.trm-list');
    el.textContent='';
    cfg.list.forEach((x,i)=>{
      const row=document.createElement('div');row.className='trm-row'+(i===cfg.at?' on':'');
      const go=document.createElement('button');go.type='button';go.className='trm-go';go.dataset.i=i;go.textContent=x.title||x.url.replace('https://','');
      const del=document.createElement('button');del.type='button';del.className='trm-x';del.dataset.x=i;del.textContent='×';del.title=t('mu_remove');del.setAttribute('aria-label',t('mu_remove'));
      row.append(go,extLink(x.url),del);el.appendChild(row);
    });
  }
  function place(){
    const rail=document.querySelector('.rail'),right=rail&&getComputedStyle(rail).display!=='none'?rail.getBoundingClientRect().right:0;
    box.style.setProperty('--trm-left',Math.round(right)+'px');
  }
  function syncSpace(){
    const fl=box.classList.contains('float'),sd=box.classList.contains('side')&&!box.hidden;
    const h=box.classList.contains('docked')&&!box.hidden&&!fl&&!sd?Math.ceil(box.getBoundingClientRect().height):0;
    document.documentElement.style.setProperty('--trm-h',h+'px');
    document.documentElement.style.setProperty('--trm-side',(sd?box.offsetWidth:0)+'px');
    if(fl)placeWin();
  }
  const layout=()=>{
    const m=cfg.win.mode;
    if(innerWidth<=720||(m==='side'&&innerWidth<=1100))return 'bar';
    return m;
  };
  const floating=()=>{const m=layout();return m!=='bar'&&m!=='side'};
  function placeWin(){
    const m=layout(),p=anchor(m,box.offsetWidth,box.offsetHeight);
    if(p)moveWin(p[0],p[1]);else moveWin(cfg.win.x,cfg.win.y);
  }
  function edges(){
    const rail=document.querySelector('.rail'),head=document.querySelector('.top,.sx-top');
    return {left:rail&&getComputedStyle(rail).display!=='none'?rail.getBoundingClientRect().right:0,top:head?head.getBoundingClientRect().bottom:0};
  }
  function anchor(m,W,H){
    const e=edges(),G=16;
    if(m==='bl')return [e.left+G,innerHeight-H-G];
    if(m==='br')return [innerWidth-W-G,innerHeight-H-84];
    if(m==='tr')return [innerWidth-W-G,e.top+12];
    if(m==='tl')return [e.left+G,e.top+12];
    return null;
  }
  function snapZone(x,y){
    const e=edges(),R=120,nearL=x<e.left+R,nearR=x>innerWidth-R,nearT=y<e.top+R,nearB=y>innerHeight-R;
    if(nearT&&nearL)return 'tl';
    if(nearT&&nearR)return 'tr';
    if(nearB&&nearL)return 'bl';
    if(nearB&&nearR)return 'br';
    if(y>innerHeight-44)return 'bar';
    if(x>innerWidth-36&&innerWidth>1100)return 'side';
    return null;
  }
  function zoneBox(z){
    const e=edges(),barH=$q('.trm-bar').offsetHeight;
    if(z==='bar')return [e.left,innerHeight-68,innerWidth-e.left,68,0];
    if(z==='side')return [innerWidth-340,0,340,innerHeight,0];
    const p=anchor(z,340,barH+8);
    return [p[0],p[1],340,barH+8,20];
  }
  function setLayout(m){
    cfg.win.mode=m;
    if(m==='free'&&cfg.win.x<0){cfg.win.x=innerWidth-cfg.win.w-24;cfg.win.y=innerHeight-cfg.win.h-120}
    writeCfg();
    box.classList.remove('trm-moved');void box.offsetWidth;box.classList.add('trm-moved');
    paint();
  }
  function toggleLayoutMenu(){
    const old=document.getElementById('trmLayout');
    if(old){old.remove();return}
    const menu=document.createElement('div');menu.id='trmLayout';menu.setAttribute('role','menu');
    const cur=cfg.win.mode;
    for(const [id,label,mark] of LAYOUTS){
      if(id==='side'&&innerWidth<=1100)continue;
      const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitemradio');b.setAttribute('aria-checked',id===cur);
      if(id===cur)b.className='on';
      const icon=document.createElement('span');icon.className='trm-mi';
      const zone=document.createElement('i');zone.style.cssText=mark;icon.appendChild(zone);
      const name=document.createElement('span');name.textContent=t(label);
      b.append(icon,name);
      b.onclick=()=>{menu.remove();setLayout(id)};
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    const r=$q('.trm-win').getBoundingClientRect(),h=menu.offsetHeight,w=menu.offsetWidth;
    menu.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-w))+'px';
    menu.style.top=(r.top-h-8>=8?r.top-h-8:Math.min(innerHeight-h-8,r.bottom+8))+'px';
    const close=e=>{
      if(e.type==='keydown'&&e.key!=='Escape')return;
      if(e.type==='pointerdown'&&(menu.contains(e.target)||e.target.closest('.trm-win')))return;
      menu.remove();removeEventListener('pointerdown',close,true);removeEventListener('keydown',close,true);
    };
    addEventListener('pointerdown',close,true);addEventListener('keydown',close,true);
  }
  function moveWin(x,y){
    const X=Math.round(Math.min(Math.max(0,x),Math.max(0,innerWidth-box.offsetWidth)));
    const Y=Math.round(Math.min(Math.max(0,y),Math.max(0,innerHeight-box.offsetHeight)));
    box.style.setProperty('--trm-x',X+'px');box.style.setProperty('--trm-y',Y+'px');
    if(cfg.win.mode==='free'){cfg.win.x=X;cfg.win.y=Y}
  }
  function bindWindow(){
    const bar=$q('.trm-bar');
    let d=null,frame=0,nx=0,ny=0,px=0,py=0,zone=null,ghost=null;
    const showZone=z=>{
      if(z===zone)return;
      zone=z;
      if(!ghost){ghost=document.createElement('div');ghost.id='trmSnap';document.body.appendChild(ghost)}
      if(!z){ghost.classList.remove('on');return}
      const [x,y,w,h,r]=zoneBox(z);
      ghost.style.transform='translate3d('+x+'px,'+y+'px,0)';ghost.style.width=w+'px';ghost.style.height=h+'px';ghost.style.borderRadius=r+'px';
      ghost.classList.add('on');
    };
    const flush=()=>{frame=0;moveWin(nx,ny);showZone(snapZone(px,py))};
    bar.addEventListener('pointerdown',e=>{
      if(e.button||innerWidth<=720||layout()==='side'||e.target.closest('button,a,input,label')||!box.classList.contains('docked'))return;
      d={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:cfg.win.x,oy:cfg.win.y,was:floating(),moved:false};
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove',e=>{
      if(!d||e.pointerId!==d.id)return;
      const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
      if(!d.moved){
        if(d.was?Math.hypot(dx,dy)<5:dy>-18)return;
        d.moved=true;box.classList.add('dragging');
        if(!d.was){
          cfg.win.mode='free';paint();
          d.ox=e.clientX-Math.min(160,box.offsetWidth/2);d.oy=e.clientY-24;d.sx=e.clientX;d.sy=e.clientY;
        }else if(cfg.win.mode!=='free'){
          const r=box.getBoundingClientRect();
          cfg.win.w=Math.round(r.width);cfg.win.x=d.ox=r.left;cfg.win.y=d.oy=r.top;
          cfg.win.mode='free';paint();
        }
      }
      nx=d.ox+e.clientX-d.sx;ny=d.oy+e.clientY-d.sy;px=e.clientX;py=e.clientY;
      if(!frame)frame=requestAnimationFrame(flush);
    });
    const end=e=>{
      if(!d||e.pointerId!==d.id)return;
      const moved=d.moved;d=null;
      if(!moved)return;
      box.classList.remove('dragging');
      const target=zone;
      if(frame){cancelAnimationFrame(frame);frame=0}
      showZone(null);
      if(ghost){ghost.remove();ghost=null}
      if(target)setLayout(target);else writeCfg();
    };
    bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
    const grip=$q('.trm-grip');
    let r=null;
    grip.addEventListener('pointerdown',e=>{r={id:e.pointerId,x:e.clientX,y:e.clientY,w:cfg.win.w,h:cfg.win.h};grip.setPointerCapture(e.pointerId);box.classList.add('dragging');e.preventDefault()});
    grip.addEventListener('pointermove',e=>{
      if(!r||e.pointerId!==r.id)return;
      cfg.win.w=Math.round(Math.min(Math.min(1100,innerWidth-8),Math.max(320,r.w+e.clientX-r.x)));
      cfg.win.h=Math.round(Math.min(700,Math.max(160,r.h+e.clientY-r.y)));
      box.style.setProperty('--trm-w',cfg.win.w+'px');box.style.setProperty('--trm-win-h',cfg.win.h+'px');
    });
    const stop=e=>{if(r&&e.pointerId===r.id){r=null;box.classList.remove('dragging');writeCfg()}};
    grip.addEventListener('pointerup',stop);grip.addEventListener('pointercancel',stop);
  }
  const openClose=()=>{cfg.open=!cfg.open;writeCfg();paint()};

  function mount(){
    const css=document.createElement('style');css.id='trMusicCss';css.textContent=CSS;document.head.appendChild(css);
    box=document.createElement('section');box.id='trMusic';box.setAttribute('aria-label',t('mu_title'));
    box.innerHTML=`<canvas class="trm-aura" aria-hidden="true"></canvas><div class="trm-line" role="slider" tabindex="0" aria-label="${t('mu_seek')}" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" aria-valuetext="0:00 / 0:00"><i></i></div>
      <div class="trm-bar">
        <div class="trm-left">
          <button class="trm-art"><img alt="" hidden>${ic(IC.note)}<span class="trm-eq"><i></i><i></i><i></i></span></button>
          <div class="trm-info"><a class="trm-t" target="_blank" rel="noopener"></a><span class="trm-s"></span></div>
          <button class="trm-c trm-like" hidden>${ic(IC.heart,16)}</button>
        </div>
        <div class="trm-center">
          <div class="trm-transport">
            <button class="trm-c trm-prev" data-i18n-title="mu_prev" title="${t('mu_prev')}">${ic(IC.prev,16)}</button>
            <button class="trm-c trm-play" data-i18n-title="mu_play" title="${t('mu_play')}">${ic(IC.play)}</button>
            <button class="trm-c trm-next" data-i18n-title="mu_next" title="${t('mu_next')}">${ic(IC.next,16)}</button>
          </div>
          <div class="trm-seek"><span class="trm-now">0:00</span><div class="trm-wave-box"><canvas class="trm-wave"></canvas><input class="trm-range" type="range" min="0" max="1" value="0" aria-label="${t('mu_seek')}"></div><span class="trm-len">0:00</span></div>
        </div>
        <div class="trm-right">
          <label class="trm-vol"><input class="trm-v" type="range" min="0" max="100" aria-label="${t('mu_vol')}"></label>
          <button class="trm-c trm-win" data-i18n-title="mu_window" title="${t('mu_window')}">${ic(IC.win,16)}</button>
          <button class="trm-c trm-toggle">${ic(IC.chev)}</button>
        </div>
      </div>
      <div class="trm-panel"><div class="trm-panel-in"><div class="trm-cols">
        <div class="trm-col trm-col-player"><div class="trm-frame"></div></div>
        <div class="trm-col trm-col-tracks"><div class="trm-tracks"></div></div>
        <div class="trm-col trm-col-links">
          <form class="trm-form"><input class="trm-link" type="text" autocomplete="off" spellcheck="false" data-i18n-ph="mu_ph" placeholder="${t('mu_ph')}"><button class="trm-add" type="submit" data-i18n="mu_add">${t('mu_add')}</button></form>
          <div class="trm-acct"></div>
          <div class="trm-results"></div>
          <div class="trm-list"></div>
          <label class="trm-loop"><input class="trm-l" type="checkbox"><span data-i18n="mu_loop">${t('mu_loop')}</span></label>
          <label class="trm-loop trm-md"><input type="checkbox"><span data-i18n="mu_mduck">${t('mu_mduck')}</span></label>
          <label class="trm-loop trm-mp"><input type="checkbox"><span data-i18n="mu_mpause">${t('mu_mpause')}</span></label>
          <label class="trm-loop trm-lvl"><input class="trm-lv" type="checkbox"><span data-i18n="mu_level">${t('mu_level')}</span></label>
          <div class="trm-note" data-i18n="mu_note">${t('mu_note')}</div>
        </div>
      </div></div></div>
      <div class="trm-grip"></div>`;
    document.body.appendChild(box);
    $q=s=>box.querySelector(s);

    const spot=document.querySelector('.rail .spacer');
    if(spot){
      railBtn=document.createElement('button');railBtn.className='rail-btn';railBtn.id='trmRail';railBtn.title=t('mu_title');railBtn.setAttribute('data-i18n-title','mu_title');
      railBtn.innerHTML='<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="'+IC.note+'"/></svg><span class="rl" data-i18n="mu_title">'+t('mu_title')+'</span>';
      railBtn.onclick=openClose;
      spot.before(railBtn);
    }
    $q('.trm-toggle').onclick=openClose;
    $q('.trm-win').onclick=toggleLayoutMenu;
    bindWindow();
    watchMatch();
    $q('.trm-md input').onchange=e=>{cfg.matchDuck=e.target.checked;writeCfg()};
    $q('.trm-mp input').onchange=e=>{cfg.matchPause=e.target.checked;writeCfg()};
    addEventListener('resize',()=>paint());
    $q('.trm-lv').onchange=e=>{cfg.level=e.target.checked;if(!cfg.level){trackGain=1;applyVol()}writeCfg()};
    $q('.trm-art').onclick=openClose;
    if(window.ResizeObserver)new ResizeObserver(syncSpace).observe(box);
    $q('.trm-play').onclick=()=>{
      if(!engine)return;
      if(S.playing)fadeThen(()=>engine&&engine.pause(),420);else engine.toggle();
    };
    $q('.trm-prev').onclick=()=>engine&&engine.prev();
    $q('.trm-next').onclick=()=>engine&&engine.next();
    const range=$q('.trm-range');
    range.oninput=()=>{seeking=true;$q('.trm-now').textContent=fmt(range.value*1000);drawWave(range.value*1000)};
    range.onchange=()=>{seeking=false;if(engine)engine.seek(Number(range.value))};
    const mobileSeek=$q('.trm-line');
    const seekAt=e=>{
      const r=mobileSeek.getBoundingClientRect(),usable=Math.max(1,r.width-20);
      const part=Math.max(0,Math.min(1,(e.clientX-r.left-10)/usable));
      S.pos=Math.round(S.dur*part);showTime();drawWave(S.pos);
    };
    mobileSeek.onpointerdown=e=>{
      if(!S.dur)return;
      seeking=true;mobileSeek.setPointerCapture(e.pointerId);seekAt(e);e.preventDefault();
    };
    mobileSeek.onpointermove=e=>{if(seeking&&mobileSeek.hasPointerCapture(e.pointerId))seekAt(e)};
    mobileSeek.onpointerup=e=>{
      if(!seeking)return;
      seeking=false;if(mobileSeek.hasPointerCapture(e.pointerId))mobileSeek.releasePointerCapture(e.pointerId);
      if(engine)engine.seek(Math.floor(S.pos/1000));
    };
    mobileSeek.onpointercancel=()=>{seeking=false};
    mobileSeek.onkeydown=e=>{
      if(!S.dur)return;
      const step=e.shiftKey?30000:5000;let next=null;
      if(e.key==='ArrowLeft')next=Math.max(0,S.pos-step);
      else if(e.key==='ArrowRight')next=Math.min(S.dur,S.pos+step);
      else if(e.key==='Home')next=0;
      else if(e.key==='End')next=S.dur;
      if(next===null)return;
      e.preventDefault();S.pos=next;showTime();drawWave(next);if(engine)engine.seek(Math.floor(next/1000));
    };
    $q('.trm-v').oninput=e=>{cfg.vol=clampVol(e.target.value);fill(e.target,cfg.vol/100);writeCfg();applyVol()};
    $q('.trm-form').onsubmit=e=>{
      e.preventDefault();
      const inp=$q('.trm-link'),text=inp.value.trim(),url=parse(text);
      if(!text)return;
      if(!url){
        if(/soundcloud\.com\/(discover|stations)\//i.test(text)){if(typeof toast==='function')toast(t('mu_discover'));return}
        if(/^[a-z]+:|soundcloud\.com/i.test(text)){if(typeof toast==='function')toast(t('mu_bad'));return}
        if(TRSc.connected()){fetchHits(()=>TRSc.search(text),'add');return}
        window.open('https://soundcloud.com/search?q='+encodeURIComponent(text),'_blank','noopener');
        if(typeof toast==='function')toast(t('mu_search'));
        return;
      }
      let i=cfg.list.findIndex(x=>x.url===url);
      if(i<0){
        if(cfg.list.length>=MAX_LINKS)cfg.list.shift();
        cfg.list.push({url,title:''});
        i=cfg.list.length-1;
      }
      const wasPlaying=S.playing;
      cfg.at=i;writeCfg();inp.value='';start(wasPlaying);
    };
    $q('.trm-tracks').onclick=e=>{const b=e.target.closest('[data-t]');if(b&&engine)engine.skip(Number(b.dataset.t))};
    $q('.trm-link').oninput=e=>{
      const q=e.target.value.trim().toLowerCase(),isLink=/^[a-z]+:|soundcloud\.com/.test(q);
      $q('.trm-tracks').querySelectorAll('.trm-track').forEach(b=>{b.hidden=!!q&&!isLink&&!b.textContent.toLowerCase().includes(q)});
    };
    $q('.trm-results').onclick=e=>{
      const b=e.target.closest('[data-h]');
      if(!b||!hits)return;
      const i=Number(b.dataset.h);
      if(hits.kind==='likes'){
        cfg.list=hits.items.slice(i,i+MAX_LINKS).map(x=>({url:x.url,title:x.title}));
        cfg.at=0;writeCfg();start(true);
      }else addAndPlay([hits.items[i]]);
    };
    $q('.trm-like').onclick=async()=>{
      const id=curId,on=!TRSc.isLiked(id),b=$q('.trm-like');
      b.classList.toggle('on',on);
      b.classList.remove('pop');void b.offsetWidth;if(on)b.classList.add('pop');
      try{await TRSc.like(id,on);paintLike()}catch(e){paintLike();if(e.message!=='off'&&typeof toast==='function')toast(t('sc_err'))}
    };
    TRSc.onChange(()=>{if(!TRSc.connected())likeChecked=null;paintAccount();paintLike();refreshLike()});
    paintAccount();
    $q('.trm-l').onchange=e=>{cfg.loop=e.target.checked;writeCfg()};
    $q('.trm-list').onclick=e=>{
      const go=e.target.closest('[data-i]'),del=e.target.closest('[data-x]');
      if(go){cfg.at=Number(go.dataset.i);writeCfg();start(true);return}
      if(!del)return;
      const i=Number(del.dataset.x),wasCurrent=i===cfg.at,wasPlaying=S.playing;
      cfg.list.splice(i,1);
      if(i<cfg.at)cfg.at--;
      cfg.at=Math.min(cfg.at,Math.max(0,cfg.list.length-1));
      writeCfg();
      if(wasCurrent)start(wasPlaying);else paintList();
    };
    const rail=document.querySelector('.rail');
    if(rail&&window.ResizeObserver)new ResizeObserver(place).observe(rail);
    addEventListener('resize',place);
    place();
  }

  window.TRMusic={
    parseLink:parse,
    pulse:()=>S.playing?aura.energy:0,
    toggle:()=>openClose(),
    scApi:()=>loadScript(SC_API),
    visible:()=>!cfg.hidden,
    setVisible(on){cfg.hidden=!on;writeCfg();start()},
    pauseForAlert(){if(!engine||!S.playing||!cfg.matchDuck)return false;alertPaused=true;ramp('duck',.12,600);return true},
    resumeAfterAlert(){if(!matchLow)releaseDuck()},
    clear(){try{localStorage.removeItem(KEY)}catch(e){}TRSc.disconnect();cfg=readCfg();start()}
  };

  cfg=readCfg();
  resume=readNow();
  addEventListener('pagehide',()=>saveNow(true));
  mount();
  showTime();
  start();
})();
