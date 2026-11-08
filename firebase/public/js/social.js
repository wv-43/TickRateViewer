/* =====================================================
 * TICKRATE - Notifications, Chat de room, Messages privés (social-voice.js)
 * ===================================================== */
/* =====================================================
   NOTIFICATIONS (cloche) : résultats, bans, pass, missions, file...
   ===================================================== */
const NI=d=>`<svg class="ic" aria-hidden="true" viewBox="0 0 512 512" width="15" height="15" fill="currentColor">${d}</svg>`;
const N_ICON={match:NI('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M256 96V56M256 456v-40M256 112a144 144 0 10144 144 144 144 0 00-144-144zM416 256h40M56 256h40"/>'),win:NI('<path d="M464 80h-60.1a4 4 0 01-4-4V63.92a32 32 0 00-32-31.92l-223.79.26a32 32 0 00-31.94 31.93V76a4 4 0 01-4 4H48a16 16 0 00-16 16v16c0 54.53 30 112.45 76.52 125.35a7.82 7.82 0 015.55 5.9c5.77 26.89 23.52 52.5 51.41 73.61 20.91 15.83 45.85 27.5 68.27 32.48a8 8 0 016.25 7.8V444a4 4 0 01-4 4h-59.55c-8.61 0-16 6.62-16.43 15.23A16 16 0 00176 480h159.55c8.61 0 16-6.62 16.43-15.23A16 16 0 00336 448h-60a4 4 0 01-4-4v-86.86a8 8 0 016.25-7.8c22.42-5 47.36-16.65 68.27-32.48 27.89-21.11 45.64-46.72 51.41-73.61a7.82 7.82 0 015.55-5.9C450 224.45 480 166.53 480 112V96a16 16 0 00-16-16zM112 198.22a4 4 0 01-6 3.45c-10.26-6.11-17.75-15.37-22.14-21.89-11.91-17.69-19-40.67-19.79-63.63a4 4 0 014-4.15h40a4 4 0 014 4c-.02 27.45-.07 58.87-.07 82.22zm316.13-18.44c-4.39 6.52-11.87 15.78-22.13 21.89a4 4 0 01-6-3.46c0-26.51 0-56.63-.05-82.21a4 4 0 014-4h40a4 4 0 014 4.15c-.79 22.96-7.9 45.94-19.81 63.63z"/>'),loss:NI('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 368h112V256"/><path d="M48 144l121.37 121.37a32 32 0 0045.26 0l50.74-50.74a32 32 0 0145.26 0L448 352" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>'),ban:NI('<circle fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="48" cx="256" cy="256" r="200"/><path stroke="currentColor" stroke-miterlimit="10" stroke-width="48" d="M114.58 114.58l282.84 282.84"/>'),pass:NI('<path d="M490.18 181.4l-44.13-44.13a20 20 0 00-27-1 30.81 30.81 0 01-41.68-1.6 30.81 30.81 0 01-1.6-41.67 20 20 0 00-1-27L330.6 21.82a19.91 19.91 0 00-28.13 0l-70.35 70.34a39.87 39.87 0 00-9.57 15.5 7.71 7.71 0 01-4.83 4.83 39.78 39.78 0 00-15.5 9.58l-180.4 180.4a19.91 19.91 0 000 28.13L66 374.73a20 20 0 0027 1 30.69 30.69 0 0143.28 43.28 20 20 0 001 27l44.13 44.13a19.91 19.91 0 0028.13 0l180.4-180.4a39.82 39.82 0 009.58-15.49 7.69 7.69 0 014.84-4.84 39.84 39.84 0 0015.49-9.57l70.34-70.35a19.91 19.91 0 00-.01-28.09zm-228.37-29.65a16 16 0 01-22.63 0l-11.51-11.51a16 16 0 0122.63-22.62l11.51 11.5a16 16 0 010 22.63zm44 44a16 16 0 01-22.62 0l-11-11a16 16 0 1122.63-22.63l11 11a16 16 0 01.01 22.66zm44 44a16 16 0 01-22.63 0l-11-11a16 16 0 0122.63-22.62l11 11a16 16 0 01.05 22.67zm44.43 44.54a16 16 0 01-22.63 0l-11.44-11.5a16 16 0 1122.68-22.57l11.45 11.49a16 16 0 01-.01 22.63z"/>'),level:NI('<path d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48zm91.36 212.65a16 16 0 01-22.63.09L272 208.42V342a16 16 0 01-32 0V208.42l-52.73 52.32A16 16 0 11164.73 238l80-79.39a16 16 0 0122.54 0l80 79.39a16 16 0 01.09 22.65z"/>'),mission:NI('<path d="M258.9 48C141.92 46.42 46.42 141.92 48 258.9c1.56 112.19 92.91 203.54 205.1 205.1 117 1.6 212.48-93.9 210.88-210.88C462.44 140.91 371.09 49.56 258.9 48zm-16.79 192.47l51.55-59a16 16 0 0124.1 21.06l-51.55 59a16 16 0 11-24.1-21.06zm-38.86 90.85a16 16 0 01-22.62 0l-47.95-48a16 16 0 1122.64-22.62l48 48a16 16 0 01-.07 22.62zm176.8-128.79l-111.88 128a16 16 0 01-11.51 5.47h-.54a16 16 0 01-11.32-4.69l-47.94-48a16 16 0 1122.64-22.62l29.8 29.83a8 8 0 0011.68-.39l95-108.66a16 16 0 0124.1 21.06z"/>'),prio:NI('<path d="M194.82 496a18.36 18.36 0 01-18.1-21.53v-.11L204.83 320H96a16 16 0 01-12.44-26.06L302.73 23a18.45 18.45 0 0132.8 13.71c0 .3-.08.59-.13.89L307.19 192H416a16 16 0 0112.44 26.06L209.24 489a18.45 18.45 0 01-14.42 7z"/>'),friend:NI('<path d="M288 256c52.79 0 99.43-49.71 104-110.82 2.27-30.7-7.36-59.33-27.12-80.6C345.33 43.57 318 32 288 32c-30.24 0-57.59 11.5-77 32.38-19.63 21.11-29.2 49.8-27 80.78C188.49 206.28 235.12 256 288 256zM495.38 439.76c-8.44-46.82-34.79-86.15-76.19-113.75C382.42 301.5 335.83 288 288 288s-94.42 13.5-131.19 38c-41.4 27.6-67.75 66.93-76.19 113.75-1.93 10.73.69 21.34 7.19 29.11A30.94 30.94 0 00112 480h352a30.94 30.94 0 0024.21-11.13c6.48-7.77 9.1-18.38 7.17-29.11zM104 288v-40h40a16 16 0 000-32h-40v-40a16 16 0 00-32 0v40H32a16 16 0 000 32h40v40a16 16 0 0032 0z"/>'),friend_ok:NI('<path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z"/>'),dm:NI('<path d="M398 81.84A227.4 227.4 0 00255.82 32C194.9 32 138 55.47 95.46 98.09 54.35 139.33 31.82 193.78 32 251.37a215.66 215.66 0 0035.65 118.76l.19.27c.28.41.57.82.86 1.22s.65.92.73 1.05l.22.4c1.13 2 2 4.44 1.23 6.9l-18.42 66.66a29.13 29.13 0 00-1.2 7.63A25.69 25.69 0 0076.83 480a29.44 29.44 0 0010.45-2.29l67.49-24.36.85-.33a14.75 14.75 0 015.8-1.15 15.12 15.12 0 015.37 1c1.62.63 16.33 6.26 31.85 10.6 12.9 3.6 39.74 9 60.77 9 59.65 0 115.35-23.1 156.83-65.06C457.36 365.77 480 310.42 480 251.49a213.5 213.5 0 00-4.78-45c-10.34-48.62-37.76-92.9-77.22-124.65zM87.48 380zM160 288a32 32 0 1132-32 32 32 0 01-32 32zm96 0a32 32 0 1132-32 32 32 0 01-32 32zm96 0a32 32 0 1132-32 32 32 0 01-32 32z"/>'),trade:NI('<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M304 48l112 112-112 112M398.87 160H96M208 464L96 352l112-112M114 352h302"/>'),party:NI('<path d="M483.13 245.38C461.92 149.49 430 98.31 382.65 84.33A107.13 107.13 0 00352 80c-13.71 0-25.65 3.34-38.28 6.88C298.5 91.15 281.21 96 256 96s-42.51-4.84-57.76-9.11C185.6 83.34 173.67 80 160 80a115.74 115.74 0 00-31.73 4.32c-47.1 13.92-79 65.08-100.52 161C4.61 348.54 16 413.71 59.69 428.83a56.62 56.62 0 0018.64 3.22c29.93 0 53.93-24.93 70.33-45.34 18.53-23.1 40.22-34.82 107.34-34.82 59.95 0 84.76 8.13 106.19 34.82 13.47 16.78 26.2 28.52 38.9 35.91 16.89 9.82 33.77 12 50.16 6.37 25.82-8.81 40.62-32.1 44-69.24 2.57-28.48-1.39-65.89-12.12-114.37zM208 240h-32v32a16 16 0 01-32 0v-32h-32a16 16 0 010-32h32v-32a16 16 0 0132 0v32h32a16 16 0 010 32zm84 4a20 20 0 1120-20 20 20 0 01-20 20zm44 44a20 20 0 1120-19.95A20 20 0 01336 288zm0-88a20 20 0 1120-20 20 20 0 01-20 20zm44 44a20 20 0 1120-20 20 20 0 01-20 20z"/>'),drop:NI('<path d="M200 144h40v-40a40 40 0 10-40 40zM352 104a40 40 0 00-80 0v40h40a40 40 0 0040-40z" fill="none"/><path d="M80 416a64 64 0 0064 64h92a4 4 0 004-4V292a4 4 0 00-4-4H88a8 8 0 00-8 8zM240 252V144h32v108a4 4 0 004 4h140a47.93 47.93 0 0016-2.75A48.09 48.09 0 00464 208v-16a48 48 0 00-48-48h-40.54a2 2 0 01-1.7-3A72 72 0 00256 58.82 72 72 0 00138.24 141a2 2 0 01-1.7 3H96a48 48 0 00-48 48v16a48.09 48.09 0 0032 45.25A47.93 47.93 0 0096 256h140a4 4 0 004-4zm32-148a40 40 0 1140 40h-40zm-74.86-39.9A40 40 0 01240 104v40h-40a40 40 0 01-2.86-79.89zM276 480h92a64 64 0 0064-64V296a8 8 0 00-8-8H276a4 4 0 00-4 4v184a4 4 0 004 4z"/>'),sold:NI('<path d="M448 400H64a16 16 0 010-32h384a16 16 0 010 32zM416 448H96a16 16 0 010-32h320a16 16 0 010 32zM32 272H16v48a32 32 0 0032 32h48v-16a64.07 64.07 0 00-64-64z"/><path d="M480 240h16v-64h-16a96.11 96.11 0 01-96-96V64H128v16a96.11 96.11 0 01-96 96H16v64h16a96.11 96.11 0 0196 96v16h256v-16a96.11 96.11 0 0196-96zm-224 64a96 96 0 1196-96 96.11 96.11 0 01-96 96z"/><circle cx="256" cy="208" r="64"/><path d="M416 336v16h48a32 32 0 0032-32v-48h-16a64.07 64.07 0 00-64 64zM480 144h16V96a32 32 0 00-32-32h-48v16a64.07 64.07 0 0064 64zM96 80V64H48a32 32 0 00-32 32v48h16a64.07 64.07 0 0064-64z"/>'),report:NI('<circle cx="256" cy="256" r="64"/><path d="M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96c-42.52 0-84.33 12.15-124.27 36.11-40.73 24.43-77.63 60.12-109.68 106.07a31.92 31.92 0 00-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416c46.71 0 93.81-14.43 136.2-41.72 38.46-24.77 72.72-59.66 99.08-100.92a32.2 32.2 0 00-.1-34.76zM256 352a96 96 0 1196-96 96.11 96.11 0 01-96 96z"/>'),shop:NI('<path d="M467 45.2A44.45 44.45 0 00435.29 32H312.36a30.63 30.63 0 00-21.52 8.89L45.09 286.59a44.82 44.82 0 000 63.32l117 117a44.83 44.83 0 0063.34 0l245.65-245.6A30.6 30.6 0 00480 199.8v-123a44.24 44.24 0 00-13-31.6zM384 160a32 32 0 1132-32 32 32 0 01-32 32z"/>'),info:NI('<path d="M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200 200-89.72 200-200S366.28 56 256 56zm0 82a26 26 0 11-26 26 26 26 0 0126-26zm48 226h-88a16 16 0 010-32h28v-88h-16a16 16 0 010-32h32a16 16 0 0116 16v104h28a16 16 0 010 32z"/>')};
let NOTIFS=[];
try{NOTIFS=JSON.parse(localStorage.getItem('tr_notifs')||'[]')}catch(e){NOTIFS=[]}
const saveN=()=>{try{localStorage.setItem('tr_notifs',JSON.stringify(NOTIFS.slice(0,40)))}catch(e){}};
// key = clé i18n, v = variables (traduites à l'affichage -> suit la langue), go = page à ouvrir au clic
function notify(type,key,v={},go=null){
  NOTIFS.unshift({id:Date.now()+Math.random(),type,key,v,go,at:Date.now(),read:false});
  NOTIFS=NOTIFS.slice(0,40);saveN();renderNotifs();
  const b=$('#notifBtn');if(b){b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}
}
function agoTxt(ms){const m=Math.floor(ms/6e4);if(m<1)return t('n_now');if(m<60)return t('n_min',{n:m});const h=Math.floor(m/60);if(h<24)return t('n_h',{n:h});return t('n_d',{n:Math.floor(h/24)})}
function renderNotifs(){
  const un=NOTIFS.filter(n=>!n.read).length,c=$('#notifCount');
  if(c){c.hidden=!un;c.textContent=un>9?'9+':un}
  const l=$('#nList');if(!l)return;
  l.innerHTML=NOTIFS.length?NOTIFS.map(n=>`<button class="ni ${n.read?'':'unread'} t-${n.type}" data-nid="${n.id}"><span class="nic">${N_ICON[n.type]||N_ICON.info}</span><span class="nt">${t(n.key,n.v)}<small>${agoTxt(Date.now()-n.at)}</small></span></button>`).join('')
    :`<div class="np-empty">${t('n_empty')}</div>`;
}
function toggleNotifs(force){
  const p=$('#npanel'),open=force!=null?force:p.hidden;p.hidden=!open;
  if(open){
    if(typeof toggleUmenu==='function')toggleUmenu(false);
    $('#themePop')?.classList.remove('open');
    const r=$('#notifBtn').getBoundingClientRect();
    p.style.top=(r.bottom+6)+'px';
    p.style.right=Math.max(8,innerWidth-r.right)+'px';
    renderNotifs();
  }
}
$('#notifBtn').onclick=e=>{e.stopPropagation();toggleUmenu(false);toggleNotifs()};
document.addEventListener('click',e=>{if(!e.target.closest('#npanel')&&!e.target.closest('#notifBtn'))toggleNotifs(false)});
$('#nList').addEventListener('click',e=>{const b=e.target.closest('[data-nid]');if(!b)return;const n=NOTIFS.find(x=>String(x.id)===b.dataset.nid);if(!n)return;
  n.read=true;saveN();renderNotifs();if(n.go){toggleNotifs(false);if(n.go==='shop:pass')shopTab='pass';if(n.go==='friends:requests')frTab='requests';setView(n.go.split(':')[0])}});
