// indexAnimation.js — LifeLine intro (ES Module)

export const indexAnimationCSS = `
  .lf-stage{ position:absolute; inset:0; pointer-events:none; }
  .lf-item{ position:absolute; transform:translate(-50%,-50%); will-change:left, top, transform, opacity; }
  .lf-word{
    color:#e6eef6; background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.12); border-radius:12px;
    padding:10px 16px; font-weight:900; font-size:40px; min-width:140px; text-align:center;
    box-shadow:0 14px 36px rgba(0,0,0,0.45);
  }
  .lf-dot{
    width:14px; height:14px; background:#fff; border-radius:50%;
    box-shadow:0 0 12px rgba(255,255,255,0.6), 0 6px 22px rgba(0,0,0,0.4);
  }

  .lf-info{
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(.98);
    opacity:0; pointer-events:none; transition:opacity .25s ease, transform .35s cubic-bezier(.22,1,.2,1);
    width:min(70ch, 82%); max-width:760px; z-index:20;
  }
  .lf-info-show{ opacity:1; pointer-events:auto; transform:translate(-50%,-50%) scale(1); }
  .lf-info .lf-info-body{
    background:linear-gradient(180deg, rgba(0,0,0,0.42), rgba(255,255,255,0.06));
    border:1px solid rgba(255,255,255,0.12); border-radius:18px;
    padding:24px; color:#e6eef6; backdrop-filter: blur(6px);
    text-align:center; box-shadow:0 18px 48px rgba(0,0,0,0.55);
  }
  .lf-info .lf-info-title{ font-size:28px; font-weight:900; margin:0 0 8px 0; }
  .lf-info .lf-info-text{ font-size:16px; color:#cfe; line-height:1.45; margin:0; }

  .lf-nav{
    position:absolute; bottom:22px; width:56px; height:56px; border-radius:50%;
    border:1px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.06);
    color:#e6eef6; font-size:20px; font-weight:900; cursor:pointer; user-select:none; z-index:30;
    display:flex; align-items:center; justify-content:center;
    transition:transform .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .lf-nav:hover{ transform:translateY(-2px); background:rgba(255,255,255,0.1); box-shadow:0 10px 24px rgba(0,0,0,.35) }
  .lf-prev{ left:22px } .lf-next{ right:22px }

  /* Spacebar hint (top right) */
  .lf-space{
    position:absolute; top:16px; right:20px; z-index:40; display:flex; align-items:center; gap:10px;
    padding:10px 18px; height:44px; border-radius:10px; border:1px solid rgba(255,255,255,.16);
    background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.02));
    box-shadow:0 8px 28px rgba(0,0,0,.4); font-weight:800; letter-spacing:.2px; color:#e6eef6;
    cursor:pointer; user-select:none;
  }
  .lf-space .key{
    min-width:120px; height:28px; border-radius:8px; border:1px solid rgba(255,255,255,.25);
    background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
    box-shadow: inset 0 -2px 0 rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.06);
    position:relative;
  }
  @keyframes lfFlicker { 0%, 100% { opacity:1 } 50% { opacity:.32 } }
  @keyframes lfClick { 0% { transform:translateY(0) } 50% { transform:translateY(2px) } 100% { transform:translateY(0) } }
  .lf-space.flicker{ animation: lfFlicker 1.2s infinite }
  .lf-space .key.click{ animation: lfClick 1s ease infinite }

  /* Final CTA */
  .lf-final{
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(.92);
    padding:18px 26px; border-radius:14px; border:1px solid rgba(255,255,255,.22);
    background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.02)); z-index:50;
    box-shadow:0 12px 40px rgba(0,0,0,.6); font-weight:900; font-size:34px; letter-spacing:.4px; color:#e8fff6;
    opacity:0; transition:transform .6s cubic-bezier(.22,1,.2,1), opacity .5s ease; cursor:pointer; text-align:center;
  }
  .lf-final.show{ opacity:1; transform:translate(-50%,-50%) scale(1); }
`;

