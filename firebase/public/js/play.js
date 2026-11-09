Object.assign(I18N.fr,{qf_preview:'Aperçu local · connecte-toi pour jouer en ligne',qf_region_open:'File ouverte · {region}',qf_region_closed:'File fermée · {region}',qf_server_free:'Serveurs libres : {n}',qf_server_busy:'Aucun serveur libre au dernier relevé',qf_server_unknown:'État des serveurs indisponible',qf_server_age:'Dernier relevé il y a {n} min',qf_steam_ok:'Steam lié · {n}/{total}',qf_steam_missing:'Compte(s) Steam à lier : {n}',qf_link_steam:'Lier Steam',qf_csgo:'CS:GO à rejoindre sur PC',qf_desk_ask:'Alertes bureau : activer',qf_desk_on:'Alertes bureau activées',desk_found_d:'{m} · {r} — 20 s pour accepter',desk_ready_t:'Serveur prêt · {m}',desk_ready_d:'Rejoins le serveur CS:GO ({ip})'});
Object.assign(I18N.en,{qf_preview:'Local preview · sign in to play online',qf_region_open:'Queue open · {region}',qf_region_closed:'Queue closed · {region}',qf_server_free:'Free servers: {n}',qf_server_busy:'No free server in the latest status',qf_server_unknown:'Server status unavailable',qf_server_age:'Last status {n} min ago',qf_steam_ok:'Steam linked · {n}/{total}',qf_steam_missing:'Steam links missing: {n}',qf_link_steam:'Link Steam',qf_csgo:'Join CS:GO on PC',qf_desk_ask:'Desktop alerts: enable',qf_desk_on:'Desktop alerts enabled',desk_found_d:'{m} · {r} — 20 s to accept',desk_ready_t:'Server ready · {m}',desk_ready_d:'Join the CS:GO server ({ip})'});
Object.assign(I18N.ru,{qf_preview:'Локальный просмотр · войди, чтобы играть онлайн',qf_region_open:'Очередь открыта · {region}',qf_region_closed:'Очередь закрыта · {region}',qf_server_free:'Свободные серверы: {n}',qf_server_busy:'В последнем статусе нет свободных серверов',qf_server_unknown:'Статус серверов недоступен',qf_server_age:'Последнее обновление: {n} мин назад',qf_steam_ok:'Steam привязан · {n}/{total}',qf_steam_missing:'Не привязан Steam у игроков: {n}',qf_link_steam:'Привязать Steam',qf_csgo:'Для игры нужен CS:GO на ПК',qf_desk_ask:'Уведомления на ПК: включить',qf_desk_on:'Уведомления на ПК включены',desk_found_d:'{m} · {r} — 20 с на принятие',desk_ready_t:'Сервер готов · {m}',desk_ready_d:'Заходи на сервер CS:GO ({ip})'});

function deskNotify(title,body,tag='tr_mm'){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  if(typeof SET!=='undefined'&&SET.notif&&SET.notif.desktop===false)return;
  if(!document.hidden&&document.hasFocus())return;
  try{const n=new Notification(title,{body,tag,icon:'/favicon-192.png'});n.onclick=()=>{window.focus();n.close()}}catch(_){}
}

const QUEUE_STATUS={data:null,busy:false,at:0};
async function refreshQueueStatus(){
  if(QUEUE_STATUS.busy||Date.now()-QUEUE_STATUS.at<30e3||document.hidden||$('#play').hidden)return;
  if(typeof realMM!=='function'||!realMM())return;
  QUEUE_STATUS.busy=true;
  try{
    const r=await fetch('https://tickratecsgo-default-rtdb.europe-west1.firebasedatabase.app/publicStatus.json',{cache:'no-store'});
    if(!r.ok)throw new Error('status_unavailable');
    const data=await r.json();
    if(!data||!data.servers||!Number.isFinite(Number(data.at)))throw new Error('status_invalid');
    QUEUE_STATUS.data=data;
  }catch(_){QUEUE_STATUS.data=null}
  finally{QUEUE_STATUS.at=Date.now();QUEUE_STATUS.busy=false;renderQueueReady()}
}
setInterval(refreshQueueStatus,5e3);

