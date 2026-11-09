(function(){
  const cv=document.createElement('canvas');
  cv.id='trAmbient';cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;left:0;right:0;bottom:0;width:100%;height:44vh;z-index:-1;pointer-events:none';
  document.body.appendChild(cv);
  const g=cv.getContext('2d'),root=document.documentElement;
  const auth=document.getElementById('auth');
  let last=0,time=0,energy=.1,color='255,255,255',colorAt=0,cleared=false;
  const calm=()=>root.classList.contains('rm')||matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||now-last<42)return;
    if(calm()||(auth&&!auth.hidden)){
      if(!cleared){g.clearRect(0,0,cv.width,cv.height);cleared=true}
      return;
    }
    cleared=false;
    const dt=Math.min(120,now-last);last=now;
    const W=cv.clientWidth,H=cv.clientHeight;
    if(!W||!H)return;
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
    if(now-colorAt>2000){colorAt=now;color=(getComputedStyle(root).getPropertyValue('--acc-rgb').trim()||color).replace(/\s/g,'')}
    const m=window.TRMusic&&TRMusic.pulse?TRMusic.pulse():0;
    energy+=(Math.max(.1,m)-energy)*Math.min(1,dt/700);
    time+=dt*(.00011+energy*.00022);
    g.clearRect(0,0,W,H);
    for(const [freq,phase,alpha,size] of [[.7,0,.075,1],[1.15,1.9,.055,.74],[1.8,3.7,.04,.52]]){
      const amp=(H*.07+energy*H*.13)*size,mid=H*(.5+.12*(1-size));
      const y=x=>mid+Math.sin(x/W*Math.PI*2*freq+time*freq*4+phase)*amp+Math.sin(x/W*Math.PI*2*freq*2.1-time*3+phase)*amp*.3;
      g.beginPath();g.moveTo(0,H);
      for(let x=0;x<=W+16;x+=16)g.lineTo(x,y(x));
      g.lineTo(W,H);g.closePath();
      const fill=g.createLinearGradient(0,mid-amp,0,H);
      fill.addColorStop(0,'rgba('+color+','+alpha.toFixed(3)+')');
      fill.addColorStop(1,'rgba('+color+',0)');
      g.fillStyle=fill;g.fill();
    }
  }
  requestAnimationFrame(frame);
})();
