(() => {
  "use strict";

  const garden = document.getElementById("garden");
  const g = garden.getContext("2d");
  const bouquetCanvas = document.getElementById("bouquetCanvas");
  const b = bouquetCanvas.getContext("2d");

  const intro = document.getElementById("intro");
  const enterButton = document.getElementById("enterButton");
  const resetButton = document.getElementById("resetButton");
  const selectedCount = document.getElementById("selectedCount");
  const targetCount = document.getElementById("targetCount");
  const bouquetInstruction = document.getElementById("bouquetInstruction");
  const bouquetSubtext = document.getElementById("bouquetSubtext");
  const flowerLegend = document.getElementById("flowerLegend");
  const messageModal = document.getElementById("messageModal");
  const messageText = document.getElementById("messageText");
  const closeMessage = document.getElementById("closeMessage");

  const TARGET = 7;
  const DPR_LIMIT = 1.65;

  const messages = [
    "Tu forma de cuidar a quienes amas se siente como un lugar seguro.",
    "Aunque a veces escondas lo que sientes, dentro de ti hay un mundo inmenso.",
    "Amas con una fuerza que vuelve especiales incluso los días más pequeños.",
    "Tu ternura vive en los detalles, en la atención y en la forma en que permaneces.",
    "Incluso cuando tienes miedo, sigues intentando acercarte a lo que quieres.",
    "Hay algo profundamente dulce en tu manera de mirar el mundo.",
    "Eres como este lirio: delicado a primera vista y lleno de vida por dentro."
  ];

  const flowerNames = [
    "Lirio rojo",
    "Lirio blanco",
    "Lirio degradado",
    "Lirio rojo intenso",
    "Lirio blanco puro",
    "Lirio rosado",
    "Lirio especial"
  ];

  const state = {
    started: false,
    time: 0,
    last: performance.now(),
    width: 0,
    height: 0,
    bouquetW: 0,
    bouquetH: 0,
    flowers: [],
    grass: [],
    stars: [],
    fireflies: [],
    pollen: [],
    bouquetPollen: [],
    selected: [],
    bouquetHits: [],
    rngSeed: 998117
  };

  targetCount.textContent = TARGET;

  function rand() {
    state.rngSeed = (1664525 * state.rngSeed + 1013904223) >>> 0;
    return state.rngSeed / 4294967296;
  }

  function range(min, max) {
    return min + (max - min) * rand();
  }

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function resize() {
    const fieldSize = resizeCanvas(garden, g);
    const bouquetSize = resizeCanvas(bouquetCanvas, b);
    state.width = fieldSize.width;
    state.height = fieldSize.height;
    state.bouquetW = bouquetSize.width;
    state.bouquetH = bouquetSize.height;
    buildField();
  }

  function buildField() {
    state.rngSeed = 998117;
    state.flowers = [];
    state.grass = [];
    state.stars = [];
    state.fireflies = [];

    const w = state.width;
    const h = state.height;
    const horizon = h * 0.34;
    const phone = w < 700;

    const flowerCount = phone ? 310 : 560;
    const grassCount = phone ? 850 : 1450;
    const starCount = phone ? 120 : 230;
    const fireflyCount = phone ? 45 : 85;

    for (let i = 0; i < starCount; i++) {
      state.stars.push({
        x: range(0, w),
        y: range(0, horizon * .92),
        r: range(.35, 1.5),
        a: range(.25, .95),
        phase: range(0, Math.PI * 2)
      });
    }

    for (let i = 0; i < grassCount; i++) {
      const depth = rand();
      const y = horizon + Math.pow(depth, 1.2) * (h - horizon);
      state.grass.push({
        x: range(-10, w + 10),
        y,
        depth,
        length: range(15, 56) * (.22 + depth),
        phase: range(0, Math.PI * 2),
        lean: range(-.28, .28)
      });
    }

    const candidates = [];

    for (let i = 0; i < flowerCount; i++) {
      const depth = rand();
      const y = horizon + Math.pow(depth, 1.44) * (h - horizon - 4);
      const scale = .22 + depth * 1.18;
      const roll = rand();
      const type = roll < .36 ? "white" : roll < .70 ? "red" : "gradient";

      const f = {
        id: i,
        x: range(-30, w + 30),
        y,
        depth,
        size: range(8, 18) * scale,
        stem: range(22, 57) * scale,
        phase: range(0, Math.PI * 2),
        rotation: range(-.30, .30),
        type,
        special: false,
        selected: false,
        messageIndex: -1,
        glowPhase: range(0, Math.PI * 2)
      };

      state.flowers.push(f);

      if (
        depth > .48 &&
        depth < .91 &&
        f.x > w * .07 &&
        f.x < w * .93
      ) {
        candidates.push(f);
      }
    }

    const chosen = [];
    for (let i = 0; i < TARGET; i++) {
      const desiredX = w * (.13 + i * (.74 / (TARGET - 1)));
      const desiredDepth = .58 + (i % 3) * .09;
      let best = null;
      let bestScore = Infinity;

      for (const f of candidates) {
        if (chosen.includes(f)) continue;
        const score = Math.abs(f.x - desiredX) + Math.abs(f.depth - desiredDepth) * 190;
        if (score < bestScore) {
          best = f;
          bestScore = score;
        }
      }

      if (best) chosen.push(best);
    }

    chosen.forEach((f, index) => {
      f.special = true;
      f.messageIndex = index;
      f.size *= 1.18;
      f.stem *= 1.06;
      f.type = index % 3 === 0 ? "red" : index % 3 === 1 ? "white" : "gradient";
    });

    for (let i = 0; i < fireflyCount; i++) {
      state.fireflies.push({
        x: range(0, w),
        y: range(horizon * .72, h),
        r: range(.7, 2.1),
        phase: range(0, Math.PI * 2),
        speed: range(.15, .45)
      });
    }

    state.flowers.sort((a, b) => a.depth - b.depth);

    for (const selected of state.selected) {
      const rebuilt = state.flowers.find(f => f.messageIndex === selected.messageIndex && f.special);
      if (rebuilt) rebuilt.selected = true;
    }
  }

  function wind(y, phase, multiplier = 1) {
    const depth = Math.max(0, Math.min(1, (y - state.height * .32) / (state.height * .68)));
    return (
      Math.sin(state.time * .0012 + phase) * (1.4 + depth * 5.5) +
      Math.sin(state.time * .00045 + phase * 2.2) * (1 + depth * 2)
    ) * multiplier;
  }

  function drawSky() {
    const w = state.width;
    const h = state.height;
    const horizon = h * .34;

    const sky = g.createLinearGradient(0, 0, 0, horizon + 60);
    sky.addColorStop(0, "#020713");
    sky.addColorStop(.45, "#071328");
    sky.addColorStop(.78, "#172844");
    sky.addColorStop(1, "#38465c");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    for (const star of state.stars) {
      const twinkle = star.a * (.68 + Math.sin(state.time * .002 + star.phase) * .28);
      g.fillStyle = `rgba(221,234,255,${twinkle})`;
      g.beginPath();
      g.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      g.fill();

      if (star.r > 1.15) {
        g.strokeStyle = `rgba(205,225,255,${twinkle * .55})`;
        g.lineWidth = .5;
        g.beginPath();
        g.moveTo(star.x - 3, star.y);
        g.lineTo(star.x + 3, star.y);
        g.moveTo(star.x, star.y - 3);
        g.lineTo(star.x, star.y + 3);
        g.stroke();
      }
    }

    drawMoon(w * .24, h * .13, Math.min(w, h) * .055);

    const milky = g.createLinearGradient(w * .55, 0, w * .9, horizon);
    milky.addColorStop(0, "rgba(108,128,190,0)");
    milky.addColorStop(.46, "rgba(124,142,199,.09)");
    milky.addColorStop(.62, "rgba(196,204,237,.11)");
    milky.addColorStop(1, "rgba(108,128,190,0)");
    g.fillStyle = milky;
    g.save();
    g.translate(w * .72, horizon * .36);
    g.rotate(-.42);
    g.fillRect(-w * .14, -h * .5, w * .27, h);
    g.restore();

    const ground = g.createLinearGradient(0, horizon - 5, 0, h);
    ground.addColorStop(0, "#17251d");
    ground.addColorStop(.25, "#0f2018");
    ground.addColorStop(1, "#030a08");
    g.fillStyle = ground;
    g.fillRect(0, horizon, w, h - horizon);

    drawTreeLine(horizon + 7);

    const mist = g.createLinearGradient(0, horizon - 28, 0, horizon + 76);
    mist.addColorStop(0, "rgba(187,207,220,0)");
    mist.addColorStop(.45, "rgba(187,207,220,.12)");
    mist.addColorStop(1, "rgba(187,207,220,0)");
    g.fillStyle = mist;
    g.fillRect(0, horizon - 30, w, 110);
  }

  function drawMoon(x, y, r) {
    const glow = g.createRadialGradient(x, y, 0, x, y, r * 3.2);
    glow.addColorStop(0, "rgba(241,247,255,.58)");
    glow.addColorStop(.34, "rgba(170,195,234,.16)");
    glow.addColorStop(1, "rgba(130,170,220,0)");
    g.fillStyle = glow;
    g.beginPath();
    g.arc(x, y, r * 3.2, 0, Math.PI * 2);
    g.fill();

    const moon = g.createRadialGradient(x - r * .32, y - r * .36, r * .08, x, y, r);
    moon.addColorStop(0, "#fffdf4");
    moon.addColorStop(.55, "#dce6ef");
    moon.addColorStop(1, "#8598ae");
    g.fillStyle = moon;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();

    g.globalAlpha = .22;
    g.fillStyle = "#5d7087";
    const craters = [
      [-.30, -.10, .16], [.17, -.28, .10], [.27, .18, .18],
      [-.12, .33, .11], [-.40, .29, .07], [.03, .05, .07]
    ];
    for (const [cx, cy, cr] of craters) {
      g.beginPath();
      g.arc(x + cx * r, y + cy * r, cr * r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function drawTreeLine(y) {
    g.save();
    g.fillStyle = "rgba(3,10,12,.95)";
    g.beginPath();
    g.moveTo(0, y + 20);
    for (let x = 0; x <= state.width + 20; x += 11) {
      const peak = y - (10 + Math.sin(x * .037) * 8 + ((x * 17) % 23));
      g.lineTo(x, peak);
      g.lineTo(x + 6, y + 12);
    }
    g.lineTo(state.width, y + 40);
    g.lineTo(0, y + 40);
    g.closePath();
    g.fill();
    g.restore();
  }

  function drawGrass() {
    for (const blade of state.grass) {
      const sway = wind(blade.y, blade.phase, .55);
      g.strokeStyle = blade.depth > .55
        ? `rgba(42,92,54,${.28 + blade.depth * .46})`
        : `rgba(31,66,42,${.20 + blade.depth * .42})`;
      g.lineWidth = .5 + blade.depth * 1.15;
      g.beginPath();
      g.moveTo(blade.x, blade.y);
      g.quadraticCurveTo(
        blade.x + blade.lean * blade.length + sway * .35,
        blade.y - blade.length * .55,
        blade.x + blade.lean * blade.length + sway,
        blade.y - blade.length
      );
      g.stroke();
    }
  }

  function palette(type, petalIndex) {
    if (type === "white") {
      return ["#fffdf7", "#f4eee8", "#cfd6df"];
    }
    if (type === "red") {
      return ["#ffd5c7", "#ce2c47", "#650818"];
    }
    return petalIndex % 2 === 0
      ? ["#fff8f1", "#efc6c8", "#a91231"]
      : ["#fff1e8", "#dd6b7b", "#78091f"];
  }

  function drawPetal(context, length, width, angle, colors) {
    context.save();
    context.rotate(angle);
    const grad = context.createLinearGradient(0, 2, 0, -length);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(.52, colors[1]);
    grad.addColorStop(1, colors[2]);
    context.fillStyle = grad;
    context.strokeStyle = "rgba(255,235,226,.25)";
    context.lineWidth = Math.max(.45, width * .035);
    context.beginPath();
    context.moveTo(0, 2);
    context.bezierCurveTo(-width * .74, -length * .22, -width * .72, -length * .68, 0, -length);
    context.bezierCurveTo(width * .72, -length * .68, width * .74, -length * .22, 0, 2);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(111,24,43,.25)";
    context.lineWidth = Math.max(.35, width * .022);
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(width * .05, -length * .45, 0, -length * .83);
    context.stroke();
    context.restore();
  }

  function drawLily(context, flower, x, y, opts = {}) {
    const scale = opts.scale ?? 1;
    const bouquet = !!opts.bouquet;
    const size = flower.size * scale;
    const sway = bouquet ? Math.sin(state.time * .001 + flower.phase) * 1.3 : wind(y, flower.phase, 1);
    const headX = x + sway;
    const headY = y - flower.stem * scale;

    if (flower.special && !flower.selected && !bouquet) {
      const pulse = .72 + Math.sin(state.time * .0034 + flower.glowPhase) * .20;
      const glow = context.createRadialGradient(headX, headY, 0, headX, headY, size * 3.3);
      glow.addColorStop(0, `rgba(255,244,210,${.46 * pulse})`);
      glow.addColorStop(.28, `rgba(255,88,111,${.24 * pulse})`);
      glow.addColorStop(1, "rgba(255,80,105,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(headX, headY, size * 3.3, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = `rgba(255,230,185,${.55 + pulse * .28})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(headX, headY, size * 1.6, 0, Math.PI * 2);
      context.stroke();
    }

    context.strokeStyle = bouquet ? "#486a3e" : `rgba(45,89,47,${.5 + flower.depth * .46})`;
    context.lineWidth = Math.max(1, size * .10);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, y + 4);
    context.quadraticCurveTo(
      x + sway * .3,
      y - flower.stem * scale * .55,
      headX,
      headY + size * .18
    );
    context.stroke();

    const leafY = y - flower.stem * scale * .38;
    context.fillStyle = bouquet ? "rgba(55,103,49,.95)" : "rgba(40,82,43,.88)";
    context.beginPath();
    context.moveTo(x, leafY);
    context.quadraticCurveTo(x - size * .9, leafY - size * .1, x - size * .23, leafY - size * 1.12);
    context.quadraticCurveTo(x + size * .05, leafY - size * .5, x, leafY);
    context.fill();

    context.save();
    context.translate(headX, headY);
    context.rotate(flower.rotation + sway * .003);

    for (let i = 0; i < 6; i++) {
      drawPetal(
        context,
        size * (1.08 + (i % 2) * .07),
        size * .51,
        i * Math.PI / 3,
        palette(flower.type, i)
      );
    }

    context.fillStyle = "#f0d59a";
    context.beginPath();
    context.arc(0, 0, size * .19, 0, Math.PI * 2);
    context.fill();

    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + .25;
      const len = size * (.52 + (i % 2) * .08);
      context.strokeStyle = "rgba(244,214,153,.95)";
      context.lineWidth = Math.max(.55, size * .042);
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      context.stroke();

      context.fillStyle = "#522018";
      context.beginPath();
      context.ellipse(
        Math.cos(a) * len,
        Math.sin(a) * len,
        size * .05,
        size * .095,
        a,
        0,
        Math.PI * 2
      );
      context.fill();
    }

    context.restore();
    return { x: headX, y: headY, r: size * 1.55 };
  }

  function drawFlowers() {
    for (const flower of state.flowers) {
      if (flower.selected) continue;
      drawLily(g, flower, flower.x, flower.y);
    }
  }

  function drawFireflies() {
    for (const f of state.fireflies) {
      const x = f.x + Math.sin(state.time * .00035 + f.phase) * 14;
      const y = f.y + Math.cos(state.time * f.speed * .01 + f.phase) * 8;
      const alpha = .18 + (Math.sin(state.time * .003 + f.phase) + 1) * .22;
      g.shadowBlur = 8;
      g.shadowColor = "rgba(255,204,98,.9)";
      g.fillStyle = `rgba(255,214,112,${alpha})`;
      g.beginPath();
      g.arc(x, y, f.r, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
    }
  }

  function spawnPollen(x, y, special = false) {
    const amount = special ? 54 : 30;
    for (let i = 0; i < amount; i++) {
      const angle = range(-Math.PI, Math.PI);
      const speed = range(.35, special ? 2.2 : 1.35);
      state.pollen.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - range(.25, 1.05),
        life: range(700, 1350),
        r: range(.8, special ? 2.7 : 1.9),
        special
      });
    }
  }

  function updatePollen(delta) {
    for (let i = state.pollen.length - 1; i >= 0; i--) {
      const p = state.pollen[i];
      p.life -= delta;
      if (p.life <= 0) {
        state.pollen.splice(i, 1);
        continue;
      }
      p.vy += .009;
      p.vx += .003;
      p.x += p.vx * delta / 16.67;
      p.y += p.vy * delta / 16.67;
      const a = Math.min(1, p.life / 380);
      if (p.special) {
        g.shadowBlur = 10;
        g.shadowColor = "rgba(255,210,117,.95)";
      }
      g.fillStyle = `rgba(255,220,137,${a * .88})`;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
    }
  }

  function renderField(delta) {
    drawSky();
    drawGrass();
    drawFlowers();
    drawFireflies();
    updatePollen(delta);
  }

  function bouquetLayout() {
    const w = state.bouquetW;
    const h = state.bouquetH;
    const phone = w < 700;
    const centerX = phone ? w * .54 : w * .52;
    const baseY = h * .88;
    const availableW = phone ? w * .47 : w * .43;
    const scale = Math.max(.52, Math.min(1.05, availableW / 390));

    return {
      centerX,
      baseY,
      scale,
      positions: [
        { x: -108, y: 5, s: .90, r: -.20 },
        { x: -74, y: -32, s: .96, r: -.12 },
        { x: -38, y: 9, s: .91, r: -.06 },
        { x: 0, y: -58, s: 1.05, r: 0 },
        { x: 38, y: 8, s: .91, r: .06 },
        { x: 74, y: -31, s: .96, r: .12 },
        { x: 108, y: 6, s: .90, r: .20 }
      ]
    };
  }

  function drawBouquetBackdrop() {
    const w = state.bouquetW;
    const h = state.bouquetH;
    b.clearRect(0, 0, w, h);

    const glow = b.createRadialGradient(w * .52, h * .52, 0, w * .52, h * .52, Math.min(w, h) * .65);
    glow.addColorStop(0, "rgba(133,35,54,.28)");
    glow.addColorStop(.52, "rgba(35,14,27,.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    b.fillStyle = glow;
    b.fillRect(0, 0, w, h);

    for (let i = 0; i < 70; i++) {
      const x = (i * 83.17) % w;
      const y = (i * 47.31) % h;
      const a = .07 + ((i % 8) / 8) * .18;
      b.fillStyle = `rgba(232,190,111,${a})`;
      b.beginPath();
      b.arc(x, y, .5 + (i % 3) * .45, 0, Math.PI * 2);
      b.fill();
    }
  }

  function drawWrapping(layout) {
    const { centerX, baseY, scale } = layout;

    b.save();
    b.translate(centerX, baseY - 2);

    const paper = b.createLinearGradient(-60 * scale, 0, 55 * scale, 110 * scale);
    paper.addColorStop(0, "rgba(226,198,159,.95)");
    paper.addColorStop(.48, "rgba(173,137,99,.92)");
    paper.addColorStop(1, "rgba(103,73,56,.94)");

    b.fillStyle = paper;
    b.beginPath();
    b.moveTo(-54 * scale, -16 * scale);
    b.lineTo(54 * scale, -16 * scale);
    b.lineTo(30 * scale, 111 * scale);
    b.lineTo(-30 * scale, 111 * scale);
    b.closePath();
    b.fill();

    b.strokeStyle = "rgba(255,236,207,.25)";
    b.lineWidth = 1;
    b.stroke();

    b.fillStyle = "#78182f";
    b.beginPath();
    b.ellipse(0, 19 * scale, 53 * scale, 13 * scale, 0, 0, Math.PI * 2);
    b.fill();

    b.fillStyle = "#a6304b";
    b.beginPath();
    b.moveTo(-4 * scale, 17 * scale);
    b.bezierCurveTo(-40 * scale, -9 * scale, -59 * scale, 24 * scale, -16 * scale, 39 * scale);
    b.bezierCurveTo(-37 * scale, 59 * scale, -2 * scale, 65 * scale, 8 * scale, 28 * scale);
    b.fill();

    b.beginPath();
    b.moveTo(4 * scale, 17 * scale);
    b.bezierCurveTo(40 * scale, -9 * scale, 59 * scale, 24 * scale, 16 * scale, 39 * scale);
    b.bezierCurveTo(37 * scale, 59 * scale, 2 * scale, 65 * scale, -8 * scale, 28 * scale);
    b.fill();

    b.restore();
  }

  function drawBouquet(delta) {
    drawBouquetBackdrop();
    const layout = bouquetLayout();
    state.bouquetHits = [];

    for (let i = 0; i < state.selected.length; i++) {
      const source = state.selected[i];
      const pos = layout.positions[i];

      const flower = {
        ...source,
        size: 27 * pos.s * layout.scale,
        stem: 166 * layout.scale,
        rotation: pos.r,
        selected: false,
        special: false,
        depth: 1
      };

      const x = layout.centerX + pos.x * layout.scale;
      const y = layout.baseY + pos.y * layout.scale;

      const hit = drawLily(b, flower, x, y, { bouquet: true });
      state.bouquetHits.push({
        x: hit.x,
        y: hit.y,
        r: Math.max(20, hit.r),
        messageIndex: source.messageIndex
      });
    }

    drawWrapping(layout);
    updateBouquetPollen(delta);
  }

  function spawnBouquetPollen(x, y) {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = .45 + Math.random() * 2.2;
      state.bouquetPollen.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - .8,
        life: 950 + Math.random() * 700,
        r: .8 + Math.random() * 2.1
      });
    }
  }

  function updateBouquetPollen(delta) {
    for (let i = state.bouquetPollen.length - 1; i >= 0; i--) {
      const p = state.bouquetPollen[i];
      p.life -= delta;
      if (p.life <= 0) {
        state.bouquetPollen.splice(i, 1);
        continue;
      }
      p.vy += .012;
      p.x += p.vx * delta / 16.67;
      p.y += p.vy * delta / 16.67;
      const a = Math.min(1, p.life / 380);
      b.shadowBlur = 9;
      b.shadowColor = "rgba(255,209,107,.95)";
      b.fillStyle = `rgba(255,220,136,${a})`;
      b.beginPath();
      b.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      b.fill();
      b.shadowBlur = 0;
    }
  }

  function hitFieldFlower(x, y) {
    let best = null;
    let bestDistance = Infinity;

    for (let i = state.flowers.length - 1; i >= 0; i--) {
      const f = state.flowers[i];
      if (f.selected) continue;
      const hx = f.x + wind(f.y, f.phase, 1);
      const hy = f.y - f.stem;
      const radius = Math.max(13, f.size * 1.6);
      const d = Math.hypot(x - hx, y - hy);
      if (d <= radius && d < bestDistance) {
        best = f;
        bestDistance = d;
      }
    }

    return best;
  }

  function handleGardenPointer(event) {
    if (!state.started || !messageModal.classList.contains("hidden")) return;

    const rect = garden.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const flower = hitFieldFlower(x, y);

    if (!flower) {
      spawnPollen(x, y, false);
      return;
    }

    const hx = flower.x + wind(flower.y, flower.phase, 1);
    const hy = flower.y - flower.stem;
    spawnPollen(hx, hy, flower.special);

    if (flower.special && !flower.selected && state.selected.length < TARGET) {
      flower.selected = true;
      state.selected.push({ ...flower });
      selectedCount.textContent = state.selected.length;
      updateBouquetUI();

      if (state.selected.length === TARGET) {
        bouquetInstruction.textContent = "Ahora toca cada flor";
        bouquetSubtext.textContent = "Cada lirio conserva un mensaje para ti.";
      }
    }
  }

  function handleBouquetPointer(event) {
    if (state.selected.length < TARGET || !messageModal.classList.contains("hidden")) return;

    const rect = bouquetCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let hit = null;
    let bestDistance = Infinity;

    for (const area of state.bouquetHits) {
      const d = Math.hypot(x - area.x, y - area.y);
      if (d <= area.r && d < bestDistance) {
        hit = area;
        bestDistance = d;
      }
    }

    if (!hit) return;

    spawnBouquetPollen(hit.x, hit.y);
    messageText.textContent = messages[hit.messageIndex];
    messageModal.classList.remove("hidden");
  }

  function updateBouquetUI() {
    flowerLegend.innerHTML = "";

    state.selected.forEach((flower, index) => {
      const item = document.createElement("div");
      item.className = "legend-item";

      const dot = document.createElement("div");
      dot.className = "legend-dot";
      dot.style.background = flower.type === "white"
        ? "radial-gradient(circle, #fffaf1, #d9dce4)"
        : flower.type === "red"
          ? "radial-gradient(circle, #ef7884, #7b0b20)"
          : "radial-gradient(circle, #fff3ed, #d96b7b 55%, #7a0b22)";

      const text = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = flowerNames[flower.messageIndex];
      const span = document.createElement("span");
      span.textContent = state.selected.length === TARGET
        ? "Toca la flor para leer su mensaje."
        : `Flor ${index + 1} colocada dentro del ramo.`;

      text.appendChild(strong);
      text.appendChild(span);
      item.appendChild(dot);
      item.appendChild(text);
      flowerLegend.appendChild(item);
    });
  }

  function reset() {
    state.selected = [];
    state.pollen = [];
    state.bouquetPollen = [];
    selectedCount.textContent = "0";
    bouquetInstruction.textContent = "Encuentra las flores que brillan";
    bouquetSubtext.textContent = "Las flores elegidas aparecerán aquí.";
    flowerLegend.innerHTML = "";
    messageModal.classList.add("hidden");
    buildField();
  }

  function animate(now) {
    const delta = Math.min(40, now - state.last);
    state.last = now;
    state.time = now;

    renderField(delta);
    drawBouquet(delta);

    requestAnimationFrame(animate);
  }

  enterButton.addEventListener("click", () => {
    state.started = true;
    intro.classList.add("hidden");
  });

  resetButton.addEventListener("click", reset);
  garden.addEventListener("pointerdown", handleGardenPointer);
  bouquetCanvas.addEventListener("pointerdown", handleBouquetPointer);

  closeMessage.addEventListener("click", () => {
    messageModal.classList.add("hidden");
  });

  messageModal.addEventListener("click", event => {
    if (event.target === messageModal) {
      messageModal.classList.add("hidden");
    }
  });

  window.addEventListener("resize", resize, { passive: true });

  resize();
  requestAnimationFrame(animate);
})();