function renderModes(){
  $('#modes').innerHTML=MODES.map(m=>`<div class="mode ${state.mode===m.id?'active':''} ${m.id==='dz'?'dz-mode':''}" data-id="${m.id}"><div class="tag">${m.tag}${m.soon?` <span class="dz-pill">${t('m_dz_soon')}</span>`:''}</div><div class="nm">${m.n}</div><div class="ds">${m.d}</div></div>`).join('');
}
const DZ_MAPS=[
  {n:'Blacksite',code:'dz_blacksite',p:'18 joueurs · Solo / Duo / Trio',c:'#3a4e38'},
  {n:'Sirocco',code:'dz_sirocco',p:'18 joueurs · Solo / Duo / Trio',c:'#8a6438'},
  {n:'Vineyard',code:'dz_vineyard',p:'18 joueurs · Solo / Duo / Trio',c:'#4b5f3d'},
  {n:'Ember',code:'dz_ember',p:'18 joueurs · Solo / Duo / Trio',c:'#6e362a'},
  {n:'County',code:'dz_county',p:'16 joueurs · Solo / Duo / Trio',c:'#3b5366'}
];
let dzWaitlist=false;
try{dzWaitlist=localStorage.getItem('tr_dz_wait')==='1'}catch(e){}
function renderDangerZone(){
  const box=$('#dzBox'),pool=$('#playPool'),stg=$('#playStage');
  if(!box)return;
  const isDz=state.mode==='dz';
  box.hidden=!isDz;
  if(pool)pool.hidden=isDz;
  if(stg)stg.hidden=isDz;
  if(!isDz)return;
  box.innerHTML=`
    <div class="dz-hero">
      <div class="dz-hero-l">
        <div class="dz-kicker"><i></i>${t('dz_soon')}</div>
        <h2>DANGER ZONE</h2>
        <p>${t('dz_desc')}</p>
        <div class="dz-specs">
          <div class="dz-spec"><span>${t('dz_players')}</span><b>16 – 18</b></div>
          <div class="dz-spec"><span>${t('dz_formats')}</span><b>SOLO · DUO · TRIO</b></div>
          <div class="dz-spec"><span>${t('dz_rules')}</span><b>${t('dz_classic')}</b></div>
        </div>
      </div>
      <div class="dz-hero-r">
        <button class="btn ${dzWaitlist?'':'primary'}" id="dzNotifyBtn" style="height:42px;padding:0 18px">
          ${dzWaitlist?t('dz_notified'):t('dz_notify')}
        </button>
        <button class="btn ghost sm" id="dzBack5v5Btn">${t('dz_back')}</button>
      </div>
    </div>
    <div class="dz-grid">
      <div class="dz-rule">
        <b>${t('dz_r1t')}</b>
        <p>${t('dz_r1')}</p>
      </div>
      <div class="dz-rule">
        <b>${t('dz_r2t')}</b>
        <p>${t('dz_r2')}</p>
      </div>
      <div class="dz-rule">
        <b>${t('dz_r3t')}</b>
        <p>${t('dz_r3')}</p>
      </div>
      <div class="dz-rule">
        <b>${t('dz_r4t')}</b>
        <p>${t('dz_r4')}</p>
      </div>
    </div>
    <div class="label" style="margin:4px 0 -4px"><span>${t('dz_maps')}</span></div>
    <div class="dz-maps">
      ${DZ_MAPS.map(m=>`<div class="dz-map" style="background:linear-gradient(155deg,${m.c} 0%,#121318 85%)">
        <span class="m-code">${m.code}</span>
        <div><b>${m.n}</b><small>${m.p}</small></div>
      </div>`).join('')}
    </div>`;
  const nb=$('#dzNotifyBtn');
  if(nb)nb.onclick=()=>{
    dzWaitlist=!dzWaitlist;
    try{localStorage.setItem('tr_dz_wait',dzWaitlist?'1':'0')}catch(e){}
    if(typeof fbReq==='function'&&typeof fbUserKey==='function'){
      fbReq(`dangerzone_waitlist/${fbUserKey()}`,dzWaitlist?'PUT':'DELETE',dzWaitlist?{name:ME.name,elo:ME.elo,at:Date.now()}:undefined);
    }
    renderDangerZone();
    toast(dzWaitlist?t('dz_wait_on'):t('dz_wait_off'));
    if(dzWaitlist)beep(880,.08);
  };
  const bb=$('#dzBack5v5Btn');
  if(bb)bb.onclick=()=>{state.mode='ranked';renderAll()};
}
function mapWR(n){const h=ME.history.filter(x=>x.map===n);return h.length?h.filter(x=>x.won).length/h.length:-1}
function renderMaps(){
  const isWm=state.mode==='wingman',isDuel=state.mode==='duel';
  for(const n of [...state.maps]){const m=MAPS.find(x=>x.n===n);if(!m||!canPlayMap(m))state.maps.delete(n)}
  if(!state.maps.size){MAPS.filter(canPlayMap).slice(0,isDuel?5:isWm?12:7).forEach(m=>state.maps.add(m.n))}
  const rot=curRot();
  const nx=String(rot.next||'');
  const chips=nx.replace(/\([^)]*\)/,'').split(/[\/,]/).map(x=>x.trim()).filter(Boolean).map(x=>`<span class="rc ${x[0]==='+'?'in':'out'}">${x[0]==='+'?'+':'−'} ${escA(x.slice(1).trim())}</span>`).join('');
  const act=MAPS.filter(canPlayMap).length;
  const rotBar=isDuel
    ?`<div class="rot-card">
      <div class="rot-main"><b>Pool 1v1 Aim Arena · CS:GO 128-tick (Serveurs Dédiés)</b>
        <small>${act} maps de duel rapides (${MAPS.filter(isAimMap).map(m=>m.wm?.bsp||m.slug).join(', ')}) · MR9 (5 rounds gagnants)</small></div>
      <div class="rot-nx"><button class="btn sm" type="button" data-goview="duel">${t('du_open')}</button></div>
    </div>`
    :isWm
    ?`<div class="rot-card">
      <div class="rot-main"><b>${t('wm_pool')}</b>
        <small>${t('wm_pool_t',{n:act,l:MAPS.filter(isWingmanMap).map(m=>m.wm.bsp).join(', ')})}</small></div>
      <div class="rot-nx"><span class="rot-k">${t('wm_build')}</span><div class="rc-list"><span class="rc in">csgo_legacy · game_mode 2</span></div></div>
    </div>`
    :`<div class="rot-card">
      <div class="rot-main"><b>${t('mv_rot_now')}</b>
        <small>${t('mv_rot_t',{n:act})} · <span class="rot-next">${typeof mvNextIn==='function'?t('mv_next',{d:mvNextIn()}):''}</span></small></div>
      <div class="rot-nx"><button class="btn sm" type="button" data-goview="mapvote">${t('mv_go')}</button></div>
    </div>`;
  const tile=m=>{
    const ok=canPlayMap(m),on=ok&&state.maps.has(m.n);
    const wmTag=(isWm||isDuel)&&m.wm?`<div class="lock-tag" style="left:8px;right:auto;top:7px;background:rgba(0,0,0,.68);color:#cfd3da;border-color:rgba(255,255,255,.18)">${m.wm.bsp}${m.wm.site?' · '+m.wm.site:''}</div>`:'';
    return `<div class="map ${on?'':'off'} ${ok?'':'comp-lock'}" data-n="${m.n}">
      <div class="bg" style="background:${mapBg(m)}"></div>
      ${wmTag}
      ${ok?`<div class="tick">${ICON.check}</div>`:`<div class="lock-tag">${t('mv_off_tag')}</div>`}
      <div class="mn">${m.n}</div>
      ${mapSort==='wr'&&mapWR(m.n)>=0?`<div class="mwr">${Math.round(mapWR(m.n)*100)}%</div>`:''}
    </div>`;
  };
  const visiblePool=isDuel?MAPS.filter(isAimMap):isWm?MAPS.filter(isWingmanMap):MAPS.filter(isVoteMap);
  const sorted=list=>mapSort==='az'?[...list].sort((a,b)=>a.n.localeCompare(b.n)):mapSort==='wr'?[...list].sort((a,b)=>mapWR(b.n)-mapWR(a.n)):list;
  if(isDuel&&mapSort==='def'){
    const duelMaps=MAPS.filter(isAimMap);
    const grp=([title,arr])=>`<div class="mgroup"><div class="mg-t">${title}</div><div class="maps-in">${arr.map(tile).join('')}</div></div>`;
    $('#maps').innerHTML=grp(['Pool 1v1 Aim Arena officiel & classique · 128-tick',duelMaps])+rotBar;
  }else if(isWm&&mapSort==='def'){
    const wmMaps=MAPS.filter(isWingmanMap);
    const grp=([title,arr])=>`<div class="mgroup"><div class="mg-t">${title}</div><div class="maps-in">${arr.map(tile).join('')}</div></div>`;
    $('#maps').innerHTML=grp(['Pool Wingman 2v2 officiel · CS:GO (Dernière version Steam avant CS2)',wmMaps])+rotBar;
  }else if(mapSort==='def'){
    const compMaps=visiblePool.filter(m=>isCompMap(m));
    const resMaps=visiblePool.filter(m=>!isCompMap(m)),funMaps=[];
    const grp=([title,arr])=>`<div class="mgroup"><div class="mg-t">${title}</div><div class="maps-in">${arr.map(tile).join('')}</div></div>`;
    const others=[[t('mv_off'),resMaps]];
    const fold=!mapsMore;
    if(!resMaps.length)mapsMore=false;
    $('#maps').innerHTML=grp([t('map_active_g'),compMaps])+(fold
      ?`<button class="maps-more" data-mapsmore>${t('maps_more',{n:resMaps.length+funMaps.length})}<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 184l144 144 144-144"/></svg></button>`
      :others.map(grp).join('')+(state.mode!=='casual'?`<button class="maps-more open" data-mapsmore>${t('maps_less')}<svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 328l144-144 144 144"/></svg></button>`:''))+rotBar;
  }else{
    $('#maps').innerHTML=`<div class="maps-in">${sorted(visiblePool).map(tile).join('')}</div>`+rotBar;
  }
  const playableTotal=MAPS.filter(canPlayMap).length;
  $('#mapCount').textContent=t('maps_selected',{n:state.maps.size,t:playableTotal});
  $('#poolTools').innerHTML=`<div class="seg"><button data-sel="active">${isDuel?'Tout le pool 1v1':isWm?'Tout le pool 2v2':t('sel_active')}</button>${state.mode==='casual'?`<button data-sel="all">${t('sel_all')}</button>`:''}</div>
    <div class="seg"><span class="seg-l">${t('sort_l')}</span>${[['def',t('sort_def')],['az','A → Z'],['wr',t('sort_wr')]].map(([k,l])=>`<button class="${mapSort===k?'on':''}" data-sort="${k}">${l}</button>`).join('')}</div>`;
}
$('#maps').addEventListener('click',e=>{if(e.target.closest('[data-mapsmore]')){e.stopPropagation();mapsMore=!mapsMore;renderMaps()}},true);
$('#poolTools').addEventListener('click',e=>{
  const so=e.target.closest('[data-sort]');if(so){mapSort=so.dataset.sort;return renderMaps()}
  const se=e.target.closest('[data-sel]');if(se){if(locked())return;state.maps=new Set(MAPS.filter(m=>state.mode==='duel'?isAimMap(m):state.mode==='wingman'?isWingmanMap(m):se.dataset.sel==='all'?canPlayMap(m):isCompMap(m)).map(m=>m.n));renderMaps()}
});
let _admPartyDebounce = null;
function admHydratePartyDebounced(){
  if(typeof admOn !== 'function' || !admOn() || !state.party || state.party.length <= 1) return;
  clearTimeout(_admPartyDebounce);
  _admPartyDebounce = setTimeout(() => {
    if(typeof admHydrateBadges === 'function'){
      admHydrateBadges(state.party, () => { renderParty(); });
    }
  }, 120);
}

