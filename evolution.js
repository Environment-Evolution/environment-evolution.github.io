(() => {
  const canvas = document.querySelector('.evolution-art');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const hero = canvas.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, elapsed = 0, previous = 0, frame = 0;
  let visible = true;
  const stages = [
    { x: -330, z: 120, size: 230, cells: 8 },
    { x: 0, z: 0, size: 240, cells: 12 },
    { x: 330, z: -120, size: 250, cells: 16 },
  ];

  // Successive terrain patches represent increasingly complex environments.
  // This is a decorative illustration of evolution, not experimental data.
  function elevation(x, z, generation, time) {
    const drift = Math.sin(time * 0.12) * 0.12;
    const hill = (cx, cz, spread) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / spread);
    const base = hill(-0.2 + drift, 0.1, 0.3) * 28;
    const structure = generation * (hill(0.3, -0.22, 0.15) * 48 + hill(-0.45, -0.38, 0.12) * 24);
    const detail = generation ** 1.5 * Math.sin(x * 8 + time * 0.08) * Math.cos(z * 7) * 7;
    return Math.max(0, base + structure + detail);
  }

  function project(x, y, z, time) {
    const scale = Math.min(width / 1170, height / 610, 1.38);
    const angle = -0.13 + Math.sin(time * 0.07) * 0.045;
    const rx = x * Math.cos(angle) - z * Math.sin(angle);
    const rz = x * Math.sin(angle) + z * Math.cos(angle);
    return { x: width / 2 + rx * scale, y: height * (width < 600 ? 0.86 : 0.58) + (rz * 0.66 - y) * scale };
  }

  function vertex(stage, u, v, index, time) {
    return project(stage.x + u * stage.size, elevation(u, v, index, time), stage.z + v * stage.size, time);
  }

  function line(points, color, strokeWidth = 0.7) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  function draw(time) {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    // A faint floor grid gives each environment its own bounded sandbox.
    stages.forEach((stage, index) => {
      const n = stage.cells;
      const gridColor = `rgba(85, 112, 153, ${0.18 + index * 0.025})`;
      for (let i = 0; i <= n; i++) {
        const a = i / n - 0.5;
        const row = [], column = [];
        for (let j = 0; j <= n; j++) {
          const b = j / n - 0.5;
          row.push(vertex(stage, a, b, index, time));
          column.push(vertex(stage, b, a, index, time));
        }
        line(row, gridColor);
        line(column, gridColor);
      }
      const corners = [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5],[-.5,-.5]];
      line(corners.map(([u,v]) => project(stage.x + u * stage.size, -18, stage.z + v * stage.size, time)), 'rgba(85,112,153,0.12)');
      corners.slice(0, 4).forEach(([u,v]) => line([
        vertex(stage,u,v,index,time),
        project(stage.x+u*stage.size,-18,stage.z+v*stage.size,time),
      ], 'rgba(85,112,153,0.13)'));

      // Each generation has a different route through its environment.
      const route = [];
      for (let j = 0; j <= 48; j++) {
        const u = j / 48 - .5;
        const v = Math.sin(u * (5 + index * 3) + index) * (0.09 + index * 0.035);
        route.push(vertex(stage, u, v, index, time));
      }
      line(route, 'rgba(62,108,193,0.32)', 1.25);
      const dot = route[Math.floor((time * 3 + index * 13) % route.length)];
      ctx.beginPath();ctx.arc(dot.x,dot.y,2.2,0,Math.PI*2);
      ctx.fillStyle='rgba(62,108,193,0.52)';ctx.fill();

      const label = project(stage.x-stage.size*.5,-18,stage.z+stage.size*.64,time);
      ctx.font='10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillStyle='rgba(85,105,138,0.5)';
      ctx.fillText(`G${index}`,label.x,label.y);
    });

    // Connect accepted environments into a single evolution lineage.
    for (let i=0;i<stages.length-1;i++) {
      const start=vertex(stages[i],.53,0,i,time);
      const end=vertex(stages[i+1],-.53,0,i+1,time);
      ctx.setLineDash([3,5]);
      line([start,end],'rgba(75,108,165,0.26)');
      ctx.setLineDash([]);
      const angle=Math.atan2(end.y-start.y,end.x-start.x);
      line([{x:end.x-6*Math.cos(angle-.45),y:end.y-6*Math.sin(angle-.45)},end,{x:end.x-6*Math.cos(angle+.45),y:end.y-6*Math.sin(angle+.45)}],'rgba(75,108,165,0.3)');
    }
  }

  function tick(now) {
    frame=requestAnimationFrame(tick);
    if(now-previous<1000/30)return;
    if(previous)elapsed+=Math.min(now-previous,100)/1000;
    previous=now;draw(elapsed);
  }
  function updateMotion() {
    cancelAnimationFrame(frame);previous=0;draw(elapsed);
    if(!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(tick);
  }
  new ResizeObserver(()=>{
    width=hero.clientWidth;height=hero.clientHeight;
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);updateMotion();
  }).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;updateMotion();}).observe(hero);
  motion.addEventListener('change',updateMotion);
  document.addEventListener('visibilitychange',updateMotion);
})();
