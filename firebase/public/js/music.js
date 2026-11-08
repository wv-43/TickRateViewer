/* =====================================================
 * TICKRATE - Lecteur de musique (bas gauche)
 * Utilise le lecteur officiel SoundCloud, chargé seulement après qu'un joueur a collé un lien.
 * Le lien reste dans ce navigateur (localStorage) : rien ne passe par nos serveurs.
 * ===================================================== */
(function(){
  const KEY='tr_music';
  const SC_API='https://w.soundcloud.com/player/api.js';
  const I={
    fr:{mu_title:'Musique',mu_open:'Ouvrir le lecteur',mu_close:'Réduire le lecteur',mu_play:'Lecture ou pause',mu_prev:'Morceau précédent',mu_next:'Morceau suivant',mu_seek:'Position dans le morceau',mu_vol:'Volume',mu_ph:'Colle un lien SoundCloud',mu_add:'Lire',mu_remove:'Retirer ce lien',mu_empty:'Aucune musique',mu_bad:'Ce lien n\'est pas un lien SoundCloud valide',mu_fail:'Ce lecteur n\'a pas pu se charger',mu_note:'Morceau, playlist ou profil. SoundCloud n\'est contacté qu\'une fois un lien collé.'},
    en:{mu_title:'Music',mu_open:'Open the player',mu_close:'Collapse the player',mu_play:'Play or pause',mu_prev:'Previous track',mu_next:'Next track',mu_seek:'Track position',mu_vol:'Volume',mu_ph:'Paste a SoundCloud link',mu_add:'Play',mu_remove:'Remove this link',mu_empty:'No music',mu_bad:'This is not a valid SoundCloud link',mu_fail:'This player could not load',mu_note:'Track, playlist or profile. SoundCloud is only contacted once you paste a link.'},
    ru:{mu_title:'Музыка',mu_open:'Открыть плеер',mu_close:'Свернуть плеер',mu_play:'Воспроизведение или пауза',mu_prev:'Предыдущий трек',mu_next:'Следующий трек',mu_seek:'Позиция в треке',mu_vol:'Громкость',mu_ph:'Вставь ссылку SoundCloud',mu_add:'Играть',mu_remove:'Удалить ссылку',mu_empty:'Нет музыки',mu_bad:'Это неверная ссылка SoundCloud',mu_fail:'Не удалось загрузить плеер',mu_note:'Трек, плейлист или профиль. SoundCloud подключается только после вставки ссылки.'}
  };
  for(const l in I)Object.assign(I18N[l],I[l]);

  const ic=d=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  const IC={note:'M9 18.5a3 3 0 1 1-2-2.83V5l12-2.5v12.99a3 3 0 1 1-2-2.83V7.4L9 9.07z',play:'M7 4.5v15l13-7.5z',pause:'M6 4.5h4.5v15H6zm7.5 0H18v15h-4.5z',prev:'M6 5h2.5v14H6zm3.5 7L20 5v14z',next:'M15.5 5H18v14h-2.5zM4 5l10.5 7L4 19z',chev:'M6.7 8.3 12 13.6l5.3-5.3 1.4 1.4-6.7 6.7-6.7-6.7z'};

  const CSS=`
#trMusic{position:fixed;left:84px;bottom:18px;z-index:70;width:320px;max-width:calc(100vw - 16px);color:var(--text);font-size:13px;background:rgba(13,16,23,.96);border:1px solid var(--line2);border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
#trMusic.is-empty:not(.open){width:44px}
#trMusic button{background:none;border:none;color:inherit;cursor:pointer;font:inherit}
.trm-bar{display:flex;align-items:center;gap:6px;height:44px;padding:0 6px 0 0}
.trm-toggle{flex:0 0 44px;height:44px;display:grid;place-items:center;color:var(--muted)!important}
.trm-toggle:hover,.trm-c:hover{color:var(--acc)!important}
#trMusic.playing .trm-toggle{color:var(--acc)!important}
.trm-info{flex:1;min-width:0;line-height:1.25}
.trm-info b,.trm-info small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trm-info small{color:var(--muted);font-size:11.5px}
.trm-c{width:30px;height:30px;display:grid;place-items:center;border-radius:4px}
#trMusic.is-empty:not(.open) .trm-info,#trMusic.is-empty .trm-c{display:none}
.trm-seek{display:flex;align-items:center;gap:8px;padding:0 10px 8px;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
.trm-seek input{flex:1;min-width:0;accent-color:var(--acc);height:14px}
#trMusic.is-empty .trm-seek{display:none}
.trm-frame{padding:0 10px}
.trm-frame iframe{display:block;width:100%;border:0;border-radius:8px}
#trMusic:not(.open) .trm-frame{position:fixed;left:-9999px;top:0;width:300px}
#trMusic.is-empty .trm-frame{display:none}
.trm-body{display:none;padding:10px;border-top:1px solid var(--line);margin-top:10px}
#trMusic.is-empty .trm-body{margin-top:0}
#trMusic.open .trm-body{display:block}
.trm-form{display:flex;gap:6px}
.trm-form input{flex:1;min-width:0;height:34px;padding:0 10px;color:var(--text);background:var(--bg2);border:1px solid var(--line2);border-radius:5px;font:inherit}
.trm-form input:focus{outline:none;border-color:var(--acc)}
#trMusic .trm-add{flex:none;height:34px;padding:0 12px;color:var(--on-acc);background:var(--acc);border-radius:5px;font-weight:700}
.trm-vol{display:flex;align-items:center;gap:10px;margin-top:8px;color:var(--muted);font-size:12px}
.trm-vol[hidden]{display:none}
.trm-vol input{flex:1;accent-color:var(--acc)}
.trm-note{margin-top:8px;font-size:11.5px;line-height:1.45;color:var(--dim)}
#trMusic .trm-del{margin-top:6px;padding:0;color:var(--muted);font-size:12px;text-decoration:underline}
.trm-del[hidden]{display:none}
@media(max-width:720px){#trMusic{left:8px;bottom:calc(var(--mnav-h,60px) + var(--safe-b,0px) + 8px)}}
`;

  const clampVol=v=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(100,Math.max(0,n)):60};
  function readCfg(){
    let c=null;
    try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    c=c&&typeof c==='object'?c:{};
    return {url:parse(c.url)||'',open:!!c.open,vol:clampVol(c.vol)};
  }
  const writeCfg=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};

  // Seuls des liens reconnus, reconstruits ici, arrivent jusqu'au lecteur.
  function parse(raw){
    let u;
    try{u=new URL(String(raw||'').trim())}catch(e){return null}
    if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
    const host=u.hostname.toLowerCase().replace(/^(www|m)\./,'');
    if((host==='soundcloud.com'||host==='on.soundcloud.com')&&/^\/[\w%./-]+$/.test(u.pathname))
      return `https://${host}${u.pathname.replace(/\/$/,'')}`;
    return null;
  }

  let cfg,box,$q,engine=null,gen=0,seeking=false,alertPaused=false;
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
    $q('.trm-play').innerHTML=ic(on?IC.pause:IC.play);
  }
  function showTime(){
    $q('.trm-now').textContent=fmt(S.pos);
    $q('.trm-len').textContent=fmt(S.dur);
    if(!seeking){const r=$q('.trm-range');r.max=Math.max(1,Math.floor(S.dur/1000));r.value=Math.floor(S.pos/1000)}
  }
  function setInfo(title,sub){$q('.trm-t').textContent=title;$q('.trm-s').textContent=sub}

  async function startSoundCloud(url,my,holder){
    await loadScript(SC_API);
    if(my!==gen)return;
    const fr=document.createElement('iframe');
    fr.title='SoundCloud';fr.allow='autoplay;encrypted-media';fr.height=166;
    fr.src='https://w.soundcloud.com/player/?'+new URLSearchParams({url,auto_play:'false',visual:'false',show_comments:'false',hide_related:'true',show_teaser:'false',show_reposts:'false',color:'#ffab1a'});
    holder.appendChild(fr);
    const w=SC.Widget(fr),E=SC.Widget.Events;
    const readSound=()=>w.getCurrentSound(s=>{
      if(my!==gen||!s)return;
      setInfo(String(s.title||''),String(s.user&&s.user.username||'SoundCloud'));
      if(s.duration){S.dur=s.duration;showTime()}
    });
    w.bind(E.READY,()=>{if(my!==gen)return;w.setVolume(cfg.vol);readSound()});
    w.bind(E.PLAY,()=>{if(my!==gen)return;setPlaying(true);readSound()});
    w.bind(E.PAUSE,()=>{if(my===gen)setPlaying(false)});
    w.bind(E.FINISH,()=>{if(my===gen)setPlaying(false)});
    w.bind(E.PLAY_PROGRESS,e=>{if(my!==gen)return;S.pos=e.currentPosition||0;showTime()});
    engine={toggle:()=>w.toggle(),pause:()=>w.pause(),resume:()=>w.play(),seek:s=>w.seekTo(s*1000),next:()=>w.next(),prev:()=>w.prev(),vol:v=>w.setVolume(v),destroy:()=>w.unbind&&[E.READY,E.PLAY,E.PAUSE,E.FINISH,E.PLAY_PROGRESS].forEach(x=>w.unbind(x))};
  }

  function unload(){
    gen++;
    if(engine){try{engine.destroy()}catch(e){}engine=null}
    $q('.trm-frame').textContent='';
    S.pos=0;S.dur=0;alertPaused=false;setPlaying(false);showTime();
  }
  function start(){
    unload();
    const my=gen;
    paint();
    if(!cfg.url)return;
    setInfo('SoundCloud','');
    startSoundCloud(cfg.url,my,$q('.trm-frame')).catch(()=>{if(my===gen&&typeof toast==='function')toast(t('mu_fail'))});
  }
  function paint(){
    const has=!!cfg.url;
    box.classList.toggle('open',cfg.open);
    box.classList.toggle('is-empty',!has);
    const tg=$q('.trm-toggle');tg.title=tg.ariaLabel=t(cfg.open?'mu_close':'mu_open');
    tg.innerHTML=ic(cfg.open?IC.chev:IC.note);
    if(!has)setInfo(t('mu_empty'),t('mu_title'));
    $q('.trm-vol').hidden=!has;
    $q('.trm-del').hidden=!has;
    $q('.trm-v').value=cfg.vol;
  }

  function mount(){
    const css=document.createElement('style');css.id='trMusicCss';css.textContent=CSS;document.head.appendChild(css);
    box=document.createElement('section');box.id='trMusic';box.setAttribute('aria-label',t('mu_title'));
    box.innerHTML=`<div class="trm-bar">
        <button class="trm-toggle"></button>
        <div class="trm-info"><b class="trm-t"></b><small class="trm-s"></small></div>
        <button class="trm-c trm-prev" data-i18n-title="mu_prev" title="${t('mu_prev')}">${ic(IC.prev)}</button>
        <button class="trm-c trm-play" data-i18n-title="mu_play" title="${t('mu_play')}">${ic(IC.play)}</button>
        <button class="trm-c trm-next" data-i18n-title="mu_next" title="${t('mu_next')}">${ic(IC.next)}</button>
      </div>
      <div class="trm-seek"><span class="trm-now">0:00</span><input class="trm-range" type="range" min="0" max="1" value="0" aria-label="${t('mu_seek')}"><span class="trm-len">0:00</span></div>
      <div class="trm-frame"></div>
      <div class="trm-body">
        <form class="trm-form"><input class="trm-link" type="url" autocomplete="off" spellcheck="false" data-i18n-ph="mu_ph" placeholder="${t('mu_ph')}"><button class="trm-add" type="submit" data-i18n="mu_add">${t('mu_add')}</button></form>
        <label class="trm-vol"><span data-i18n="mu_vol">${t('mu_vol')}</span><input class="trm-v" type="range" min="0" max="100"></label>
        <button class="trm-del" data-i18n="mu_remove">${t('mu_remove')}</button>
        <div class="trm-note" data-i18n="mu_note">${t('mu_note')}</div>
      </div>`;
    document.body.appendChild(box);
    $q=s=>box.querySelector(s);

    $q('.trm-toggle').onclick=()=>{cfg.open=!cfg.open;writeCfg();paint()};
    $q('.trm-play').onclick=()=>{alertPaused=false;engine&&engine.toggle()};
    $q('.trm-prev').onclick=()=>engine&&engine.prev&&engine.prev();
    $q('.trm-next').onclick=()=>engine&&engine.next&&engine.next();
    const range=$q('.trm-range');
    range.oninput=()=>{seeking=true;$q('.trm-now').textContent=fmt(range.value*1000)};
    range.onchange=()=>{seeking=false;if(engine)engine.seek(Number(range.value))};
    $q('.trm-v').oninput=e=>{cfg.vol=clampVol(e.target.value);writeCfg();if(engine&&engine.vol)engine.vol(cfg.vol)};
    $q('.trm-form').onsubmit=e=>{
      e.preventDefault();
      const inp=$q('.trm-link'),url=parse(inp.value);
      if(!url){if(typeof toast==='function')toast(t('mu_bad'));return}
      cfg.url=url;writeCfg();inp.value='';start();
    };
    $q('.trm-del').onclick=()=>{cfg.url='';writeCfg();start()};
  }

  window.TRMusic={
    // La musique se coupe pendant l'alerte, puis reprend seule si c'est elle qui l'avait arrêtée.
    pauseForAlert(){if(!engine||!S.playing)return false;alertPaused=true;engine.pause();return true},
    resumeAfterAlert(){if(alertPaused&&engine){alertPaused=false;engine.resume()}},
    clear(){try{localStorage.removeItem(KEY)}catch(e){}cfg=readCfg();start()}
  };

  cfg=readCfg();
  mount();
  showTime();
  start();
})();