function renderParty(){
  if(Array.isArray(state.party)){
    state.party=state.party.filter(p=>p&&(p.me||p.id===ME.id||p.name===ME.name||p.viaLink));
    if(!state.party.length)state.party=[ME];
  }
  const max=maxParty(),order=max===5?[3,1,0,2,4]:[0,1];
  const isLeader = (state.party.length > 0 && state.party[0].name && ME && state.party[0].name.toLowerCase() === ME.name.toLowerCase());
  $('#slots').innerHTML=order.map((idx,pos)=>{
    const p=state.party[idx],d=`animation-delay:${pos*50}ms`;
    if(!p)return `<div class="pcard empty" data-add style="${d}"><div class="plus">+</div><span>${t('invite')}</span></div>`;
    const isMe = (p.me || (p.name && ME && p.name.toLowerCase() === ME.name.toLowerCase()));
    const isSteamOk = isMe ? !!(ME.steam && ME.steam.linked) : !!(p.steam && p.steam.linked);
    const steamBadge = isSteamOk ? '' : `<span class="psteam">${t('steam_unlinked')}</span>`;
    let actionBtn = '';
    if(isLeader){
      if(idx > 0) actionBtn = `<button class="x" data-i="${idx}" title="${t('pt_kick')}">${ICON.x}</button>`;
    } else {
      if(isMe && state.party.length > 1) actionBtn = `<button class="x" data-i="${idx}" title="${t('pt_leave')}">${ICON.x}</button>`;
    }
    const csId = typeof cardStyleOf === 'function' ? cardStyleOf(p) : 'default';
    const csDeco = typeof cardFrameHTML === 'function' ? cardFrameHTML(p) : '';
    const meCardBtn = isMe ? `<button class="pcard-edit-btn" data-open-cardshop title="Changer ma carte de profil"><svg class="ic" aria-hidden="true" fill="currentColor" viewBox="0 0 512 512"><path d="M233.15 360.11a15.7 15.7 0 01-4.92-.77 16 16 0 01-10.92-13c-2.15-15-19.95-32.46-36.62-35.85a16 16 0 01-8.69-26.33l211.09-235.1c.19-.22.39-.43.59-.63a56.57 56.57 0 0179.89 0 56.51 56.51 0 01.11 79.78l-219 227a16 16 0 01-11.53 4.9zM119.89 480.11c-32.14 0-65.45-16.89-84.85-43a16 16 0 0112.85-25.54c5.34 0 20-4.87 20-20.57 0-39.07 31.4-70.86 70-70.86s70 31.79 70 70.86c0 49.12-39.48 89.11-88 89.11z"/></svg></button>` : '';
    const badgesHtml = typeof planBadge === 'function' ? planBadge(p) : '';
    const isWm = state.mode === 'wingman';
    const isDuel = state.mode === 'duel';
    const pElo = isWm ? (isMe ? (ME.eloWm ?? 1000) : (p.eloWm ?? p.elo ?? 1000)) : isDuel ? (isMe ? (ME.eloDuel ?? 1000) : (p.eloDuel ?? p.elo ?? 1000)) : p.elo;
    const eloBadge = isDuel && typeof duelLvlHTML === 'function' ? duelLvlHTML(pElo) : lvlHTML(pElo, false, isWm || isDuel ? false : isCalib(p));
    const eloLabel = isWm ? 'Wingman ELO' : isDuel ? 'Duel ELO' : 'ELO';
    return `<div class="pcard ${p.me?'me':''} pcard-cs-${csId}" style="${d}">
      ${csDeco}${meCardBtn}${actionBtn}
      <div class="bn" style="background:${bannerCSS(p.banner)}"></div>
      <div class="avatar big" data-profile="${escA(p.name)}" style="${avStyle(p)}">${avInner(p)}${eloBadge}</div>
      <div class="pname ${p.plan==='premium'?'gold':''}" data-profile="${escA(p.name)}">${escA(p.name)}</div>
      ${badgesHtml ? `<div class="pcard-badges">${badgesHtml}</div>` : ''}
      <div class="prole">${idx===0?`<span class="crown" title="${t('leader')}">${ICON.leader}</span>${t('leader')}`:t('teammate')}</div>${steamBadge}
      <div class="pfoot"><span>${eloLabel} <b>${pElo}</b></span>${tfHTML(p)}</div>
    </div>`;
  }).join('');
  $('#partyCount').textContent=`${state.party.length}/${max}`;
  const tr=partyTier();
  $('#poolPill').innerHTML=`<span class="tf" style="--c:${tr.c}">${ICON.shield}${t('pool_pill',{x:tierName(tr)})}</span>`;
  admHydratePartyDebounced();
  renderQueueReady();
}
function renderQueueReady(){
  const box=$('#queueReady');
  if(!box)return;
  const realQueue=typeof realMM==='function'&&realMM();
  const items=[];
  if(!realQueue){
    items.push(`<span class="queue-ready-item info">${t('qf_preview')}</span>`);
  }else{
    const isOpen=typeof OPEN_REGIONS==='undefined'||OPEN_REGIONS.includes(state.region);
    items.push(`<span class="queue-ready-item ${isOpen?'ready':'pending'}">${t(isOpen?'qf_region_open':'qf_region_closed',{region:regObj().name})}</span>`);
    if(isOpen){
      const status=QUEUE_STATUS.data,age=status?Date.now()-Number(status.at):Infinity;
      if(status&&age<=12*60e3){
        const free=Object.values(status.servers).filter(s=>s&&s.state==='free'&&(!s.mode||s.mode===state.mode)).length;
        const label=free?t('qf_server_free',{n:free}):t('qf_server_busy');
        items.push(`<span class="queue-ready-item ${free?'ready':'pending'}" title="${t('qf_server_age',{n:Math.max(0,Math.floor(age/60e3))})}">${label}</span>`);
      }else{
        items.push(`<span class="queue-ready-item info">${t('qf_server_unknown')}</span>`);
      }
    }
    const members=state.party?.length?state.party:[ME],total=members.length;
    const isMe=p=>p.me||p.id===ME.id||p.name===ME.name;
    const missing=members.filter(p=>isMe(p)?!(ME.steam&&ME.steam.linked):!(p.steam&&p.steam.linked));
    const selfMissing=missing.some(isMe);
    const steamText=missing.length?t('qf_steam_missing',{n:missing.length}):t('qf_steam_ok',{n:total,total});
    items.push(`<span class="queue-ready-item ${missing.length?'pending':'ready'}">${steamText}${selfMissing?` <button type="button" class="queue-ready-link" data-qf-steam>${t('qf_link_steam')}</button>`:''}</span>`);
  }
  items.push(`<span class="queue-ready-item info">${t('qf_csgo')}</span>`);
  if('Notification' in window&&(Notification.permission==='default'||(Notification.permission==='granted'&&typeof SET!=='undefined'&&SET.notif&&!SET.notif.desktop))){
    items.push(`<span class="queue-ready-item info"><button type="button" class="queue-ready-link" data-qf-desk>${t('qf_desk_ask')}</button></span>`);
  }
  box.innerHTML=items.join('');
}
$('#queueReady').addEventListener('click',e=>{
  if(e.target.closest('[data-qf-steam]'))setView('profile');
  if(e.target.closest('[data-qf-desk]')){
    Notification.requestPermission().then(r=>{
      if(r==='granted'){if(typeof SET!=='undefined'&&SET.notif){SET.notif.desktop=true;if(typeof saveSet==='function')saveSet()}toast(t('qf_desk_on'))}
      renderQueueReady();
    });
  }
});
function renderRegions(){
  $('#regions').innerHTML=REGIONS.map(r=>{
    const ok=r.pingState==='ok',c=!ok?'var(--dim)':r.ping<50?'var(--green)':r.ping<120?'var(--yellow)':'var(--red)';
    const txt=ok?`${r.ping} ms`:r.pingState==='wait'?'… ms':'— ms';
    return `<div class="chip ${state.region===r.id?'active':''}" data-id="${r.id}" title="${t('ping_'+(r.pingState||'wait'))}">${r.id}<small style="color:${c}">${txt}</small></div>`;
  }).join('');
  renderQueueReady();
}
function renderStats(){
  if($('#sGap'))$('#sGap').innerHTML=mmSort?`±${MM[partyPlan()].gap} ${planBadge({plan:partyPlan()})}`:'—';
  if($('#mmSort'))$('#mmSort').checked=mmSort;
  const isWm = state.mode === 'wingman';
  const isDuel = state.mode === 'duel';
  const getElo = p => isWm ? (p.me || p.name === ME.name ? (ME.eloWm ?? 1000) : (p.eloWm ?? p.elo ?? 1000)) : isDuel ? (p.me || p.name === ME.name ? (ME.eloDuel ?? 1000) : (p.eloDuel ?? p.elo ?? 1000)) : p.elo;
  $('#sAvg').textContent=Math.round(state.party.reduce((s,p)=>s+getElo(p),0)/state.party.length);
  $('#sWait').textContent=(mmSort?{EU:'~0:40',NA:'~1:10',AS:'~2:30'}:{EU:'~0:15',NA:'~0:25',AS:'~0:50'})[state.region];
}
function setFind(){
  const f=$('#find');
  f.classList.toggle('searching',state.searching);
  f.classList.toggle('banned',banned());
  $('#play').classList.toggle('searching-on',state.searching);
  if(banned()){f.innerHTML=`<span class="fl">${t('ban_find',{x:'<b>'+clock(SAN.until-Date.now())+'</b>'})}</span><span class="t">${t('ban_r_'+SAN.reason)}</span>`;return}
  f.innerHTML=state.searching
    ?`<span class="fl">${t('searching_btn')} <b id="qt">${qStart?fmt(Math.floor((Date.now()-qStart)/1000)):'00:00'}</b></span><span class="t">${t('click_cancel')}</span>`
    :`<span class="fl">${t('find_match')}</span><span class="t">${modeObj().n} · ${regObj().name}</span>`;
}
function renderAll(){renderModes();renderDangerZone();renderMaps();renderParty();renderRegions();renderStats();setFind();renderBan()}

