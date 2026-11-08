/* =====================================================
 * TICKRATE - Ping réel vers les serveurs de jeu (ping.js)
 * Un navigateur ne peut pas faire de ping UDP : on mesure l'aller-retour HTTP vers
 * un petit répondeur installé sur chaque machine de jeu (server-cs/ping-responder).
 * Les adresses viennent de Firebase : pingTargets/<région>/<serveur> = { url, city }
 * (à remplir dans la console Firebase quand les serveurs sont en ligne).
 * ===================================================== */
class PingProbe{
  constructor({samples=5,timeout=2000}={}){this.samples=samples;this.timeout=timeout}
  // une requête chronométrée ; null si le serveur ne répond pas à temps
  async once(url){
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),this.timeout),t0=performance.now();
    try{await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store',mode:'cors',signal:ctl.signal});return performance.now()-t0}
    catch(e){return null}finally{clearTimeout(tm)}
  }
  // première requête jetée (DNS + connexion + TLS), puis médiane des suivantes
  async measure(url){
    if(await this.once(url)==null)return null;
    const got=[];
    for(let i=0;i<this.samples;i++){const ms=await this.once(url);if(ms!=null)got.push(ms)}
    if(!got.length)return null;
    got.sort((a,b)=>a-b);return Math.round(got[Math.floor(got.length/2)]);
  }
  // { EU:{ s1:{url}, … }, … } -> { EU:{ ms, server }, … } : le meilleur serveur de chaque région
  async regions(targets){
    const out={};
    await Promise.all(Object.entries(targets||{}).map(async([reg,servers])=>{
      let best=null;
      for(const [sid,s] of Object.entries(servers||{})){
        if(!s||!/^https?:\/\//.test(s.url||''))continue;
        const ms=await this.measure(s.url);
        if(ms!=null&&(!best||ms<best.ms))best={ms,server:sid,city:s.city||null};
      }
      out[reg]=best;
    }));
    return out;
  }
}

// état affiché par région : state = 'wait' (mesure en cours) | 'ok' | 'none' (aucun serveur) | 'down' (aucun ne répond)
Object.assign(I18N.fr,{ping_wait:'Mesure du ping…',ping_ok:'Ping mesuré vers le serveur le plus proche',ping_none:'Aucun serveur dans cette région pour le moment',ping_down:'Les serveurs de cette région ne répondent pas'});
Object.assign(I18N.en,{ping_wait:'Measuring ping…',ping_ok:'Ping measured to the closest server',ping_none:'No server in this region yet',ping_down:'Servers in this region are not responding'});
Object.assign(I18N.ru,{ping_wait:'Измеряем пинг…',ping_ok:'Пинг до ближайшего сервера',ping_none:'В этом регионе пока нет серверов',ping_down:'Серверы региона не отвечают'});
const PING={probe:new PingProbe(),timer:null,busy:false,at:0,EVERY:30e3};
REGIONS.forEach(r=>{r.ping=null;r.pingState='wait'});
async function pingRefresh(force=false){
  if(PING.busy||(!force&&Date.now()-PING.at<PING.EVERY))return;
  if(!(typeof fbLive==='function'&&fbLive()&&FBA.uid)){REGIONS.forEach(r=>{r.ping=null;r.pingState='none'});return pingPaint()}
  PING.busy=true;
  const targets=(await fbReq('pingTargets'))||{};
  const res=await PING.probe.regions(targets);
  REGIONS.forEach(r=>{
    const has=targets[r.id]&&Object.keys(targets[r.id]).length,x=res[r.id];
    r.ping=x?x.ms:null;r.pingState=x?'ok':has?'down':'none';
    if(x&&x.city)r.city=x.city;
  });
  PING.at=Date.now();PING.busy=false;pingPaint();
}
function pingPaint(){if(typeof renderRegions==='function'&&$('#regions'))renderRegions()}
// mesure à l'ouverture, puis toutes les 30 s tant que l'onglet est visible et la page Jouer ouverte
function pingLoop(){
  clearInterval(PING.timer);
  PING.timer=setInterval(()=>{if(!document.hidden&&!$('#play').hidden)pingRefresh()},5e3);
  setTimeout(()=>pingRefresh(true),0);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#play')?.hidden)pingRefresh()});
pingLoop();
