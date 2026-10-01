(() => {
  const canvas = document.querySelector('.skill-graph-art');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const hero = canvas.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, frame = 0, previous = 0, elapsed = 0, visible = true;
  // Scenario nodes and directed skill transitions, with sampled workflow paths.
  // The decorative graph illustrates the method; it is not the research dataset.
  const nodes = [];
  for (let column = 0; column < 8; column++) {
    for (let row = 0; row < 5; row++) {
      nodes.push({ x: (column - 3.5) * 145 + Math.sin(column * 11 + row * 3) * 28,
        y: (row - 2) * 89 + Math.cos(column * 4 + row * 7) * 23,
        phase: column * 2 + row * 1.7 });
    }
  }
  const paths = [[3,8,12,16,22,28,33,37],[1,5,11,17,21,26,32,36],[4,9,13,18,24,29,34,39]];
  const edges = [];
  for (let col=0;col<7;col++) for(let row=0;row<5;row++) {
    edges.push([col*5+row,(col+1)*5+row]);
    if(row<4)edges.push([col*5+row,(col+1)*5+row+1]);
    if(row>0&&col%2===0)edges.push([col*5+row,(col+1)*5+row-1]);
  }
  paths.forEach(path=>path.slice(1).forEach((to,i)=>{
    const from=path[i];if(!edges.some(([a,b])=>a===from&&b===to))edges.push([from,to]);
  }));

  function positions(time) {
    const scale=Math.min(width/1270,height/570,1.38);
    return nodes.map(n=>({x:width/2+(n.x+Math.sin(time*.12+n.phase)*8)*scale,
      y:height*(width<600?.91:.53)+(n.y+Math.cos(time*.1+n.phase)*8)*scale}));
  }
  function edge(a,b,color,lineWidth=0.65,arrow=false) {
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.lineWidth=lineWidth;ctx.strokeStyle=color;ctx.stroke();
    if(arrow){
      const angle=Math.atan2(b.y-a.y,b.x-a.x),x=a.x+(b.x-a.x)*.64,y=a.y+(b.y-a.y)*.64;
      ctx.beginPath();ctx.moveTo(x-4*Math.cos(angle-.5),y-4*Math.sin(angle-.5));ctx.lineTo(x,y);ctx.lineTo(x-4*Math.cos(angle+.5),y-4*Math.sin(angle+.5));ctx.stroke();
    }
  }
  function draw(time) {
    if(!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const points=positions(time);
    edges.forEach(([a,b])=>edge(points[a],points[b],'rgba(94,116,155,0.16)'));
    const routeIndex=Math.floor(time/12)%paths.length, route=paths[routeIndex];
    const progress=(time%12)/12*(route.length-1);
    for(let i=0;i<route.length-1;i++) {
      const alpha=i<=progress?.38:.13;
      edge(points[route[i]],points[route[i+1]],`rgba(58,104,190,${alpha})`,1.1,true);
    }
    points.forEach((p,i)=>{
      const active=route.includes(i);
      ctx.beginPath();ctx.arc(p.x,p.y,active?3.5:2.5,0,Math.PI*2);
      ctx.fillStyle=active?'rgba(101,138,207,0.32)':'rgba(247,247,249,0.95)';ctx.fill();
      ctx.lineWidth=.8;ctx.strokeStyle=active?'rgba(70,113,192,0.48)':'rgba(100,120,155,0.27)';ctx.stroke();
    });
    const segment=Math.min(Math.floor(progress),route.length-2),fraction=progress-segment;
    const a=points[route[segment]],b=points[route[segment+1]];
    ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*fraction,a.y+(b.y-a.y)*fraction,2.7,0,Math.PI*2);
    ctx.fillStyle='rgba(52,95,200,0.65)';ctx.fill();
  }
  function tick(now){frame=requestAnimationFrame(tick);if(now-previous<1000/30)return;if(previous)elapsed+=Math.min(now-previous,100)/1000;previous=now;draw(elapsed);}
  function update(){cancelAnimationFrame(frame);previous=0;draw(elapsed);if(!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(tick);}
  new ResizeObserver(()=>{width=hero.clientWidth;height=hero.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);update();}).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();}).observe(hero);
  motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);
})();