const locked=()=>{if(state.searching){toast(t('locked'));return true}return false};
$('#modes').onclick=e=>{
  const c=e.target.closest('.mode');if(!c||locked())return;
  state.mode=c.dataset.id;
  if(state.mode==='dz'){renderAll();return}
  while(state.party.length>maxParty())used.delete(state.party.pop().name);
  if(state.mode==='duel'){
    state.maps=new Set(MAPS.filter(isAimMap).map(m=>m.n));
  }else if(state.mode==='wingman'){
    state.maps=new Set(MAPS.filter(isWingmanMap).map(m=>m.n));
  }else if(state.mode!=='casual'){
    state.maps=new Set([...state.maps].filter(n=>{const m=MAPS.find(x=>x.n===n);return m&&isCompMap(m)}));
    if(!state.maps.size)curRot().maps.forEach(n=>state.maps.add(n));
  }else{
    state.maps=new Set([...state.maps].filter(n=>{const m=MAPS.find(x=>x.n===n);return m&&m.g!=='wingman'&&m.g!=='duel'}));
    if(!state.maps.size)curRot().maps.forEach(n=>state.maps.add(n));
  }
  renderAll();
};
$('#maps').onclick=e=>{
  const c=e.target.closest('.map');if(!c||locked())return;
  const n=c.dataset.n,m=MAPS.find(x=>x.n===n);
  if(!m)return;
  if(!canPlayMap(m))return toast(t('mv_off_toast',{n}));
  if(state.maps.has(n)){if(state.maps.size===1)return toast(t('keep_map'));state.maps.delete(n)}else state.maps.add(n);
  renderMaps();
};
$('#regions').onclick=e=>{
  const c=e.target.closest('.chip');if(!c||locked())return;
  state.region=c.dataset.id;renderRegions();renderStats();setFind();
};
document.addEventListener('click',e=>{
  if(e.target.closest('[data-open-cardshop]')){
    e.stopPropagation();
    shopTab='cards';
    setView('shop:cards');
  }
});
async function openPartyInviteModal(){
  if(typeof triggerFastInvitePoll==='function') triggerFastInvitePoll(20000);
  if(typeof plCreate==='function'){
    if(!PL.code||Date.now()>PL.exp)await plCreate();
    else{ if(typeof plPoll==='function') plPoll(); renderPL(); }
  }else if(typeof renderPL==='function'){
    renderPL();
  }
  openModal('plModal');
  clearInterval(plTick);
  plTick=setInterval(()=>{
    if(!$('#plModal')||!$('#plModal').classList.contains('on'))return clearInterval(plTick);
    const el=$('#plExp');if(!el)return;
    const l=Math.max(0,(typeof PL!=='undefined'&&PL.exp?PL.exp:0)-Date.now());
    el.textContent=t('pl_exp',{x:`${Math.floor(l/6e4)}:${String(Math.floor(l/1e3)%60).padStart(2,'0')}`});
    if(!l&&typeof renderPL==='function')renderPL();
  },1000);
}
$('#slots').onclick=async e=>{
  const x=e.target.closest('.x'),add=e.target.closest('[data-add]');
  if((!x&&!add)||locked())return;
  if(x){
    const idx=+x.dataset.i;
    const p=state.party[idx];
    if(!p)return;

    const isLeader=!state.party.length||(state.party[0].name&&ME&&state.party[0].name.toLowerCase()===ME.name.toLowerCase());
    const isMe=(p.me||(p.name&&ME&&p.name.toLowerCase()===ME.name.toLowerCase()));

    if(isMe&&!isLeader){
      const pCode=window.CURRENT_PARTY_CODE;
      const myBox=typeof fbMailbox==='function'?fbMailbox(ME.name):ME.name.toLowerCase();
      if(pCode&&typeof fbReq==='function'){
        fbReq(`parties/${pCode}/members/${myBox}`,'DELETE');
      }
      state.party=[ME];
      window.CURRENT_PARTY_CODE=null;
      used.clear();
      used.add(ME.name);
      renderParty();renderStats();
      toast("Tu as quitté le groupe.");
      return;
    }

    if(isLeader&&idx>0){
      state.party.splice(idx,1);
      used.delete(p.name);
      const pBox=typeof fbMailbox==='function'?fbMailbox(p.name):p.name.toLowerCase();

      if(typeof PL!=='undefined'){
        if(PL.seen){PL.seen.delete(pBox);PL.seen.delete(p.name);}
        if(PL.joined)PL.joined=PL.joined.filter(n=>n.toLowerCase()!==p.name.toLowerCase());
        PL.kicked=PL.kicked||new Set();
        PL.kicked.add(pBox);
        PL.kicked.add(p.name.toLowerCase());
      }
      if(typeof FR_INVITES_CACHE!=='undefined'){
        FR_INVITES_CACHE.delete(p.name);
      }

      if(window.CURRENT_PARTY_CODE&&typeof fbReq==='function'){
        fbReq(`parties/${window.CURRENT_PARTY_CODE}/members/${pBox}`,'DELETE');
        fbReq(`parties/${window.CURRENT_PARTY_CODE}/kicked/${pBox}`,'PUT',{name:p.name,at:Date.now()});
      }

      toast(t('pt_kicked',{n:p.name}));
      renderParty();renderStats();
      if($('#plModal')&&$('#plModal').classList.contains('on')&&typeof renderPL==='function'){
        renderPL();
      }
      return;
    }
  }
  if(add){
    openPartyInviteModal();
  }
};