export class IndexAnimation {
  /**
   * @param {Object}   opts
   * @param {HTMLElement} opts.mount
   * @param {{label:string, desc:string}[]} opts.items
   * @param {Function=} opts.onFinish
   */
  constructor(opts){
    this.root = opts.mount;
    this.itemsData = opts.items;
    this.onFinish = opts.onFinish || (()=>{});

    // Geometry
    this.center = {x:0,y:0};
    this.radius = 0;
    this.pushRatio = 1.18;
    this.rotation = 0;
    this.activeIndex = 0;
    this.state = 'init';
    this.locked = false;
    this.cycled = 0; // how many messages shown

    // Timings (ms)
    this.t_wordsToDots = 540;
    this.t_toCircle    = 900;
    this.t_rotate      = 1600;  // rotate 2x spins per nav
    this.t_pushOut     = 300;
    this.t_pushBack    = 280;

    // Stage
    this.stage = document.createElement('div');
    this.stage.className = 'lf-stage';
    this.root.appendChild(this.stage);

    // Info
    this.info = document.createElement('div');
    this.info.className = 'lf-info';
    this.info.innerHTML = `
      <div class="lf-info-body">
        <div class="lf-info-title"></div>
        <div class="lf-info-text"></div>
      </div>`;
    this.root.appendChild(this.info);

    // Spacebar hint
    this.space = document.createElement('button');
    this.space.className = 'lf-space flicker';
    this.space.innerHTML = `<span>Click Space</span><span class="key click" aria-hidden="true"></span>`;
    this.root.appendChild(this.space);

    // Final CTA
    this.final = document.createElement('div');
    this.final.className = 'lf-final';
    this.final.textContent = 'Start Your Journey';
    this.root.appendChild(this.final);

    // Nav buttons
    this.prevBtn = document.createElement('button');
    this.prevBtn.className = 'lf-nav lf-prev';
    this.prevBtn.setAttribute('aria-label','Previous');
    this.prevBtn.innerHTML = '&#8592;';

    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'lf-nav lf-next';
    this.nextBtn.setAttribute('aria-label','Next');
    this.nextBtn.innerHTML = '&#8594;';

    this.root.appendChild(this.prevBtn);
    this.root.appendChild(this.nextBtn);

    // Items as words initially
    this.items = this.itemsData.map((d,i)=>{
      const el = document.createElement('div');
      el.className = 'lf-item lf-word';
      el.textContent = d.label;
      this.stage.appendChild(el);
      return { el, ...d };
    });

    // Specific initial layout (your request)
    // 0: Prizes (left middle), 1: Entertainment (top center, longer), 2: Drama (right middle),
    // 3: Competition (bottom-left more centered), 4: Teamwork (bottom-right more centered)
    this.initialLayouts = [
      {xRatio:0.12, yRatio:0.50}, // Prizes
      {xRatio:0.50, yRatio:0.14}, // Entertainment
      {xRatio:0.88, yRatio:0.50}, // Drama
      {xRatio:0.35, yRatio:0.86}, // Competition
      {xRatio:0.65, yRatio:0.86}, // Teamwork
    ];

    // Bindings
    this.handleResize = this.handleResize.bind(this);
    this.onKey = this.onKey.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.start = this.start.bind(this);
    this.finish = this.finish.bind(this);

    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.onKey);
    this.prevBtn.addEventListener('click', this.prev);
    this.nextBtn.addEventListener('click', this.next);
    this.space.addEventListener('click', this.next);
    this.final.addEventListener('click', this.finish);

