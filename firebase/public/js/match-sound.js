/* =====================================================
 * TICKRATE - Son de « match trouvé »
 * Sons intégrés, ou fichier personnel dont on choisit le passage joué.
 * Le fichier reste dans ce navigateur (IndexedDB) et n'est jamais envoyé à nos serveurs.
 * Le réglage est dans localStorage, hors de tr_settings qui est copié dans Firebase.
 * ===================================================== */
(function(){
  const KEY='tr_mfs',DB='tickrate_local',STORE='files',ID='mfs';
  const MAX_FILE=15*1024*1024,DUR_MIN=2,DUR_MAX=20,DUR_DEF=8,VOL_DEF=70,BINS=600;   // 20 s : la durée pour accepter un match

  // [fréquence, durée, départ, forme, volume]
  const PRESETS={
    classic:[[660,.15,0,'square',.035],[880,.15,.18,'square',.035],[1175,.3,.36,'square',.035]],
    alarm:[[880,.14,0,'square',.04],[660,.14,.16,'square',.04],[880,.14,.32,'square',.04],[660,.14,.48,'square',.04],[880,.3,.64,'square',.04]],
    soft:[[523,.3,0,'sine',.07],[659,.3,.16,'sine',.07],[784,.3,.32,'sine',.07],[1047,.55,.48,'sine',.07]],
    arcade:[[392,.08,0,'triangle',.08],[523,.08,.08,'triangle',.08],[659,.08,.16,'triangle',.08],[784,.08,.24,'triangle',.08],[1047,.08,.32,'triangle',.08],[1319,.3,.4,'triangle',.08]],
    radar:[[1320,.22,0,'sine',.07],[1320,.22,.4,'sine',.07],[1760,.4,.8,'sine',.07]]
  };

  const I={
    fr:{mfs_title:'Son de match trouvé',mfs_note:'Ton fichier reste dans ce navigateur : il n\'est jamais envoyé sur nos serveurs. Il faudra le remettre sur un autre appareil.',mfs_p_classic:'Classique',mfs_p_alarm:'Alarme',mfs_p_soft:'Doux',mfs_p_arcade:'Arcade',mfs_p_radar:'Radar',mfs_p_file:'Mon son',mfs_play:'Écouter',mfs_pick:'Choisir un fichier audio',mfs_change:'Changer de fichier',mfs_remove:'Retirer',mfs_start:'Départ',mfs_dur:'Durée',mfs_auto:'Trouver le meilleur moment',mfs_auto_ok:'Passage le plus fort sélectionné',mfs_vol:'Volume',mfs_wave:'Clique sur l\'onde pour choisir le moment de départ',mfs_saved:'Son enregistré',mfs_loading:'Analyse du fichier…',mfs_removed:'Son retiré',mfs_muted:'Les sons sont désactivés plus haut',mfs_err_type:'Ce fichier n\'est pas un son',mfs_err_size:'Fichier trop lourd (15 Mo maximum)',mfs_err_decode:'Ce format audio n\'est pas lisible par ton navigateur',mfs_err_store:'Impossible d\'enregistrer ce son dans ce navigateur'},
    en:{mfs_title:'Match found sound',mfs_note:'Your file stays in this browser: it is never sent to our servers. You will need to add it again on another device.',mfs_p_classic:'Classic',mfs_p_alarm:'Alarm',mfs_p_soft:'Soft',mfs_p_arcade:'Arcade',mfs_p_radar:'Radar',mfs_p_file:'My sound',mfs_play:'Listen',mfs_pick:'Choose an audio file',mfs_change:'Change file',mfs_remove:'Remove',mfs_start:'Start',mfs_dur:'Length',mfs_auto:'Find the best moment',mfs_auto_ok:'Loudest part selected',mfs_vol:'Volume',mfs_wave:'Click the waveform to choose where it starts',mfs_saved:'Sound saved',mfs_loading:'Analysing the file…',mfs_removed:'Sound removed',mfs_muted:'Sounds are turned off above',mfs_err_type:'This file is not audio',mfs_err_size:'File too large (15 MB maximum)',mfs_err_decode:'Your browser cannot read this audio format',mfs_err_store:'Could not save this sound in this browser'},
    ru:{mfs_title:'Звук найденного матча',mfs_note:'Файл остаётся в этом браузере и никогда не отправляется на наши серверы. На другом устройстве его нужно добавить заново.',mfs_p_classic:'Классика',mfs_p_alarm:'Тревога',mfs_p_soft:'Мягкий',mfs_p_arcade:'Аркада',mfs_p_radar:'Радар',mfs_p_file:'Мой звук',mfs_play:'Прослушать',mfs_pick:'Выбрать аудиофайл',mfs_change:'Заменить файл',mfs_remove:'Удалить',mfs_start:'Начало',mfs_dur:'Длительность',mfs_auto:'Найти лучший момент',mfs_auto_ok:'Выбрана самая громкая часть',mfs_vol:'Громкость',mfs_wave:'Нажми на волну, чтобы выбрать начало',mfs_saved:'Звук сохранён',mfs_loading:'Анализ файла…',mfs_removed:'Звук удалён',mfs_muted:'Звуки отключены выше',mfs_err_type:'Этот файл не является аудио',mfs_err_size:'Файл слишком большой (максимум 15 МБ)',mfs_err_decode:'Браузер не может прочитать этот формат',mfs_err_store:'Не удалось сохранить звук в этом браузере'}
  };
  for(const l in I)Object.assign(I18N[l],I[l]);

  const num=(v,min,max,def)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def};
  const fmt=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const soundsOn=()=>!(typeof SET!=='undefined'&&SET&&SET.notif&&!SET.notif.sounds);

  function readCfg(){
    let c=null;
    try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    c=c&&typeof c==='object'?c:{};
    const file=c.file&&typeof c.file==='object'&&c.file.len>0?c.file:null;
    const out={preset:PRESETS[c.preset]||(c.preset==='file'&&file)?c.preset:'classic',vol:num(c.vol,0,100,VOL_DEF),file};
    if(file){
      file.dur=num(file.dur,DUR_MIN,Math.min(DUR_MAX,Math.max(DUR_MIN,file.len)),DUR_DEF);
      file.start=num(file.start,0,Math.max(0,file.len-file.dur),0);
      file.bins=typeof file.bins==='string'?file.bins:'';
    }
    return out;
  }
  const writeCfg=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}};

  function withStore(mode,work){
    return new Promise((ok,ko)=>{
      let open;
      try{open=indexedDB.open(DB,1)}catch(e){return ko(e)}
      open.onupgradeneeded=()=>open.result.createObjectStore(STORE);
      open.onerror=()=>ko(open.error);
      open.onsuccess=()=>{
        const db=open.result,tx=db.transaction(STORE,mode),req=work(tx.objectStore(STORE));
        tx.oncomplete=()=>{db.close();ok(req.result)};
        tx.onerror=tx.onabort=()=>{db.close();ko(tx.error)};
      };
    });
  }

  /* ---------- Analyse : énergie du morceau, puis meilleur passage ---------- */
  async function analyse(file){
    const Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    let audio;
    try{audio=await new Off(1,1,44100).decodeAudioData(await file.arrayBuffer())}catch(e){throw new Error('decode')}
    const data=audio.getChannelData(0),step=Math.max(1,Math.floor(data.length/BINS)),raw=new Float32Array(BINS);
    let top=0;
    for(let b=0;b<BINS;b++){
      let sum=0,n=0;
      for(let i=b*step,e=Math.min(data.length,i+step);i<e;i+=16){sum+=data[i]*data[i];n++}
      raw[b]=n?Math.sqrt(sum/n):0;
      if(raw[b]>top)top=raw[b];
    }
    let bins='';
    for(let b=0;b<BINS;b++)bins+=Math.round(top?raw[b]/top*35:0).toString(36);
    return {len:audio.duration,bins};
  }
  // Le passage retenu : fort sur toute sa durée, avec un bonus s'il arrive d'un coup (un refrain, un drop).
  function bestStart(f){
    const levels=[...f.bins].map(c=>parseInt(c,36)),n=levels.length;
    if(!n||f.dur>=f.len)return 0;
    const sec=f.len/n,w=Math.max(1,Math.round(f.dur/sec)),lead=Math.max(1,Math.round(2/sec)),sum=[0];
    levels.forEach((v,i)=>sum[i+1]=sum[i]+v);
    let best=0,top=-1;
    for(let i=0;i+w<=n;i++){
      const inside=(sum[i+w]-sum[i])/w,back=Math.max(0,i-lead),before=i?(sum[i]-sum[back])/(i-back):0;
      const score=inside+Math.max(0,inside-before)*.6;
      if(score>top){top=score;best=i}
    }
    return Math.round(best*sec*10)/10;
  }

  /* ---------- Lecture ---------- */
  let fileUrl=null,fileRev=null,el=null,fade=null,endT=null,ducked=false;
  async function prepare(){
    const c=readCfg();
    if(!c.file||c.preset!=='file'){if(fileUrl){URL.revokeObjectURL(fileUrl);fileUrl=null;fileRev=null}return null}
    if(fileUrl&&fileRev===c.file.rev)return fileUrl;
    let blob;
    try{blob=await withStore('readonly',s=>s.get(ID))}catch(e){return null}
    if(!blob)return null;
    if(fileUrl)URL.revokeObjectURL(fileUrl);
    fileUrl=URL.createObjectURL(blob);fileRev=c.file.rev;
    return fileUrl;
  }
  function duck(){if(!ducked&&window.TRMusic&&TRMusic.pauseForAlert())ducked=true}
  function unduck(){if(ducked){ducked=false;window.TRMusic&&TRMusic.resumeAfterAlert()}}
  function stop(){
    clearInterval(fade);fade=null;clearTimeout(endT);endT=null;
    if(el){try{el.pause()}catch(e){}el.removeAttribute('src');el=null}
    unduck();
  }
  function playPreset(id,vol){
    const k=vol/VOL_DEF;
    PRESETS[id].forEach(([f,d,at,type,v])=>beep(f,d,at,type,v*k));
  }
  async function playFile(c){
    const url=await prepare();
    if(!url)throw new Error('missing');
    const f=c.file,a=new Audio(url),target=c.vol/100;
    await new Promise((ok,ko)=>{a.onloadedmetadata=ok;a.onerror=ko});
    a.currentTime=f.start;a.volume=0;
    await a.play();
    el=a;
    const t0=performance.now(),ms=f.dur*1000,edge=Math.min(300,ms/4);
    fade=setInterval(()=>{   // arrivée et sortie en fondu : un extrait coupé net claque dans le casque
      const at=performance.now()-t0;
      a.volume=target*Math.max(0,Math.min(1,at/edge,(ms-at)/edge));
    },30);
    endT=setTimeout(stop,ms);
  }
  async function play(){
    stop();
    if(!soundsOn())return;
    const c=readCfg();
    if(c.preset==='file'){
      duck();
      try{return await playFile(c)}catch(e){stop();playPreset('classic',c.vol);return}   // navigateur qui bloque le son, fichier disparu
    }
    duck();
    playPreset(c.preset,c.vol);
    endT=setTimeout(stop,1400);
  }

  /* ---------- Carte dans Paramètres > Notifications ---------- */
  function card(){
    const c=readCfg(),f=c.file;
    const ids=Object.keys(PRESETS).concat(f?['file']:[]);
    const slider=(id,label,min,max,step,value,text)=>`<label class="st-row" style="margin-top:8px;gap:16px"><span style="min-width:62px"><b>${t(label)}</b></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" style="flex:1;accent-color:var(--acc)"><span id="${id}V" style="min-width:42px;text-align:right;color:var(--muted);font-size:12.5px">${text}</span></label>`;
    return `<div class="st-card"><h3>${t('mfs_title')}</h3>
      <div class="st-note">${t('mfs_note')}</div>
      <div class="seg" style="flex-wrap:wrap;margin-top:10px">${ids.map(id=>`<button class="${c.preset===id?'on':''}" data-mfs-preset="${id}">${t('mfs_p_'+id)}</button>`).join('')}</div>
      <div class="st-actions" style="margin-top:10px"><button class="btn" data-mfs="play">${t('mfs_play')}</button><button class="btn ghost" data-mfs="pick">${t(f?'mfs_change':'mfs_pick')}</button>${f?`<button class="btn ghost" data-mfs="clear">${t('mfs_remove')}</button>`:''}</div>
      <input type="file" id="mfsFile" accept="audio/*" hidden>
      ${f?`<canvas id="mfsWave" style="display:block;width:100%;height:72px;margin-top:12px;border-radius:6px;background:var(--bg2);cursor:pointer" title="${t('mfs_wave')}"></canvas>
      <div class="st-note" style="margin-top:6px"><b id="mfsName"></b> · ${t('mfs_wave')}</div>
      ${slider('mfsStart','mfs_start',0,Math.max(.1,f.len-f.dur).toFixed(1),.1,f.start,fmt(f.start))}
      ${slider('mfsDur','mfs_dur',DUR_MIN,Math.min(DUR_MAX,Math.max(DUR_MIN,f.len)).toFixed(1),.5,f.dur,f.dur.toFixed(1)+' s')}
      <div class="st-actions" style="margin-top:8px"><button class="btn ghost sm" data-mfs="auto">${t('mfs_auto')}</button></div>`:''}
      ${slider('mfsVol','mfs_vol',0,100,1,c.vol,c.vol+' %')}
    </div>`;
  }
  function draw(){
    const cv=document.getElementById('mfsWave'),c=readCfg(),f=c.file;
    if(!cv||!f)return;
    const name=document.getElementById('mfsName');if(name)name.textContent=f.name||'';
    const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
    if(!W)return;
    cv.width=W*dpr;cv.height=H*dpr;
    const g=cv.getContext('2d'),css=getComputedStyle(document.documentElement),acc=css.getPropertyValue('--acc').trim()||'#ffab1a',off=css.getPropertyValue('--dim').trim()||'#666';
    g.scale(dpr,dpr);
    const x0=f.start/f.len*W,x1=(f.start+f.dur)/f.len*W;
    g.fillStyle=acc;g.globalAlpha=.14;g.fillRect(x0,0,x1-x0,H);g.globalAlpha=1;
    const bars=Math.floor(W/3),n=f.bins.length;
    for(let i=0;i<bars;i++){
      const lvl=parseInt(f.bins[Math.floor(i/bars*n)]||'0',36)/35,h=Math.max(2,lvl*(H-10)),x=i*3;
      g.fillStyle=x>=x0&&x<x1?acc:off;
      g.fillRect(x,(H-h)/2,2,h);
    }
    g.fillStyle=acc;g.fillRect(x0,0,2,H);
  }
  function setStart(v){
    const c=readCfg();if(!c.file)return;
    c.file.start=Math.round(num(v,0,Math.max(0,c.file.len-c.file.dur),0)*10)/10;
    writeCfg(c);showValues(c);draw();
  }
  function showValues(c){
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
    if(c.file){
      val('mfsStart',c.file.start);val('mfsDur',c.file.dur);
      const s=document.getElementById('mfsStart');if(s)s.max=Math.max(.1,c.file.len-c.file.dur).toFixed(1);
      set('mfsStartV',fmt(c.file.start));set('mfsDurV',c.file.dur.toFixed(1)+' s');
    }
    set('mfsVolV',c.vol+' %');
  }
  const rerender=()=>{if(typeof renderSettings==='function')renderSettings()};

  async function setFile(file){
    if(!file||!/^(audio\/|video\/ogg$|application\/ogg$)/.test(file.type))throw new Error('type');
    if(file.size>MAX_FILE)throw new Error('size');
    const {len,bins}=await analyse(file);
    if(!(len>0))throw new Error('decode');
    try{await withStore('readwrite',s=>s.put(file,ID))}catch(e){throw new Error('store')}
    const c=readCfg(),f={name:String(file.name||'').slice(0,80),len,bins,dur:Math.min(DUR_DEF,len),start:0,rev:Date.now()};
    f.start=bestStart(f);
    c.file=f;c.preset='file';writeCfg(c);
    await prepare();
  }
  async function clear(){
    stop();
    try{localStorage.removeItem(KEY)}catch(e){}
    await prepare();
    try{await withStore('readwrite',s=>s.delete(ID))}catch(e){}
  }

  function bind(){
    const page=document.getElementById('settings');
    if(page){
      page.addEventListener('click',e=>{
        const p=e.target.closest('[data-mfs-preset]');
        if(p){const c=readCfg();c.preset=p.dataset.mfsPreset;writeCfg(c);rerender();play();return}
        const cv=e.target.closest('#mfsWave');
        if(cv){const c=readCfg();if(c.file){const r=cv.getBoundingClientRect();setStart((e.clientX-r.left)/r.width*c.file.len)}return}
        const b=e.target.closest('[data-mfs]');if(!b)return;
        const a=b.dataset.mfs;
        if(a==='play'){if(!soundsOn())return toast(t('mfs_muted'));return play()}
        if(a==='pick')return document.getElementById('mfsFile').click();
        if(a==='clear')return clear().then(()=>{toast(t('mfs_removed'));rerender()});
        if(a==='auto'){const c=readCfg();if(c.file){setStart(bestStart(c.file));toast(t('mfs_auto_ok'))}}
      });
      page.addEventListener('input',e=>{
        const id=e.target.id;
        if(id==='mfsStart')return setStart(e.target.value);
        if(id==='mfsDur'){const c=readCfg();if(!c.file)return;c.file.dur=num(e.target.value,DUR_MIN,Math.min(DUR_MAX,Math.max(DUR_MIN,c.file.len)),DUR_DEF);c.file.start=Math.min(c.file.start,Math.max(0,c.file.len-c.file.dur));writeCfg(c);showValues(c);draw();return}
        if(id==='mfsVol'){const c=readCfg();c.vol=num(e.target.value,0,100,VOL_DEF);writeCfg(c);showValues(c)}
      });
      page.addEventListener('change',e=>{
        if(e.target.id!=='mfsFile'||!e.target.files[0])return;
        toast(t('mfs_loading'));
        setFile(e.target.files[0]).then(()=>{toast(t('mfs_saved'));rerender();play()}).catch(err=>toast(t('mfs_err_'+err.message)));
      });
    }
    // Le son s'arrête dès qu'on répond ou que la fenêtre « match trouvé » se ferme, quelle qu'en soit la raison.
    document.getElementById('acceptBtn')?.addEventListener('click',stop);
    document.getElementById('declineBtn')?.addEventListener('click',stop);
    const found=document.getElementById('found');
    if(found)new MutationObserver(()=>{if(!found.classList.contains('on'))stop()}).observe(found,{attributes:true,attributeFilter:['class']});
    addEventListener('storage',e=>{if(e.key===KEY)prepare()});
    prepare();
  }

  window.TRMatchSound={play,stop,card,draw,clear};
  bind();
})();
