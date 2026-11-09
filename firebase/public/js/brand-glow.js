(function(){
  for(const zone of document.querySelectorAll('.top .brand, .logo-row, .auth-brand')){
    const parts=[...zone.querySelectorAll('.brand-word, .brand-logo, .logo')];
    let raf=0,ev=null;
    const paint=()=>{raf=0;for(const p of parts){const r=p.getBoundingClientRect();
      p.style.setProperty('--mx',(ev.clientX-r.left)+'px');p.style.setProperty('--my',(ev.clientY-r.top)+'px')}};
    zone.addEventListener('pointermove',e=>{ev=e;if(!raf)raf=requestAnimationFrame(paint)});
    zone.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0});
  }
  for(const el of document.querySelectorAll('#goPrem')){
    let raf=0,ev=null;
    const paint=()=>{raf=0;const r=el.getBoundingClientRect();
      el.style.setProperty('--mx',(ev.clientX-r.left)+'px');el.style.setProperty('--my',(ev.clientY-r.top)+'px')};
    el.addEventListener('pointermove',e=>{ev=e;if(!raf)raf=requestAnimationFrame(paint)});
    el.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0});
  }
})();
