(function(){
  const KEY='tr_sfx',VOL_DEF=70;
  const I={
    fr:{sfx_title:'Ambiance sonore',sfx_note:'Tous les sons sont créés par ton navigateur : aucun fichier n\'est téléchargé ni stocké.',sfx_vol:'Volume',sfx_ui:'Sons d\'interface',sfx_ui_h:'Survol, clics et changements de page',sfx_3d:'Son 3D',sfx_3d_h:'Les sons du site se placent autour de toi, à écouter au casque'},
    en:{sfx_title:'Sound design',sfx_note:'Every sound is created by your browser: no file is downloaded or stored.',sfx_vol:'Volume',sfx_ui:'Interface sounds',sfx_ui_h:'Hover, clicks and page changes',sfx_3d:'3D sound',sfx_3d_h:'Site sounds move around you, best with headphones'},
    ru:{sfx_title:'Звуковое оформление',sfx_note:'Все звуки создаются браузером: файлы не загружаются и не хранятся.',sfx_vol:'Громкость',sfx_ui:'Звуки интерфейса',sfx_ui_h:'Наведение, клики и смена страниц',sfx_3d:'3D-звук',sfx_3d_h:'Звуки сайта располагаются вокруг вас, лучше в наушниках'}
  };
  for(const l in I)Object.assign(I18N[l],I[l]);

  function readCfg(){
    let c=null;
    try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    c=c&&typeof c==='object'?c:{};
    const v=Math.round(Number(c.vol));
    return {vol:Number.isFinite(v)&&c.vol!=null?Math.min(100,Math.max(0,v)):VOL_DEF,ui:c.ui!==false,spatial:c.spatial!==false};
  }
  let cfg=readCfg();
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};
  const on=()=>!(typeof SET!=='undefined'&&SET&&SET.notif&&!SET.notif.sounds);

  let ac=null,master=null,room=null,noise=null,orbitNode=null,orbitUntil=0;
  const level=()=>cfg.vol/VOL_DEF;

  function impulse(){
    const secs=.9,len=Math.floor(ac.sampleRate*secs),buf=ac.createBuffer(2,len,ac.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=buf.getChannelData(ch);
      let prev=0;
      for(let i=0;i<len;i++){
        const left=1-i/len,cut=.08+.5*left;
        prev+=cut*((Math.random()*2-1)-prev);
        d[i]=prev*Math.pow(left,3.2);
      }
    }
    return buf;
  }
  function ctx(){
    try{
      if(!ac){
        ac=new (window.AudioContext||window.webkitAudioContext)();
        const comp=ac.createDynamicsCompressor();
        comp.threshold.value=-14;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.15;
        comp.connect(ac.destination);
        master=ac.createGain();master.gain.value=level();master.connect(comp);
        room=ac.createConvolver();room.buffer=impulse();
        const wet=ac.createGain();wet.gain.value=.22;
        room.connect(wet).connect(master);
        orbitNode=ac.createPanner();orbitNode.panningModel='HRTF';orbitNode.distanceModel='linear';orbitNode.refDistance=1;orbitNode.maxDistance=10;orbitNode.rolloffFactor=0;
        const orbitGain=ac.createGain();orbitGain.gain.value=1.25;
        orbitNode.connect(orbitGain).connect(master);
        noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
        const n=noise.getChannelData(0);
        for(let i=0;i<n.length;i++)n[i]=Math.random()*2-1;
      }
      if(ac.state==='suspended')ac.resume();
    }catch(e){return null}
    return ac;
  }
  const ready=()=>ac&&ac.state==='running';

  function note(f,d,at,type,vol,wet){
    const c=ctx();if(!c)return;
    const t0=c.currentTime+at,end=t0+d+.08;
    const out=c.createGain(),lp=c.createBiquadFilter();
    lp.type='lowpass';lp.Q.value=.6;
    lp.frequency.setValueAtTime(Math.min(14000,f*(type==='sine'?10:5)),t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500,f*1.8),t0+d);
    out.gain.setValueAtTime(.0001,t0);
    out.gain.exponentialRampToValueAtTime(vol,t0+.006);
    out.gain.exponentialRampToValueAtTime(vol*.5,t0+Math.max(.01,d*.35));
    out.gain.exponentialRampToValueAtTime(.0001,end);
    lp.connect(out);out.connect(orbiting()?orbitNode:master);
    if(wet)out.connect(room);
    const parts=[[type,-5,.55],[type,5,.55],['sine',-1200,.25]];
    parts.forEach(([shape,detune,mix],i)=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type=shape;o.frequency.value=f;o.detune.value=detune;g.gain.value=mix;
      o.connect(g).connect(lp);
      o.start(t0);o.stop(end+.02);
      if(i===0)o.onended=()=>{lp.disconnect();out.disconnect()};
    });
  }

  window.beep=function(f=880,d=.12,delay=0,type='sine',vol=.05){
    if(on())note(f,d,delay,type,vol,true);
  };

  const orbiting=()=>cfg.spatial&&orbitNode&&performance.now()<orbitUntil;
  function orbit(ms){
    if(!cfg.spatial||!on()||!ctx()||!orbitNode.positionX)return;
    const t0=ac.currentTime,n=Math.max(8,Math.round(ms/60)),turns=ms/1800,px=orbitNode.positionX,pz=orbitNode.positionZ;
    px.cancelScheduledValues(t0);pz.cancelScheduledValues(t0);
    px.setValueAtTime(0,t0);pz.setValueAtTime(-1.6,t0);
    for(let i=1;i<=n;i++){
      const a=i/n*Math.PI*2*turns,at=t0+i/n*ms/1000;
      px.linearRampToValueAtTime(Math.sin(a)*1.6,at);
      pz.linearRampToValueAtTime(-Math.cos(a)*1.6,at);
    }
    orbitUntil=performance.now()+ms;
  }
  function attach(el,ms){
    if(!cfg.spatial||!on()||!ready()||!orbitNode||!orbitNode.positionX)return false;
    try{ac.createMediaElementSource(el).connect(orbitNode)}catch(e){return false}
    orbit(ms);
    return true;
  }
  let panX=0;
  function blip(from,to,d,vol){
    const c=ac,t0=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(from,t0);o.frequency.exponentialRampToValueAtTime(to,t0+d);
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+.003);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    o.connect(g);
    if(cfg.spatial&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=panX;g.connect(p).connect(master)}else g.connect(master);
    o.start(t0);o.stop(t0+d+.01);
  }
  function whoosh(){
    const c=ac,t0=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=noise;f.type='bandpass';f.Q.value=1.1;
    f.frequency.setValueAtTime(450,t0);f.frequency.exponentialRampToValueAtTime(1900,t0+.16);
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.03,t0+.05);g.gain.exponentialRampToValueAtTime(.0001,t0+.18);
    s.connect(f).connect(g);g.connect(master);g.connect(room);
    s.start(t0,Math.random()*.7,.2);
  }
  const uiOn=()=>cfg.ui&&on();

  const CLICK='button,a[href],summary,select,[role="button"],[data-view]',HOVER='.rail-btn,.btn,.seg button,.st-nav button,.theme-swatch';
  let lastHover=null,hoverAt=0;
  document.addEventListener('pointerdown',()=>{if(on())ctx()},{capture:true,passive:true});
  const panFrom=x=>{panX=Math.max(-1,Math.min(1,(x/innerWidth)*2-1))*.65};
  document.addEventListener('click',e=>{
    if(!uiOn()||!ctx()||!ready())return;
    panFrom(e.clientX);
    const box=e.target.closest&&e.target.closest('input[type="checkbox"]');
    if(box){box.checked?blip(1000,1500,.05,.05):blip(1400,900,.05,.04);return}
    const el=e.target.closest&&e.target.closest(CLICK);
    if(el&&!el.disabled)blip(1500,850,.035,.045);
  },true);
  document.addEventListener('pointerover',e=>{
    if(e.pointerType!=='mouse'||!uiOn()||!ready()||!e.target.closest)return;
    const el=e.target.closest(HOVER);
    if(!el){lastHover=null;return}
    const now=performance.now();
    if(el===lastHover||el.disabled||now-hoverAt<50)return;
    lastHover=el;hoverAt=now;panFrom(e.clientX);
    blip(2300,2000,.016,.008);
  },{capture:true,passive:true});
  addEventListener('hashchange',()=>{if(uiOn()&&ready())whoosh()});

  function card(tog){
    return `<div class="st-card"><h3>${t('sfx_title')}</h3>
      <div class="st-note">${t('sfx_note')}</div>
      <label class="st-row" style="margin-top:8px;gap:16px"><span style="min-width:62px"><b>${t('sfx_vol')}</b></span><input type="range" id="sfxVol" min="0" max="100" value="${cfg.vol}" style="flex:1;accent-color:var(--acc)"><span id="sfxVolV" style="min-width:42px;text-align:right;color:var(--muted);font-size:12.5px">${cfg.vol} %</span></label>
      ${tog('sfxUi',cfg.ui,t('sfx_ui'),t('sfx_ui_h'))}
      ${tog('sfx3d',cfg.spatial,t('sfx_3d'),t('sfx_3d_h'))}
    </div>`;
  }
  const page=document.getElementById('settings');
  if(page){
    page.addEventListener('input',e=>{
      if(e.target.id!=='sfxVol')return;
      cfg.vol=Math.min(100,Math.max(0,Math.round(Number(e.target.value))||0));
      save();
      if(master)master.gain.setTargetAtTime(level(),ac.currentTime,.02);
      document.getElementById('sfxVolV').textContent=cfg.vol+' %';
    });
    page.addEventListener('change',e=>{
      if(e.target.id==='sfxVol')window.beep(880,.16);
      if(e.target.id==='sfxUi'){cfg.ui=e.target.checked;save();if(typeof toast==='function')toast(t('st_saved'))}
      if(e.target.id==='sfx3d'){cfg.spatial=e.target.checked;save();if(cfg.spatial){orbit(1800);window.beep(660,.3,0,'sine',.07);window.beep(880,.3,.5,'sine',.07);window.beep(1047,.5,1,'sine',.07)}}
    });
  }

  window.TRSfx={card,orbit,attach,clear(){try{localStorage.removeItem(KEY)}catch(e){}cfg=readCfg();if(master)master.gain.value=level()}};
})();
