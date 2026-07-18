(() => {
  "use strict";

  const effectsCanvas = document.getElementById("effectsCanvas");
  const ctx = effectsCanvas.getContext("2d");

  const bouquetEffectsCanvas = document.getElementById("bouquetEffectsCanvas");
  const bouquetCtx = bouquetEffectsCanvas.getContext("2d");

  const fieldScene = document.getElementById("fieldScene");
  const bouquetScene = document.getElementById("bouquetScene");

  const foregroundFlowers = document.getElementById("foregroundFlowers");
  const bouquetFlowers = document.getElementById("bouquetFlowers");

  const intro = document.getElementById("intro");
  const enterButton = document.getElementById("enterButton");

  const resetButton = document.getElementById("resetButton");
  const backButton = document.getElementById("backButton");

  const selectedCount = document.getElementById("selectedCount");

  const flowerInfoList = document.getElementById("flowerInfoList");

  const messageModal = document.getElementById("messageModal");
  const messageTitle = document.getElementById("messageTitle");
  const messageText = document.getElementById("messageText");
  const closeMessage = document.getElementById("closeMessage");

  const TARGET = 7;
  const DPR_LIMIT = 1.7;

  const FLOWER_DATA = [
    {
      name: "Lirio rojo",
      kind: "red",
      note: "Intensidad y amor profundo.",
      message: "Tu manera de amar tiene una fuerza que se queda conmigo."
    },
    {
      name: "Lirio blanco",
      kind: "white",
      note: "Calma y ternura silenciosa.",
      message: "Hay una paz especial en la forma en que cuidas a quienes quieres."
    },
    {
      name: "Lirio degradado",
      kind: "gradient",
      note: "Dulzura y fuerza.",
      message: "En ti pueden existir al mismo tiempo la delicadeza y una fuerza inmensa."
    },
    {
      name: "Lirio rojo intenso",
      kind: "red",
      note: "Una forma de amar verdadera.",
      message: "Cuando amas, lo haces con una profundidad que se siente incluso en los silencios."
    },
    {
      name: "Lirio blanco puro",
      kind: "white",
      note: "Serenidad y refugio.",
      message: "Tu presencia puede sentirse como un lugar tranquilo al que siempre dan ganas de volver."
    },
    {
      name: "Lirio rosado",
      kind: "gradient",
      note: "Ternura y sensibilidad.",
      message: "Tu ternura aparece en detalles pequeños que terminan significándolo todo."
    },
    {
      name: "Lirio especial",
      kind: "gradient",
      note: "Todas tus formas de querer.",
      message: "No eres una sola flor: eres el jardín entero que aparece cuando alguien aprende a conocerte."
    }
  ];

  const FLOWER_POSITIONS = [
    { x: 13, y: 75, scale: 0.90 },
    { x: 27, y: 63, scale: 0.76 },
    { x: 40, y: 76, scale: 1.00 },
    { x: 54, y: 61, scale: 0.76 },
    { x: 66, y: 73, scale: 0.94 },
    { x: 79, y: 63, scale: 0.78 },
    { x: 89, y: 76, scale: 0.98 }
  ];

  const BOUQUET_POSITIONS = [
    { left: 22, top: 35, scale: .90, rotate: -15 },
    { left: 34, top: 21, scale: .96, rotate: -9 },
    { left: 42, top: 38, scale: .92, rotate: -5 },
    { left: 50, top: 13, scale: 1.05, rotate: 0 },
    { left: 58, top: 37, scale: .92, rotate: 5 },
    { left: 67, top: 21, scale: .96, rotate: 9 },
    { left: 79, top: 35, scale: .90, rotate: 15 }
  ];

  const state = {
    started: false,
    scene: "field",
    width: 0,
    height: 0,
    bouquetWidth: 0,
    bouquetHeight: 0,
    time: 0,
    lastTime: performance.now(),

    selected: [],

    stars: [],
    fireflies: [],
    pollen: [],
    bouquetPollen: [],

    flowerElements: [],
    bouquetFlowerElements: []
  };

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
      width: rect.width,
      height: rect.height
    };
  }

  function resize() {
    const fieldSize = resizeCanvas(effectsCanvas, ctx);
    const bouquetSize = resizeCanvas(bouquetEffectsCanvas, bouquetCtx);

    state.width = fieldSize.width;
    state.height = fieldSize.height;

    state.bouquetWidth = bouquetSize.width;
    state.bouquetHeight = bouquetSize.height;

    buildParticles();
  }

  function buildParticles() {
    state.stars = [];
    state.fireflies = [];

    const starCount = state.width < 700 ? 45 : 80;
    const fireflyCount = state.width < 700 ? 34 : 60;

    for (let i = 0; i < starCount; i++) {
      state.stars.push({
        x: Math.random() * state.width,
        y: Math.random() * state.height * 0.38,
        radius: 0.4 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0012 + Math.random() * 0.0021,
        strength: 0.28 + Math.random() * 0.62
      });
    }

    for (let i = 0; i < fireflyCount; i++) {
      state.fireflies.push({
        x: Math.random() * state.width,
        y: state.height * (0.38 + Math.random() * 0.58),
        radius: 0.8 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        drift: 4 + Math.random() * 13,
        speed: 0.00025 + Math.random() * 0.00045,
        strength: 0.18 + Math.random() * 0.48
      });
    }
  }

  function createForegroundFlowers() {
    foregroundFlowers.innerHTML = "";
    state.flowerElements = [];

    FLOWER_DATA.forEach((flower, index) => {
      const position = FLOWER_POSITIONS[index];

      const element = document.createElement("button");
      element.type = "button";

      element.className =
        `interactive-flower flower-${flower.kind} special`;

      element.style.left = `${position.x}%`;
      element.style.top = `${position.y}%`;
      element.style.setProperty("--flower-scale", position.scale);
      element.style.setProperty("--wind-delay", `${-index * 0.37}s`);
      element.style.setProperty(
        "--wind-duration",
        `${4.5 + (index % 3) * 0.7}s`
      );

      element.style.transform = "translate(-50%, -100%)";

      element.setAttribute(
        "aria-label",
        `Seleccionar ${flower.name}`
      );

      const glow = document.createElement("span");
      glow.className = "flower-glow";
      element.appendChild(glow);

      element.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        touchFlower(index, element);
      });

      foregroundFlowers.appendChild(element);

      state.flowerElements.push(element);
    });
  }

  function touchFlower(index, element) {
    const rect = element.getBoundingClientRect();

    spawnPollen(
      rect.left + rect.width / 2,
      rect.top + rect.height * 0.24,
      true,
      false
    );

    if (state.selected.includes(index)) return;

    state.selected.push(index);

    selectedCount.textContent = String(state.selected.length);

    element.classList.add("removed");

    if (state.selected.length === TARGET) {
      window.setTimeout(() => {
        openBouquetScene();
      }, 780);
    }
  }

  function spawnPollen(x, y, strong, bouquet) {
    const list = bouquet
      ? state.bouquetPollen
      : state.pollen;

    const amount = strong ? 52 : 26;

    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed =
        0.35 +
        Math.random() * (strong ? 2.1 : 1.3);

      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.65,
        life: 650 + Math.random() * 900,
        radius: 0.7 + Math.random() * 2.1,
        warm: Math.random() > 0.16
      });
    }
  }

  function updatePollen(context, list, delta) {
    for (let i = list.length - 1; i >= 0; i--) {
      const particle = list[i];

      particle.life -= delta;

      if (particle.life <= 0) {
        list.splice(i, 1);
        continue;
      }

      particle.vy += 0.008;
      particle.vx += 0.002;

      particle.x += particle.vx * delta / 16.67;
      particle.y += particle.vy * delta / 16.67;

      const alpha = Math.min(1, particle.life / 380);

      context.shadowBlur = 9;
      context.shadowColor = particle.warm
        ? "rgba(255, 208, 100, .95)"
        : "rgba(132, 185, 255, .95)";

      context.fillStyle = particle.warm
        ? `rgba(255, 220, 137, ${alpha})`
        : `rgba(140, 190, 255, ${alpha})`;

      context.beginPath();
      context.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );
      context.fill();

      context.shadowBlur = 0;
    }
  }

  function renderStars() {
    for (const star of state.stars) {
      const pulse =
        0.48 +
        Math.sin(
          state.time * star.speed + star.phase
        ) * 0.48;

      const alpha =
        star.strength *
        Math.max(0.08, pulse);

      ctx.fillStyle =
        `rgba(221, 235, 255, ${alpha})`;

      ctx.beginPath();
      ctx.arc(
        star.x,
        star.y,
        star.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (star.radius > 1.1) {
        ctx.strokeStyle =
          `rgba(210, 229, 255, ${alpha * 0.52})`;

        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.moveTo(star.x - 3, star.y);
        ctx.lineTo(star.x + 3, star.y);
        ctx.moveTo(star.x, star.y - 3);
        ctx.lineTo(star.x, star.y + 3);
        ctx.stroke();
      }
    }
  }

  function renderFireflies() {
    for (const firefly of state.fireflies) {
      const x =
        firefly.x +
        Math.sin(
          state.time * firefly.speed +
          firefly.phase
        ) *
        firefly.drift;

      const y =
        firefly.y +
        Math.cos(
          state.time * firefly.speed * 1.7 +
          firefly.phase
        ) *
        firefly.drift * 0.35;

      const pulse =
        0.5 +
        Math.sin(
          state.time * 0.003 +
          firefly.phase
        ) * 0.5;

      const alpha =
        firefly.strength *
        (0.35 + pulse * 0.65);

      ctx.shadowBlur = 12;
      ctx.shadowColor =
        "rgba(255, 200, 88, .96)";

      ctx.fillStyle =
        `rgba(255, 215, 111, ${alpha})`;

      ctx.beginPath();
      ctx.arc(
        x,
        y,
        firefly.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  function renderField(delta) {
    ctx.clearRect(
      0,
      0,
      state.width,
      state.height
    );

    renderStars();
    renderFireflies();

    updatePollen(
      ctx,
      state.pollen,
      delta
    );
  }

  function createBouquetFlowers() {
    bouquetFlowers.innerHTML = "";
    flowerInfoList.innerHTML = "";

    state.bouquetFlowerElements = [];

    state.selected.forEach((flowerIndex, bouquetIndex) => {
      const data = FLOWER_DATA[flowerIndex];
      const position = BOUQUET_POSITIONS[bouquetIndex];

      const flower = document.createElement("button");
      flower.type = "button";

      flower.className =
        `bouquet-flower flower-${data.kind}`;

      flower.style.left = `${position.left}%`;
      flower.style.top = `${position.top}%`;
      flower.style.transform =
        `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotate}deg)`;

      flower.setAttribute(
        "aria-label",
        `Abrir mensaje de ${data.name}`
      );

      flower.addEventListener("pointerdown", (event) => {
        event.stopPropagation();

        const rect =
          flower.getBoundingClientRect();

        spawnPollen(
          rect.left + rect.width / 2,
          rect.top + rect.height * 0.32,
          true,
          true
        );

        showMessage(flowerIndex);
      });

      bouquetFlowers.appendChild(flower);

      state.bouquetFlowerElements.push(flower);

      const infoItem =
        document.createElement("div");

      infoItem.className = "info-item";

      const dot =
        document.createElement("div");

      dot.className = "info-dot";

      dot.style.background =
        data.kind === "red"
          ? "radial-gradient(circle, #ffd4c8, #cf304c 55%, #6d091c)"
          : data.kind === "white"
            ? "radial-gradient(circle, #fffef8, #d6dfe6)"
            : "radial-gradient(circle, #fff5ed, #df7887 55%, #7d1029)";

      const text =
        document.createElement("div");

      const strong =
        document.createElement("strong");

      strong.textContent = data.name;

      const span =
        document.createElement("span");

      span.textContent = data.note;

      text.appendChild(strong);
      text.appendChild(span);

      infoItem.appendChild(dot);
      infoItem.appendChild(text);

      flowerInfoList.appendChild(infoItem);
    });
  }

  function showMessage(index) {
    const data = FLOWER_DATA[index];

    messageTitle.textContent =
      data.name;

    messageText.textContent =
      data.message;

    messageModal.classList.remove("hidden");
  }

  function renderBouquetParticles(delta) {
    bouquetCtx.clearRect(
      0,
      0,
      state.bouquetWidth,
      state.bouquetHeight
    );

    // pequeñas partículas ambientales
    for (let i = 0; i < 38; i++) {
      const x =
        (i * 97.37) %
        state.bouquetWidth;

      const y =
        (i * 53.13) %
        state.bouquetHeight;

      const pulse =
        0.5 +
        Math.sin(
          state.time * 0.0017 +
          i
        ) * 0.5;

      bouquetCtx.fillStyle =
        `rgba(232, 192, 110, ${0.04 + pulse * 0.12})`;

      bouquetCtx.beginPath();
      bouquetCtx.arc(
        x,
        y,
        0.6 + (i % 3) * 0.4,
        0,
        Math.PI * 2
      );
      bouquetCtx.fill();
    }

    updatePollen(
      bouquetCtx,
      state.bouquetPollen,
      delta
    );
  }

  function openBouquetScene() {
    createBouquetFlowers();

    state.scene = "bouquet";

    fieldScene.classList.add("hidden");
    bouquetScene.classList.remove("hidden");
  }

  function openFieldScene() {
    state.scene = "field";

    bouquetScene.classList.add("hidden");
    fieldScene.classList.remove("hidden");
  }

  function resetExperience() {
    state.selected = [];
    state.pollen = [];
    state.bouquetPollen = [];

    selectedCount.textContent = "0";

    createForegroundFlowers();

    messageModal.classList.add("hidden");

    openFieldScene();
  }

  function animate(now) {
    const delta =
      Math.min(
        40,
        now - state.lastTime
      );

    state.lastTime = now;
    state.time = now;

    renderField(delta);
    renderBouquetParticles(delta);

    requestAnimationFrame(animate);
  }

  enterButton.addEventListener("click", () => {
    state.started = true;
    intro.classList.add("hidden");
  });

  resetButton.addEventListener(
    "click",
    resetExperience
  );

  backButton.addEventListener(
    "click",
    openFieldScene
  );

  closeMessage.addEventListener(
    "click",
    () => {
      messageModal.classList.add("hidden");
    }
  );

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );

  resize();
  createForegroundFlowers();

  requestAnimationFrame(animate);
})();
