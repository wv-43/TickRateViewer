(function(){
  const KEY='tr_ubg',DB='tickrate_local',STORE='files',ID='bg';
  const MAX_FILE=25*1024*1024,MAX_SIDE=2560,DIM_DEF=78,DIM_MIN=30,DIM_MAX=95;
  const LOGO='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 9 46 46"><g opacity=".07"><path d="M50.61 37.34A19.36 19.36 0 0 1 37.34 50.61M26.66 50.61A19.36 19.36 0 0 1 13.39 37.34M13.39 26.66A19.36 19.36 0 0 1 26.66 13.39M37.34 13.39A19.36 19.36 0 0 1 50.61 26.66" fill="none" stroke="#fff" stroke-width="2.7" stroke-linecap="round"/><circle cx="32" cy="32" r="15.2" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="1 1.985" opacity=".42"/><path d="M32 10.4v4.4M32 49.2v4.4M10.4 32h4.4M49.2 32h4.4" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/><path d="M20.4 21.2h23.2l-2.6 5.4h-6.2V42L32 45.6 29.6 42V26.6h-6.2z" fill="#fff"/></g></svg>')+'")';
  const CSS='html.has-ubg body,html.has-ubg-logo body{background:transparent!important}'
    +'#userBg{position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:var(--ubg);background-position:center;background-size:cover;background-repeat:no-repeat}'
    +'html.has-ubg #userBg{background-color:#000}'
    +'html.has-ubg-logo #userBg{background-size:min(86vh,86vw)}'
    +'html.has-ubg .auth{background-color:#000!important;background-image:var(--ubg)!important;background-position:center;background-size:cover;background-repeat:no-repeat}'
    +'html.has-ubg .auth-slider-bg{display:none}'
    +'html.has-ubg .auth-side{background:rgba(9,10,14,.78)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}';
  const root=document.documentElement;
  let layer=null,objUrl=null,shownRev=null;

  const clampDim=v=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(DIM_MAX,Math.max(DIM_MIN,n)):DIM_DEF};
  const readCfg=()=>{try{const c=JSON.parse(localStorage.getItem(KEY)||'null');return c&&c.on?{on:1,dim:clampDim(c.dim),rev:c.rev||0}:null}catch(e){return null}};
  const writeCfg=c=>{try{c?localStorage.setItem(KEY,JSON.stringify(c)):localStorage.removeItem(KEY)}catch(e){}};

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

  function mount(){
    if(layer)return;
    const css=document.createElement('style');css.id='userBgCss';css.textContent=CSS;
    document.head.appendChild(css);
    layer=document.createElement('div');layer.id='userBg';layer.setAttribute('aria-hidden','true');
    document.body.prepend(layer);
  }
  function freeImage(){
    if(objUrl){URL.revokeObjectURL(objUrl);objUrl=null}
    shownRev=null;
  }
  function paintImage(dim){
    if(!objUrl)return;
    const a=(dim/100).toFixed(2);
    root.style.setProperty('--ubg',`linear-gradient(rgba(0,0,0,${a}),rgba(0,0,0,${a})),url("${objUrl}")`);
  }
  function showLogo(){
    mount();freeImage();
    root.style.setProperty('--ubg',LOGO);
    root.classList.remove('has-ubg');
    root.classList.add('has-ubg-logo');
  }
  function showImage(blob,cfg){
    mount();freeImage();
    objUrl=URL.createObjectURL(blob);shownRev=cfg.rev;
    paintImage(cfg.dim);
    root.classList.remove('has-ubg-logo');
    root.classList.add('has-ubg');
  }
  async function refresh(){
    const cfg=readCfg();
    if(!cfg)return showLogo();
    if(shownRev===cfg.rev)return paintImage(cfg.dim);
    let blob;
    try{blob=await withStore('readonly',s=>s.get(ID))}catch(e){return showLogo()}
    if(!blob){writeCfg(null);return showLogo()}
    showImage(blob,cfg);
  }

  async function shrink(file){
    if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('type');
    if(file.size>MAX_FILE)throw new Error('size');
    let bmp;
    try{bmp=await createImageBitmap(file)}catch(e){throw new Error('decode')}
    const k=Math.min(1,MAX_SIDE/Math.max(bmp.width,bmp.height));
    const c=document.createElement('canvas');
    c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
    c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    bmp.close();
    const encode=type=>new Promise(r=>c.toBlob(r,type,0.86));
    let out=await encode('image/webp');
    if(!out||out.type!=='image/webp')out=await encode('image/jpeg');
    if(!out)throw new Error('decode');
    return out;
  }

  window.TRUserBg={
    has:()=>!!readCfg(),
    dim:()=>(readCfg()||{dim:DIM_DEF}).dim,
    range:{min:DIM_MIN,max:DIM_MAX},
    async set(file){
      const blob=await shrink(file);
      try{await withStore('readwrite',s=>s.put(blob,ID))}catch(e){throw new Error('store')}
      writeCfg({on:1,dim:(readCfg()||{dim:DIM_DEF}).dim,rev:Date.now()});
      await refresh();
    },
    setDim(v){const c=readCfg();if(!c)return;c.dim=clampDim(v);writeCfg(c);paintImage(c.dim)},
    async clear(){
      writeCfg(null);showLogo();
      try{await withStore('readwrite',s=>s.delete(ID))}catch(e){}
    }
  };

  addEventListener('storage',e=>{if(e.key===KEY)refresh()});
  if(document.body)refresh();
  else document.addEventListener('DOMContentLoaded',refresh,{once:true});
})();
