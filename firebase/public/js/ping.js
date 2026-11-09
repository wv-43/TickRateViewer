class PingProbe{
  constructor({samples=5,timeout=2000}={}){this.samples=samples;this.timeout=timeout}
  async once(url){
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),this.timeout),t0=performance.now();
    try{await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store',mode:'cors',signal:ctl.signal});return performance.now()-t0}
    catch(e){return null}finally{clearTimeout(tm)}
  }
  async measure(url){
    if(await this.once(url)==null)return null;
    const got=[];
    for(let i=0;i<this.samples;i++){const ms=await this.once(url);if(ms!=null)got.push(ms)}
    if(!got.length)return null;
    got.sort((a,b)=>a-b);return Math.round(got[Math.floor(got.length/2)]);
  }
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

Object.assign(I18N.fr,{ping_wait:'Mesure du ping…',ping_ok:'Ping mesuré vers la sonde la plus proche',ping_none:'Ping non mesuré : aucune cible disponible. La région peut rester ouverte au matchmaking.',ping_down:'La sonde ping ne répond pas. Cela ne signifie pas que la file est fermée.'});
Object.assign(I18N.en,{ping_wait:'Measuring ping…',ping_ok:'Ping measured to the closest probe',ping_none:'Ping not measured: no probe is available. The region may still be open for matchmaking.',ping_down:'The ping probe is not responding. This does not mean the queue is closed.'});
Object.assign(I18N.ru,{ping_wait:'Измеряем пинг…',ping_ok:'Пинг до ближайшей контрольной точки',ping_none:'Пинг не измерен: контрольная точка недоступна. Регион может быть открыт для матчмейкинга.',ping_down:'Контрольная точка пинга не отвечает. Это не означает, что очередь закрыта.'});
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
function pingLoop(){
  clearInterval(PING.timer);
  PING.timer=setInterval(()=>{if(!document.hidden&&!$('#play').hidden)pingRefresh()},5e3);
  setTimeout(()=>pingRefresh(true),0);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#play')?.hidden)pingRefresh()});
pingLoop();