let qStart=0,qInt,qTo;
function startQueue(prio){
  state.searching=true;state.prio=!!prio;qStart=Date.now();setFind();
  $('#bMode').innerHTML=modeObj().n+(prio?` <span class="prio-tag">${t('prio')}</span>`:'');$('#banner').classList.add('on');
  qInt=setInterval(tick,250);tick();

  if(window.CURRENT_PARTY_CODE && (!state.party.length || state.party[0].name === ME.name)){
    if(typeof fbReq === 'function'){
      fbReq(`parties/${CURRENT_PARTY_CODE}/queue`, 'PUT', {
        status: 'searching',
        leader: ME.name,
        mode: state.mode,
        region: state.region,
        prio: !!prio,
        at: Date.now()
      });
    }
  }

  qTo=setTimeout(matchFound,prio?800+Math.random()*1500:4000+Math.random()*5000);
  beep(520,.08);beep(780,.1,.09);
  if(typeof fbSyncOnline==='function')fbSyncOnline();
}
function stopQueue(byUser){
  state.searching=false;qStart=0;clearInterval(qInt);clearTimeout(qTo);setFind();$('#banner').classList.remove('on');
  if(byUser){toast(t('search_cancelled'));beep(380,.14)}

  if(window.CURRENT_PARTY_CODE && (!state.party.length || state.party[0].name === ME.name)){
    if(typeof fbReq === 'function'){
      fbReq(`parties/${CURRENT_PARTY_CODE}/queue`, 'PUT', { status: 'idle', at: Date.now() });
    }
  }

  if(typeof fbSyncOnline==='function')fbSyncOnline();
}
function tick(){const tm=fmt(Math.floor((Date.now()-qStart)/1000));const q=$('#qt');if(q)q.textContent=tm;$('#bTime').textContent=tm}
$('#find').onclick=()=>{
  if(state.searching)return stopQueue(true);
  if(banned())return toast(t('ban_blocked',{x:clock(SAN.until-Date.now())}));
  if(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||window.innerWidth<=680){
    toast("Le matchmaking 128 tick s'exécute sur PC (Steam & CS:GO requis).");
  }

  if(state.party.length > 1 && state.party[0].name !== ME.name){
    return toast(t('pt_leader_only',{n:state.party[0].name}));
  }

  const unlinked = state.party.find(p => {
    if (p.me || p.name === ME.name) return !ME.steam || !ME.steam.linked;
    return !p.steam || !p.steam.linked;
  });
  if(unlinked){
    if(unlinked.name === ME.name || unlinked.me){
      toast(t('link_to_search'));
      return setView('profile');
    } else {
      return toast(`Impossible de lancer : ${unlinked.name} n'a pas lié son compte Steam !`);
    }
  }

  startQueue(false);
};
$('#bCancel').onclick=()=>stopQueue(true);

let qCount=0,online=1;

const CIRC=2*Math.PI*52;$('#ringFg').style.strokeDasharray=CIRC;
let mf={},ft;
function flashTitle(on){clearInterval(ft);document.title=BASE_TITLE;if(on){let b=0;ft=setInterval(()=>document.title=(b^=1)?t('match_found'):BASE_TITLE,700)}}
function ring(f){const c=$('#ringFg');c.style.strokeDashoffset=CIRC*(1-f);c.style.stroke=f<.3?'var(--red)':'var(--green)'}
function matchFound(){
  stopQueue(false);

  if(window.CURRENT_PARTY_CODE && (!state.party.length || state.party[0].name === ME.name)){
    if(typeof fbReq === 'function'){
      fbReq(`parties/${CURRENT_PARTY_CODE}/queue`, 'PUT', { status: 'found', at: Date.now() });
    }
  }
  const total=state.mode==='duel'?2:state.mode==='wingman'?4:10;
  mf={total,ok:0,accepted:false,left:20,timers:[],done:false};
  $('#accepts').innerHTML='<div class="acc"></div>'.repeat(total);
  $('#fMode').textContent=`${modeObj().n} · ${regObj().name}`;
  $('#fStatus').textContent=t('waiting_players');
  const ab=$('#acceptBtn');ab.disabled=false;ab.textContent=t('accept');
  const db=$('#declineBtn');db.hidden=false;db.title=t('decline_free');
  ring(1);$('#ringNum').textContent=20;
  $('#found').classList.add('on');
  TRMatchSound.play();
  flashTitle(true);
  deskNotify(t('match_found'),t('desk_found_d',{m:modeObj().n,r:regObj().name}),'tr_found');
  mf.int=setInterval(()=>{mf.left-=.1;ring(Math.max(0,mf.left/20));$('#ringNum').textContent=Math.max(0,Math.ceil(mf.left));if(mf.left<=0)endFound('timeout')},100);
  const others=total-1,declineIdx=Math.random()<.12?rnd(0,others-1):-1;
  for(let i=0;i<others;i++)mf.timers.push(setTimeout(()=>{if(mf.done)return;i===declineIdx?markDecline():markOk()},rnd(700,9000)));
}
function markOk(){
  const d=$$('#accepts .acc')[mf.ok++];if(d)d.classList.add('ok');
  $('#fStatus').textContent=t('n_accepted',{n:mf.ok,t:mf.total});
  beep(880+mf.ok*40,.06,0,'sine',.03);
  if(mf.ok>=mf.total)endFound('ok');
}
function markDecline(){const d=$$('#accepts .acc');d[d.length-1].classList.add('no');endFound('decline')}
function endFound(why){
  if(mf.done)return;mf.done=true;clearInterval(mf.int);mf.timers.forEach(clearTimeout);flashTitle(false);
  const close=()=>$('#found').classList.remove('on');
  if(why==='ok'){
    $('#fStatus').textContent=t('all_ready');
    beep(784,.12);beep(1047,.12,.12);beep(1319,.25,.24);
    setTimeout(()=>{close();showLobby()},1000);
  }else if(why==='decline'){
    $('#fStatus').textContent=t('declined');beep(300,.25,0,'sawtooth',.035);
    setTimeout(()=>{close();if(mf.accepted){toast(t('prio_requeue'));startQueue(true)}else toast(t('match_cancelled'))},1300);
  }else if(why==='self_decline'){
    close();toast(t('declined_free'));beep(380,.14);
  }else{
    close();
    if(mf.accepted){toast(t('prio_requeue'));notify('prio','prio_requeue',{},'play');startQueue(true)}else toast(t('not_accepted_free'));
  }
}
$('#declineBtn').onclick=()=>{if(mf.done||mf.accepted)return;$$('#accepts .acc')[mf.total-1].classList.add('no');endFound('self_decline')};
$('#acceptBtn').onclick=()=>{
  if(mf.accepted||mf.done)return;mf.accepted=true;
  const b=$('#acceptBtn');b.disabled=true;b.textContent=t('accepted');$('#declineBtn').hidden=true;markOk();
};

