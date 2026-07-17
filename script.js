(() => {
  "use strict";

  const canvas = document.getElementById("garden");
  const ctx = canvas.getContext("2d", { alpha: false });
  const intro = document.getElementById("intro");
  const enterButton = document.getElementById("enterButton");
  const hud = document.getElementById("hud");
  const hint = document.getElementById("hint");
  const resetButton = document.getElementById("resetButton");
  const selectedCountEl = document.getElementById("selectedCount");
  const targetCountEl = document.getElementById("targetCount");
  const messagePanel = document.getElementById("messagePanel");
  const closeMessage = document.getElementById("closeMessage");
  const messageEyebrow = messagePanel.querySelector(".eyebrow");
  const messageTitle = messagePanel.querySelector("h2");
  const messageText = messagePanel.querySelector("p:not(.eyebrow)");

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    started: false,
    width: innerWidth,
    height: innerHeight,
    dpr: Math.min(devicePixelRatio || 1, 2),
    time: 0,
    lastTime: performance.now(),
    selected: [],
    target: 7,
    completed: false,
    bouquetProgress: 0,
    bouquetHitAreas: [],
    lastTap: 0
  };

  targetCountEl.textContent = String(state.target);

  const messages = [
    ["Tu ternura", "Hay algo en ti que vuelve más suaves incluso los días difíciles."],
    ["Tu manera de amar", "Amas con una fuerza delicada, como una flor que permanece incluso cuando sopla el viento."],
    ["Tu refugio", "Tu presencia se siente como un lugar tranquilo al que siempre quisiera volver."],
    ["Tu luz", "Incluso cuando tienes miedo, sigues iluminando a quienes amas."],
    ["Tu dulzura", "Tienes esa calidez que recuerda a los aromas dulces y a las tardes suaves."],
    ["Tu mundo interior", "Dentro de ti existe un jardín profundo, silencioso y hermoso."],
    ["Lo que significas", "Entre tantas flores, te elegiría a ti una y otra vez."]
  ];

  const flowers = [];
  const grass = [];
  const motes = [];
  const fireflies = [];
  const sparkles = [];
  const pollen = [];
  const stones = [];
  const soilDetails = [];

  const rand = (min, max) => min + Math.random() * (max - min);
  const seeded = seed => {
    const x = Math.sin(seed * 999.91) * 43758.5453;
    return x - Math.floor(x);
  };

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    buildField();
  }

  function buildField() {
    flowers.length = 0;
    const rows = state.width < 600 ? 8 : 9;
    let id = 0;

    for (let row = 0; row < rows; row++) {
      const depth = row / (rows - 1);
      const count = Math.round(13 + depth * 13);
      const baseY = state.height * (0.47 + depth * 0.5);
      const baseScale = 0.27 + depth * 0.72;

      for (let col = 0; col < count; col++) {
        const seed = row * 181 + col * 23 + 7;
        const slot = state.width / count;
        const x = (col + 0.5 + (row % 2) * 0.42) * slot + (seeded(seed) - 0.5) * slot * 0.75;
        const y = baseY + (seeded(seed + 3) - 0.5) * 32;
        const roll = seeded(seed + 9);
        const colorType = roll < 0.34 ? "red" : roll < 0.67 ? "white" : "gradient";

        flowers.push({
          id: id++, x, baseY: y,
          scale: baseScale * rand(0.84, 1.14),
          phase: rand(0, Math.PI * 2),
          colorType,
          selectable: false,
          selected: false,
          pluck: 0,
          bend: rand(-0.35, 0.35)
        });
      }
    }

    const candidates = flowers.filter(f => f.baseY > state.height * 0.59 && f.baseY < state.height * 0.9);
    [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92].forEach((p, i) => {
      let best = null;
      let score = Infinity;
      candidates.forEach(f => {
        if (f.selectable) return;
        const s = Math.abs(f.x - state.width * p) + Math.abs(f.baseY - state.height * (0.68 + (i % 3) * 0.055));
        if (s < score) { score = s; best = f; }
      });
      if (best) best.selectable = true;
    });

    grass.length = 0;
    const grassCount = Math.max(420, Math.floor(state.width * 1.35));
    for (let i = 0; i < grassCount; i++) {
      const y = rand(state.height * 0.64, state.height * 1.01);
      const depth = Math.max(0, Math.min(1, (y - state.height * 0.64) / (state.height * 0.37)));
      grass.push({
        x: Math.random() * state.width,
        y,
        h: rand(9, 30 + depth * 58),
        lean: rand(-0.95, 0.95),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.11, 0.32 + depth * 0.28),
        width: rand(0.55, 1.15 + depth * 0.75),
        tone: Math.floor(rand(0, 4))
      });
    }

    stones.length = 0;
    for (let i = 0; i < Math.max(28, Math.floor(state.width / 20)); i++) {
      const y = rand(state.height * 0.75, state.height * 1.01);
      const depth = Math.max(0, Math.min(1, (y - state.height * 0.75) / (state.height * 0.26)));
      stones.push({ x: Math.random() * state.width, y, rx: rand(2, 5 + depth * 8), ry: rand(1, 3 + depth * 4), rot: rand(-0.5, 0.5), alpha: rand(0.12, 0.34) });
    }

    soilDetails.length = 0;
    for (let i = 0; i < Math.max(90, Math.floor(state.width / 5)); i++) {
      soilDetails.push({ x: Math.random() * state.width, y: rand(state.height * 0.73, state.height), r: rand(0.5, 2.4), alpha: rand(0.05, 0.2) });
    }

    motes.length = 0;
    for (let i = 0; i < 55; i++) motes.push({ x: Math.random() * state.width, y: Math.random() * state.height * 0.8, r: rand(0.5, 2), phase: rand(0, Math.PI * 2), speed: rand(0.05, 0.2) });

    fireflies.length = 0;
    for (let i = 0; i < 14; i++) fireflies.push({ x: Math.random() * state.width, y: rand(state.height * 0.25, state.height * 0.76), phase: rand(0, Math.PI * 2), ax: rand(10, 34), ay: rand(8, 24), speed: rand(0.3, 0.7) });
  }

  function background() {
    const g = ctx.createLinearGradient(0, 0, 0, state.height);
    g.addColorStop(0, "#1b1219"); g.addColorStop(0.58, "#110e12"); g.addColorStop(1, "#08080a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, state.width, state.height);

    const lx = state.width * 0.5 + Math.sin(state.time * 0.00015) * state.width * 0.08;
    const glow = ctx.createRadialGradient(lx, state.height * 0.2, 0, lx, state.height * 0.2, Math.max(state.width, state.height) * 0.62);
    glow.addColorStop(0, "rgba(255,230,204,.25)"); glow.addColorStop(0.26, "rgba(205,113,109,.11)"); glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, state.width, state.height);

    const soil = ctx.createLinearGradient(0, state.height * 0.68, 0, state.height);
    soil.addColorStop(0, "#30251f");
    soil.addColorStop(0.35, "#211815");
    soil.addColorStop(1, "#100c0b");
    ctx.fillStyle = soil;
    ctx.beginPath();
    ctx.moveTo(0, state.height * 0.73);
    ctx.quadraticCurveTo(state.width * 0.24, state.height * 0.685, state.width * 0.48, state.height * 0.72);
    ctx.quadraticCurveTo(state.width * 0.74, state.height * 0.75, state.width, state.height * 0.72);
    ctx.lineTo(state.width, state.height); ctx.lineTo(0, state.height); ctx.closePath(); ctx.fill();

    const dampGlow = ctx.createLinearGradient(0, state.height * 0.7, 0, state.height);
    dampGlow.addColorStop(0, "rgba(134,93,65,.18)");
    dampGlow.addColorStop(0.48, "rgba(75,51,38,.09)");
    dampGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = dampGlow; ctx.fillRect(0, state.height * 0.69, state.width, state.height * 0.31);

    soilDetails.forEach(d => {
      ctx.fillStyle = `rgba(178,139,101,${d.alpha})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    });

    stones.forEach(st => {
      ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.rot);
      const sg = ctx.createLinearGradient(0, -st.ry, 0, st.ry);
      sg.addColorStop(0, `rgba(145,130,116,${st.alpha + .08})`);
      sg.addColorStop(1, `rgba(63,54,49,${st.alpha})`);
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, 0, st.rx, st.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }

  function particleLayer() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    motes.forEach(m => {
      const y = (m.y - state.time * m.speed * 0.01 + state.height * 0.8) % (state.height * 0.8);
      const x = m.x + Math.sin(state.time * 0.0005 + m.phase) * 10;
      ctx.fillStyle = `rgba(255,225,185,${0.07 + (Math.sin(state.time * 0.0016 + m.phase) + 1) * 0.07})`;
      ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill();
    });
    fireflies.forEach(f => {
      const x = f.x + Math.sin(state.time * 0.0007 * f.speed + f.phase) * f.ax;
      const y = f.y + Math.cos(state.time * 0.0009 * f.speed + f.phase) * f.ay;
      const pulse = (Math.sin(state.time * 0.003 + f.phase) + 1) / 2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
      g.addColorStop(0, `rgba(255,234,166,${0.72 * pulse})`); g.addColorStop(1, "rgba(255,198,90,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    });
    updateBurst(sparkles, false);
    updateBurst(pollen, true);
    ctx.restore();
  }

  function updateBurst(list, isPollen) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx; p.y += p.vy; p.vy += isPollen ? 0.004 : 0.025; p.life -= p.decay;
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.2, p.size * p.life), 0, Math.PI * 2); ctx.fill();
      if (p.life <= 0) list.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  function grassLayer() {
    const tones = [[50,79,43], [63,94,50], [76,105,57], [42,67,39]];
    ctx.save(); ctx.lineCap = "round";
    grass.slice().sort((a,b) => a.y-b.y).forEach(b => {
      const wind = reducedMotion ? 0 : Math.sin(state.time * 0.0011 + b.phase) * (4 + b.h * .045);
      const tone = tones[b.tone] || tones[0];
      ctx.strokeStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${b.alpha})`;
      ctx.lineWidth = b.width;
      ctx.beginPath(); ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.lean * b.h * 0.22 + wind * 0.32, b.y - b.h * 0.53, b.x + b.lean * b.h + wind, b.y - b.h);
      ctx.stroke();
      if (b.h > 42) {
        ctx.strokeStyle = `rgba(123,145,82,${b.alpha * .32})`;
        ctx.lineWidth = Math.max(.45, b.width * .45);
        ctx.beginPath(); ctx.moveTo(b.x, b.y - b.h * .32); ctx.lineTo(b.x + wind * .8 + b.lean * b.h * .72, b.y - b.h * .88); ctx.stroke();
      }
    });
    ctx.restore();
  }

  function leaf(x, y, angle, size, sway) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + sway * 0.07);
    const g = ctx.createLinearGradient(0, 0, size, 0); g.addColorStop(0, "#33472f"); g.addColorStop(0.55, "#668354"); g.addColorStop(1, "rgba(128,151,96,.45)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(size * 0.28, -size * 0.22, size * 0.78, -size * 0.16, size, 0); ctx.bezierCurveTo(size * 0.74, size * 0.15, size * 0.3, size * 0.2, 0, 0); ctx.fill();
    ctx.strokeStyle = "rgba(226,238,196,.18)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(size * 0.08, 0); ctx.lineTo(size * 0.9, 0); ctx.stroke(); ctx.restore();
  }

  function petalPath(length, width, curl) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-width * 0.72, -length * 0.22, -width * 0.82, -length * 0.7, -curl, -length);
    ctx.bezierCurveTo(0, -length * 1.05, width * 0.2, -length * 0.98, curl, -length);
    ctx.bezierCurveTo(width * 0.82, -length * 0.7, width * 0.7, -length * 0.22, 0, 0); ctx.closePath();
  }

  function petalGradient(type, length) {
    const g = ctx.createLinearGradient(0, 0, 0, -length);
    if (type === "red") { g.addColorStop(0, "#5d0c1d"); g.addColorStop(0.28, "#a51c34"); g.addColorStop(0.72, "#d94759"); g.addColorStop(1, "#ef8a91"); }
    else if (type === "white") { g.addColorStop(0, "#b89092"); g.addColorStop(0.25, "#e6d5d1"); g.addColorStop(0.72, "#fff8ef"); g.addColorStop(1, "#fffdf7"); }
    else { g.addColorStop(0, "#791025"); g.addColorStop(0.3, "#c72e46"); g.addColorStop(0.66, "#f1b4ad"); g.addColorStop(1, "#fffaf2"); }
    return g;
  }

  function lilyHead(f, x, y, sway, scaleMul = 1, alpha = 1, bouquetIndex = -1) {
    const s = f.scale * scaleMul;
    const len = 42 * s, width = 15.5 * s;
    const rotations = [-1.55, -1.03, -0.46, 0.12, 0.72, 1.31];
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway * 0.045); ctx.globalAlpha = alpha;

    if (f.selectable && !f.selected && !state.completed) {
      const pulse = 0.5 + Math.sin(state.time * 0.003 + f.phase) * 0.5;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      const halo = ctx.createRadialGradient(0, -4 * s, 0, 0, -4 * s, 72 * s);
      halo.addColorStop(0, f.colorType === "white" ? `rgba(255,252,226,${0.46 + pulse * 0.2})` : `rgba(255,86,112,${0.42 + pulse * 0.22})`);
      halo.addColorStop(.28, f.colorType === "white" ? `rgba(255,235,181,${0.2 + pulse * .1})` : `rgba(255,70,95,${0.2 + pulse * .11})`);
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, -4 * s, 74 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = f.colorType === "white" ? `rgba(255,245,200,${.58 + pulse*.25})` : `rgba(255,103,124,${.6 + pulse*.25})`;
      ctx.lineWidth = Math.max(1.2, 1.7*s);
      ctx.beginPath(); ctx.arc(0, -4*s, (39 + pulse*5)*s, 0, Math.PI*2); ctx.stroke();
      for (let k=0;k<5;k++) {
        const a = state.time*.0014 + f.phase + k*Math.PI*2/5;
        const rr = (46 + pulse*8)*s;
        ctx.fillStyle = f.colorType === "white" ? "rgba(255,244,190,.9)" : "rgba(255,117,139,.9)";
        ctx.beginPath(); ctx.arc(Math.cos(a)*rr, -4*s + Math.sin(a)*rr, Math.max(1,1.5*s), 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    rotations.forEach((r, i) => {
      ctx.save(); ctx.rotate(r); ctx.translate(0, -2 * s);
      const localLen = len * (i % 2 ? 0.94 : 1.03);
      ctx.fillStyle = petalGradient(f.colorType, localLen); petalPath(localLen, width, (i % 2 ? 2.5 : -2.5) * s); ctx.fill();
      ctx.strokeStyle = f.colorType === "white" ? "rgba(130,85,94,.24)" : "rgba(255,205,198,.2)"; ctx.lineWidth = Math.max(0.65, 0.8 * s); ctx.stroke();
      ctx.strokeStyle = f.colorType === "white" ? "rgba(142,94,102,.2)" : "rgba(255,226,207,.19)"; ctx.lineWidth = 0.55 * s;
      ctx.beginPath(); ctx.moveTo(0, -4 * s); ctx.bezierCurveTo(1 * s, -localLen * 0.35, -1 * s, -localLen * 0.65, 0, -localLen * 0.88); ctx.stroke();
      ctx.fillStyle = f.colorType === "white" ? "rgba(174,91,101,.25)" : "rgba(255,226,207,.27)";
      for (let d = 0; d < 7; d++) { const yy = -localLen * (0.28 + d * 0.075); const xx = (d % 2 ? 1 : -1) * (2.2 + d * 0.55) * s; ctx.beginPath(); ctx.arc(xx, yy, 0.72 * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });

    ctx.fillStyle = f.colorType === "white" ? "#e4c6bc" : "#741326"; ctx.beginPath(); ctx.arc(0, -3 * s, 7.6 * s, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 2 * i / 6 + 0.22, l = 19 * s, ex = Math.cos(a) * l, ey = Math.sin(a) * l - 3 * s;
      ctx.strokeStyle = "rgba(237,203,126,.9)"; ctx.lineWidth = 1.15 * s; ctx.beginPath(); ctx.moveTo(0, -3 * s); ctx.quadraticCurveTo(ex * 0.55, ey * 0.55, ex, ey); ctx.stroke();
      ctx.fillStyle = "#cb7e37"; ctx.beginPath(); ctx.ellipse(ex, ey, 2.6 * s, 1.25 * s, a, 0, Math.PI * 2); ctx.fill();
    }

    if (bouquetIndex >= 0) state.bouquetHitAreas.push({ x, y, r: Math.max(28, 38 * s), index: bouquetIndex });
    ctx.restore();
  }

  function headPos(f) {
    const sway = reducedMotion ? 0 : Math.sin(state.time * 0.001 + f.phase) + Math.sin(state.time * 0.0019 + f.phase * 1.7) * 0.3;
    const stemH = 95 * f.scale, bend = (sway + f.bend) * 10 * f.scale;
    return { x: f.x + bend, y: f.baseY - stemH, sway };
  }

  function drawFlower(f) {
    const p = headPos(f), opacity = 1 - f.pluck;
    if (opacity <= 0.01) return;
    ctx.save(); ctx.globalAlpha = opacity; ctx.lineCap = "round";
    const g = ctx.createLinearGradient(f.x, f.baseY, p.x, p.y); g.addColorStop(0, "#415538"); g.addColorStop(1, "#7e965f");
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.2, 2.7 * f.scale); ctx.beginPath(); ctx.moveTo(f.x, f.baseY); ctx.quadraticCurveTo(f.x + (p.x - f.x) * 0.25, f.baseY - 45 * f.scale, p.x, p.y + 8 * f.scale); ctx.stroke();
    leaf(f.x, f.baseY - 30 * f.scale, -2.75, 30 * f.scale, p.sway); leaf(f.x + (p.x - f.x) * 0.25, f.baseY - 55 * f.scale, -0.34, 27 * f.scale, p.sway);
    lilyHead(f, p.x, p.y, p.sway, 1, opacity); ctx.restore();
  }

  function bouquet() {
    state.bouquetHitAreas.length = 0;
    if (!state.selected.length) return;
    const cx = state.width * 0.5, bottom = state.height * 1.03, targetY = state.height * 0.82;
    const rise = bottom + (targetY - bottom) * state.bouquetProgress;
    const offsets = [-42, -27, -12, 4, 20, 36, 0];
    ctx.save(); ctx.globalAlpha = Math.min(1, state.bouquetProgress * 1.3);

    state.selected.forEach((f, i) => {
      const off = offsets[i] || 0, topX = cx + off * 1.25, topY = rise - 116 - Math.abs(off) * 0.18 - (i % 2) * 8;
      const sway = reducedMotion ? 0 : Math.sin(state.time * 0.0014 + i) * 0.35;
      ctx.strokeStyle = "#78905a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + off * 0.2, rise + 67); ctx.quadraticCurveTo(cx + off * 0.7, rise - 8, topX, topY + 17); ctx.stroke();
      leaf(cx + off * 0.55, rise - 6, i % 2 ? -2.72 : -0.38, 30, sway); lilyHead(f, topX, topY, sway, 0.9, 1, i);
    });

    ctx.fillStyle = "rgba(224,194,172,.9)"; ctx.beginPath(); ctx.moveTo(cx - 78, rise - 62); ctx.quadraticCurveTo(cx, rise - 29, cx + 78, rise - 62); ctx.lineTo(cx + 45, rise + 74); ctx.quadraticCurveTo(cx, rise + 99, cx - 45, rise + 74); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(132,46,60,.96)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 44, rise + 30); ctx.quadraticCurveTo(cx, rise + 40, cx + 44, rise + 30); ctx.stroke(); ctx.restore();
  }

  function update(dt) {
    state.time += dt;
    flowers.forEach(f => { const target = f.selected ? 1 : 0; f.pluck += (target - f.pluck) * Math.min(1, dt * 0.007); });
    state.bouquetProgress += ((state.selected.length ? 1 : 0) - state.bouquetProgress) * Math.min(1, dt * 0.004);
  }

  function draw() {
    background(); particleLayer(); grassLayer();
    flowers.slice().sort((a, b) => a.baseY - b.baseY).forEach(drawFlower);
    bouquet();
  }

  function frame(now) {
    const dt = Math.min(40, now - state.lastTime); state.lastTime = now; update(dt); draw(); requestAnimationFrame(frame);
  }

  function burst(x, y, color, count, pollenMode = false) {
    const list = pollenMode ? pollen : sparkles;
    for (let i = 0; i < count; i++) list.push({ x, y, vx: pollenMode ? rand(-0.8, 0.8) : rand(-1.8, 1.8), vy: pollenMode ? rand(-1.4, -0.15) : rand(-2.6, -0.4), life: 1, decay: pollenMode ? rand(0.006, 0.012) : rand(0.015, 0.022), color, size: pollenMode ? rand(1, 2.6) : rand(1.2, 3) });
  }

  function findFieldFlower(x, y, selectableOnly = false) {
    let best = null, bestD = Infinity;
    flowers.forEach(f => {
      if (f.selected) return;
      if (selectableOnly && (!f.selectable || state.completed)) return;
      const p = headPos(f), d = Math.hypot(x - p.x, y - p.y), r = Math.max(24, 40 * f.scale);
      if (d < r && d < bestD) { best = f; bestD = d; }
    });
    return best;
  }

  function findBouquetFlower(x, y) {
    let best = null, bestD = Infinity;
    state.bouquetHitAreas.forEach(a => { const d = Math.hypot(x - a.x, y - a.y); if (d < a.r && d < bestD) { best = a; bestD = d; } });
    return best;
  }

  function chooseFlower(f) {
    if (!f || f.selected || state.completed) return;
    f.selected = true; state.selected.push(f); selectedCountEl.textContent = String(state.selected.length);
    const p = headPos(f); burst(p.x, p.y, "#f6d58a", 42, true);
    burst(p.x, p.y, f.colorType === "white" ? "#fff0d7" : "#ff7181", 18);
    if (navigator.vibrate) navigator.vibrate(16);
    if (state.selected.length >= state.target) {
      state.completed = true; hint.textContent = "Toca las flores del ramo";
      setTimeout(() => {
        messageEyebrow.textContent = "TU RAMO ESTÁ LISTO";
        messageTitle.textContent = "Ahora cada flor guarda un mensaje";
        messageText.textContent = "Toca cualquiera de los lirios del ramo. Al abrir su mensaje, soltará un poco de polen.";
        messagePanel.classList.remove("hidden");
      }, 850);
    }
  }

  function openFlowerMessage(area) {
    const m = messages[area.index % messages.length];
    messageEyebrow.textContent = `FLOR ${area.index + 1}`; messageTitle.textContent = m[0]; messageText.textContent = m[1];
    burst(area.x, area.y, "#f5d78f", 48, true); messagePanel.classList.remove("hidden");
  }

  function tap(event) {
    if (!state.started || !messagePanel.classList.contains("hidden")) return;
    const now = Date.now(); if (now - state.lastTap < 220) return; state.lastTap = now;
    const r = canvas.getBoundingClientRect(), x = event.clientX - r.left, y = event.clientY - r.top;
    if (state.completed) {
      const area = findBouquetFlower(x, y);
      if (area) { openFlowerMessage(area); return; }
      const fieldFlower = findFieldFlower(x, y, false);
      if (fieldFlower) { const p = headPos(fieldFlower); burst(p.x, p.y, "#f6d58a", 38, true); }
      return;
    }

    const touched = findFieldFlower(x, y, false);
    if (!touched) return;
    const p = headPos(touched);
    burst(p.x, p.y, "#f6d58a", 34, true);
    if (touched.selectable) chooseFlower(touched);
  }

  function reset() {
    state.selected = []; state.completed = false; state.bouquetProgress = 0; selectedCountEl.textContent = "0";
    messagePanel.classList.add("hidden"); hint.textContent = "Toca una flor iluminada";
    flowers.forEach(f => { f.selected = false; f.pluck = 0; });
  }

  enterButton.addEventListener("click", () => {
    state.started = true; intro.classList.add("is-leaving");
    setTimeout(() => { intro.classList.add("hidden"); hud.classList.remove("hidden"); hint.classList.remove("hidden"); }, 450);
  });
  resetButton.addEventListener("click", reset);
  closeMessage.addEventListener("click", () => messagePanel.classList.add("hidden"));
  canvas.addEventListener("pointerdown", tap, { passive: true });
  addEventListener("resize", resize);

  resize(); requestAnimationFrame(frame);
})();