$('#nRead').onclick=()=>{NOTIFS.forEach(n=>n.read=true);saveN();renderNotifs()};
$('#nClear').onclick=()=>{NOTIFS=[];saveN();renderNotifs()};
setInterval(()=>{if(!$('#npanel').hidden)renderNotifs()},30000);
function seedNotifs(){
  if(NOTIFS.length)return;
  const h=36e5;
  const list=[{type:'pass',key:'n_season',v:{},go:'shop:pass',at:Date.now()-26*h},
              {type:'shop',key:'n_shop_new',v:{},go:'shop',at:Date.now()-3*h}];
  const onlineF=FRIENDS.find(f=>f.status==='online');
  if(onlineF)list.push({type:'friend',key:'n_friend_on',v:{n:onlineF.name},go:'friends',at:Date.now()-40*6e4});
  NOTIFS=list.map((n,i)=>({...n,id:Date.now()-i,read:i>0}));
  saveN();
}

/* =====================================================
   CHAT DE LA ROOM (équipe / tous) - en ligne : événement Socket.io « lobby:chat »
   ===================================================== */
const LINES={
  fr:{hi:['salut tout le monde','yo','glhf','bonne game les gars','gl','on fait une bonne game','salut'],hiAll:['glhf','gl hf','bonne game','gl'],
      ban:['ban {m}, ils ont {p} dessus','faut ban {m} direct','{m} non, ils sont trop forts dessus ({p})'],pick:['ok {m} ça me va','go {m}','{m} parfait'],
      join:['je lance le jeu','je suis co','c\'est bon je suis sur le serv'],reply:['ok','+1','go','d\'accord','ça marche','oui'],live:['let\'s go','go go','on est tous là']},
  en:{hi:['hey all','yo','glhf','good luck guys','gl','lets have a good one','hi'],hiAll:['glhf','gl hf','have fun','gl'],
      ban:['ban {m}, they have {p} there','we should ban {m}','not {m}, they are too good on it ({p})'],pick:['ok {m} works','go {m}','{m} perfect'],
      join:['launching the game','im in','ok im on the server'],reply:['ok','+1','go','sure','sounds good','yes'],live:['lets go','go go','everyone is here']},
  ru:{hi:['всем привет','йо','glhf','удачи пацаны','gl','давайте хорошую игру','привет'],hiAll:['glhf','gl hf','удачи','gl'],
      ban:['баним {m}, у них там {p}','надо банить {m}','{m} не надо, они там сильные ({p})'],pick:['ок {m} норм','го {m}','{m} отлично'],
      join:['запускаю игру','я зашёл','всё, я на сервере'],reply:['ок','+1','го','давай','норм','да']}};