const BAN_STEPS=[5,30,120,1440];
const isComp=()=>state.mode!=='casual';
let SAN={until:0,reason:null,list:[]};
try{const v=JSON.parse(localStorage.getItem('cs_sanctions')||'null');if(v&&Array.isArray(v.list))SAN=v}catch(e){}
const saveSan=()=>{try{localStorage.setItem('cs_sanctions',JSON.stringify(SAN))}catch(e){}};
const banned=()=>SAN.until>Date.now();
const recentOff=()=>SAN.list.filter(x=>Date.now()-x.at<7*864e5).length;
const durTxt=min=>min<60?t('dur_min',{n:min}):t('dur_h',{n:min/60});
const nextBan=()=>BAN_STEPS[Math.min(recentOff(),BAN_STEPS.length-1)];
function clock(ms){const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(x).padStart(2,'0')}
function applyBan(reason,fixedMin){
  if(!isComp())return 0;
  const min=fixedMin||nextBan();
  SAN.list.unshift({at:Date.now(),reason,min});
  SAN.until=Date.now()+min*60e3;SAN.reason=reason;saveSan();
  notify('ban','n_ban',{x:durTxt(min),r:t('ban_r_'+reason)},'profile');
  if(state.searching)stopQueue(false);
  renderBan();setFind();
  beep(260,.3,0,'sawtooth',.035);
  return min;
}
function renderBan(){
  const box=$('#banBox');
  if(!banned()){box.hidden=true;return}
  const off=recentOff(),nx=BAN_STEPS[Math.min(off,BAN_STEPS.length-1)];
  box.hidden=false;
  box.innerHTML=`<div class="ico">${ICON.ban}</div>
    <div><div class="bt">${t('ban_title')}</div><div class="bs">${t('ban_r_'+SAN.reason)} · ${off>=BAN_STEPS.length?t('ban_level_max',{x:durTxt(BAN_STEPS.at(-1))}):t('ban_level',{n:off,x:durTxt(nx)})}</div></div>
    <div class="bc"><b id="banClock">${clock(SAN.until-Date.now())}</b><small>${t('ban_ends')}</small></div>
    <button class="btn ghost sm" id="banLift">${t('ban_lift')}</button>`;
  $('#banLift').onclick=()=>{SAN.until=0;saveSan();renderBan();setFind();toast(t('ban_lifted'))};
}
let wasBanned=banned();
setInterval(()=>{
  const b=banned();
  if(b){const c=$('#banClock');if(c)c.textContent=clock(SAN.until-Date.now());const f=$('#find .fl b');if(f)f.textContent=clock(SAN.until-Date.now())}
  if(wasBanned&&!b){renderBan();setFind();toast(t('ban_over'));beep(880,.1)}
  wasBanned=b;
},1000);

function confirmBox(title,html,yes,no,onYes){
  $('#cfTitle').textContent=title;$('#cfText').innerHTML=html;$('#cfYes').textContent=yes;$('#cfNo').textContent=no;
  $('#cfYes').onclick=()=>{closeModal('confirmModal');onYes()};openModal('confirmModal');
}

let ip='',cur=null,srvPass='';
const MM={free:{gap:400,minTrust:0},plus:{gap:250,minTrust:0},premium:{gap:150,minTrust:8.5}};
const partyPlan=()=>state.party.reduce((lo,p)=>PLAN_RANK[p.plan||'free']<PLAN_RANK[lo]?(p.plan||'free'):lo,'premium');
function showLobby(){
  if(window.CURRENT_PARTY_CODE && (!state.party.length || state.party[0].name === ME.name)){
    if(typeof fbReq === 'function'){
      fbReq(`parties/${CURRENT_PARTY_CODE}/queue`, 'PUT', { status: 'lobby', at: Date.now() });
    }
  }
  const isWm=state.mode==='wingman',isDuel=state.mode==='duel';
  const getElo=p=>isWm?(p.me||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())?(ME.eloWm??1000):(p.eloWm??p.elo??1000)):isDuel?(p.me||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())?(ME.eloDuel??1000):(p.eloDuel??p.elo??1000)):p.elo;
  const size=isDuel?1:isWm?2:5,pool=partyTier(),pp=partyPlan(),mm=mmSort?MM[pp]:{gap:1200,minTrust:0};
  const base=Math.round(state.party.reduce((s,p)=>s+getElo(p),0)/state.party.length),spread=Math.round(mm.gap/2);
  const minT=pool.id==='high'?mm.minTrust:0;
  used=new Set(state.party.map(p=>p.name));
  const A=[...state.party];while(A.length<size)A.push(newPlayer(base,pool.id,spread,minT));
  const B=[];while(B.length<size)B.push(newPlayer(base,pool.id,spread,minT));
  B.sort((x,y)=>getElo(y)-getElo(x));
  const avg=tm=>Math.round(tm.reduce((s,p)=>s+getElo(p),0)/tm.length);
  const aA=avg(A),aB=avg(B),pA=1/(1+10**((aB-aA)/400));
  ip=`${pick([185,92,151])}.${rnd(10,250)}.${rnd(10,250)}.${rnd(10,250)}:27015`;
  [...A,...B].forEach(p=>{if(!p.me)p.lastPlayed=Date.now()});
  clearVeto();
  cur={A,B,aA,aB,pA,map:null,size,pool,plan:pp,mode:state.mode,gap:mm.gap,sorted:mmSort,done:false,veto:{left:MAPS.filter(x=>state.maps.has(x.n)).map(x=>x.n),log:[],turn:'A',deadline:0},srvN:rnd(1,40),id:Math.random().toString(16).slice(2,8).toUpperCase()};
  chatInit();
  if(cur.veto.left.length===1)finishVeto();else startTurn('A');
  renderLobby();setView('lobby');
}
function lobbyMapUI(){
  const m=cur.map;
  $('#mapBg').style.background=m?mapBg(m):'linear-gradient(135deg,#23262d,#16171b)';$('#mapName').textContent=m?m.n:t('veto_pending');
  const j=cur.join,me=j&&j.joined.has(ME.name),all=j&&j.live;
  $('#connect').disabled=!m||me;$('#connect').textContent=me?t('connected_btn'):t('connect');
  $('#simBtn').disabled=!m||!all;$('#simBtn').title=all?'':t('join_wait_all');
  renderJoin();
}
function renderLobby(){
  const c=cur,{A,B,aA,aB,pA,map:m,size}=c;
  renderVeto();
  const matchMode=c.mode||state.mode;
  const isWm=matchMode==='wingman',isDuel=matchMode==='duel';
  const getElo=p=>isWm?(p.me||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())?(ME.eloWm??p.elo??1000):(p.eloWm??p.elo??1000)):isDuel?(p.me||(p.name&&ME.name&&p.name.toLowerCase()===ME.name.toLowerCase())?(ME.eloDuel??p.elo??1000):(p.eloDuel??p.elo??1000)):p.elo;

  const row=(p,i)=>{
    const csId=typeof cardStyleOf==='function'?cardStyleOf(p):'default';
    const pElo=getElo(p);
    return `<div class="prow ${p.me?'me':''} pcard-cs-${csId}" style="animation-delay:${i*60}ms" data-row="${escA(p.name)}"><span data-profile="${escA(p.name)}">${avHTML(p)}</span><i class="jdot" title=""></i>
    <div class="who"><div class="pn"><span data-profile="${escA(p.name)}">${escA(p.name)}</span> ${planBadge(p)} ${i===0?`<span class="crown" title="${t('leader')}">${ICON.leader}</span>`:''}</div>
    <div class="ps">${p.me?t('you'):state.party.includes(p)?t('your_party'):i===0?t('captain'):t('player')} · ${tfHTML(p)}</div></div>
    <div class="pe">${pElo}</div>${lvlHTML(pElo,false,false)}${reportBtn(p)}</div>`
  };
  $('#teamA').innerHTML=A.map(row).join('');$('#teamB').innerHTML=B.map(row).join('');
  $('#nameA').textContent='TEAM_'+A[0].name.toUpperCase();$('#nameB').textContent='TEAM_'+B[0].name.toUpperCase();
  $('#avgA').textContent=t('team_avg',{n:aA});$('#avgB').textContent=t('team_avg',{n:aB});
  lobbyMapUI();
  $('#vsTag').textContent=`${size} VS ${size}`;
  const r=regObj();
  $('#srv').textContent=`${r.id}-${r.city} #${c.srvN}${r.pingState==='ok'?` · ${r.ping} ms`:''}`;
  $('#lMode').textContent=(MODES.find(x=>x.id===matchMode)||modeObj()).n;
  const all=[...A,...B].map(p=>p.elo),real=Math.max(...all)-Math.min(...all);
  $('#lGap').innerHTML=`${c.sorted===false?t('mm_off'):`±${c.gap} ${planBadge({plan:c.plan})}`}<br><small style="color:var(--dim);font-weight:400">${t('elo_gap_real')} : ${real}</small>`;
  $('#lPool').innerHTML=`<span class="tf" style="--c:${c.pool.c}">${ICON.shield}${tierName(c.pool)}</span>`;
  $('#winP').textContent=Math.round(pA*100)+' %';
  $('#stakes').innerHTML=matchMode==='casual'
    ?`<div class="win" style="grid-column:1/-1"><small>${t('unranked_match')}</small>±0</div>`
    :`<div class="win"><small>${t('win')}</small>+${Math.round(50*(1-pA))}</div><div class="loss"><small>${t('loss')}</small>−${Math.round(50*pA)}</div>`;
  $('#ip').textContent='connect '+ip;
  $('#matchId').textContent='MATCH #'+c.id;
  renderChat();
}
$('#leave').onclick=()=>{
  if(!isComp()){clearJoin();clearVeto();cur=null;setView('play');return toast(t('left_lobby'))}
  confirmBox(t('leave_title'),t('leave_text',{x:durTxt(nextBan())}),t('leave_confirm'),t('stay'),()=>{
    clearJoin();clearVeto();const min=applyBan('left');cur=null;setView('play');
    toast(t('ban_applied',{x:durTxt(min),r:t('ban_r_left')}));
  });
};
$('#afkBtn').onclick=()=>{
  const pen=state.mode==='casual'?0:25;
  ME.elo=Math.max(100,ME.elo-pen);
  clearJoin();clearVeto();const min=applyBan('afk_match');cur=null;refreshMe();setView('play');
  toast(min?t('afk_penalty',{e:pen,x:durTxt(min)}):t('casual_free'));
};
let autoLaunchCsgo=false;
if($('#autoLaunchToggle')){
  $('#autoLaunchToggle').checked=autoLaunchCsgo;
  $('#autoLaunchToggle').onchange=e=>{
    autoLaunchCsgo=e.target.checked;
    try{localStorage.setItem('tr_autolaunch',autoLaunchCsgo?'1':'0')}catch(_){}
    toast(autoLaunchCsgo?'Lancement auto CS:GO via Steam activé':'Lancement auto CS:GO désactivé');
  };
}
const CSGO_APPID=4465480;
let steamLaunching=0;
async function launchCsgoClient(srvIp=ip,isAuto=false){
  const pw=srvPass?`password ${srvPass}; `:'';
  const cmdLine=typeof buildCsgoExecLine==='function'?`${buildCsgoExecLine(ME.csgoCfg)}; ${pw}connect ${srvIp}`:`${pw}connect ${srvIp}`;
  try{await navigator.clipboard.writeText(cmdLine)}catch(e){}
  if(cur&&typeof fbReq==='function'){
    fbReq(`csgo_dispatch/${cur.id}/playerConfigs/${fbUserKey()}`,'PUT',{
      name:ME.name,steamId:ME.steam&&ME.steam.id,cfg:ME.csgoCfg,execLine:buildCsgoExecLine(ME.csgoCfg),verifiedAt:Date.now()
    });
  }
  try{
    const steamUri=`steam://connect/${srvIp}${srvPass?'/'+encodeURIComponent(srvPass):''}`;
    steamLaunching=Date.now();
    const w=window.open(steamUri,'_blank');
    if(!w){
      let f=document.getElementById('steamLaunchFrame');
      if(!f){f=document.createElement('iframe');f.id='steamLaunchFrame';f.style.display='none';document.body.appendChild(f)}
      f.src=steamUri;
    }else setTimeout(()=>{try{w.close()}catch(e){}},4000);
  }catch(e){}
  toast(t('joining_srv'));beep(990,.08);
  setTimeout(()=>{if(cur&&cur.join&&!cur.join.done)joinPlayer(ME.name)},900);
}
$('#connect').onclick=()=>launchCsgoClient(ip,false);
$('#ipCopy').onclick=async()=>{
  const cmd=$('#ip').textContent.trim();
  if(!ip||!cmd||cmd.endsWith('…'))return;
  try{await navigator.clipboard.writeText(cmd);toast(t('copied_cmd'));beep(880,.06)}catch(e){toast(cmd)}
};

