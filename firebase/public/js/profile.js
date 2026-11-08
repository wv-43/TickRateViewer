/* =====================================================
 * TICKRATE - Menu Profil : Stats, Graphique ELO interactif & Historique (profile.js)
 * ===================================================== */
/* =====================================================
   PROFIL
   ===================================================== */
let histShown=5,eloRange='20m',eloChartPts=[],eloMode='ranked';   // eloMode : courbe 5v5 ou Wingman (classements séparés)
function filterEloHistory(P,rng=eloRange){
  const all=(P.history||[]).filter(x=>(x.mode==='wingman')===(eloMode==='wingman'));   // un seul classement à la fois
  if(!all.length)return [];
  const now=Date.now();
  if(rng==='7d'){
    const f=all.filter(x=>(now-+new Date(x.date))<=7*864e5);
    return f.length>=2?f:all.slice(0,Math.min(5,all.length));
  }
  if(rng==='30d'){
    const f=all.filter(x=>(now-+new Date(x.date))<=30*864e5);
    return f.length>=2?f:all.slice(0,Math.min(12,all.length));
  }
  if(rng==='all')return all;
  return all.slice(0,20);
}
function eloRangeLabel(rng,n){
  const map={
    fr:{'7d':`7 derniers jours (${n})`,'30d':`30 derniers jours (${n})`,'20m':t('last_n',{n}),'all':`Lifetime (${n} matchs)`},
    en:{'7d':`Last 7 days (${n})`,'30d':`Last 30 days (${n})`,'20m':t('last_n',{n}),'all':`Lifetime (${n} matches)`},
    ru:{'7d':`За 7 дней (${n})`,'30d':`За 30 дней (${n})`,'20m':t('last_n',{n}),'all':`За всё время (${n})`}
  };
  return (map[lang]||map.fr)[rng]||t('last_n',{n});
}
function eloHoverSummary(p){
  if(!p)return '';
  const dCls=p.delta>0?'pos':p.delta<0?'neg':'';
  return `<span><b>${p.elo} ELO</b> <span class="${dCls}">(${sign(p.delta)})</span> · ${escA(p.map)} <span class="${p.won?'pos':'neg'}">${escA(p.score)}</span></span><span>K/D ${kd(p.k,p.d)} · ${fmtDate(new Date(p.date))}</span>`;
}
function eloChart(h){
  const pts=h.length?[...h].reverse():[{elo:(eloMode==='wingman'?(profileTarget?profileTarget.eloWm:ME.eloWm):(profileTarget||ME).elo)||1000,won:true,map:'Placement',score:'0-0',delta:0,k:0,d:0,date:new Date()}];
  eloChartPts=pts;
  const W=660,H=210,PL=48,PR=16,PT=18,PB=22;
  const vals=pts.map(x=>x.elo),mn=Math.min(...vals)-22,mx=Math.max(...vals)+22;
  const X=i=>PL+i*(W-PL-PR)/Math.max(1,pts.length-1),Y=v=>H-PB-(v-mn)/Math.max(1,mx-mn)*(H-PT-PB);
  const line=pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(p.elo).toFixed(1)}`).join('');
  const area=line+`L${X(pts.length-1).toFixed(1)},${H-PB}L${X(0).toFixed(1)},${H-PB}Z`;
  const grid=[0,.25,.5,.75,1].map(f=>{
    const v=Math.round(mn+(mx-mn)*f),y=Y(v).toFixed(1);
    return `<line x1="${PL}" x2="${W-PR}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.08)"/><text x="${PL-8}" y="${(+y+4).toFixed(1)}" text-anchor="end" fill="#9ba1b0" font-size="11" font-family="Plus Jakarta Sans,sans-serif">${v}</text>`;
  }).join('');
  const rDot=pts.length>45?2.2:pts.length>25?2.8:3.2;
  const dots=pts.map((p,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(p.elo).toFixed(1)}" r="${i===pts.length-1?4.5:rDot}" fill="${p.won?'#3fcf8e':'#ef5560'}"/>`).join('');
  const last=pts[pts.length-1];
  return `<div class="elo-svg-wrap" id="eloSvgWrap" data-pl="${PL}" data-pr="${PR}" data-pt="${PT}" data-pb="${PB}" data-w="${W}" data-h="${H}" data-mn="${mn}" data-mx="${mx}">
    <div class="elo-hover-bar" id="eloHoverBar">${eloHoverSummary(last)}</div>
    <svg id="eloSvg" viewBox="0 0 ${W} ${H}">
      <line x1="${PL}" x2="${PL}" y1="${PT}" y2="${H-PB}" stroke="#262830" stroke-width="1"/>
      ${grid}
      <path d="${area}" fill="#ffb21f" fill-opacity=".08"/>
      <path d="${line}" fill="none" stroke="#ffb21f" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      <g id="eloCrosshair" style="display:none;pointer-events:none">
        <line id="eloHzLine" x1="${PL}" x2="${W-PR}" y1="0" y2="0" stroke="#ffb21f" stroke-width="1.3" stroke-dasharray="4 3" opacity=".9"/>
        <line id="eloVtLine" x1="0" x2="0" y1="${PT}" y2="${H-PB}" stroke="rgba(255,255,255,.22)" stroke-width="1" stroke-dasharray="3 3"/>
        <circle id="eloActiveGlow" cx="0" cy="0" r="8" fill="#ffb21f" fill-opacity=".22"/>
        <circle id="eloActiveDot" cx="0" cy="0" r="4.8" fill="#ffb21f" stroke="#0b0c0e" stroke-width="2"/>
        <g id="eloYBadge">
          <rect x="2" y="-10" width="42" height="20" rx="4" fill="#ffb21f"/>
          <text id="eloYText" x="23" y="4" text-anchor="middle" fill="#0b0c0e" font-family="Rajdhani,sans-serif" font-weight="800" font-size="14">1840</text>
        </g>
      </g>
    </svg>
  </div>`;
}
function bindEloChartHover(){
  const wrap=$('#eloSvgWrap'),svg=$('#eloSvg'),ch=$('#eloCrosshair'),bar=$('#eloHoverBar');
  if(!wrap||!svg||!ch||!eloChartPts.length)return;
  const W=+wrap.dataset.w,H=+wrap.dataset.h,PL=+wrap.dataset.pl,PR=+wrap.dataset.pr,PT=+wrap.dataset.pt,PB=+wrap.dataset.pb;
  const mn=+wrap.dataset.mn,mx=+wrap.dataset.mx,pts=eloChartPts;
  const X=i=>PL+i*(W-PL-PR)/Math.max(1,pts.length-1),Y=v=>H-PB-(v-mn)/Math.max(1,mx-mn)*(H-PT-PB);
  const hz=$('#eloHzLine'),vt=$('#eloVtLine'),dot=$('#eloActiveDot'),glow=$('#eloActiveGlow'),yb=$('#eloYBadge'),yt=$('#eloYText');
  const updateFromEvent=e=>{
    const rect=svg.getBoundingClientRect();
    if(!rect.width)return;
    const relX=(e.clientX-rect.left)/rect.width*W;
    const ratio=Math.max(0,Math.min(1,(relX-PL)/Math.max(1,W-PL-PR)));
    const idx=Math.round(ratio*(pts.length-1));
    const p=pts[idx];if(!p)return;
    const cx=X(idx),cy=Y(p.elo);
    ch.style.display='';
    hz.setAttribute('y1',cy.toFixed(1));
    hz.setAttribute('y2',cy.toFixed(1));
    hz.setAttribute('x2',cx.toFixed(1));
    vt.setAttribute('x1',cx.toFixed(1));
    vt.setAttribute('x2',cx.toFixed(1));
    dot.setAttribute('cx',cx.toFixed(1));
    dot.setAttribute('cy',cy.toFixed(1));
    dot.setAttribute('fill',p.won?'#3fcf8e':'#ef5560');
    glow.setAttribute('cx',cx.toFixed(1));
    glow.setAttribute('cy',cy.toFixed(1));
    yb.setAttribute('transform',`translate(0,${cy.toFixed(1)})`);
    yt.textContent=p.elo;
    if(bar)bar.innerHTML=eloHoverSummary(p);
  };
  svg.addEventListener('mousemove',updateFromEvent);
  svg.addEventListener('mouseleave',()=>{
    ch.style.display='none';
    if(bar&&pts.length)bar.innerHTML=eloHoverSummary(pts[pts.length-1]);
  });
}
let profileTarget=null,prevView='play';
const fmtSince=d=>d.toLocaleDateString(LOC[lang],{month:'2-digit',year:'numeric'});
const fmtDate=d=>`${d.toLocaleDateString(LOC[lang],{day:'2-digit',month:'2-digit'})} ${d.toLocaleTimeString(LOC[lang],{hour:'2-digit',minute:'2-digit'})}`;
async function openProfile(name){
  if(!name)return;
  const isMe=(name===ME.name||(ME&&name.toLowerCase()===ME.name.toLowerCase()));
  if(isMe){
    profileTarget=null;histShown=5;setView('profile',true);
    return;
  }
  let p=REG.get(name);
  if(!p){
    p=makePlayer(name,1000,'high',0);
    p.matches=0;p.history=[];
    REG.set(name,p);
  }
  profileTarget=p;histShown=5;setView('profile',true);

  if(typeof fbReq==='function'){
    try{
      const myBox=typeof fbMailbox==='function'?fbMailbox(name):name.toLowerCase();
      const dir=await fbReq(`playerDirectory/${myBox}`);
      if(dir){
        if(typeof dir.elo==='number')p.elo=dir.elo;
        if(typeof dir.matches==='number')p.matches=dir.matches;
        putAv(p,dir.avatar);
        if(dir.color)p.color=dir.color;
        if(dir.cardStyle&&typeof validCardId==='function')p.cardStyle=validCardId(dir.cardStyle);
        if(dir.country)p.country=dir.country;
        if(dir.steam)p.steam=dir.steam;
      }
      const hist=await fbReq(`history/${myBox}`);
      if(hist&&typeof hist==='object'){
        const MN=n=>(MAPS.find(m=>'de_'+m.slug===n||m.slug===String(n).replace('de_',''))||{n:String(n).replace('de_','')}).n;
        p.history=Object.entries(hist).map(([id,x])=>({
          id,
          date:new Date(x.at||Date.now()),
          map:MN(x.map),
          won:!!x.won,
          score:x.score||'16-0',
          k:x.k||0,
          d:x.d||0,
          a:x.a||0,
          hs:x.hs||0,
          adr:x.adr||0,
          kast:x.kast||70,
          rating:x.rating||1.0,
          delta:x.delta||0,
          elo:x.elo||p.elo
        })).sort((a,b)=>b.date-a.date);
        p.matches=p.history.length;
      }else{
        p.history=[];
        if(typeof dir?.matches!=='number')p.matches=0;
      }
      if(profileTarget===p&&!$('#profile').hidden){
        renderProfile();
      }
    }catch(e){}
  }
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-profile]');if(!el||e.target.closest('button'))return;
  openProfile(el.dataset.profile);
});
function trustCard(P){
  const tr=tierOf(P),v=trust(P);
  return `<div class="card"><div class="h3">${t('trust')} <span>${t('matches_n',{n:P.matches})}</span></div>
    <div class="tf-big" style="--c:${tr.c}"><div class="tf-score">${v.toFixed(1)}<small>/10</small></div><span class="tf-tier">${tierName(tr)}</span></div>
    <div class="tf-scale">${[...TIERS].reverse().map(x=>`<i class="${x===tr?'on':''}" style="background:${x.c}"></i>`).join('')}</div>
    <div class="tf-legend"><span>0</span><span>4</span><span>6</span><span><b style="font-weight:400">8</b><b style="font-weight:400">10</b></span></div>
    <div class="tf-lines">
      <div>${t('tf_reports',{r:P.reports,m:P.matches})}</div>
      <div style="margin-top:4px">${t('tf_pool_text',{x:tierName(tr)})}</div>
    </div>
    <div class="h3" style="margin:16px 0 0;font-size:14px">${t('tf_by_reason')}</div>
    <div class="rep-list">${REASONS.map(r=>`<div><span>${t('r_'+r)}</span><b>${P.reasons[r]||0}</b></div>`).join('')}</div>
  </div>`;
}
function sanctionsCard(){
  const off=recentOff(),act=banned();
  const rows=SAN.list.slice(0,5).map((x,i)=>{const d=new Date(x.at),live=i===0&&act;
    return `<tr><td>${fmtDate(d)}</td><td style="text-align:left">${t('ban_r_'+x.reason)}</td><td>${durTxt(x.min)}</td><td><span class="st ${live?'on':'off'}">${live?t('status_active'):t('status_done')}</span></td></tr>`}).join('');
  return `<section class="card"><div class="h3">${t('sanctions')} <span>${t('offenses',{n:off})}</span></div>
    <div class="san-status">${act?`<span class="st on">${t('status_active')}</span> ${t('ban_r_'+SAN.reason)} · <b style="color:var(--text)">${clock(SAN.until-Date.now())}</b>`:`<span class="st off">${t('san_clean')}</span>`}</div>
    <div class="san-steps">${BAN_STEPS.map((m,i)=>`<span class="${i<off?'done':i===Math.min(off,BAN_STEPS.length-1)&&off<BAN_STEPS.length?'next':''}">${durTxt(m)}</span>`).join('')}</div>
    <div class="m-hint" style="margin:0 0 10px">${t('sanctions_rule')}</div>
    ${rows?`<div class="tbl-wrap"><table class="tbl" style="min-width:460px"><thead><tr><th>${t('th_date')}</th><th style="text-align:left">${t('th_reason')}</th><th>${t('th_duration')}</th><th>${t('th_status')}</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="m-hint">${t('sanctions_none')}</div>`}
  </section>`;
}
function relationHTML(P){
  const parts=[];
  if(P.friend)parts.push(`<span class="fr-st s-${P.status}" style="display:inline-flex"><i></i>${t('st_'+P.status)}</span>`);
  parts.push(`<span>${P.lastPlayed?t('played_with',{d:fmtDate(new Date(P.lastPlayed))}):t('never_played')}</span>`);
  return parts.join(' · ');
}
function profileActions(P){
  const inP=state.party.includes(P),st=repState(P),btns=[];
  if(P.friend){
    const ok=P.status==='online'&&!inP&&state.party.length<maxParty();
    btns.push(`<button class="btn primary sm" id="pInvite" ${ok?'':'disabled'}>${inP?t('in_party'):P.status!=='online'?t('not_available'):state.party.length>=maxParty()?t('party_full'):'+ '+t('invite_party')}</button>`);
    btns.push(`<button class="btn sm" id="pMsg">${t('dm_btn')}</button>`);
    btns.push(`<span class="pill" style="align-self:center">${ICON.ok.replace('<svg','<svg style="width:12px;height:12px;vertical-align:-2px"')} ${t('is_friend')}</span>`);
  }else{
    btns.push(`<button class="btn sm" id="pFriend" ${P.friendPending?'disabled':''}>${P.friendPending?t('friend_sent'):'+ '+t('add_friend')}</button>`);
  }
  btns.push(`<button class="btn ghost sm" id="pReport" ${st.ok?'':'disabled'} title="${st.ok?t('report'):st.why}">${ICON.flag} ${t('report')}</button>`);
  return `<div class="p-actions">${btns.join('')}</div>${!st.ok&&st.why?`<div class="m-hint" style="margin-top:6px">${st.why}</div>`:''}`;
}
function renderProfile(){
  setTimeout(decorateProfile,0);
  const el=$('#profile'),isMe=!profileTarget,P=ensureDetails(profileTarget||ME),st=ME.steam;
  const online=isMe||P.status!=='offline';
  // classement affiché : 5v5 ou Wingman (ELO, niveau, rang, stats et courbe séparés)
  const wm=eloMode==='wingman',E=wm?(P.eloWm??1000):P.elo,cal=!wm&&isMe&&isCalib(ME);
  const csId=typeof cardStyleOf==='function'?cardStyleOf(P):'default';
  const csObj=typeof cardObjOf==='function'?cardObjOf(csId):null;
  const csBadge=csId!=='default'&&csObj?`<span class="p-hero-card-badge" style="--tc:${csObj.tierCol}">${escA(csObj.name)} · <b>${escA(csObj.code)}</b></span>`:'';
  const bgId=typeof profileBgOf==='function'?profileBgOf(P):'default';
  const bgHtml=(bgId!=='default'&&typeof profileBgHTML==='function')?profileBgHTML(bgId):'';
  el.dataset.profileBg=bgId;
  const hero=`<section class="p-hero pcard-cs-${csId}">
    <div class="p-banner" style="background:${bannerCSS(P.banner)}">
      <div class="p-banner-badges">
        ${!isMe?`<button type="button" class="btn sm back" id="pBack">← ${t('back')}</button>`:''}
        ${csBadge}
      </div>
      <div class="p-banner-actions">
        <button type="button" class="btn sm ghost" data-go-shop="bgs">${t('shop_bgs')||'Fonds de profil'}</button>
        <button type="button" class="btn sm ghost" data-go-shop="cards">${t('shop_cards')||'Cartes de profil'}</button>
        ${isMe?`<button type="button" class="btn sm primary" id="editBtn">${ICON.edit} ${t('edit_profile')}</button>`:''}
      </div>
    </div>
    <div class="p-row">
      <div class="p-av ${typeof getAvatarFrame==='function'?getAvatarFrame(P):''}" style="${avStyle(P)}">${avInner(P)}<span class="on ${online?'':'off'}"></span></div>
      <div>
        <div class="p-name ${P.plan==='premium'?'gold':''}">${escA(P.name)} ${P.country==='FR'?'<span class="flag" title="France"></span>':''}<span class="cc">${escA(P.country)}</span>${planBadge(P)}</div>
        <div class="steam">${isMe
          ?(st.linked?`<span class="ok">${ICON.ok} ${t('steam_linked')}</span>${st.id?`<code>${escA(st.id)}</code>`:''}<button class="btn ghost sm" id="unlink">${t('unlink')}</button>`
                     :`<span>${t('no_steam')}</span><button class="btn sm steam-btn" id="link">${ICON.link} ${t('steam_login')}</button>`)
          :`<span class="ok">${ICON.ok} Steam</span><code>${escA(P.steamId||'')}</code>`}</div>
        <div class="p-since">${t('member_since',{d:fmtSince(P.since)})}${isMe?'':' · '+relationHTML(P)}</div>
        ${isMe?'':profileActions(P)}
      </div>
      <div class="p-lvl">
        <div class="p-mode">${t(wm?'pf_mode_wm':'pf_mode_5v5')} · <b>${cal?'Placement':rankOf(E).name}</b></div>
        <div class="top2">${lvlHTML(E,true,cal)}<div class="elo">${cal?`Placement <small>${ME.calib.played||0}/3</small>`:`${E} <small>ELO</small>`}</div><span style="margin-left:auto">${tfHTML(P)}</span></div>
        ${lvlBarHTML(E)}
      </div>
    </div>
  </section>`;
  if(isMe&&!st.linked){
    el.innerHTML=bgHtml+hero+`<div class="card locked">
      <b>${t('link_title')}</b>${t('link_text')}<br>
      <button class="btn steam-btn" id="link2">${ICON.link} ${t('steam_login')}</button>
    </div>`;
  }else{
    const h=filterEloHistory(P,eloRange),n=h.length||1,sum=f=>h.reduce((s,x)=>s+f(x),0);
    const wins=sum(x=>x.won?1:0),K=sum(x=>x.k),D=sum(x=>x.d);
    let best=0,cnt=0;[...h].reverse().forEach(x=>{cnt=x.won?cnt+1:0;best=Math.max(best,cnt)});
    const hm=(P.history||[]).filter(x=>(x.mode==='wingman')===wm);
    const peak=Math.max(E,wm?(P.peakEloWm||0):0,...hm.map(x=>x.elo||0));
    const eloTileVal=cal?`${ME.calib.played||0}/3`:E;
    const eloTileSub=cal?`Placement (${ME.calib.wins||0}V)`:t('peak',{n:peak});
    const T=[['ELO',eloTileVal,eloTileSub],[t('t_matches'),wm?(P.matchesWm??hm.length):(P.matches||0),t('total')],[t('t_winrate'),h.length?Math.round(wins/n*100)+'%':'—',h.length?t('wl',{w:wins,l:h.length-wins}):'0V - 0D'],
      ['K/D',h.length?kd(K,D):'—',h.length?t('kills',{n:K}):'0 kill'],['HS %',h.length?Math.round(sum(x=>x.hs)/n)+'%':'—',t('headshots')],['ADR',h.length?Math.round(sum(x=>x.adr)/n):'—',t('dmg_round')],
      [t('rating'),h.length?(sum(x=>x.rating)/n).toFixed(2):'—',t('average')],[t('t_streak'),best,t('max_wins')]];
    const maps={};h.forEach(x=>{const m=maps[x.map]||(maps[x.map]={n:0,w:0});m.n++;m.w+=x.won});
    let mrows=Object.entries(maps).sort((a,b)=>b[1].n-a[1].n).slice(0,8).map(([name,m])=>{const wr=Math.round(m.w/m.n*100);
      return `<div class="mrow"><div class="mn">${escA(name)}</div><div class="bar"><i style="width:${wr}%"></i></div><div class="r"><b>${wr}%</b></div><div class="r">${t('m_short',{n:m.n})}</div></div>`}).join('');
    if(!mrows) mrows=`<div style="text-align:center;padding:26px 12px;color:var(--muted);font-size:12.5px">${t('pf_no_maps')}</div>`;
    const total=(P.history&&P.history.length)||0,shown=Math.min(histShown,total);
    const histRows=(P.history||[]).slice(0,shown).map((x,i)=>`<tr data-md="${i}" title="${t('md_open')}"><td>${fmtDate(x.date)}</td>
      <td style="text-align:left"><span class="wl ${x.won?'w':'l'}">${x.won?t('w'):t('l')}</span></td><td style="text-align:left;font-weight:700">${escA(x.map)}</td><td class="${x.won?'pos':'neg'} rt">${escA(x.score)}</td>
      <td>${x.k} / ${x.d} / ${x.a}</td><td>${kd(x.k,x.d)}</td><td>${x.adr}</td><td>${x.hs}%</td><td class="rt ${rtClass(x.rating)}">${x.rating.toFixed(2)}</td>
      <td class="rt ${x.delta>0?'pos':x.delta<0?'neg':''}">${sign(x.delta)}</td><td>${x.elo}</td></tr>`).join('');
    const hist=histRows||`<tr><td colspan="11" style="text-align:center;padding:32px 16px;color:var(--muted);font-size:13px">${t('pf_no_hist')}</td></tr>`;
    const rangeTabs=[['7d',t('pf_week')],['30d',t('pf_month')],['20m','20M'],['all',t('pf_all')]]
      .map(([k,lbl])=>`<button type="button" class="${eloRange===k?'on':''}" data-elorange="${k}">${lbl}</button>`).join('');
    const formHtml=h.length
      ? h.slice(0,10).map(x=>`<span class="wl ${x.won?'w':'l'}">${x.won?t('w'):t('l')}</span>`).join('')
      : `<span style="font-size:12px;color:var(--muted);margin-left:6px">${t('pf_no_match')}</span>`;
    el.innerHTML=bgHtml+hero+`
      <div class="seg p-modes" id="eloModeTabs"><button type="button" class="${wm?'':'on'}" data-elomode="ranked">${t('pf_mode_5v5')} <small>${P.elo} ELO</small></button><button type="button" class="${wm?'on':''}" data-elomode="wingman">${t('pf_mode_wm')} <small>${P.eloWm??1000} ELO</small></button></div>
      <section class="tiles">${T.map(x=>`<div class="tile"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</section>
      <section class="p-grid">
        <div class="card chart">
          <div class="elo-head">
            <div class="h3">${t('elo_evo')} <span>${eloRangeLabel(eloRange,h.length)}</span></div>
                        <div class="elo-tabs" id="eloRangeTabs">${rangeTabs}</div>
          </div>
          ${eloChart(h)}
          <div class="form"><span class="form-l">${t('pf_form')}</span>${formHtml}</div>
          ${(()=>{
            if(!h.length) return `<div class="pf-kpis"><div><span>${t('pf_last10')}</span><b>0–0</b><small>0 match</small></div><div><span>${t('pf_delta')}</span><b>±0</b><small>ELO</small></div><div><span>${t('pf_best')}</span><b>–</b><small>Rating</small></div><div><span>${t('pf_strong')}</span><b>–</b><small>Map</small></div></div>`;
            const l10=h.slice(0,10),w10=l10.filter(x=>x.won).length,d=h.length?h[0].elo-(h[h.length-1].elo-h[h.length-1].delta):0;
            const bm=[...h].sort((a,b)=>b.rating-a.rating)[0];
            const strong=Object.entries(maps).filter(([,m])=>m.n>=2).sort((a,b)=>b[1].w/b[1].n-a[1].w/a[1].n||b[1].n-a[1].n)[0];
            const k=[[t('pf_last10'),`${w10}–${l10.length-w10}`,t('pf_wl')],[t('pf_delta'),`<span class="${d>=0?'pos':'neg'}">${sign(d)}</span>`,eloRangeLabel(eloRange,h.length)],
              [t('pf_best'),bm?bm.rating.toFixed(2):'–',bm?`${bm.map} · ${bm.k}/${bm.d}`:''],[t('pf_strong'),strong?strong[0]:'–',strong?Math.round(strong[1].w/strong[1].n*100)+' % · '+t('m_short',{n:strong[1].n}):'']];
            return `<div class="pf-kpis">${k.map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div>`})()}</div>
        <div class="card"><div class="h3">${t('map_stats')} <span>${t('winrate_s')}</span></div>${mrows}</div>
      </section>
      <section class="p-grid2 ${isMe?'':'solo'}">${trustCard(P)}${isMe?sanctionsCard():''}</section>
      ${isMe?csgoCfgCard():''}
      <section class="card hist-card"><div class="h3">${t('history')} <span>${t('showing',{a:shown,b:total})}</span></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('th_date')}</th><th style="text-align:left">${t('th_res')}</th><th style="text-align:left">${t('th_map')}</th><th>${t('th_score')}</th><th>K / D / A</th><th>K/D</th><th>ADR</th><th>HS %</th><th>${t('rating')}</th><th>±ELO</th><th>ELO</th></tr></thead><tbody>${hist}</tbody></table></div>
          <div class="more">${shown<total?`<button class="btn sm" id="histMore">${t('show_more')} (+${Math.min(5,total-shown)})</button>`:''}${shown>5?`<button class="btn ghost sm" id="histLess">${t('show_less')}</button>`:''}</div>
      </section>`;
  }
  const on=(id,f)=>{const b=$('#'+id);if(b)b.onclick=f};
  on('unlink',async()=>{const r=await doUnlinkSteam();if(r.error)return toast(errMsg(r.error));if(r.session)applySession(r.session);else{ME.steam.linked=false}toast(t('steam_unlinked'));renderProfile()});
  on('editBtn',openEditor);
  on('pBack',()=>{if(window.history.length>1)history.back();else setView(prevView==='profile'?'play':prevView);});
  on('pInvite',()=>{invite(P);renderProfile()});
  on('pMsg',()=>openDM(P.name));
  on('pFriend',async()=>{if(typeof sendFriendRequest==='function')await sendFriendRequest(P.name);else toast(t('friend_sent_toast',{n:P.name}));P.friendPending=true;renderProfile()});   // vraie demande (serveur)
  on('pReport',()=>openReport(P));
  on('histMore',()=>{histShown+=5;renderProfile()});
  on('histLess',()=>{histShown=5;renderProfile();$('#profile .hist-card').scrollIntoView({block:'nearest'})});
  bindEloChartHover();
  const rTabs=$('#eloRangeTabs');
  if(rTabs)rTabs.onclick=e=>{
    const b=e.target.closest('[data-elorange]');if(!b)return;
    eloRange=b.dataset.elorange;renderProfile();
  };
  const mTabs=$('#eloModeTabs');
  if(mTabs)mTabs.onclick=e=>{const b=e.target.closest('[data-elomode]');if(!b)return;eloMode=b.dataset.elomode;renderProfile()};
  if(isMe&&typeof bindCsgoCfgEvents==='function')bindCsgoCfgEvents();
  $$('#link,#link2').forEach(b=>b.onclick=()=>{
    b.innerHTML='<span class="spin inl"></span> '+t('steam_connecting');b.disabled=true;
    doSteam().then(r=>{if(!r||!r.ok)return renderProfile();applySession(AUTH.session);toast(t('steam_linked_toast'));beep(880,.08);beep(1175,.12,.1);renderProfile()});
  });
  const fDs=$('#fDirectSteam');
  if(fDs){
    fDs.onsubmit=async ev=>{
      ev.preventDefault();
      const inp=$('#inDirectSteam'),err=$('#directSteamErr'),btn=$('#btnDirectSteam');
      if(!inp||!inp.value.trim())return;
      btn.disabled=true;if(err)err.textContent='';
      const res=await doDirectSteamLink(inp.value.trim());
      btn.disabled=false;
      if(res&&res.ok){
        toast(t('steam_linked_toast'));
        beep(880,.08);beep(1175,.12,.1);
        renderProfile();
      }else{
        if(err)err.textContent=res&&res.error==='steam_taken'?'Ce compte Steam est déjà affilié à un autre compte.':res&&res.error==='invalid_steam_id'?'SteamID invalide (17 chiffres requis).':'Erreur lors de la liaison.';
      }
    };
  }
  if(typeof bindProfileBgInteractive==='function')bindProfileBgInteractive(el,bgId);
}

