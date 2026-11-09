(function(){
  const KEY='tr_sc',CB='tr_sc_cb',API='https://api.soundcloud.com',AUTH='https://secure.soundcloud.com/authorize';
  const I={
    fr:{sc_connect:'Connecter SoundCloud',sc_off:'Déconnecter',sc_likes:'Mes likes',sc_related:'Similaires',sc_like:'Liker sur SoundCloud',sc_unlike:'Retirer le like',sc_as:'Connecté à SoundCloud : {n}',sc_fail:'La connexion à SoundCloud a échoué',sc_none:'Aucun résultat',sc_err:'SoundCloud n\'a pas répondu',sc_open:'Ouvrir sur SoundCloud',sc_popup:'Autorise les fenêtres surgissantes pour te connecter'},
    en:{sc_connect:'Connect SoundCloud',sc_off:'Disconnect',sc_likes:'My likes',sc_related:'Similar',sc_like:'Like on SoundCloud',sc_unlike:'Remove like',sc_as:'Connected to SoundCloud: {n}',sc_fail:'Could not connect to SoundCloud',sc_none:'No results',sc_err:'SoundCloud did not respond',sc_open:'Open on SoundCloud',sc_popup:'Allow pop-ups to sign in'},
    ru:{sc_connect:'Подключить SoundCloud',sc_off:'Отключить',sc_likes:'Мои лайки',sc_related:'Похожие',sc_like:'Лайкнуть в SoundCloud',sc_unlike:'Убрать лайк',sc_as:'Подключено к SoundCloud: {n}',sc_fail:'Не удалось подключиться к SoundCloud',sc_none:'Ничего не найдено',sc_err:'SoundCloud не ответил',sc_open:'Открыть в SoundCloud',sc_popup:'Разрешите всплывающие окна для входа'}
  };
  for(const l in I)Object.assign(I18N[l],I[l]);

  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.access?v:null}catch(e){return null}};
  const write=()=>{try{s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY)}catch(e){}};
  let s=read(),liked=new Set(),pending=null;
  const subs=new Set(),emit=()=>subs.forEach(f=>{try{f()}catch(e){}});

  const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const random=n=>b64(crypto.getRandomValues(new Uint8Array(n)));
  const store=r=>{s={access:r.access,refresh:r.refresh||(s&&s.refresh)||null,exp:Date.now()+r.expiresIn*1000,user:s&&s.user||null};write()};

  function disconnect(){
    s=null;liked=new Set();
    try{localStorage.removeItem(CB)}catch(e){}
    write();emit();
  }

  async function renew(){
    const work=async()=>{
      s=read();
      if(!s)throw new Error('off');
      if(s.exp-60e3>Date.now())return;
      if(!s.refresh){disconnect();throw new Error('off')}
      const r=await fbCall('scAuth',{op:'refresh',refresh:s.refresh});
      if(!r||r.error||!r.access){
        if(r&&r.error==='network')throw new Error('net');
        disconnect();throw new Error('off');
      }
      store(r);
    };
    return navigator.locks?navigator.locks.request('tr_sc_refresh',work):work();
  }
  async function api(path,opt={},retry=true){
    if(!s)throw new Error('off');
    if(s.exp-60e3<=Date.now())await renew();
    const r=await fetch(API+path,{method:opt.method||'GET',headers:{Accept:'application/json; charset=utf-8',Authorization:'OAuth '+s.access}});
    if(r.status===401&&retry){if(s)s.exp=0;await renew();return api(path,opt,false)}
    if(!r.ok)throw new Error('http'+r.status);
    return r.status===204?null:r.json().catch(()=>null);
  }

  const idOf=t=>{const m=String(t.urn||t.id||'').match(/(\d+)$/);return m?m[1]:null};
  const norm=list=>((list&&list.collection)||list||[]).map(t=>({
    id:idOf(t),title:String(t.title||'').slice(0,120),artist:String(t.user&&t.user.username||'').slice(0,80),
    url:/^https:\/\/soundcloud\.com\//.test(t.permalink_url||'')?t.permalink_url:''
  })).filter(t=>t.url&&t.id);

  async function loadUser(){
    try{
      const me=await api('/me');
      if(s&&me){s.user={name:String(me.username||'').slice(0,80)};write()}
      await likes();
    }catch(e){}
    emit();
  }
  async function likes(){
    const l=norm(await api('/me/likes/tracks?limit=50&access=playable&linked_partitioning=true'));
    liked=new Set(l.map(t=>t.id));
    return l;
  }

  async function connect(){
    const pop=window.open('','tr_sc_auth','width=520,height=720');
    if(!pop)throw new Error('popup');
    const cfg=await fbCall('scAuth',{op:'config'});
    if(!cfg||cfg.error||!cfg.clientId){pop.close();throw new Error('fail')}
    const verifier=random(64),state=random(24);
    const challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
    pending={verifier,state};
    pop.location=AUTH+'?'+new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.redirect,response_type:'code',code_challenge:challenge,code_challenge_method:'S256',state});
  }
  async function finish(raw){
    let m=null;
    try{m=JSON.parse(raw)}catch(e){}
    try{localStorage.removeItem(CB)}catch(e){}
    const p=pending;
    if(!m||!p||m.state!==p.state)return;
    pending=null;
    if(m.error||!m.code)return fail();
    const r=await fbCall('scAuth',{op:'code',code:m.code,verifier:p.verifier});
    if(!r||r.error||!r.access)return fail();
    s=null;store(r);emit();
    loadUser();
  }
  const fail=()=>{if(typeof toast==='function')toast(t('sc_fail'))};

  addEventListener('storage',e=>{
    if(e.key===CB&&e.newValue)finish(e.newValue);
    if(e.key===KEY){s=read();if(!s)liked=new Set();emit()}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    if(typeof doLogout!=='function')return;
    const o=doLogout;
    doLogout=async function(...a){disconnect();return o.apply(this,a)};
  },{once:true});

  window.TRSc={
    connected:()=>!!s,
    name:()=>(s&&s.user&&s.user.name)||'',
    connect,disconnect,likes,
    onChange:f=>subs.add(f),
    isLiked:id=>liked.has(String(id)),
    async checkLiked(id){
      const t=await api('/tracks/soundcloud:tracks:'+encodeURIComponent(id));
      if(t&&typeof t.user_favorite==='boolean')t.user_favorite?liked.add(String(id)):liked.delete(String(id));
    },
    search:async q=>norm(await api('/tracks?'+new URLSearchParams({q,access:'playable',limit:'20',linked_partitioning:'true'}))),
    related:async id=>norm(await api('/tracks/soundcloud:tracks:'+encodeURIComponent(id)+'/related?access=playable&limit=20&linked_partitioning=true')),
    async like(id,on){
      const method=on?'POST':'DELETE',safe=encodeURIComponent(id);
      let done=false,last='';
      for(const path of ['/likes/tracks/soundcloud:tracks:'+safe,'/likes/tracks/'+safe]){
        try{await api(path,{method});done=true;break}
        catch(e){if(e.message==='off')throw e;last=e.message}
      }
      if(!done){
        const r=await fbCall('scAuth',{op:'like',access:s&&s.access,id:String(id),on});
        if(!r||r.error){console.warn('SoundCloud like refusé',method,last,r&&r.error);throw new Error('like')}
      }
      on?liked.add(String(id)):liked.delete(String(id));
    }
  };
  if(s)document.addEventListener('DOMContentLoaded',loadUser,{once:true});
})();