const JOIN_MS=240000,NO_SHOW_MIN=5;
function startJoin(){
  const c=cur;if(!c||c.join)return;
  const all=[...c.A,...c.B];
  c.join={deadline:Date.now()+JOIN_MS,joined:new Set(),timers:[],done:false,live:false};
  const bots=all.filter(p=>!p.me),ghost=Math.random()<.13?pick(bots).name:null;
  c.join.ghost=ghost;
  bots.forEach(p=>{if(p.name!==ghost)c.join.timers.push(setTimeout(()=>joinPlayer(p.name),rnd(2500,55000)))});
  c.join.int=setInterval(()=>{if(!cur||cur!==c||c.join.done)return clearInterval(c.join.int);renderJoin();if(Date.now()>=c.join.deadline)joinTimeout()},250);
  lobbyMapUI();
}
function clearJoin(){chatClear();lcfClose();const j=cur&&cur.join;if(!j)return;j.done=true;j.timers.forEach(clearTimeout);clearInterval(j.int)}
function joinPlayer(name){
  const c=cur,j=c&&c.join;if(!j||j.done||j.joined.has(name))return;
  j.joined.add(name);const r=$(`#lobby [data-row="${CSS.escape(name)}"]`);if(r)r.classList.add('in');
  if(name===ME.name){beep(880,.08);beep(1175,.1,.08)}
  if(j.joined.size===c.A.length+c.B.length){chatSys('sys_live');j.done=true;j.live=true;j.timers.forEach(clearTimeout);clearInterval(j.int);toast(t('join_all'));beep(784,.12);beep(1047,.12,.12);beep(1319,.2,.24)}
  lobbyMapUI();
}
function renderJoin(){
  const box=$('#joinBox'),c=cur,j=c&&c.join;
  if(!j){box.hidden=true;return}
  box.hidden=false;const tot=c.A.length+c.B.length,n=j.joined.size,left=Math.max(0,j.deadline-Date.now());
  $$('#lobby [data-row]').forEach(r=>r.classList.toggle('in',j.joined.has(r.dataset.row)));
  box.className='joinbox'+(j.live?' live':left<30000?' hot':'');
  box.innerHTML=j.live
    ?`<b>● LIVE</b><span>${t('join_all')}</span>`
    :`<div class="jb-h"><b>${t('join_title')}</b><span class="jb-c">${clock(left)}</span></div>
      <div class="jb-bar"><i style="width:${n/tot*100}%"></i></div>
      <div class="jb-s"><span>${t('join_n',{n,t:tot})}</span><span>${j.joined.has(ME.name)?t('connected_srv'):t('join_me')}</span></div>`;
}
function joinTimeout(){
  const c=cur,j=c.join;if(j.done)return;clearJoin();
  const missing=[...c.A,...c.B].filter(p=>!j.joined.has(p.name));
  if(!missing.length)return;
  cur=null;clearVeto();
  if(missing.some(p=>p.me)){
    applyBan('no_show',NO_SHOW_MIN);setView('play');
    toast(t('join_kick_me',{x:durTxt(NO_SHOW_MIN)}));
  }else{
    toast(t('join_kick',{n:missing.map(p=>p.name).join(', '),x:durTxt(NO_SHOW_MIN)}));beep(300,.25,0,'sawtooth',.035);
    notify('prio','n_prio_kick',{n:missing.map(p=>p.name).join(', ')},'play');
    setView('play');setTimeout(()=>startQueue(true),1600);
  }
}

