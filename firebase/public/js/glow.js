(function(){
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const root=document.documentElement,REACH=110;
  const CARDS='.card,.st-card,.mode,.btn,.theme-swatch,#trMusic.float .trm-c';
  let raf=0,x=0,y=0,target=null,lit=null;
  const calm=()=>root.classList.contains('rm')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bars=()=>document.querySelectorAll('.top,.rail,#trMusic');

  function paint(){
    raf=0;
    if(calm())return;
    for(const b of bars()){
      const r=b.getBoundingClientRect();
      const near=r.width>0&&x>r.left-REACH&&x<r.right+REACH&&y>r.top-REACH&&y<r.bottom+REACH;
      b.classList.toggle('tg-on',near);
      if(near){b.style.setProperty('--gx',x+'px');b.style.setProperty('--gy',y+'px')}
    }
    const card=target&&target.closest?target.closest(CARDS):null;
    if(card!==lit){if(lit)lit.classList.remove('tg-card');lit=card;if(lit)lit.classList.add('tg-card')}
    if(lit){const r=lit.getBoundingClientRect();lit.style.setProperty('--lx',(x-r.left)+'px');lit.style.setProperty('--ly',(y-r.top)+'px')}
  }
  addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;
    x=e.clientX;y=e.clientY;target=e.target;
    if(!raf)raf=requestAnimationFrame(paint);
  },{passive:true});
  document.addEventListener('pointerleave',()=>{
    for(const b of bars())b.classList.remove('tg-on');
    if(lit){lit.classList.remove('tg-card');lit=null}
  });
})();