    this.handleResize();
    this.placeWords();
  }

  // Public
  start(){
    if(this.locked) return;
    this.locked = true;
    this.wordsToDots()
      .then(()=> this.toCircle())
      .then(()=> this.showMessageAt(0))
      .finally(()=>{ this.locked=false; });
  }

  // Layout helpers
  handleResize(){
    const r = this.root.getBoundingClientRect();
    this.center = { x: r.left + r.width/2, y: r.top + r.height/2 };
    const size = Math.min(r.width, r.height);
    this.radius = size * 0.32;
    if(this.state === 'circle' || this.state === 'message'){
      this.renderCircle(this.rotation, 1);
    } else if(this.state === 'words' || this.state === 'init'){
      this.placeWords();
    }
  }
  placeWords(){
    this.state = 'words';
    const vw = this.root.clientWidth, vh = this.root.clientHeight;
    this.items.forEach((it,i)=>{
      const L = this.initialLayouts[i];
      const x = L.xRatio * vw, y = L.yRatio * vh;
      this.place(it.el, x, y);
      it.el.classList.remove('lf-dot'); it.el.classList.add('lf-word');
      it.el.style.minWidth = i===1 ? '220px' : '140px';
      it.el.style.fontSize = '40px';
      it.el.style.opacity = '1';
    });
  }
  place(el, x, y){
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    el.style.transform = 'translate(-50%,-50%)';
  }

  // Animations
  wordsToDots(){
    this.state = 'dots';
    return this.animate(this.t_wordsToDots, t=>{
      this.items.forEach(it=>{
        const s = 1 - t;
        it.el.style.transform = `translate(-50%,-50%) scale(${Math.max(0.2, s)})`;
        it.el.style.opacity = String(1 - t * 0.85);
      });
    }).then(()=>{
      this.items.forEach(it=>{
        it.el.classList.remove('lf-word');
        it.el.classList.add('lf-dot');
        it.el.textContent = '';
        it.el.style.width='14px'; it.el.style.height='14px';
        it.el.style.opacity = '1';
        it.el.style.transform = 'translate(-50%,-50%)';
      });
    });
  }

  toCircle(){
    this.state = 'circle';
    const starts = this.items.map(it=>{
      const r = it.el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    });
    return this.animate(this.t_toCircle, t=>{
      const e = this.easeOutCubic(t);
      const step = 360/this.items.length;
      this.items.forEach((it,i)=>{
        const ang = (i * step + this.rotation) * Math.PI/180;
        const tx = this.center.x + this.radius * Math.cos(ang);
        const ty = this.center.y + this.radius * Math.sin(ang);
        const sx = starts[i].x, sy = starts[i].y;
        this.place(it.el, sx + (tx - sx)*e, sy + (ty - sy)*e);
      });
    });
  }

  rotateToIndex(targetIndex, rounds=2, dir=1){
    const step = 360/this.items.length;
    const targetAngle = -90 - (targetIndex * step); // top
    const deltaToTarget = targetAngle - this.rotation;
    const fullSpins = 360 * rounds * dir;
    const startRot = this.rotation, endRot = startRot + fullSpins + deltaToTarget;

    return this.animate(this.t_rotate, t=>{
      const e = this.easeInOutQuad(t);
      const rot = startRot + (endRot - startRot) * e;
      this.renderCircle(rot, 1);
    }).then(()=>{ this.rotation = endRot; });
  }

  pushOut(){
    return this.animate(this.t_pushOut, t=>{
      const k = 1 + (this.pushRatio - 1) * this.easeOutCubic(t);
      this.renderCircle(this.rotation, k);
      if(t>0.6) this.info.classList.add('lf-info-show');
    });
  }
  pushBack(){
    return this.animate(this.t_pushBack, t=>{
      const k = this.pushRatio - (this.pushRatio - 1) * this.easeOutCubic(t);
      this.renderCircle(this.rotation, k);
      if(t>0.4) this.info.classList.remove('lf-info-show');
    });
  }

  showMessageAt(index){
    this.activeIndex = index;
    return this.rotateToIndex(index, 2, 1)
      .then(()=> this.pushOut())
      .then(()=>{
        const d = this.itemsData[index];
        this.info.querySelector('.lf-info-title').textContent = d.label;
        this.info.querySelector('.lf-info-text').textContent  = d.desc;
        this.state = 'message';
        this.cycled += 1;
        if(this.cycled === this.items.length){
          // After showing last item once, next "next()" will show final CTA
          this.cycled = 0; // reset for future loops if needed
        }
      });
  }
  hideMessage(){
    this.info.classList.remove('lf-info-show');
    this.state = 'circle';
    return Promise.resolve();
  }

  // Navigation
  prev(){
    if(this.locked || this.state==='init') return;
    this.locked = true;
    const nextIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
    this.pushBack()
      .then(()=> this.hideMessage())
      .then(()=> this.rotateToIndex(nextIndex, 2, -1))
      .then(()=> this.pushOut())
      .then(()=>{
        const d = this.itemsData[nextIndex];
        this.info.querySelector('.lf-info-title').textContent = d.label;
        this.info.querySelector('.lf-info-text').textContent  = d.desc;
        this.activeIndex = nextIndex;
      })
      .finally(()=> this.locked = false);
  }

  next(){
    if(this.locked) return;
    // If final CTA visible, finish
    if(this.final.classList.contains('show')) { this.finish(); return; }

    // If we've shown all items and user goes next again: show final CTA
    if(this.state==='message' && this.activeIndex === this.items.length - 1){
      this.locked = true;
      this.pushBack()
        .then(()=> this.hideMessage())
        .then(()=> this.spinOutAllThenFinal())
        .finally(()=> this.locked=false);
      return;
    }

    if(this.state==='init'){
      this.start();
      return;
    }

    if(this.state==='message'){
      this.locked = true;
      const nextIndex = (this.activeIndex + 1) % this.items.length;
      this.pushBack()
        .then(()=> this.hideMessage())
        .then(()=> this.rotateToIndex(nextIndex, 2, 1))
        .then(()=> this.pushOut())
        .then(()=>{
          const d = this.itemsData[nextIndex];
          this.info.querySelector('.lf-info-title').textContent = d.label;
          this.info.querySelector('.lf-info-text').textContent  = d.desc;
          this.activeIndex = nextIndex;
        })
        .finally(()=> this.locked=false);
    }
  }

  // Final step: spin, fade dots, then show "Start Your Journey"
  spinOutAllThenFinal(){
    const startRot = this.rotation, endRot = startRot + 1080; // 3 spins just for flair
    return this.animate(1400, t=>{
      const e = this.easeOutCubic(t);
      const rot = startRot + (endRot - startRot) * e;
      const k = 1 + 0.25 * e; // slight radial grow
      this.renderCircle(rot, k);
      // fade dots slightly
      this.items.forEach(it=> it.el.style.opacity = String(1 - 0.9*e));
    }).then(()=>{
      this.items.forEach(it=> it.el.style.display='none');
      this.final.classList.add('show');
      this.space.classList.remove('flicker'); // stop hint once at final
    });
  }

  finish(){
    this.onFinish?.();
  }

  // Render positions around a circle
  renderCircle(rotDeg, scaleR=1){
    const step = 360/this.items.length;
    const r = this.radius * scaleR;
    this.items.forEach((it,i)=>{
      const ang = (i * step + rotDeg) * Math.PI/180;
      const x = this.center.x + r * Math.cos(ang);
      const y = this.center.y + r * Math.sin(ang);
      this.place(it.el, x, y);
    });
  }

  // Input
  onKey(e){
    if(e.code==='ArrowLeft'){ e.preventDefault(); this.prev(); }
    if(e.code==='ArrowRight' || e.code==='Space'){ e.preventDefault(); this.next(); }
    if(e.code==='Enter' && this.final.classList.contains('show')){ e.preventDefault(); this.finish(); }
  }

  // Utils
  animate(dur, fn){
    return new Promise(res=>{
      const t0 = performance.now();
      const tick = now=>{
        const p = Math.min(1, (now - t0) / dur);
        fn(p);
        if(p < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  }
  easeOutCubic(t){ return 1 - Math.pow(1-t,3); }
  easeInOutQuad(t){ return t<.5 ? 2*t*t : -1 + (4 - 2*t)*t; }
}
