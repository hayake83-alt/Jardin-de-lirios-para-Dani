(() => {
  "use strict";

  const garden = document.getElementById("garden");
  const ctx = garden.getContext("2d");
  const bouquetCanvas = document.getElementById("bouquetCanvas");
  const bouquetCtx = bouquetCanvas.getContext("2d");

  const intro = document.getElementById("intro");
  const enterButton = document.getElementById("enterButton");
  const hud = document.getElementById("hud");
  const resetButton = document.getElementById("resetButton");
  const selectedCount = document.getElementById("selectedCount");
  const targetCount = document.getElementById("targetCount");
  const hint = document.getElementById("hint");

  const flowerMessage = document.getElementById("flowerMessage");
  const flowerMessageText = document.getElementById("flowerMessageText");
  const closeFlowerMessage = document.getElementById("closeFlowerMessage");

  const bouquetStage = document.getElementById("bouquetStage");
  const returnToField = document.getElementById("returnToField");

  const DPR_LIMIT = 1.65;
  const TARGET = 7;

  const messages = [
    "Tu forma de cuidar a quienes amas se siente como un lugar seguro.",
    "Aunque a veces escondas lo que sientes, dentro de ti hay un mundo inmenso.",
    "Amas con una fuerza que vuelve especiales incluso los días más pequeños.",
    "Tu ternura vive en los detalles, en la atención y en la forma en que permaneces.",
    "Incluso cuando tienes miedo, sigues intentando acercarte a lo que quieres.",
    "Hay algo profundamente dulce en tu manera de mirar el mundo.",
    "Eres como este lirio: delicado a primera vista y lleno de vida por dentro."
  ];

  const state = {
    started: false,
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    flowers: [],
    grass: [],
    motes: [],
    pollen: [],
    selected: [],
    pointer: { x: 0, y: 0 },
    bouquetMode: false,
    bouquetHitAreas: []
  };

  targetCount.textContent = String(TARGET);

  class RNG {
    constructor(seed = 917351) {
      this.seed = seed >>> 0;
    }
    next() {
      this.seed = (1664525 * this.seed + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }
    range(min, max) {
      return min + (max - min) * this.next();
    }
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }
  }

  const rng = new RNG();

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height, dpr };
  }

  function resize() {
    const g = resizeCanvas(garden, ctx);
    state.width = g.width;
    state.height = g.height;
    state.dpr = g.dpr;

    resizeCanvas(bouquetCanvas, bouquetCtx);

    buildScene();
  }

  function buildScene() {
    const w = state.width;
    const h = state.height;
    if (!w || !h) return;

    state.flowers = [];
    state.grass = [];
    state.motes = [];

    const isPhone = w < 700;
    const flowerCount = isPhone ? 155 : 245;
    const grassCount = isPhone ? 520 : 880;
    const horizon = h * 0.37;

    for (let i = 0; i < grassCount; i++) {
      const depth = rng.range(0, 1);
      const y = horizon + Math.pow(depth, 1.35) * (h - horizon);
      const scale = 0.18 + depth * 1.18;
      state.grass.push({
        x: rng.range(-20, w + 20),
        y,
        h: rng.range(18, 54) * scale,
        lean: rng.range(-0.35, 0.35),
        phase: rng.range(0, Math.PI * 2),
        depth,
        tone: rng.range(0, 1)
      });
    }

    const candidates = [];
    for (let i = 0; i < flowerCount; i++) {
      const depth = rng.range(0, 1);
      const y = horizon + Math.pow(depth, 1.5) * (h - horizon - 8);
      const perspective = 0.28 + depth * 1.18;
      const x = rng.range(-30, w + 30);
      const size = rng.range(13, 23) * perspective;
      const typeRoll = rng.next();
      const type = typeRoll < 0.38 ? "white" : typeRoll < 0.72 ? "red" : "gradient";

      const flower = {
        id: i,
        x,
        y,
        depth,
        size,
        stem: rng.range(32, 68) * perspective,
        phase: rng.range(0, Math.PI * 2),
        speed: rng.range(0.65, 1.15),
        type,
        rotation: rng.range(-0.35, 0.35),
        eligible: false,
        selected: false,
        messageIndex: -1,
        glowPhase: rng.range(0, Math.PI * 2)
      };
      state.flowers.push(flower);

      if (depth > 0.38 && depth < 0.88 && x > w * 0.08 && x < w * 0.92) {
        candidates.push(flower);
      }
    }

    candidates.sort((a, b) => a.x - b.x);
    const chosen = [];
    const segments = TARGET;
    for (let i = 0; i < segments; i++) {
      const targetX = w * (0.13 + (i / (segments - 1)) * 0.74);
      let best = null;
      let bestScore = Infinity;
      for (const f of candidates) {
        if (chosen.includes(f)) continue;
        const score =
          Math.abs(f.x - targetX) +
          Math.abs(f.depth - (0.57 + (i % 2) * 0.11)) * 180;
        if (score < bestScore) {
          best = f;
          bestScore = score;
        }
      }
      if (best) chosen.push(best);
    }

    chosen.forEach((flower, index) => {
      flower.eligible = true;
      flower.messageIndex = index;
      flower.size *= 1.12;
    });

    for (let i = 0; i < 70; i++) {
      state.motes.push({
        x: rng.range(0, w),
        y: rng.range(horizon * 0.4, h),
        r: rng.range(0.5, 2),
        phase: rng.range(0, Math.PI * 2),
        speed: rng.range(0.08, 0.32),
        alpha: rng.range(0.08, 0.32)
      });
    }

    state.flowers.sort((a, b) => a.depth - b.depth);
  }

  function roundedHill(context, x, y, rx, ry, color) {
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(x, y, rx, ry, 0, Math.PI, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawBackground() {
    const w = state.width;
    const h = state.height;
    const horizon = h * 0.37;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon + 40);
    sky.addColorStop(0, "#160c18");
    sky.addColorStop(0.48, "#3b1521");
    sky.addColorStop(0.78, "#8b3a42");
    sky.addColorStop(1, "#d99b8e");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const moonGlow = ctx.createRadialGradient(w * 0.74, h * 0.17, 0, w * 0.74, h * 0.17, Math.min(w, h) * 0.28);
    moonGlow.addColorStop(0, "rgba(255,238,220,.65)");
    moonGlow.addColorStop(0.25, "rgba(255,204,190,.22)");
    moonGlow.addColorStop(1, "rgba(255,180,170,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, w, h * 0.55);

    const ground = ctx.createLinearGradient(0, horizon - 5, 0, h);
    ground.addColorStop(0, "#25331c");
    ground.addColorStop(0.35, "#192514");
    ground.addColorStop(1, "#070d08");
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon - 2, w, h - horizon + 2);

    roundedHill(ctx, w * 0.15, horizon + 15, w * 0.34, h * 0.15, "rgba(18,27,17,.95)");
    roundedHill(ctx, w * 0.53, horizon + 18, w * 0.40, h * 0.14, "rgba(25,34,20,.95)");
    roundedHill(ctx, w * 0.91, horizon + 18, w * 0.35, h * 0.15, "rgba(14,24,17,.98)");

    const fog = ctx.createLinearGradient(0, horizon - 38, 0, horizon + 85);
    fog.addColorStop(0, "rgba(255,229,218,0)");
    fog.addColorStop(0.46, "rgba(255,225,216,.25)");
    fog.addColorStop(0.70, "rgba(255,225,216,.08)");
    fog.addColorStop(1, "rgba(255,225,216,0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, horizon - 50, w, 150);
  }

  function windAt(y, phase, multiplier = 1) {
    const depth = Math.max(0, Math.min(1, (y - state.height * 0.35) / (state.height * 0.65)));
    return (
      Math.sin(state.time * 0.00115 + phase) * (2 + depth * 6) +
      Math.sin(state.time * 0.00046 + phase * 2.3) * (1.2 + depth * 2.4)
    ) * multiplier;
  }

  function drawGrass() {
    for (const blade of state.grass) {
      const sway = windAt(blade.y, blade.phase, 0.55);
      const shade = blade.tone < 0.5
        ? `rgba(52, ${78 + Math.round(blade.depth * 35)}, 38, ${0.35 + blade.depth * 0.40})`
        : `rgba(75, ${98 + Math.round(blade.depth * 42)}, 47, ${0.26 + blade.depth * 0.40})`;

      ctx.strokeStyle = shade;
      ctx.lineWidth = 0.65 + blade.depth * 1.2;
      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(
        blade.x + blade.lean * blade.h + sway * 0.35,
        blade.y - blade.h * 0.58,
        blade.x + blade.lean * blade.h + sway,
        blade.y - blade.h
      );
      ctx.stroke();
    }
  }

  function petalPalette(type, gradientT) {
    if (type === "white") {
      return {
        inner: "#fff7ed",
        middle: "#f5ede7",
        edge: "#d9d9df",
        vein: "rgba(117,19,40,.26)"
      };
    }

    if (type === "red") {
      return {
        inner: "#ffd5c8",
        middle: "#c92543",
        edge: "#690719",
        vein: "rgba(255,221,206,.45)"
      };
    }

    const red = Math.max(0, Math.min(1, gradientT));
    return {
      inner: "#fff2e9",
      middle: red < 0.5 ? "#f4d8d4" : "#dc5263",
      edge: red < 0.45 ? "#b7203c" : "#74091e",
      vein: "rgba(109,9,32,.34)"
    };
  }

  function drawPetal(context, length, width, rotation, palette, type, alpha = 1) {
    context.save();
    context.rotate(rotation);

    const grad = context.createLinearGradient(0, 3, 0, -length);
    if (type === "gradient") {
      grad.addColorStop(0, palette.inner);
      grad.addColorStop(0.40, palette.middle);
      grad.addColorStop(1, palette.edge);
    } else {
      grad.addColorStop(0, palette.inner);
      grad.addColorStop(0.45, palette.middle);
      grad.addColorStop(1, palette.edge);
    }

    context.globalAlpha = alpha;
    context.fillStyle = grad;
    context.strokeStyle = type === "white" ? "rgba(103,77,83,.28)" : "rgba(255,228,220,.22)";
    context.lineWidth = Math.max(0.55, width * 0.035);

    context.beginPath();
    context.moveTo(0, 2);
    context.bezierCurveTo(-width * 0.74, -length * 0.20, -width * 0.78, -length * 0.64, 0, -length);
    context.bezierCurveTo(width * 0.78, -length * 0.64, width * 0.74, -length * 0.20, 0, 2);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = palette.vein;
    context.lineWidth = Math.max(0.45, width * 0.026);
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(width * 0.08, -length * 0.46, 0, -length * 0.83);
    context.stroke();

    context.restore();
  }

  function drawLily(context, flower, x, y, scale = 1, bouquet = false) {
    const size = flower.size * scale;
    const sway = bouquet ? Math.sin(state.time * 0.001 + flower.phase) * 1.6 : windAt(y, flower.phase, flower.speed);
    const headX = x + sway;
    const headY = y - flower.stem * scale;
    const pulse = 0.74 + Math.sin(state.time * 0.0032 + flower.glowPhase) * 0.18;

    if (flower.eligible && !flower.selected && !bouquet) {
      const glow = context.createRadialGradient(headX, headY, 0, headX, headY, size * 2.8);
      glow.addColorStop(0, `rgba(255,244,219,${0.34 * pulse})`);
      glow.addColorStop(0.34, `rgba(255,94,113,${0.22 * pulse})`);
      glow.addColorStop(1, "rgba(255,80,110,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(headX, headY, size * 2.8, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = `rgba(255,225,201,${0.52 + pulse * 0.28})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(headX, headY, size * (1.42 + 0.08 * Math.sin(state.time * 0.004 + flower.phase)), 0, Math.PI * 2);
      context.stroke();
    }

    context.save();
    context.strokeStyle = bouquet ? "#476438" : `rgba(52,88,42,${0.54 + flower.depth * 0.42})`;
    context.lineWidth = Math.max(1, size * 0.11);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, y + 4);
    context.quadraticCurveTo(x + sway * 0.35, y - flower.stem * scale * 0.52, headX, headY + size * 0.18);
    context.stroke();

    const leafY = y - flower.stem * scale * 0.35;
    context.fillStyle = bouquet ? "rgba(58,105,49,.93)" : "rgba(43,82,38,.86)";
    context.beginPath();
    context.moveTo(x + sway * 0.15, leafY);
    context.quadraticCurveTo(x - size * 0.9, leafY - size * 0.15, x - size * 0.25, leafY - size * 1.15);
    context.quadraticCurveTo(x + size * 0.02, leafY - size * 0.55, x + sway * 0.15, leafY);
    context.fill();
    context.restore();

    context.save();
    context.translate(headX, headY);
    context.rotate(flower.rotation + sway * 0.003);

    const petalCount = 6;
    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount;
      const palette = petalPalette(flower.type, i / (petalCount - 1));
      drawPetal(
        context,
        size * (1.05 + (i % 2) * 0.08),
        size * 0.52,
        angle,
        palette,
        flower.type,
        1
      );
    }

    context.fillStyle = flower.type === "red" ? "#ffd09c" : "#f3d79e";
    context.beginPath();
    context.arc(0, 0, size * 0.20, 0, Math.PI * 2);
    context.fill();

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + 0.25;
      const len = size * (0.54 + (i % 2) * 0.08);
      context.strokeStyle = "rgba(245,215,155,.94)";
      context.lineWidth = Math.max(0.6, size * 0.045);
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      context.stroke();

      context.fillStyle = "#582018";
      context.beginPath();
      context.ellipse(
        Math.cos(a) * len,
        Math.sin(a) * len,
        size * 0.055,
        size * 0.10,
        a,
        0,
        Math.PI * 2
      );
      context.fill();
    }

    context.restore();

    return {
      x: headX,
      y: headY,
      r: size * 1.45
    };
  }

  function drawFlowers() {
    for (const flower of state.flowers) {
      if (flower.selected) continue;
      drawLily(ctx, flower, flower.x, flower.y, 1, false);
    }
  }

  function drawMotes() {
    for (const mote of state.motes) {
      const y = mote.y + Math.sin(state.time * mote.speed * 0.01 + mote.phase) * 10;
      const x = mote.x + Math.sin(state.time * 0.0003 + mote.phase) * 16;
      ctx.fillStyle = `rgba(255,226,179,${mote.alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnPollen(x, y, amount = 34, strong = false) {
    for (let i = 0; i < amount; i++) {
      const angle = rng.range(-Math.PI, Math.PI);
      const speed = rng.range(strong ? 0.45 : 0.25, strong ? 2.2 : 1.45);
      state.pollen.push({
        x,
        y,
        vx: Math.cos(angle) * speed + rng.range(-0.2, 0.6),
        vy: Math.sin(angle) * speed - rng.range(0.2, 1.15),
        life: rng.range(650, 1350),
        maxLife: 1350,
        r: rng.range(1.1, strong ? 3 : 2.2),
        glow: strong
      });
    }
  }

  function updateAndDrawPollen(delta) {
    for (let i = state.pollen.length - 1; i >= 0; i--) {
      const p = state.pollen[i];
      p.life -= delta;
      if (p.life <= 0) {
        state.pollen.splice(i, 1);
        continue;
      }
      p.vx += 0.00008 * delta;
      p.vy += 0.00012 * delta;
      p.x += p.vx * (delta / 16.67);
      p.y += p.vy * (delta / 16.67);

      const alpha = Math.min(1, p.life / 420);
      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255,216,143,.9)";
      }
      ctx.fillStyle = `rgba(255,220,142,${alpha * 0.86})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function renderGarden(delta) {
    drawBackground();
    drawMotes();
    drawGrass();
    drawFlowers();
    updateAndDrawPollen(delta);
  }

  function hitFlower(x, y) {
    const reverse = [...state.flowers].reverse();
    let nearest = null;
    let nearestDistance = Infinity;

    for (const flower of reverse) {
      if (flower.selected) continue;
      const sway = windAt(flower.y, flower.phase, flower.speed);
      const hx = flower.x + sway;
      const hy = flower.y - flower.stem;
      const radius = Math.max(18, flower.size * 1.65);
      const distance = Math.hypot(x - hx, y - hy);
      if (distance <= radius && distance < nearestDistance) {
        nearest = flower;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function showFlowerMessage(index) {
    flowerMessageText.textContent = messages[index];
    flowerMessage.classList.remove("hidden");
  }

  function closeMessage() {
    flowerMessage.classList.add("hidden");
  }

  function selectFlower(flower) {
    if (!flower.eligible || flower.selected) return;
    flower.selected = true;
    state.selected.push(flower);
    selectedCount.textContent = String(state.selected.length);

    showFlowerMessage(flower.messageIndex);

    if (state.selected.length === TARGET) {
      setTimeout(() => {
        closeMessage();
        openBouquet();
      }, 1250);
    }
  }

  function handleGardenPointer(event) {
    if (!state.started || state.bouquetMode || !flowerMessage.classList.contains("hidden")) return;

    const rect = garden.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const flower = hitFlower(x, y);

    if (!flower) {
      spawnPollen(x, y, 12, false);
      return;
    }

    const sway = windAt(flower.y, flower.phase, flower.speed);
    const hx = flower.x + sway;
    const hy = flower.y - flower.stem;

    spawnPollen(hx, hy, flower.eligible ? 48 : 30, flower.eligible);

    if (flower.eligible) {
      selectFlower(flower);
    }
  }

  function openBouquet() {
    state.bouquetMode = true;
    bouquetStage.classList.remove("hidden");
    hud.classList.add("hidden");
    hint.classList.add("hidden");
    state.bouquetHitAreas = [];
  }

  function closeBouquet() {
    state.bouquetMode = false;
    bouquetStage.classList.add("hidden");
    hud.classList.remove("hidden");
    hint.classList.remove("hidden");
  }

  function drawBouquetBackground() {
    const rect = bouquetCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    bouquetCtx.clearRect(0, 0, w, h);

    const glow = bouquetCtx.createRadialGradient(w * 0.5, h * 0.47, 0, w * 0.5, h * 0.47, Math.min(w, h) * 0.48);
    glow.addColorStop(0, "rgba(132,30,48,.38)");
    glow.addColorStop(0.45, "rgba(75,11,25,.17)");
    glow.addColorStop(1, "rgba(6,4,7,0)");
    bouquetCtx.fillStyle = glow;
    bouquetCtx.fillRect(0, 0, w, h);

    for (let i = 0; i < 44; i++) {
      const x = (i * 97.37) % w;
      const y = ((i * 53.11) % h);
      const alpha = 0.08 + ((i % 7) / 7) * 0.18;
      bouquetCtx.fillStyle = `rgba(255,222,177,${alpha})`;
      bouquetCtx.beginPath();
      bouquetCtx.arc(x, y, 0.7 + (i % 3) * 0.5, 0, Math.PI * 2);
      bouquetCtx.fill();
    }
  }

  function renderBouquet() {
    if (!state.bouquetMode) return;

    const rect = bouquetCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    drawBouquetBackground();

    const centerX = w * 0.5;
    const baseY = Math.min(h * 0.82, h - 115);
    const available = Math.min(w * 0.78, 430);
    const scale = Math.max(0.72, Math.min(1.08, available / 380));

    const layout = [
      { x: -112, y: 13, s: 0.90, r: -0.20 },
      { x: -75, y: -25, s: 1.00, r: -0.13 },
      { x: -35, y: 8, s: 0.94, r: -0.07 },
      { x: 0, y: -55, s: 1.08, r: 0 },
      { x: 38, y: 6, s: 0.95, r: 0.07 },
      { x: 78, y: -23, s: 1.00, r: 0.13 },
      { x: 113, y: 15, s: 0.90, r: 0.20 }
    ];

    state.bouquetHitAreas = [];

    for (let i = 0; i < state.selected.length; i++) {
      const source = state.selected[i];
      const pos = layout[i];
      const flower = {
        ...source,
        selected: false,
        eligible: false,
        rotation: pos.r,
        stem: 175 * scale,
        size: 25 * pos.s * scale
      };
      const x = centerX + pos.x * scale;
      const y = baseY + pos.y * scale;
      const hit = drawLily(bouquetCtx, flower, x, y, 1, true);
      state.bouquetHitAreas.push({
        x: hit.x,
        y: hit.y,
        r: Math.max(24, hit.r),
        messageIndex: source.messageIndex
      });
    }

    bouquetCtx.save();
    bouquetCtx.translate(centerX, baseY - 4);
    bouquetCtx.rotate(-0.03);
    bouquetCtx.fillStyle = "rgba(205,164,122,.92)";
    bouquetCtx.beginPath();
    bouquetCtx.moveTo(-44 * scale, -10 * scale);
    bouquetCtx.lineTo(44 * scale, -10 * scale);
    bouquetCtx.lineTo(27 * scale, 112 * scale);
    bouquetCtx.lineTo(-25 * scale, 112 * scale);
    bouquetCtx.closePath();
    bouquetCtx.fill();

    bouquetCtx.fillStyle = "#86172e";
    bouquetCtx.beginPath();
    bouquetCtx.ellipse(0, 19 * scale, 48 * scale, 13 * scale, 0, 0, Math.PI * 2);
    bouquetCtx.fill();

    bouquetCtx.fillStyle = "#a92944";
    bouquetCtx.beginPath();
    bouquetCtx.moveTo(-7 * scale, 20 * scale);
    bouquetCtx.bezierCurveTo(-44 * scale, -10 * scale, -58 * scale, 31 * scale, -14 * scale, 36 * scale);
    bouquetCtx.bezierCurveTo(-35 * scale, 57 * scale, -5 * scale, 62 * scale, 7 * scale, 28 * scale);
    bouquetCtx.fill();

    bouquetCtx.beginPath();
    bouquetCtx.moveTo(7 * scale, 20 * scale);
    bouquetCtx.bezierCurveTo(44 * scale, -10 * scale, 58 * scale, 31 * scale, 14 * scale, 36 * scale);
    bouquetCtx.bezierCurveTo(35 * scale, 57 * scale, 5 * scale, 62 * scale, -7 * scale, 28 * scale);
    bouquetCtx.fill();
    bouquetCtx.restore();
  }

  function handleBouquetPointer(event) {
    if (!state.bouquetMode || !flowerMessage.classList.contains("hidden")) return;

    const rect = bouquetCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let hit = null;
    let distance = Infinity;
    for (const area of state.bouquetHitAreas) {
      const d = Math.hypot(x - area.x, y - area.y);
      if (d <= area.r && d < distance) {
        hit = area;
        distance = d;
      }
    }

    if (!hit) return;

    spawnBouquetPollen(hit.x, hit.y);
    showFlowerMessage(hit.messageIndex);
  }

  const bouquetPollen = [];

  function spawnBouquetPollen(x, y) {
    for (let i = 0; i < 55; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.2;
      bouquetPollen.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 0.8,
        life: 1000 + Math.random() * 600,
        r: 1 + Math.random() * 2.2
      });
    }
  }

  function drawBouquetPollen(delta) {
    for (let i = bouquetPollen.length - 1; i >= 0; i--) {
      const p = bouquetPollen[i];
      p.life -= delta;
      if (p.life <= 0) {
        bouquetPollen.splice(i, 1);
        continue;
      }
      p.vy += 0.015;
      p.x += p.vx;
      p.y += p.vy;
      const a = Math.min(1, p.life / 400);
      bouquetCtx.shadowBlur = 9;
      bouquetCtx.shadowColor = "rgba(255,213,126,.9)";
      bouquetCtx.fillStyle = `rgba(255,221,147,${a})`;
      bouquetCtx.beginPath();
      bouquetCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bouquetCtx.fill();
      bouquetCtx.shadowBlur = 0;
    }
  }

  function resetExperience() {
    state.selected = [];
    state.pollen = [];
    state.bouquetMode = false;
    selectedCount.textContent = "0";
    flowerMessage.classList.add("hidden");
    bouquetStage.classList.add("hidden");
    hud.classList.remove("hidden");
    hint.classList.remove("hidden");
    buildScene();
  }

  let last = performance.now();

  function animate(now) {
    const delta = Math.min(40, now - last);
    last = now;
    state.time = now;

    renderGarden(delta);

    if (state.bouquetMode) {
      renderBouquet();
      drawBouquetPollen(delta);
    }

    requestAnimationFrame(animate);
  }

  enterButton.addEventListener("click", () => {
    state.started = true;
    intro.classList.add("hidden");
    hud.classList.remove("hidden");
    hint.classList.remove("hidden");
  });

  garden.addEventListener("pointerdown", handleGardenPointer);
  bouquetCanvas.addEventListener("pointerdown", handleBouquetPointer);

  closeFlowerMessage.addEventListener("click", closeMessage);
  flowerMessage.addEventListener("click", (event) => {
    if (event.target === flowerMessage) closeMessage();
  });

  resetButton.addEventListener("click", resetExperience);
  returnToField.addEventListener("click", closeBouquet);

  window.addEventListener("resize", resize, { passive: true });

  resize();
  requestAnimationFrame(animate);
})();
