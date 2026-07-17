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

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    started: false,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    time: 0,
    lastTime: performance.now(),
    pointer: { x: 0, y: 0, active: false },
    selected: [],
    bouquetProgress: 0,
    completed: false,
    target: 5
  };

  targetCountEl.textContent = String(state.target);

  const colors = {
    skyTop: "#1b1219",
    skyBottom: "#09090b",
    soil: "#17100f",
    stem: "#4c633d",
    stemLight: "#78905a",
    leaf: "#385037",
    leafLight: "#6f8d59",
    red: "#a7192d",
    redLight: "#df4354",
    redDeep: "#5f0f20",
    white: "#fff8ef",
    whiteShade: "#d8c8c2",
    pollen: "#f3c26f"
  };

  const flowers = [];
  const motes = [];
  const grass = [];
  const fireflies = [];

  const flowerLayout = [
    { x: 0.11, y: 0.73, s: 0.76, color: "white", selectable: false, phase: 0.8 },
    { x: 0.18, y: 0.68, s: 0.92, color: "red", selectable: true, phase: 2.1 },
    { x: 0.27, y: 0.76, s: 0.70, color: "white", selectable: false, phase: 3.6 },
    { x: 0.34, y: 0.63, s: 1.02, color: "white", selectable: true, phase: 1.4 },
    { x: 0.43, y: 0.72, s: 0.85, color: "red", selectable: false, phase: 4.2 },
    { x: 0.51, y: 0.60, s: 1.10, color: "red", selectable: true, phase: 0.2 },
    { x: 0.60, y: 0.70, s: 0.84, color: "white", selectable: false, phase: 2.8 },
    { x: 0.68, y: 0.64, s: 1.00, color: "white", selectable: true, phase: 5.1 },
    { x: 0.76, y: 0.75, s: 0.72, color: "red", selectable: false, phase: 1.9 },
    { x: 0.83, y: 0.67, s: 0.94, color: "red", selectable: true, phase: 3.2 },
    { x: 0.90, y: 0.74, s: 0.74, color: "white", selectable: false, phase: 4.9 },
    { x: 0.23, y: 0.83, s: 0.62, color: "red", selectable: false, phase: 1.1 },
    { x: 0.39, y: 0.84, s: 0.66, color: "white", selectable: false, phase: 5.7 },
    { x: 0.57, y: 0.82, s: 0.64, color: "red", selectable: false, phase: 2.6 },
    { x: 0.73, y: 0.84, s: 0.67, color: "white", selectable: false, phase: 0.7 }
  ];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    buildScene();
  }

  function buildScene() {
    flowers.length = 0;
    flowerLayout.forEach((item, index) => {
      flowers.push({
        id: index,
        x: item.x * state.width,
        baseY: item.y * state.height,
        scale: item.s * Math.min(state.width / 430, 1.45),
        color: item.color,
        selectable: item.selectable,
        phase: item.phase,
        selected: state.selected.includes(index),
        hover: 0,
        pluck: state.selected.includes(index) ? 1 : 0
      });
    });

    grass.length = 0;
    const grassCount = Math.floor(Math.max(55, state.width / 7));
    for (let i = 0; i < grassCount; i += 1) {
      grass.push({
        x: Math.random() * state.width,
        y: randomBetween(state.height * 0.74, state.height * 0.98),
        h: randomBetween(18, 70),
        lean: randomBetween(-0.8, 0.8),
        alpha: randomBetween(0.14, 0.45),
        phase: randomBetween(0, Math.PI * 2)
      });
    }

    motes.length = 0;
    for (let i = 0; i < 44; i += 1) {
      motes.push({
        x: Math.random() * state.width,
        y: Math.random() * state.height * 0.75,
        r: randomBetween(0.5, 2.1),
        speed: randomBetween(0.05, 0.25),
        drift: randomBetween(-0.15, 0.15),
        phase: randomBetween(0, Math.PI * 2)
      });
    }

    fireflies.length = 0;
    for (let i = 0; i < 12; i += 1) {
      fireflies.push({
        x: Math.random() * state.width,
        y: randomBetween(state.height * 0.3, state.height * 0.78),
        phase: randomBetween(0, Math.PI * 2),
        speed: randomBetween(0.2, 0.55),
        ampX: randomBetween(10, 30),
        ampY: randomBetween(8, 22)
      });
    }
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(0.58, "#120f13");
    gradient.addColorStop(1, colors.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    const lightX = state.width * 0.51 + Math.sin(state.time * 0.00013) * state.width * 0.08;
    const lightY = state.height * 0.24;
    const glow = ctx.createRadialGradient(
      lightX,
      lightY,
      0,
      lightX,
      lightY,
      Math.max(state.width, state.height) * 0.58
    );
    glow.addColorStop(0, "rgba(255, 229, 203, 0.24)");
    glow.addColorStop(0.25, "rgba(206, 119, 112, 0.11)");
    glow.addColorStop(0.72, "rgba(92, 51, 72, 0.035)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.fillStyle = colors.soil;
    ctx.beginPath();
    ctx.moveTo(0, state.height * 0.79);
    ctx.quadraticCurveTo(state.width * 0.46, state.height * 0.72, state.width, state.height * 0.8);
    ctx.lineTo(state.width, state.height);
    ctx.lineTo(0, state.height);
    ctx.closePath();
    ctx.fill();

    const soilGlow = ctx.createLinearGradient(0, state.height * 0.72, 0, state.height);
    soilGlow.addColorStop(0, "rgba(108, 66, 51, 0.16)");
    soilGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = soilGlow;
    ctx.fillRect(0, state.height * 0.7, state.width, state.height * 0.3);
  }

  function drawMotes() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    motes.forEach((mote) => {
      const y = (mote.y - state.time * mote.speed * 0.01) % (state.height * 0.8);
      const drawY = y < 0 ? y + state.height * 0.8 : y;
      const x = mote.x + Math.sin(state.time * 0.0005 + mote.phase) * 10 + state.time * mote.drift * 0.002;
      const alpha = 0.1 + (Math.sin(state.time * 0.0015 + mote.phase) + 1) * 0.08;

      ctx.fillStyle = `rgba(255, 224, 182, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, drawY, mote.r, 0, Math.PI * 2);
      ctx.fill();
    });

    fireflies.forEach((fly) => {
      const x = fly.x + Math.sin(state.time * 0.0007 * fly.speed + fly.phase) * fly.ampX;
      const y = fly.y + Math.cos(state.time * 0.0009 * fly.speed + fly.phase) * fly.ampY;
      const pulse = (Math.sin(state.time * 0.003 + fly.phase) + 1) / 2;

      const g = ctx.createRadialGradient(x, y, 0, x, y, 12 + pulse * 8);
      g.addColorStop(0, `rgba(255, 233, 166, ${0.7 * pulse})`);
      g.addColorStop(0.25, `rgba(255, 201, 110, ${0.3 * pulse})`);
      g.addColorStop(1, "rgba(255, 198, 90, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawGrass() {
    ctx.save();
    ctx.lineCap = "round";

    grass.forEach((blade) => {
      const wind = Math.sin(state.time * 0.0011 + blade.phase) * 6;
      ctx.strokeStyle = `rgba(72, 101, 58, ${blade.alpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(
        blade.x + blade.lean * blade.h * 0.22 + wind * 0.35,
        blade.y - blade.h * 0.52,
        blade.x + blade.lean * blade.h + wind,
        blade.y - blade.h
      );
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawLeaf(x, y, angle, size, sway) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + sway * 0.08);

    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, colors.leaf);
    gradient.addColorStop(0.6, colors.leafLight);
    gradient.addColorStop(1, "rgba(123, 145, 93, 0.4)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.45, -size * 0.18, size, 0);
    ctx.quadraticCurveTo(size * 0.45, size * 0.22, 0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(216, 231, 184, 0.18)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(size * 0.08, 0);
    ctx.lineTo(size * 0.9, 0);
    ctx.stroke();

    ctx.restore();
  }

  function petalPath(length, width) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      -width * 0.65,
      -length * 0.28,
      -width * 0.72,
      -length * 0.72,
      0,
      -length
    );
    ctx.bezierCurveTo(
      width * 0.72,
      -length * 0.72,
      width * 0.65,
      -length * 0.28,
      0,
      0
    );
    ctx.closePath();
  }

  function drawLilyHead(flower, x, y, sway, scaleOverride = 1, alpha = 1) {
    const s = flower.scale * scaleOverride;
    const isWhite = flower.color === "white";
    const pulse = flower.selectable && !flower.selected
      ? 0.5 + Math.sin(state.time * 0.003 + flower.phase) * 0.5
      : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway * 0.04);

    if (flower.selectable && !flower.selected) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const halo = ctx.createRadialGradient(0, -5 * s, 2, 0, -5 * s, (34 + pulse * 10) * s);
      halo.addColorStop(0, isWhite
        ? `rgba(255, 246, 225, ${0.22 + pulse * 0.08})`
        : `rgba(255, 92, 104, ${0.22 + pulse * 0.08})`);
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -4 * s, 48 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const petalLength = 38 * s;
    const petalWidth = 15 * s;
    const rotations = [-1.45, -0.82, -0.18, 0.46, 1.1, 1.72];

    rotations.forEach((rotation, index) => {
      ctx.save();
      ctx.rotate(rotation);
      ctx.translate(0, -1.5 * s);

      const grad = ctx.createLinearGradient(0, 0, 0, -petalLength);
      if (isWhite) {
        grad.addColorStop(0, `rgba(184, 150, 151, ${0.92 * alpha})`);
        grad.addColorStop(0.25, `rgba(237, 224, 218, ${0.98 * alpha})`);
        grad.addColorStop(0.75, `rgba(255, 250, 241, ${alpha})`);
        grad.addColorStop(1, `rgba(255, 255, 250, ${alpha})`);
      } else {
        grad.addColorStop(0, `rgba(86, 10, 28, ${0.98 * alpha})`);
        grad.addColorStop(0.28, `rgba(163, 25, 47, ${alpha})`);
        grad.addColorStop(0.75, `rgba(218, 58, 73, ${alpha})`);
        grad.addColorStop(1, `rgba(239, 101, 111, ${alpha})`);
      }

      ctx.fillStyle = grad;
      petalPath(petalLength * (index % 2 ? 0.95 : 1), petalWidth);
      ctx.fill();

      ctx.strokeStyle = isWhite
        ? `rgba(133, 91, 97, ${0.22 * alpha})`
        : `rgba(255, 176, 170, ${0.2 * alpha})`;
      ctx.lineWidth = Math.max(0.7, s);
      ctx.stroke();

      ctx.strokeStyle = isWhite
        ? `rgba(143, 92, 103, ${0.16 * alpha})`
        : `rgba(255, 202, 184, ${0.18 * alpha})`;
      ctx.lineWidth = 0.6 * s;
      ctx.beginPath();
      ctx.moveTo(0, -4 * s);
      ctx.lineTo(0, -petalLength * 0.78);
      ctx.stroke();

      ctx.fillStyle = isWhite
        ? `rgba(168, 82, 93, ${0.18 * alpha})`
        : `rgba(255, 214, 194, ${0.22 * alpha})`;

      for (let d = 0; d < 5; d += 1) {
        const dotY = -petalLength * (0.3 + d * 0.09);
        const dotX = (d % 2 ? 1 : -1) * (2 + d * 0.7) * s;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 0.7 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.fillStyle = isWhite ? "#e7cfc6" : "#791829";
    ctx.beginPath();
    ctx.arc(0, -3 * s, 7.5 * s, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6 + 0.25;
      const stemLength = 18 * s;
      const endX = Math.cos(a) * stemLength;
      const endY = Math.sin(a) * stemLength - 3 * s;

      ctx.strokeStyle = `rgba(230, 199, 126, ${0.8 * alpha})`;
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(0, -3 * s);
      ctx.quadraticCurveTo(endX * 0.55, endY * 0.55, endX, endY);
      ctx.stroke();

      ctx.fillStyle = `rgba(201, 123, 55, ${0.95 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(endX, endY, 2.5 * s, 1.3 * s, a, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFlower(flower) {
    const swayBase = Math.sin(state.time * 0.001 + flower.phase);
    const swayDetail = Math.sin(state.time * 0.0019 + flower.phase * 1.7) * 0.35;
    const sway = reducedMotion ? 0 : swayBase + swayDetail;
    const stemHeight = 98 * flower.scale;
    const bend = sway * 12 * flower.scale;
    const headX = flower.x + bend;
    const headY = flower.baseY - stemHeight;
    const pluckEase = flower.pluck * flower.pluck * (3 - 2 * flower.pluck);
    const opacity = 1 - pluckEase;

    if (opacity <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineCap = "round";

    const stemGradient = ctx.createLinearGradient(flower.x, flower.baseY, headX, headY);
    stemGradient.addColorStop(0, colors.stem);
    stemGradient.addColorStop(1, colors.stemLight);

    ctx.strokeStyle = stemGradient;
    ctx.lineWidth = Math.max(2, 3.1 * flower.scale);
    ctx.beginPath();
    ctx.moveTo(flower.x, flower.baseY);
    ctx.quadraticCurveTo(
      flower.x + bend * 0.25,
      flower.baseY - stemHeight * 0.45,
      headX,
      headY + 8 * flower.scale
    );
    ctx.stroke();

    drawLeaf(
      flower.x + bend * 0.12,
      flower.baseY - stemHeight * 0.33,
      -2.8 + sway * 0.04,
      34 * flower.scale,
      sway
    );
    drawLeaf(
      flower.x + bend * 0.28,
      flower.baseY - stemHeight * 0.53,
      -0.35 + sway * 0.03,
      31 * flower.scale,
      sway
    );

    drawLilyHead(flower, headX, headY, sway, 1 - pluckEase * 0.1, opacity);

    ctx.restore();
  }

  function drawBouquet() {
    if (state.selected.length === 0) return;

    const centerX = state.width * 0.5;
    const bottomY = state.height * 1.02;
    const targetY = state.height * 0.8;
    const progress = state.bouquetProgress;
    const rise = bottomY + (targetY - bottomY) * progress;

    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.4);

    const wrapTopY = rise - 68;
    const wrapBottomY = rise + 70;

    const stemPositions = [
      -34, -17, 0, 18, 35, -9, 10
    ];

    state.selected.forEach((flowerId, index) => {
      const flower = flowers.find((item) => item.id === flowerId);
      if (!flower) return;

      const offset = stemPositions[index] || 0;
      const topX = centerX + offset * 1.35;
      const topY = rise - 104 - Math.abs(offset) * 0.22 - (index % 2) * 8;
      const sway = reducedMotion ? 0 : Math.sin(state.time * 0.0014 + index) * 0.4;

      ctx.strokeStyle = colors.stemLight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX + offset * 0.25, wrapBottomY);
      ctx.quadraticCurveTo(centerX + offset * 0.7, rise - 10, topX, topY + 18);
      ctx.stroke();

      drawLeaf(centerX + offset * 0.6, rise - 12, index % 2 ? -2.7 : -0.4, 31, sway);
      drawLilyHead(flower, topX, topY, sway, 0.92, 1);
    });

    ctx.fillStyle = "rgba(224, 194, 172, 0.86)";
    ctx.beginPath();
    ctx.moveTo(centerX - 70, wrapTopY);
    ctx.quadraticCurveTo(centerX, rise - 35, centerX + 70, wrapTopY);
    ctx.lineTo(centerX + 42, wrapBottomY);
    ctx.quadraticCurveTo(centerX, wrapBottomY + 26, centerX - 42, wrapBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 246, 235, 0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = "rgba(128, 54, 64, 0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX - 42, rise + 28);
    ctx.quadraticCurveTo(centerX, rise + 38, centerX + 42, rise + 28);
    ctx.stroke();

    ctx.fillStyle = "rgba(150, 47, 61, 0.95)";
    ctx.beginPath();
    ctx.ellipse(centerX - 18, rise + 31, 19, 9, -0.35, 0, Math.PI * 2);
    ctx.ellipse(centerX + 18, rise + 31, 19, 9, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function updateHover() {
    flowers.forEach((flower) => {
      if (!flower.selectable || flower.selected || !state.started) {
        flower.hover += (0 - flower.hover) * 0.08;
        return;
      }

      const sway = reducedMotion ? 0 : Math.sin(state.time * 0.001 + flower.phase);
      const headX = flower.x + sway * 12 * flower.scale;
      const headY = flower.baseY - 98 * flower.scale;
      const distance = Math.hypot(state.pointer.x - headX, state.pointer.y - headY);
      const target = distance < 50 * flower.scale ? 1 : 0;
      flower.hover += (target - flower.hover) * 0.12;
    });
  }

  function update(dt) {
    state.time += dt;
    updateHover();

    flowers.forEach((flower) => {
      const target = flower.selected ? 1 : 0;
      flower.pluck += (target - flower.pluck) * Math.min(1, dt * 0.008);
    });

    const bouquetTarget = state.selected.length > 0 ? 1 : 0;
    state.bouquetProgress += (bouquetTarget - state.bouquetProgress) * Math.min(1, dt * 0.0045);
  }

  function draw() {
    drawBackground();
    drawMotes();
    drawGrass();

    [...flowers]
      .sort((a, b) => a.baseY - b.baseY)
      .forEach(drawFlower);

    drawBouquet();
  }

  function frame(now) {
    const dt = Math.min(40, now - state.lastTime);
    state.lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(frame);
  }

  function findFlowerAt(x, y) {
    let best = null;
    let bestDistance = Infinity;

    flowers.forEach((flower) => {
      if (!flower.selectable || flower.selected) return;

      const sway = reducedMotion ? 0 : Math.sin(state.time * 0.001 + flower.phase);
      const headX = flower.x + sway * 12 * flower.scale;
      const headY = flower.baseY - 98 * flower.scale;
      const distance = Math.hypot(x - headX, y - headY);
      const radius = 48 * flower.scale;

      if (distance < radius && distance < bestDistance) {
        best = flower;
        bestDistance = distance;
      }
    });

    return best;
  }

  function selectFlower(flower) {
    if (!flower || flower.selected || state.completed) return;

    flower.selected = true;
    state.selected.push(flower.id);
    selectedCountEl.textContent = String(state.selected.length);

    createSelectionSparkles(
      flower.x,
      flower.baseY - 98 * flower.scale,
      flower.color === "white" ? "#fff2dd" : "#ff6e7d"
    );

    if (navigator.vibrate) {
      navigator.vibrate(18);
    }

    if (state.selected.length >= state.target) {
      state.completed = true;
      hint.classList.add("hidden");

      window.setTimeout(() => {
        messagePanel.classList.remove("hidden");
      }, 900);
    }
  }

  const sparkles = [];

  function createSelectionSparkles(x, y, color) {
    for (let i = 0; i < 18; i += 1) {
      sparkles.push({
        x,
        y,
        vx: randomBetween(-1.8, 1.8),
        vy: randomBetween(-2.6, -0.3),
        life: 1,
        color,
        size: randomBetween(1.2, 3)
      });
    }
  }

  const originalDrawMotes = drawMotes;
  drawMotes = function drawMotesWithSparkles() {
    originalDrawMotes();

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = sparkles.length - 1; i >= 0; i -= 1) {
      const p = sparkles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.025;
      p.life -= 0.018;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) sparkles.splice(i, 1);
    }

    ctx.restore();
  };

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
  }

  function handlePointerMove(event) {
    const pos = pointerPosition(event);
    state.pointer.x = pos.x;
    state.pointer.y = pos.y;
    state.pointer.active = true;
  }

  function handlePointerDown(event) {
    if (!state.started) return;
    const pos = pointerPosition(event);
    const flower = findFlowerAt(pos.x, pos.y);
    selectFlower(flower);
  }

  function resetGarden() {
    state.selected = [];
    state.completed = false;
    state.bouquetProgress = 0;
    selectedCountEl.textContent = "0";
    messagePanel.classList.add("hidden");

    flowers.forEach((flower) => {
      flower.selected = false;
      flower.pluck = 0;
    });

    hint.classList.remove("hidden");
  }

  enterButton.addEventListener("click", () => {
    state.started = true;
    intro.classList.add("is-leaving");

    window.setTimeout(() => {
      intro.classList.add("hidden");
      hud.classList.remove("hidden");
      hint.classList.remove("hidden");
    }, 500);
  });

  resetButton.addEventListener("click", resetGarden);

  closeMessage.addEventListener("click", () => {
    messagePanel.classList.add("hidden");
  });

  canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
  canvas.addEventListener("pointerdown", handlePointerDown, { passive: true });

  canvas.addEventListener("touchmove", handlePointerMove, { passive: true });
  canvas.addEventListener("touchstart", handlePointerDown, { passive: true });

  window.addEventListener("resize", resize);

  resize();
  requestAnimationFrame(frame);
})();
