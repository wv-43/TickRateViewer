(function(){
  const cv=document.getElementById('authCubes');if(!cv||!cv.getContext)return;
  const ctx=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SIZE=30,GAP=4,STEP=SIZE+GAP,FADE=.62;
  let W=0,H=0,R=0,cols=0,rows=0,tiles=[],last=0,raf=0;

  function layout(){
    const dpr=Math.min(2,devicePixelRatio||1),r=cv.getBoundingClientRect();
    W=r.width;H=r.height;if(!W||!H)return false;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    R=Math.hypot(W,H)*FADE;cols=Math.ceil(Math.min(W,R)/STEP)+1;rows=Math.ceil(Math.min(H,R)/STEP)+1;
    tiles=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)tiles.push({x,y,b:.35+Math.random()*.65,p:Math.random()*Math.PI*2,s:.4+Math.random()*1.1});
    return true;
  }
  function draw(t){
    ctx.clearRect(0,0,W,H);
    for(const c of tiles){
      const px=c.x*STEP-GAP/2,py=c.y*STEP,f=Math.max(0,1-Math.hypot(px+SIZE/2,py+SIZE/2)/R);if(!f)continue;
      const tw=still?1:.75+.25*Math.sin(t/1000*c.s+c.p);
      const a=Math.pow(f,1.7)*c.b*tw*.2;if(a<.004)continue;
      ctx.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`;ctx.fillRect(px,py,SIZE,SIZE);
      ctx.fillStyle=`rgba(255,255,255,${(a*1.6).toFixed(3)})`;ctx.fillRect(px,py,SIZE,1);
    }
  }
  const visible=()=>{const a=document.getElementById('auth');return a&&!a.hidden&&cv.offsetParent!==null};
  function loop(t){
    raf=0;if(!visible())return;
    if(t-last>33){last=t;draw(t)}
    if(!still)raf=requestAnimationFrame(loop);
  }
  function start(){if(raf||!visible())return;if(!W&&!layout())return;raf=requestAnimationFrame(loop)}
  addEventListener('resize',()=>{if(visible()&&layout()){draw(performance.now());start()}});
  const auth=document.getElementById('auth');
  if(auth)new MutationObserver(()=>{if(visible()){layout();start()}}).observe(auth,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start()});
  if(visible()){layout();start()}
})();