let vetoT=null,vetoI=null;
function clearVeto(){clearTimeout(vetoT);clearInterval(vetoI);vetoT=vetoI=null}
const capName=team=>'TEAM_'+(team==='A'?cur.A[0]:cur.B[0]).name.toUpperCase();
function startTurn(team){
  const v=cur.veto;v.turn=team;v.deadline=Date.now()+15000;
  clearVeto();
  vetoI=setInterval(()=>{
    if(!cur||cur.map){clearVeto();return}
    const c=$('#vetoClock');if(c)c.textContent=Math.max(0,Math.ceil((cur.veto.deadline-Date.now())/1000))+'s';
    if(Date.now()>cur.veto.deadline&&cur.veto.turn==='A'){const m=pick(cur.veto.left);toast(t('veto_auto',{m}));vetoBan(m,'A')}
  },250);
  if(team==='B')vetoT=setTimeout(()=>{if(!cur||cur.map)return;const MS=cur.ms||(cur.ms={A:teamMapStats(cur.A),B:teamMapStats(cur.B)});
    const best=cur.veto.left.reduce((b,n)=>(MS.A[n].wr-MS.B[n].wr)>(MS.A[b].wr-MS.B[b].wr)?n:b,cur.veto.left[0]);
    vetoBan(Math.random()<.8?best:pick(cur.veto.left),'B')},rnd(1100,2600));
}
function vetoBan(m,team){
  const v=cur.veto;if(!v.left.includes(m)||v.turn!==team)return;
  v.left=v.left.filter(x=>x!==m);v.log.push({m,team});beep(team==='A'?520:420,.07);
  chatSys('sys_ban',{x:capName(team),m});
  if(v.left.length===1)finishVeto();else startTurn(team==='A'?'B':'A');
  renderVeto();lobbyMapUI();vcRows();
}
function finishVeto(){
  clearVeto();cur.map=MAPS.find(x=>x.n===cur.veto.left[0]);
  toast(t('veto_done',{m:cur.map.n}));beep(784,.1);beep(1047,.14,.1);
  chatSys('sys_pick',{m:cur.map.n});
  startJoin();
  if(typeof fbReq==='function'){
    const reg=regObj();
    const srvMap=state.mode==='duel'&&cur.map.wm?.bsp?cur.map.wm.bsp:state.mode==='wingman'&&cur.map.wm?cur.map.wm.bsp:cur.map.slug.startsWith('aim_')||cur.map.slug.startsWith('awp_')?cur.map.slug:`de_${cur.map.slug}`;
    fbReq(`csgo_dispatch/${cur.id}`,'PUT',{
      matchId:cur.id,
      status:'READY_FOR_CSGO_SERVER',
      mode:state.mode,
      gameType:0,
      gameMode:state.mode==='wingman'?2:1,
      map:srvMap,
      mapName:cur.map.n,
      wingmanSite:state.mode==='wingman'&&cur.map.wm?cur.map.wm.site:null,
      tickrate:128,
      region:reg.id,
      city:reg.city,
      connectIp:ip,
      teamA:cur.A.map(p=>({name:p.name,elo:p.elo,steamId:p.me?(ME.steam&&ME.steam.id):p.steamId})),
      teamB:cur.B.map(p=>({name:p.name,elo:p.elo,steamId:p.steamId})),
      createdAt:Date.now()
    });
  }
  if(autoLaunchCsgo){
  }
}
function playerMapStats(p){
  if(p._ms)return p._ms;
  const r=seeded(hashStr(p.name)*7+11),out={};
  const fav=new Set([MAPS[Math.floor(r()*MAPS.length)].n,MAPS[Math.floor(r()*MAPS.length)].n]),weak=MAPS[Math.floor(r()*MAPS.length)].n;
  const base=Math.min(.62,Math.max(.4,.5+(p.elo-1800)/4000));
  for(const m of MAPS){
    const played=Math.round((fav.has(m.n)?60:weak===m.n?8:22)*(.6+r()*.9));
    let wr=base+(fav.has(m.n)?.12:0)-(weak===m.n?.12:0)+(r()-.5)*.14;
    out[m.n]={p:played,w:Math.round(played*Math.min(.85,Math.max(.2,wr)))};
  }
  if(p.me)(p.history||[]).forEach(h=>{const o=out[h.map];if(o){o.p++;if(h.won)o.w++}});
  return p._ms=out;
}
function teamMapStats(team){
  const out={};
  for(const m of MAPS){let w=0,pl=0;team.forEach(p=>{const s=playerMapStats(p)[m.n];w+=s.w;pl+=s.p});out[m.n]={wr:pl?w/pl:.5,p:pl}}
  return out;
}

function renderVeto(){
  const box=$('#veto'),v=cur.veto;
  if(!v||v.log.length===0&&cur.map){box.hidden=true;return}
  box.hidden=false;
  const myTurn=!cur.map&&v.turn==='A';
  const all=MAPS.filter(x=>v.left.includes(x.n)||v.log.some(l=>l.m===x.n));
  if(!cur.ms)cur.ms={A:teamMapStats(cur.A),B:teamMapStats(cur.B)};
  const MS=cur.ms,pc=x=>Math.round(x*100)+'%',cls=x=>x>=.58?'hi':x<=.47?'lo':'mid';
  const rec=myTurn?v.left.reduce((b,n)=>(MS.B[n].wr-MS.A[n].wr)>(MS.B[b].wr-MS.A[b].wr)?n:b,v.left[0]):null;
  box.innerHTML=`<div class="veto-h"><b>${t('veto_title')}</b>${cur.map?`<span class="pill" style="color:var(--green)">${cur.map.n}</span>`:`<span class="veto-clock" id="vetoClock">${Math.max(0,Math.ceil((v.deadline-Date.now())/1000))}s</span>`}</div>
    <div class="veto-s ${myTurn?'me':''}">${cur.map?t('veto_hint'):myTurn?t('veto_your'):t('veto_wait',{x:capName(v.turn)})}</div>
    <div class="veto-legend"><span>${t('vs_us')}</span><span>${t('vs_them')}</span></div>
    <div class="veto-grid">${all.map(m=>{const l=v.log.find(x=>x.m===m.n),pickd=cur.map&&cur.map.n===m.n,a=MS.A[m.n],b=MS.B[m.n];
      return `<button class="vmap ${l?'ban':''} ${pickd?'pick':''} ${myTurn&&!l?'can':''} ${rec===m.n?'rec':''}" data-veto="${m.n}" style="background:${mapBg(m)}" title="${t('vs_tip',{a:pc(a.wr),pa:a.p,b:pc(b.wr),pb:b.p})}"><span class="vn">${m.n}</span>${l?`<small class="vby">${t('veto_by',{x:capName(l.team)})}</small>`:''}${rec===m.n?`<i class="rtag">${t('vs_rec')}</i>`:''}
        <span class="vst"><span class="us"><small>${t('vs_us_s')}</small><b>${pc(a.wr)}</b></span><span class="them"><small>${t('vs_them_s')}</small><b class="${cls(b.wr)}">${pc(b.wr)}</b></span></span></button>`}).join('')}</div>`;
}
$('#veto').addEventListener('click',e=>{
  const b=e.target.closest('[data-veto]');if(!b||!cur||cur.map||cur.veto.turn!=='A')return;
  if(cur.veto.log.some(l=>l.m===b.dataset.veto))return;
  vetoBan(b.dataset.veto,'A');
});