const line=(k,v={})=>{let x=pick((LINES[lang]||LINES.fr)[k]);for(const y in v)x=x.split('{'+y+'}').join(v[y]);return x};
let lcCh='team';
const hhmm=d=>new Date(d).toLocaleTimeString(LOC[lang],{hour:'2-digit',minute:'2-digit'});
function chatInit(){
  if(!cur)return;lcfOpen(cur.real&&cur.mid?cur.mid:cur.id);vcPresenceInit();cur.chat=[];cur.chatT=[];cur.chatNew={team:false,all:false};lcCh='team';
  chatSys('sys_welcome');
  renderChat();
}
function chatClear(){if(cur&&cur.chatT)cur.chatT.forEach(clearTimeout)}
function chatPush(m){
  const c=cur;if(!c||!c.chat)return;if(!m.id)m.id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  if(m.id&&c.chat.some(x=>x.id===m.id))return;c.chat.push(m);if(c.chat.length>200)c.chat.shift();
  if(!m.sys&&m.ch!==lcCh)c.chatNew[m.ch]=true;
  if(!$('#lobby').hidden)renderChat();
}
function chatSys(key,v={}){chatPush({sys:true,key,v,at:Date.now()})}
function botSay(){}
function renderChat(){
  const box=$('#lcMsgs');if(!box||!cur||!cur.chat)return;
  const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<40;
  const list=cur.chat.filter(m=>m.sys||m.ch===lcCh||(lcCh==='all'&&m.ch==='all'));
  box.innerHTML=list.map(m=>m.sys?`<div class="lm sys"><span class="tm">${hhmm(m.at)}</span>${escA(t(m.key,m.v))}</div>`
    :`<div class="lm t${m.team} c-${m.ch} ${m.from===ME.name?'me':''} ${m.reported?'reported':''}"><span class="tm">${hhmm(m.at)}</span><span class="ch">${m.ch==='team'?t('ch_team_to'):t('ch_all_to')}</span><span class="who" data-profile="${escA(m.from)}">${escA(m.from)}</span>: ${escA(m.text)}${m.from!==ME.name?`<button class="lm-rep" data-rep="${m.id}" title="${m.reported?t('rep_done'):t('rep_msg')}" aria-label="${t('rep_msg')}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="13" height="13"><path d="M80 480a16 16 0 01-16-16V68.13a24 24 0 0111.9-20.72C88 40.38 112.38 32 160 32c37.21 0 78.83 14.71 115.55 27.68C305.12 70.13 333.05 80 352 80a183.84 183.84 0 0071-14.5 18 18 0 0125 16.58v219.36a20 20 0 01-12 18.31c-8.71 3.81-40.51 16.25-84 16.25-24.14 0-54.38-7.14-86.39-14.71C229.63 312.79 192.43 304 160 304c-36.87 0-55.74 5.58-64 9.11V464a16 16 0 01-16 16z"/></svg></button>`:''}</div>`).join('');
  if(atBottom||list.length<8)box.scrollTop=box.scrollHeight;
  $$('.lc-tabs [data-ch]').forEach(b=>{b.classList.toggle('on',b.dataset.ch===lcCh);b.classList.toggle('new',!!cur.chatNew[b.dataset.ch]&&b.dataset.ch!==lcCh)});
  const to=$('#lcTo');to.textContent=lcCh==='team'?t('ch_team_to'):t('ch_all_to');to.className='lc-to '+lcCh;
  $('#lcIn').placeholder=lcCh==='team'?t('chat_ph_team'):t('chat_ph_all');
}
const sentAt=[];
function chatFlood(){const now=Date.now();while(sentAt.length&&now-sentAt[0]>5000)sentAt.shift();if(sentAt.length>=5)return true;sentAt.push(now);return false}
$('#lchat').addEventListener('click',e=>{const r=e.target.closest('[data-rep]');if(r){const m=cur&&cur.chat.find(x=>x.id===r.dataset.rep);if(m)reportMessage(m,'lobby');return}
  const b=e.target.closest('[data-ch]');if(b&&cur){lcCh=b.dataset.ch;cur.chatNew[lcCh]=false;renderChat();$('#lcIn').focus()}});
$('#lcForm').addEventListener('submit',e=>{
  e.preventDefault();const i=$('#lcIn'),txt=i.value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,300);
  if(!txt||!cur)return;if(chatFlood())return toast(t('chat_slow'));
  i.value='';const mm={from:ME.name,team:'A',ch:lcCh,text:txt,at:Date.now()};chatPush(mm);lcfSend(mm);
});
$('#lcIn').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();lcCh=lcCh==='team'?'all':'team';if(cur)cur.chatNew[lcCh]=false;renderChat()}});

/* =====================================================
   MESSAGES PRIVÉS ENTRE AMIS (dock en bas à droite)
   En ligne : /api/friends, /api/messages/:id et Socket.io « dm:send » / « dm:new »
   ===================================================== */

const dml=k=>{const L=DML[lang]||DML.fr;return Array.isArray(L[k])?pick(L[k]):L[k]};
let DMS={},DMU={};
try{DMS=JSON.parse(localStorage.getItem('tr_dm')||'{}');localStorage.removeItem('tr_dmu')}catch(e){DMS={};DMU={}}
const saveDM=()=>{try{localStorage.setItem('tr_dm',JSON.stringify(DMS))}catch(e){}};
const dk={open:null,list:false,typing:{},spont:0};
const friendBy=n=>FRIENDS.find(f=>f.name===n);
function dmPush(name,me,txt){(DMS[name]=DMS[name]||[]).push({me,txt,at:Date.now()});if(DMS[name].length>150)DMS[name].shift();saveDM()}
function dmUnreadTotal(){return FRIENDS.reduce((a,f)=>a+(DMU[f.name]||0),0)}
function renderDockBtn(){const n=dmUnreadTotal(),b=$('#dkCount');if(!b)return;b.hidden=n<=0;b.textContent=n>0?(n>9?'9+':String(n)):''}
function renderDkList(){
  const el=$('#dkList');if(el.hidden)return;
  const order={online:0,ingame:1,offline:2};
  const fr=[...FRIENDS].sort((a,b)=>((DMS[b.name]||[]).at(-1)?.at||0)-((DMS[a.name]||[]).at(-1)?.at||0)||order[a.status]-order[b.status]);
  el.innerHTML=`<div class="dk-lh">${t('dm_title')}</div><div class="dk-items">${fr.length?fr.map(f=>{const last=(DMS[f.name]||[]).at(-1),u=DMU[f.name]||0;
    return `<button class="dk-it" data-dm="${escA(f.name)}">${avHTML(f)}<span class="mid"><b><i class="sdot ${f.status}"></i>${escA(f.name)}</b><small>${last?(last.me?t('you')+' : ':'')+escA(last.txt):t('st_'+f.status)}</small></span>${u?`<span class="un">${u}</span>`:''}</button>`}).join(''):`<div class="dk-empty">${t('dm_empty')}</div>`}</div>`;
}
function openDM(name){
  const f=friendBy(name);if(!f)return;
  dk.open=name;dk.list=false;$('#dkList').hidden=true;DMU[name]=0;saveDM();renderDockBtn();
  $('#dkWin').hidden=false;renderDkWin();setTimeout(()=>$('#dkIn')&&$('#dkIn').focus(),30);
}
function closeDM(){dk.open=null;$('#dkWin').hidden=true}
function renderDkWin(){
  const name=dk.open,f=name&&friendBy(name),w=$('#dkWin');if(!f||w.hidden)return;
  const msgs=DMS[name]||[],inP=state.party.includes(f),canInv=f.status==='online'&&!inP&&state.party.length<maxParty();
  let last=0,body='';
  msgs.forEach((m,i)=>{
    if(m.at-last>30*6e4)body+=`<div class="dk-day">${new Date(m.at).toDateString()===new Date().toDateString()?t('today'):fmtDate(new Date(m.at))} · ${hhmm(m.at)}</div>`;
    last=m.at;
    if(m.note){body+=`<div class="dk-note">${escA(m.txt)}</div>`;return}
    body+=m.me?`<div class="bub me">${escA(m.txt)}</div>`:`<div class="bub-wrap"><div class="bub">${escA(m.txt)}</div><button class="lm-rep" data-dmrep="${i}" title="${m.reported?t('rep_done'):t('rep_msg')}"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512" width="13" height="13"><path d="M80 480a16 16 0 01-16-16V68.13a24 24 0 0111.9-20.72C88 40.38 112.38 32 160 32c37.21 0 78.83 14.71 115.55 27.68C305.12 70.13 333.05 80 352 80a183.84 183.84 0 0071-14.5 18 18 0 0125 16.58v219.36a20 20 0 01-12 18.31c-8.71 3.81-40.51 16.25-84 16.25-24.14 0-54.38-7.14-86.39-14.71C229.63 312.79 192.43 304 160 304c-36.87 0-55.74 5.58-64 9.11V464a16 16 0 01-16 16z"/></svg></button></div>`;
    const nx=msgs[i+1];if(!nx||nx.me!==m.me||nx.at-m.at>120000)body+=`<div class="bub-t ${m.me?'me':''}">${hhmm(m.at)}</div>`;
  });
  if(!msgs.length)body=`<div class="dk-empty">${t('dm_none')}</div>`;
  if(dk.typing[name])body+=`<div class="typing"><i></i><i></i><i></i></div>`;
  const keep=$('#dkIn')?$('#dkIn').value:'';
  w.innerHTML=`<div class="dk-wh">${avHTML(f)}<div class="mid" data-dkprof><b>${escA(f.name)}</b><small><i class="sdot ${f.status}"></i>${dk.typing[name]?t('st_writing'):t('st_'+f.status)}</small></div>
      <button class="ic" data-dkinv title="${t('invite_party')}" ${canInv?'':'disabled'}>+</button><button class="ic" data-dkx title="×">×</button></div>
    <div class="dk-msgs" id="dkMsgs">${body}</div>
    <form class="dk-form" id="dkForm" autocomplete="off"><input id="dkIn" maxlength="300" placeholder="${t('dm_ph',{n:escA(f.name)})}"><button class="btn primary" type="submit" aria-label="send"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/></svg></button></form>`;
  const ip=$('#dkIn');ip.value=keep;
  const box=$('#dkMsgs');box.scrollTop=box.scrollHeight;
}
function botReply(){}
function receiveDM(name,txt){
  dmPush(name,false,txt);
  if(dk.open===name&&!$('#dkWin').hidden){renderDkWin();beep(990,.05,0,'sine',.025)}
  else{DMU[name]=(DMU[name]||0)+1;saveDM();renderDockBtn();renderDkList();
    if(typeof SET==='undefined'||SET.notif.dm){notify('dm','dm_new',{n:name,x:txt.length>60?txt.slice(0,60)+'…':txt},null);beep(990,.06,0,'sine',.03);beep(1320,.08,.07,'sine',.03);
      if(typeof SET!=='undefined'&&SET.notif.desktop&&document.hidden&&'Notification' in window&&Notification.permission==='granted'){try{new Notification('TICKRATE · '+name,{body:txt.slice(0,120)})}catch(e){}}}}
}
$('#dkBtn').onclick=e=>{e.stopPropagation();const l=$('#dkList');if(!$('#dkWin').hidden&&l.hidden){closeDM()}l.hidden=!l.hidden;renderDkList()};
$('#dock').addEventListener('click',e=>{
  const it=e.target.closest('[data-dm]');if(it)return openDM(it.dataset.dm);
  const dr=e.target.closest('[data-dmrep]');if(dr&&dk.open){const m=(DMS[dk.open]||[])[+dr.dataset.dmrep];if(m)reportMessage({id:'dm'+m.at,from:dk.open,text:m.txt,at:m.at,_dm:m},'dm');return}
  if(e.target.closest('[data-dkx]'))return closeDM();
  if(e.target.closest('[data-dkprof]')){openProfile(dk.open);return}
  if(e.target.closest('[data-dkinv]')){const f=friendBy(dk.open);if(f){invite(f);renderDkWin()}return}
});
$('#dock').addEventListener('submit',e=>{
  if(e.target.id!=='dkForm')return;e.preventDefault();
  const i=$('#dkIn'),txt=i.value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,300),name=dk.open;
  if(!txt||!name)return;if(chatFlood())return toast(t('chat_slow'));
  i.value='';dmPush(name,true,txt);
  const f=friendBy(name);
  if(f&&f.status==='offline'&&!(DMS[name]||[]).some(m=>m.note&&Date.now()-m.at<36e5))DMS[name].push({note:true,txt:t('dm_off_note',{n:name}),at:Date.now()}),saveDM();
  renderDkWin();
});
document.addEventListener('click',e=>{if(!e.target.closest('#dock')&&!e.target.closest('[data-msg]'))$('#dkList').hidden=true});

/* =====================================================
   VOCAL DE LA ROOM : SUPPRIMÉ (les joueurs utilisent le vocal du jeu / Discord).
   Stubs neutres conservés pour que le reste du code (lobby, paramètres) ne casse pas.
   ===================================================== */
const VC={voice:null,on:false,ch:"all",mode:"open",muted:false,deaf:false,talk:new Set(),pmuted:new Set(),sim:null,ptt:false,present:new Map(),pt:[],qs:false};
function vcPresenceInit(){}
function renderVoice(){}
function vcRows(){}
function vcLeave(){}
try{localStorage.removeItem("tr_vc")}catch(e){}
