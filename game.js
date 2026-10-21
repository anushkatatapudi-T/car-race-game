/* ======================================================
   NEON RUSH — Game Engine
   Version 1.0
   ====================================================== */

'use strict';

// ---- roundRect polyfill for older browsers ----
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'undefined') r = 0;
    if (typeof r === 'object') r = r[0] || 0;
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

// ============================================================
// SECTION 1: DATA DEFINITIONS
// ============================================================

const CAR_DEFS = [
  {
    id: 'starter',
    name: 'STARTER',
    emoji: '🚗',
    color: '#00f5ff',
    accentColor: '#0099cc',
    price: 0,
    locked: false,
    baseStats: { speed: 60, acceleration: 65, handling: 70, nitro: 60 }
  },
  {
    id: 'speedster',
    name: 'SPEEDSTER',
    emoji: '🏎️',
    color: '#ff00aa',
    accentColor: '#cc0088',
    price: 1500,
    locked: true,
    baseStats: { speed: 85, acceleration: 75, handling: 55, nitro: 80 }
  },
  {
    id: 'drifter',
    name: 'DRIFTER',
    emoji: '🚙',
    color: '#ffe600',
    accentColor: '#cc9900',
    price: 2500,
    locked: true,
    baseStats: { speed: 70, acceleration: 65, handling: 90, nitro: 65 }
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    emoji: '🛸',
    color: '#aa00ff',
    accentColor: '#7700cc',
    price: 4000,
    locked: true,
    baseStats: { speed: 90, acceleration: 85, handling: 75, nitro: 90 }
  }
];

const TRACK_DEFS = [
  {
    id: 'city_sprint',
    name: 'CITY SPRINT',
    icon: '🏙️',
    difficulty: 'BEGINNER',
    laps: 3,
    aiCount: 3,
    targetTime: 120,
    requiredCareerWins: 0,
    color: '#00f5ff',
    description: 'A smooth intro circuit through downtown neon streets.'
  },
  {
    id: 'night_drive',
    name: 'NIGHT DRIVE',
    icon: '🌃',
    difficulty: 'EASY',
    laps: 3,
    aiCount: 3,
    targetTime: 135,
    requiredCareerWins: 1,
    color: '#ff00aa',
    description: 'Twisting roads through a neon-lit night district.'
  },
  {
    id: 'highway_rush',
    name: 'HIGHWAY RUSH',
    icon: '🛣️',
    difficulty: 'MEDIUM',
    laps: 3,
    aiCount: 4,
    targetTime: 110,
    requiredCareerWins: 2,
    color: '#ffe600',
    description: 'High-speed action on a wide open highway.'
  },
  {
    id: 'neon_circuit',
    name: 'NEON CIRCUIT',
    icon: '💫',
    difficulty: 'HARD',
    laps: 3,
    aiCount: 4,
    targetTime: 150,
    requiredCareerWins: 3,
    color: '#aa00ff',
    description: 'Tight corners and speed traps. For experts only.'
  },
  {
    id: 'final_run',
    name: 'FINAL RUN',
    icon: '🔥',
    difficulty: 'EXPERT',
    laps: 3,
    aiCount: 4,
    targetTime: 165,
    requiredCareerWins: 4,
    color: '#ff6600',
    description: 'The ultimate challenge. Prove your dominance.'
  }
];

const UPGRADE_DEFS = [
  { key: 'speed',        name: 'ENGINE',       maxLevel: 5, costPerLevel: 500,  boost: 4  },
  { key: 'acceleration', name: 'TURBO',        maxLevel: 5, costPerLevel: 400,  boost: 4  },
  { key: 'handling',     name: 'SUSPENSION',   maxLevel: 5, costPerLevel: 350,  boost: 4  },
  { key: 'nitro',        name: 'NITRO TANK',   maxLevel: 5, costPerLevel: 450,  boost: 4  }
];

// ============================================================
// SECTION 2: SAVE STATE
// ============================================================

const DEFAULT_SAVE = {
  coins: 200,
  xp: 0,
  selectedCarId: 'starter',
  selectedTrackId: 'city_sprint',
  difficulty: 'medium',
  unlockedCars: ['starter'],
  careerWins: 0,
  completedCareerRaces: [],
  bestTimes: {},
  upgrades: {
    starter:   { speed: 0, acceleration: 0, handling: 0, nitro: 0 },
    speedster: { speed: 0, acceleration: 0, handling: 0, nitro: 0 },
    drifter:   { speed: 0, acceleration: 0, handling: 0, nitro: 0 },
    phantom:   { speed: 0, acceleration: 0, handling: 0, nitro: 0 }
  },
  settings: { sfx: true, music: true, minimap: true, particles: true }
};

let saveData = loadSave();

function loadSave() {
  try {
    const raw = localStorage.getItem('neonrush_save');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys
    return deepMerge(JSON.parse(JSON.stringify(DEFAULT_SAVE)), parsed);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }
}

function saveSave() {
  try {
    localStorage.setItem('neonrush_save', JSON.stringify(saveData));
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function resetSave() {
  saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  saveSave();
  updateMenuStats();
  showToast('Progress reset!');
}

// ============================================================
// SECTION 3: AUDIO ENGINE
// ============================================================

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}

function playTone(freq, type, duration, volume = 0.15, fadeIn = 0.01, delay = 0) {
  if (!saveData.settings.sfx) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + fadeIn);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch(e) {}
}

function playEngineSound(speed, nitroOn) {
  // Continuous engine: driven by game loop, not this function
}

let engineOsc = null;
let engineGain = null;

function startEngineSound() {
  if (!saveData.settings.sfx) return;
  const ctx = getAudioCtx();
  if (!ctx || engineOsc) return;
  try {
    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    // Create some distortion
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2 / 256) - 1;
      curve[i] = (3 + 40) * x / (Math.PI + 40 * Math.abs(x));
    }
    dist.curve = curve;
    engineOsc.connect(dist);
    dist.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(80, ctx.currentTime);
    engineGain.gain.setValueAtTime(0.02, ctx.currentTime);
    engineOsc.start();
  } catch(e) { engineOsc = null; }
}

function updateEngineSound(speedRatio, nitroOn) {
  if (!saveData.settings.sfx) return;
  const ctx = getAudioCtx();
  if (!ctx || !engineOsc || !engineGain) return;
  try {
    const freq = 80 + speedRatio * 180 + (nitroOn ? 60 : 0);
    engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
    const vol = 0.01 + speedRatio * 0.04;
    engineGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
  } catch(e) {}
}

function stopEngineSound() {
  if (engineOsc) {
    try { engineOsc.stop(); } catch(e) {}
    engineOsc = null;
    engineGain = null;
  }
}

function playCoinSound() {
  playTone(880, 'sine', 0.12, 0.1);
  playTone(1320, 'sine', 0.1, 0.08, 0.01, 0.06);
}

function playNitroSound() {
  playTone(200, 'sawtooth', 0.3, 0.08);
  playTone(400, 'sawtooth', 0.3, 0.06, 0.01, 0.05);
}

function playCollisionSound() {
  playTone(120, 'square', 0.2, 0.15);
  playTone(80, 'square', 0.25, 0.1, 0.01, 0.05);
}

function playCountdownBeep(isGo) {
  if (isGo) {
    playTone(880, 'sine', 0.5, 0.2);
    playTone(1320, 'sine', 0.5, 0.15, 0.01, 0.1);
  } else {
    playTone(440, 'sine', 0.25, 0.12);
  }
}

function playFinishSound() {
  [440, 554, 659, 880].forEach((f, i) => playTone(f, 'sine', 0.4, 0.12, 0.01, i * 0.12));
}

function playClickSound() {
  playTone(660, 'sine', 0.08, 0.06);
}

// ============================================================
// SECTION 4: TOAST NOTIFICATIONS
// ============================================================

let toastContainer = null;

function initToast() {
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);
}

function showToast(msg) {
  if (!toastContainer) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ============================================================
// SECTION 5: SCREEN MANAGER
// ============================================================

let currentScreen = 'menu';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
  }
  currentScreen = id;
}

// ============================================================
// SECTION 6: MENU BACKGROUND ANIMATION
// ============================================================

let menuAnimFrame = null;
const menuParticles = [];

function initMenuBackground() {
  const canvas = document.getElementById('menu-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create particles
  for (let i = 0; i < 80; i++) {
    menuParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      color: ['#00f5ff', '#ff00aa', '#ffe600', '#aa00ff'][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.7 + 0.2
    });
  }

  // Road lines
  const roads = Array.from({length: 8}, (_, i) => ({
    progress: i / 8,
    speed: 0.001 + Math.random() * 0.002
  }));

  function drawMenu() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark gradient bg
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#050510');
    bg.addColorStop(1, '#0a0520');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid floor
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 0.5;
    const gridSize = 60;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.5);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = canvas.height * 0.5; y < canvas.height; y += gridSize * 0.5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Particles
    for (const p of menuParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Scrolling road lines in perspective
    for (const road of roads) {
      road.progress += road.speed;
      if (road.progress > 1) road.progress -= 1;
      const p = road.progress;
      const x = canvas.width * 0.5;
      const yVanish = canvas.height * 0.4;
      const yFar = canvas.height * 0.4 + p * (canvas.height * 0.6);
      const spread = p * canvas.width * 0.4;
      ctx.save();
      ctx.globalAlpha = p * 0.6;
      ctx.strokeStyle = '#ff00aa';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#ff00aa';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(x - spread * 0.5, yFar);
      ctx.lineTo(x + spread * 0.5, yFar);
      ctx.stroke();
      ctx.restore();
    }

    menuAnimFrame = requestAnimationFrame(drawMenu);
  }

  if (menuAnimFrame) cancelAnimationFrame(menuAnimFrame);
  drawMenu();
}

// ============================================================
// SECTION 7: TRACK GENERATOR
// ============================================================

// Track data: array of points forming a circuit
// Returns normalized points (0-1 range)
function generateTrackPoints(trackId) {
  const tracks = {
    city_sprint: [
      [0.5, 0.85], [0.85, 0.85], [0.9, 0.7], [0.9, 0.4],
      [0.85, 0.25], [0.7, 0.15], [0.5, 0.12], [0.3, 0.15],
      [0.15, 0.25], [0.1, 0.4], [0.1, 0.65], [0.2, 0.8],
      [0.35, 0.85]
    ],
    night_drive: [
      [0.5, 0.88], [0.75, 0.88], [0.88, 0.75], [0.88, 0.55],
      [0.75, 0.42], [0.62, 0.35], [0.72, 0.22], [0.62, 0.12],
      [0.45, 0.12], [0.28, 0.2], [0.2, 0.35], [0.15, 0.5],
      [0.2, 0.65], [0.35, 0.78], [0.5, 0.88]
    ],
    highway_rush: [
      [0.5, 0.9], [0.85, 0.9], [0.92, 0.75], [0.92, 0.3],
      [0.85, 0.15], [0.68, 0.1], [0.5, 0.1], [0.32, 0.1],
      [0.15, 0.15], [0.08, 0.3], [0.08, 0.75], [0.15, 0.9]
    ],
    neon_circuit: [
      [0.5, 0.88], [0.7, 0.88], [0.82, 0.8], [0.88, 0.65],
      [0.82, 0.5], [0.7, 0.45], [0.8, 0.35], [0.75, 0.2],
      [0.6, 0.12], [0.45, 0.15], [0.32, 0.12], [0.2, 0.22],
      [0.12, 0.38], [0.18, 0.55], [0.3, 0.62], [0.22, 0.72],
      [0.3, 0.85]
    ],
    final_run: [
      [0.5, 0.9], [0.72, 0.9], [0.85, 0.82], [0.9, 0.68],
      [0.85, 0.55], [0.72, 0.48], [0.85, 0.38], [0.85, 0.22],
      [0.72, 0.12], [0.55, 0.1], [0.38, 0.12], [0.25, 0.22],
      [0.18, 0.38], [0.22, 0.55], [0.12, 0.65], [0.18, 0.78],
      [0.32, 0.88]
    ]
  };
  return tracks[trackId] || tracks.city_sprint;
}

function buildTrackPath(points, canvasW, canvasH) {
  return points.map(([nx, ny]) => ({ x: nx * canvasW, y: ny * canvasH }));
}

// Get point along track using parameterized distance
function getTrackLength(points) {
  let len = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function getPositionAlongTrack(points, t) {
  // t is 0..1 normalized distance
  const totalLen = getTrackLength(points);
  let target = t * totalLen;
  let accum = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (accum + segLen >= target) {
      const ratio = (target - accum) / segLen;
      return {
        x: points[i].x + dx * ratio,
        y: points[i].y + dy * ratio,
        angle: Math.atan2(dy, dx)
      };
    }
    accum += segLen;
  }
  return { x: points[0].x, y: points[0].y, angle: 0 };
}

// Find closest segment on track
function findClosestTrackSegment(points, x, y) {
  let minDist = Infinity;
  let closestSegIdx = 0;
  let closestT = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) continue;
    let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (d < minDist) {
      minDist = d;
      closestSegIdx = i;
      closestT = t;
    }
  }
  return { segIdx: closestSegIdx, t: closestT, dist: minDist };
}

function getTrackProgress(points, segIdx, t) {
  let accum = 0;
  const totalLen = getTrackLength(points);
  for (let i = 0; i < segIdx; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    accum += Math.sqrt(dx * dx + dy * dy);
  }
  const b = points[(segIdx + 1) % points.length];
  const a = points[segIdx];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  accum += t * Math.sqrt(dx * dx + dy * dy);
  return accum / totalLen;
}

// ============================================================
// SECTION 8: GAME STATE
// ============================================================

let game = null;  // Active game instance

function createGameState(trackDef, carDef, difficulty, mode) {
  const diffSettings = {
    easy:   { aiSpeedMult: 0.78, aiAccelMult: 0.75, aiHandlingMult: 0.85, aiMistakeRate: 0.03 },
    medium: { aiSpeedMult: 0.9,  aiAccelMult: 0.88, aiHandlingMult: 0.92, aiMistakeRate: 0.015 },
    hard:   { aiSpeedMult: 1.05, aiAccelMult: 1.0,  aiHandlingMult: 1.0,  aiMistakeRate: 0.005 }
  };

  const ups = saveData.upgrades[carDef.id] || { speed: 0, acceleration: 0, handling: 0, nitro: 0 };
  const upgradeBoost = (key) => (ups[key] || 0) * 4;

  const effectiveStats = {
    speed:        carDef.baseStats.speed        + upgradeBoost('speed'),
    acceleration: carDef.baseStats.acceleration + upgradeBoost('acceleration'),
    handling:     carDef.baseStats.handling     + upgradeBoost('handling'),
    nitro:        carDef.baseStats.nitro        + upgradeBoost('nitro')
  };

  return {
    mode,            // 'quickrace', 'career', 'timetrial'
    trackDef,
    carDef,
    difficulty,
    diffSettings:    diffSettings[difficulty] || diffSettings.medium,
    effectiveStats,
    paused: false,
    running: false,
    started: false,  // after countdown
    finished: false,
    lap: 1,
    totalLaps: trackDef.laps,
    raceTime: 0,
    bestTime: saveData.bestTimes[trackDef.id] || null,
    coins: 0,
    driftScore: 0,
    currentDrift: 0,
    position: 1,
    totalCars: trackDef.aiCount + 1,
    player: null,
    ai: [],
    collectibles: [],
    particles: [],
    checkpoints: [],
    lastCheckpoint: -1,
    lapCheckpoints: new Set(),
    trackPoints: null,
    trackWidth: 52,
    finishTriggered: false
  };
}

// ============================================================
// SECTION 9: ENTITY CLASSES
// ============================================================

class Car {
  constructor(x, y, angle, color, accentColor, stats, isPlayer) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
    this.accentColor = accentColor;
    this.stats = stats;
    this.isPlayer = isPlayer;

    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.angularVel = 0;

    this.width = 18;
    this.height = 32;

    this.nitro = 100;
    this.nitroActive = false;
    this.shield = 0;
    this.shieldTime = 0;

    this.onTrack = true;
    this.offTrackFactor = 1;
    this.crashCooldown = 0;

    this.lapProgress = 0;  // 0..1 per lap
    this.totalProgress = 0;  // total normalized distance
    this.lap = 1;
    this.lapTime = 0;
    this.lastCheckpointPassed = -1;

    this.drifting = false;
    this.driftAngle = 0;

    // Smoke/exhaust particles timing
    this.smokeTimer = 0;
    this.nitroTimer = 0;

    // AI only
    this.aiTarget = 0;  // track t value target
    this.aiState = 'racing';  // 'racing', 'recovering'
    this.aiNitroChance = 0.002;
    this.aiMistakeTimer = 0;
    this.aiOffset = (Math.random() - 0.5) * 20;  // lane offset
  }
}

class Collectible {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'coin', 'nitro', 'shield'
    this.collected = false;
    this.radius = type === 'coin' ? 10 : 13;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.rotation = 0;
  }
}

class Particle {
  constructor(x, y, vx, vy, color, life, size, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.type = type; // 'smoke', 'spark', 'exhaust', 'coin', 'hit'
  }
}

// ============================================================
// SECTION 10: GAME LOOP
// ============================================================

let animFrame = null;
let lastTimestamp = 0;
let gameCanvas = null;
let gameCtx = null;
let minimapCanvas = null;
let minimapCtx = null;

function initGameCanvas() {
  gameCanvas = document.getElementById('game-canvas');
  gameCtx = gameCanvas.getContext('2d');
  minimapCanvas = document.getElementById('minimap-canvas');
  minimapCtx = minimapCanvas.getContext('2d');
  resizeGameCanvas();
}

function resizeGameCanvas() {
  if (!gameCanvas) return;
  gameCanvas.width = gameCanvas.offsetWidth;
  gameCanvas.height = gameCanvas.offsetHeight;
}

function startGameLoop() {
  if (animFrame) cancelAnimationFrame(animFrame);
  lastTimestamp = performance.now();

  function loop(ts) {
    const rawDt = (ts - lastTimestamp) / 1000;
    lastTimestamp = ts;
    const dt = Math.min(rawDt, 0.05); // cap to avoid big jumps

    if (!game.paused && game.running) {
      updateGame(dt);
    }
    renderGame();
    animFrame = requestAnimationFrame(loop);
  }
  animFrame = requestAnimationFrame(loop);
}

function stopGameLoop() {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  stopEngineSound();
}

// ============================================================
// SECTION 11: INPUT HANDLING
// ============================================================

const keys = {};
const virtualKeys = { accel: false, brake: false, left: false, right: false, nitro: false, emp: false };
let empCooldown = 0;

function setupInputListeners() {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function removeInputListeners() {
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
}

function setupVirtualControls() {
  const btnMap = [
    { id: 'hud-btn-up', key: 'accel' },
    { id: 'hud-btn-left', key: 'left' },
    { id: 'hud-btn-down', key: 'brake' },
    { id: 'hud-btn-right', key: 'right' },
    { id: 'hud-btn-nitro', key: 'nitro' },
    { id: 'hud-btn-emp', key: 'emp' }
  ];

  btnMap.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;

    const start = (e) => {
      e.preventDefault();
      virtualKeys[key] = true;
      el.classList.add('active');
      if (key === 'emp') triggerEMP();
    };
    const end = (e) => {
      e.preventDefault();
      virtualKeys[key] = false;
      el.classList.remove('active');
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
  });
}

function onKeyDown(e) {
  keys[e.code] = true;
  updateDirectionalHUDState();

  // ---- GLOBAL KEYBOARD MENU SHORTCUTS ----
  if (currentScreen === 'menu') {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      document.getElementById('btn-play').click();
    } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
      document.getElementById('btn-play').click();
    } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
      document.getElementById('btn-career').click();
    } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
      document.getElementById('btn-timetrial').click();
    } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
      document.getElementById('btn-garage').click();
    } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
      document.getElementById('btn-settings').click();
    } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
      document.getElementById('btn-howtoplay').click();
    }
  } else if (currentScreen === 'quickrace') {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      document.getElementById('qr-start').click();
    } else if (e.code === 'Escape') {
      document.getElementById('qr-back').click();
    }
  } else if (currentScreen === 'timetrial') {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      document.getElementById('tt-start').click();
    } else if (e.code === 'Escape') {
      document.getElementById('tt-back').click();
    }
  } else if (['career', 'garage', 'settings', 'howtoplay'].includes(currentScreen)) {
    if (e.code === 'Escape') {
      showScreen('menu');
    }
  } else if (currentScreen === 'game') {
    if (e.code === 'Escape') {
      togglePause();
    } else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      triggerEMP();
    }
    // Prevent page scroll during gameplay
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }
}

function onKeyUp(e) {
  keys[e.code] = false;
  updateDirectionalHUDState();
}

function updateDirectionalHUDState() {
  const sync = (id, active) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', active);
  };

  sync('hud-btn-up', isAccel());
  sync('hud-btn-down', isBrake());
  sync('hud-btn-left', isLeft());
  sync('hud-btn-right', isRight());
  sync('hud-btn-nitro', isNitro());
  sync('hud-btn-emp', virtualKeys.emp);
}

function isAccel()   { return keys['KeyW'] || keys['ArrowUp'] || virtualKeys.accel; }
function isBrake()   { return keys['KeyS'] || keys['ArrowDown'] || virtualKeys.brake; }
function isLeft()    { return keys['KeyA'] || keys['ArrowLeft'] || virtualKeys.left; }
function isRight()   { return keys['KeyD'] || keys['ArrowRight'] || virtualKeys.right; }
function isNitro()   { return keys['Space'] || virtualKeys.nitro; }

function triggerEMP() {
  if (!game || !game.player || game.paused || !game.started) return;
  if (empCooldown > 0) {
    showToast(`EMP cooling down (${Math.ceil(empCooldown)}s)`);
    return;
  }
  empCooldown = 8.0; // 8 sec cooldown
  playTone(600, 'sawtooth', 0.4, 0.25);
  playTone(200, 'sine', 0.6, 0.3, 0.05);

  showToast('💥 EMP BLAST ACTIVATED!');
  const px = game.player.x;
  const py = game.player.y;

  // Visual shockwave particles
  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2;
    const spd = 6 + Math.random() * 4;
    particles.push({
      x: px, y: py,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      size: 4 + Math.random() * 4,
      color: '#ff00aa',
      alpha: 1,
      life: 0.8
    });
  }

  // Slow down nearby AI cars
  for (const ai of game.ai) {
    const dx = ai.x - px;
    const dy = ai.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 380) {
      ai.speed *= 0.25; // EMP shockwave slows AI down
      ai.crashCooldown = 2.5;
      showFloatText(ai.x, ai.y - 20, '⚡ STUNNED!', '#ff00aa');
    }
  }
}

// Theme Switcher System
function applyTheme(themeName) {
  document.body.classList.remove('theme-synthwave', 'theme-matrix', 'theme-purple');
  if (themeName && themeName !== 'cyberpunk') {
    document.body.classList.add('theme-' + themeName);
  }

  if (saveData) {
    saveData.settings.theme = themeName;
    saveSave();
  }

  // Update active button state
  document.querySelectorAll('.theme-chip, .theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });
}

// ============================================================
// SECTION 12: GAME UPDATE
// ============================================================

function updateGame(dt) {
  if (!game || game.finished) return;

  if (empCooldown > 0) empCooldown -= dt;

  game.raceTime += dt;
  updatePlayer(dt);
  updateAI(dt);
  updateCarCollisions();
  updateCollectibles(dt);
  updateParticles(dt);
  updatePositions();
  adaptiveAI();
  checkRaceFinish();
  updateHUD();
  updateEngineSound(
    Math.max(0, game.player.speed) / getMaxSpeed(game.player),
    game.player.nitroActive
  );
}

// Car-to-car collision detection and bounce
function updateCarCollisions() {
  if (!game) return;
  const allCars = [game.player, ...game.ai];
  for (let i = 0; i < allCars.length; i++) {
    for (let j = i + 1; j < allCars.length; j++) {
      const a = allCars[i];
      const b = allCars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 28; // combined half-widths
      if (dist < minDist && dist > 0) {
        // Push apart
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
        // Exchange some speed
        const relVx = (Math.cos(b.angle) * b.speed) - (Math.cos(a.angle) * a.speed);
        const relVy = (Math.sin(b.angle) * b.speed) - (Math.sin(a.angle) * a.speed);
        const relN = relVx * nx + relVy * ny;
        if (relN < 0) {
          const impulse = relN * 0.4;
          a.speed -= impulse * 0.3;
          b.speed += impulse * 0.3;
          // Clamp
          a.speed = Math.max(-1, Math.min(getMaxSpeed(a) * 1.1, a.speed));
          b.speed = Math.max(-1, Math.min(getMaxSpeed(b) * 1.1, b.speed));
        }
        // Collision particles if player involved
        if ((a.isPlayer || b.isPlayer) && saveData.settings.particles) {
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          if (a.crashCooldown <= 0 || b.crashCooldown <= 0) {
            spawnHitParticles(cx, cy);
            playCollisionSound();
            if (a.isPlayer) a.crashCooldown = 0.5;
            if (b.isPlayer) b.crashCooldown = 0.5;
          }
        }
      }
    }
  }
}

// Adaptive AI: if player is far ahead, slightly boost AI
function adaptiveAI() {
  if (!game || !game.ai.length) return;
  const playerTotal = game.player.totalProgress;
  let maxAITotal = 0;
  for (const ai of game.ai) {
    maxAITotal = Math.max(maxAITotal, ai.totalProgress);
  }
  const gap = playerTotal - maxAITotal;
  // If player is more than 0.3 laps ahead, give AI a small nudge
  const rubberBandFactor = gap > 0.3 ? Math.min(1.15, 1 + (gap - 0.3) * 0.5) : 1;
  // If player is way behind, slightly slow AI
  const playerBehindFactor = gap < -0.3 ? Math.max(0.9, 1 + (gap + 0.3) * 0.3) : 1;
  game.adaptiveMultiplier = rubberBandFactor * playerBehindFactor;
}

function getMaxSpeed(car) {
  const s = car.isPlayer ? game.effectiveStats.speed : car.stats.speed;
  return 3 + s * 0.06;
}

function getAcceleration(car) {
  const a = car.isPlayer ? game.effectiveStats.acceleration : car.stats.acceleration;
  return 0.5 + a * 0.04;
}

function getHandling(car) {
  const h = car.isPlayer ? game.effectiveStats.handling : car.stats.handling;
  return 0.015 + h * 0.0006;
}

function updatePlayer(dt) {
  const p = game.player;
  if (!game.started) return;

  const maxSpd = getMaxSpeed(p);
  const accel = getAcceleration(p);
  const handling = getHandling(p);
  const offTrackSlow = p.onTrack ? 1 : 0.45;

  // Nitro
  const nitroBoost = p.nitroActive ? (1 + (game.effectiveStats.nitro / 100) * 0.7) : 1;

  if (p.crashCooldown > 0) p.crashCooldown -= dt;

  // Steering
  let steerInput = 0;
  if (isLeft())  steerInput = -1;
  if (isRight()) steerInput =  1;

  const speedFactor = Math.min(1, p.speed / (maxSpd * 0.5));
  const turnRate = handling * (1 - speedFactor * 0.4);

  p.angularVel += steerInput * turnRate * dt * 60;
  p.angularVel *= 0.82; // damping

  // Drift detection
  const driftThreshold = maxSpd * 0.6;
  if (Math.abs(steerInput) > 0.5 && p.speed > driftThreshold) {
    p.drifting = true;
    p.driftAngle += steerInput * 0.04;
    game.currentDrift += dt * 15;
    if (saveData.settings.particles) spawnDriftSmoke(p);
    // Drift slowly recharges nitro
    p.nitro = Math.min(100, p.nitro + dt * 3);
  } else {
    p.drifting = false;
    if (game.currentDrift > 0) {
      game.driftScore += game.currentDrift;
      game.currentDrift = 0;
    }
    p.driftAngle *= 0.85;
  }

  p.angle += p.angularVel + p.driftAngle * 0.3;

  // Acceleration / Brake
  if (isAccel()) {
    p.speed = Math.min(maxSpd * nitroBoost * offTrackSlow, p.speed + accel * dt);
  } else if (isBrake()) {
    p.speed = Math.max(-maxSpd * 0.4, p.speed - accel * 1.2 * dt);
  } else {
    p.speed *= (1 - dt * 1.8); // friction
    if (Math.abs(p.speed) < 0.01) p.speed = 0;
  }

  // Nitro activation
  if (isNitro() && p.nitro > 0) {
    if (!p.nitroActive) {
      p.nitroActive = true;
      playNitroSound();
    }
    p.nitro = Math.max(0, p.nitro - dt * 30);
    if (saveData.settings.particles) spawnNitroFlame(p);
  } else {
    p.nitroActive = false;
    // Slow recharge
    p.nitro = Math.min(100, p.nitro + dt * 4);
  }

  // Move
  p.x += Math.cos(p.angle) * p.speed;
  p.y += Math.sin(p.angle) * p.speed;

  // Track boundary check
  const { segIdx, dist } = findClosestTrackSegment(game.trackPoints, p.x, p.y);
  p.onTrack = dist < game.trackWidth;
  if (!p.onTrack && p.speed > 0) {
    p.speed *= 0.92; // slow down off track
  }

  // Bounce off screen edges
  clampToScreen(p);

  // Update lap progress
  const { segIdx: si2, t: st } = findClosestTrackSegment(game.trackPoints, p.x, p.y);
  const newProg = getTrackProgress(game.trackPoints, si2, st);
  updateLapProgress(p, newProg, dt, true);

  // Exhaust
  p.smokeTimer -= dt;
  if (p.smokeTimer < 0) {
    p.smokeTimer = 0.08;
    if (saveData.settings.particles && Math.abs(p.speed) > 0.2) spawnExhaust(p, false);
  }
}

function clampToScreen(car) {
  const margin = 60;
  if (car.x < margin) { car.x = margin; car.speed *= 0.5; }
  if (car.x > gameCanvas.width - margin) { car.x = gameCanvas.width - margin; car.speed *= 0.5; }
  if (car.y < margin) { car.y = margin; car.speed *= 0.5; }
  if (car.y > gameCanvas.height - margin) { car.y = gameCanvas.height - margin; car.speed *= 0.5; }
}

function updateLapProgress(car, newProg, dt, isPlayer) {
  const oldProg = car.lapProgress;
  // Detect crossing start/finish (going from 0.95+ to 0.05-)
  if (oldProg > 0.9 && newProg < 0.15) {
    car.lap++;
    car.lapProgress = newProg;
    if (isPlayer) {
      if (car.lap > game.totalLaps && !game.finishTriggered) {
        game.finishTriggered = true;
        setTimeout(() => finishRace(), 500);
      } else if (car.lap <= game.totalLaps) {
        showToast(`LAP ${car.lap} / ${game.totalLaps}`);
      }
    }
  } else if (newProg > 0.1 || Math.abs(newProg - oldProg) < 0.5) {
    car.lapProgress = newProg;
  }
  car.totalProgress = (car.lap - 1) + car.lapProgress;
}

function updateAI(dt) {
  for (const ai of game.ai) {
    updateAICar(ai, dt);
  }
}

function updateAICar(car, dt) {
  const ds = game.diffSettings;
  const maxSpd = getMaxSpeed(car) * ds.aiSpeedMult;
  const handling = getHandling(car) * ds.aiHandlingMult;

  // AI progress on track
  const { segIdx, t } = findClosestTrackSegment(game.trackPoints, car.x, car.y);
  const curProg = getTrackProgress(game.trackPoints, segIdx, t);
  updateLapProgress(car, curProg, dt, false);

  // Target next point on track
  const lookAhead = 0.04;
  let targetT = (curProg + lookAhead) % 1;
  const targetPos = getPositionAlongTrack(game.trackPoints, targetT);

  // Apply AI mistakes
  if (Math.random() < ds.aiMistakeRate) {
    car.aiMistakeTimer = 0.5 + Math.random() * 1;
  }
  if (car.aiMistakeTimer > 0) {
    car.aiMistakeTimer -= dt;
    targetPos.x += (Math.random() - 0.5) * 80;
    targetPos.y += (Math.random() - 0.5) * 80;
  }

  // Steer toward target
  const dx = targetPos.x - car.x;
  const dy = targetPos.y - car.y;
  const desiredAngle = Math.atan2(dy, dx);
  let angleDiff = desiredAngle - car.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  car.angularVel += angleDiff * handling * 60 * dt;
  car.angularVel *= 0.8;
  car.angle += car.angularVel;

  // Speed control
  const cornerSharpness = Math.min(1, Math.abs(angleDiff) / (Math.PI * 0.3));
  const cornerSlow = 1 - cornerSharpness * 0.45;
  const targetSpeed = maxSpd * cornerSlow * ds.aiAccelMult;

  car.speed += (targetSpeed - car.speed) * dt * 2;

  // AI Nitro
  if (Math.random() < car.aiNitroChance && car.nitro > 30 && cornerSharpness < 0.2) {
    car.nitroActive = true;
    car.nitro -= dt * 20;
  } else {
    car.nitroActive = false;
    car.nitro = Math.min(100, car.nitro + dt * 5);
  }
  if (car.nitroActive) car.speed = Math.min(maxSpd * 1.3, car.speed * 1.1);

  // Move
  car.x += Math.cos(car.angle) * car.speed;
  car.y += Math.sin(car.angle) * car.speed;

  clampToScreen(car);

  // Exhaust particles
  car.smokeTimer -= dt;
  if (car.smokeTimer < 0) {
    car.smokeTimer = 0.15;
    if (saveData.settings.particles) spawnExhaust(car, false);
  }
}

function updateCollectibles(dt) {
  const player = game.player;
  for (const c of game.collectibles) {
    if (c.collected) continue;
    c.rotation += dt * 2;
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < c.radius + 16) {
      c.collected = true;
      handleCollectible(c);
    }
  }
  // Remove old collected ones beyond threshold
  game.collectibles = game.collectibles.filter(c => !c.collected);
}

function handleCollectible(c) {
  if (c.type === 'coin') {
    game.coins += 10;
    playCoinSound();
    showFloatText(c.x, c.y, '+10', '#ffe600');
  } else if (c.type === 'nitro') {
    game.player.nitro = Math.min(100, game.player.nitro + 40);
    playNitroSound();
    showFloatText(c.x, c.y, '⚡ NITRO', '#00f5ff');
  } else if (c.type === 'shield') {
    game.player.shieldTime = 5;
    showFloatText(c.x, c.y, '🛡 SHIELD', '#00ff88');
  }
  if (saveData.settings.particles) spawnCollectEffect(c.x, c.y, c.type);
}

function updateParticles(dt) {
  for (const p of game.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
  }
  game.particles = game.particles.filter(p => p.life > 0);

  // Limit particles
  if (game.particles.length > 300) {
    game.particles.splice(0, game.particles.length - 300);
  }
}

function updatePositions() {
  const allCars = [game.player, ...game.ai];
  allCars.sort((a, b) => b.totalProgress - a.totalProgress);
  const playerPos = allCars.indexOf(game.player) + 1;
  game.position = playerPos;
}

function checkRaceFinish() {
  if (game.finishTriggered || !game.started) return;
  if (game.player.lap > game.totalLaps) {
    game.finishTriggered = true;
    setTimeout(() => finishRace(), 500);
  }
}

// ============================================================
// SECTION 13: PARTICLES
// ============================================================

function spawnDriftSmoke(car) {
  if (game.particles.length > 250) return;
  for (let i = 0; i < 2; i++) {
    const spread = (Math.random() - 0.5) * 10;
    const backX = car.x - Math.cos(car.angle) * car.height * 0.5;
    const backY = car.y - Math.sin(car.angle) * car.height * 0.5;
    game.particles.push(new Particle(
      backX + spread, backY + spread,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.8,
      '#888888',
      0.5 + Math.random() * 0.4,
      3 + Math.random() * 4,
      'smoke'
    ));
  }
}

function spawnNitroFlame(car) {
  if (game.particles.length > 280) return;
  for (let i = 0; i < 3; i++) {
    const backX = car.x - Math.cos(car.angle) * (car.height * 0.6 + Math.random() * 10);
    const backY = car.y - Math.sin(car.angle) * (car.height * 0.6 + Math.random() * 10);
    const colors = ['#00f5ff', '#ff00aa', '#ffe600', '#ff6600'];
    game.particles.push(new Particle(
      backX, backY,
      -Math.cos(car.angle) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.5,
      -Math.sin(car.angle) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 0.5,
      colors[Math.floor(Math.random() * colors.length)],
      0.2 + Math.random() * 0.3,
      2 + Math.random() * 4,
      'flame'
    ));
  }
}

function spawnExhaust(car, big) {
  if (game.particles.length > 200) return;
  const backX = car.x - Math.cos(car.angle) * car.height * 0.5;
  const backY = car.y - Math.sin(car.angle) * car.height * 0.5;
  game.particles.push(new Particle(
    backX + (Math.random() - 0.5) * 4,
    backY + (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 0.4,
    (Math.random() - 0.5) * 0.4,
    `rgba(150,150,150,0.5)`,
    0.3 + Math.random() * 0.2,
    big ? 6 : 3,
    'exhaust'
  ));
}

function spawnCollectEffect(x, y, type) {
  const color = type === 'coin' ? '#ffe600' : type === 'nitro' ? '#00f5ff' : '#00ff88';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    game.particles.push(new Particle(
      x, y,
      Math.cos(angle) * (1 + Math.random() * 2),
      Math.sin(angle) * (1 + Math.random() * 2),
      color,
      0.6,
      3 + Math.random() * 3,
      'spark'
    ));
  }
}

function spawnHitParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    game.particles.push(new Particle(
      x, y,
      Math.cos(angle) * (0.5 + Math.random() * 3),
      Math.sin(angle) * (0.5 + Math.random() * 3),
      '#ff6600',
      0.5,
      2 + Math.random() * 3,
      'spark'
    ));
  }
}

// Float text using canvas drawings
const floatTexts = [];
function showFloatText(x, y, text, color) {
  floatTexts.push({ x, y, text, color, life: 1.2, vy: -1 });
}

// ============================================================
// SECTION 14: HUD UPDATE
// ============================================================

function updateHUD() {
  if (!game) return;
  const el = (id) => document.getElementById(id);
  const mins = Math.floor(game.raceTime / 60);
  const secs = Math.floor(game.raceTime % 60);
  const ms = Math.floor((game.raceTime % 1) * 100);
  el('hud-timer').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms).padStart(2,'0')}`;
  el('hud-pos').textContent = `${game.position}/${game.totalCars}`;
  el('hud-lap').textContent = `${Math.min(game.player.lap, game.totalLaps)}/${game.totalLaps}`;
  el('hud-coins').textContent = game.coins;
  const spd = Math.round(Math.abs(game.player.speed) * 80);
  el('hud-speed').textContent = `${spd} KM/H`;
  el('nitro-bar').style.width = `${game.player.nitro}%`;

  // Steering Wheel HUD Rotation
  const wheelEl = el('hud-wheel');
  if (wheelEl && game.player) {
    const rot = (game.player.angularVel || 0) * 1200;
    wheelEl.style.transform = `rotate(${rot}deg)`;
  }

  // Pedal Fill Bars
  const gasBar = document.querySelector('.gas-bar');
  if (gasBar) gasBar.classList.toggle('active', isAccel());
  const brakeBar = document.querySelector('.brake-bar');
  if (brakeBar) brakeBar.classList.toggle('active', isBrake());

  // EMP Button label
  const empBtn = el('hud-btn-emp');
  if (empBtn) {
    if (empCooldown > 0) {
      empBtn.style.opacity = '0.5';
      empBtn.innerHTML = `<span class="sym">⏳</span> EMP (${Math.ceil(empCooldown)}s)`;
    } else {
      empBtn.style.opacity = '1';
      empBtn.innerHTML = `<span class="sym">💥</span> EMP [E]`;
    }
  }

  // Directional HUD visibility
  const controlsHud = el('controls-hud');
  if (controlsHud) {
    const showControls = saveData.settings.controlHud !== false;
    controlsHud.style.display = showControls ? 'flex' : 'none';
  }

  // Drift display
  const driftEl = el('drift-score-display');
  if (game.currentDrift > 5) {
    driftEl.style.display = 'block';
    el('drift-pts').textContent = '+' + Math.round(game.currentDrift);
  } else {
    driftEl.style.display = 'none';
  }

  // Minimap visibility
  const minimapContainer = document.getElementById('minimap-container');
  if (minimapContainer) {
    minimapContainer.style.display = saveData.settings.minimap ? 'block' : 'none';
  }
}

// ============================================================
// SECTION 15: RENDERER
// ============================================================

function renderGame() {
  if (!gameCanvas || !gameCtx || !game) return;
  const ctx = gameCtx;
  const W = gameCanvas.width;
  const H = gameCanvas.height;

  // Background
  ctx.fillStyle = '#06060f';
  ctx.fillRect(0, 0, W, H);

  if (!game.trackPoints || game.trackPoints.length === 0) return;

  drawBackground(ctx, W, H);
  drawTrack(ctx, W, H);
  drawCollectibles(ctx);
  drawParticles(ctx);
  drawCars(ctx);
  drawFloatTexts(ctx);

  if (saveData.settings.minimap) drawMinimap();

  // Speed lines when fast
  if (game.player) {
    const maxSpd = getMaxSpeed(game.player);
    if (game.player.speed > maxSpd * 0.7 && game.started) {
      drawSpeedLines(ctx, W, H, (game.player.speed - maxSpd * 0.7) / (maxSpd * 0.3));
    }
  }

  // Update float texts
  for (const ft of floatTexts) {
    ft.y += ft.vy;
    ft.life -= 0.02;
  }
  floatTexts.splice(0, floatTexts.filter(ft => ft.life <= 0).length);
}

function drawBackground(ctx, W, H) {
  // Grid
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#00f5ff';
  ctx.lineWidth = 1;
  const gs = 80;
  for (let x = 0; x < W; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // City background elements (simple rectangles as "buildings")
  ctx.save();
  ctx.globalAlpha = 0.12;
  const buildingColors = ['#00f5ff', '#ff00aa', '#ffe600', '#aa00ff'];
  // Static buildings based on track (deterministic)
  const seed = game.trackDef.id.length;
  for (let i = 0; i < 20; i++) {
    const bx = ((i * 137 + seed * 37) % (W - 40)) + 20;
    const bh = 40 + (i * 73) % 120;
    const bw = 20 + (i * 53) % 50;
    const by = ((i * 91) % (H - bh - 20));
    ctx.fillStyle = buildingColors[i % buildingColors.length];
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.restore();
}

function drawTrack(ctx, W, H) {
  const pts = game.trackPoints;
  const tw = game.trackWidth;

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = tw * 2 + 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Track surface
  ctx.save();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = tw * 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Track border glow
  const trackColor = game.trackDef.color;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = tw * 2 + 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = trackColor;
  ctx.shadowBlur = 15;
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.stroke();
  ctx.restore();

  // Neon borders (two lines)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = trackColor;
    ctx.shadowBlur = 8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * tw * side;
      const ny = dx / len * tw * side;
      if (i === 0) ctx.moveTo(curr.x + nx, curr.y + ny);
      else ctx.lineTo(curr.x + nx, curr.y + ny);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Center dashes
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 30]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Start/finish line
  const sf = pts[0];
  const sfNext = pts[1];
  const sfDx = sfNext.x - sf.x;
  const sfDy = sfNext.y - sf.y;
  const sfLen = Math.sqrt(sfDx * sfDx + sfDy * sfDy) || 1;
  const sfNx = -sfDy / sfLen * tw;
  const sfNy = sfDx / sfLen * tw;

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(sf.x - sfNx, sf.y - sfNy);
  ctx.lineTo(sf.x + sfNx, sf.y + sfNy);
  ctx.stroke();
  ctx.restore();

  // Checkered pattern on start line
  for (let t = -1; t <= 1; t += 0.5) {
    const cx = sf.x + sfNx * t;
    const cy = sf.y + sfNy * t;
    ctx.save();
    ctx.fillStyle = t % 1 === 0 ? '#fff' : '#000';
    ctx.fillRect(cx - 4, cy - 6, 8, 12);
    ctx.restore();
  }
}

function drawCollectibles(ctx) {
  const t = performance.now() / 1000;
  for (const c of game.collectibles) {
    const bob = Math.sin(t * 2.5 + c.bobOffset) * 4;
    const y = c.y + bob;

    ctx.save();
    ctx.translate(c.x, y);
    ctx.rotate(c.rotation);

    if (c.type === 'coin') {
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cc9900';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#cc7700';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    } else if (c.type === 'nitro') {
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(0,245,255,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#00f5ff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);
    } else if (c.type === 'shield') {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(0,255,136,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡', 0, 0);
    }
    ctx.restore();
  }
}

function drawCars(ctx) {
  // Draw AI first, then player on top
  for (const ai of game.ai) {
    drawCar(ctx, ai);
  }
  drawCar(ctx, game.player);
}

function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle + Math.PI / 2);

  const w = car.width;
  const h = car.height;

  // Shield effect
  if (car.shieldTime > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    car.shieldTime -= 0.016;
  }

  // Car shadow
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(3, 3, w * 0.7, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Car body
  ctx.fillStyle = car.color;
  ctx.shadowColor = car.color;
  ctx.shadowBlur = car.nitroActive ? 20 : 8;
  ctx.beginPath();
  ctx.roundRect(-w/2, -h/2, w, h, 4);
  ctx.fill();

  // Windshield
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(-w/2 + 3, -h/2 + 4, w - 6, h * 0.3, 2);
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = car.accentColor;
  ctx.fillRect(-w/2 + 2, -h/2 + h * 0.35, w - 4, 3);

  // Taillights
  ctx.fillStyle = '#ff3300';
  ctx.shadowColor = '#ff3300';
  ctx.shadowBlur = 6;
  ctx.fillRect(-w/2 + 2, h/2 - 5, 5, 3);
  ctx.fillRect(w/2 - 7, h/2 - 5, 5, 3);

  // Headlights
  ctx.fillStyle = '#ffffaa';
  ctx.shadowColor = '#ffffaa';
  ctx.shadowBlur = 8;
  ctx.fillRect(-w/2 + 2, -h/2 + 2, 5, 3);
  ctx.fillRect(w/2 - 7, -h/2 + 2, 5, 3);

  // Wheels
  ctx.fillStyle = '#222';
  ctx.shadowColor = 'transparent';
  const wheelW = 5, wheelH = 9;
  // Front
  ctx.fillRect(-w/2 - wheelW + 1, -h/2 + 4, wheelW, wheelH);
  ctx.fillRect(w/2 - 1, -h/2 + 4, wheelW, wheelH);
  // Rear
  ctx.fillRect(-w/2 - wheelW + 1, h/2 - 4 - wheelH, wheelW, wheelH);
  ctx.fillRect(w/2 - 1, h/2 - 4 - wheelH, wheelW, wheelH);

  // Player indicator (arrow above)
  if (car.isPlayer) {
    ctx.fillStyle = '#fff';
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -h/2 - 14);
    ctx.lineTo(-6, -h/2 - 6);
    ctx.lineTo(6, -h/2 - 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawParticles(ctx) {
  for (const p of game.particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    if (p.type === 'smoke' || p.type === 'exhaust') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark' || p.type === 'flame') {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloatTexts(ctx) {
  for (const ft of floatTexts) {
    if (ft.life <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, ft.life);
    ctx.font = `bold 14px 'Orbitron', sans-serif`;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function drawSpeedLines(ctx, W, H, intensity) {
  ctx.save();
  ctx.globalAlpha = intensity * 0.15;
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const r1 = 80 + Math.random() * 100;
    const r2 = r1 + 80 + Math.random() * 120;
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMinimap() {
  if (!minimapCanvas || !minimapCtx || !game) return;
  const ctx = minimapCtx;
  const W = minimapCanvas.width;
  const H = minimapCanvas.height;
  const pad = 12;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(6,6,15,0.9)';
  ctx.fillRect(0, 0, W, H);

  // Map bounds
  const pts = game.trackPoints;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const mapW = maxX - minX || 1;
  const mapH = maxY - minY || 1;
  const scaleX = (W - pad * 2) / mapW;
  const scaleY = (H - pad * 2) / mapH;
  const scale = Math.min(scaleX, scaleY);
  const offX = pad + (W - pad * 2 - mapW * scale) / 2 - minX * scale;
  const offY = pad + (H - pad * 2 - mapH * scale) / 2 - minY * scale;

  const toMap = (px, py) => ({ x: px * scale + offX, y: py * scale + offY });

  // Draw track
  ctx.strokeStyle = game.trackDef.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = game.trackDef.color;
  ctx.shadowBlur = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  const sp = toMap(pts[0].x, pts[0].y);
  ctx.moveTo(sp.x, sp.y);
  for (let i = 1; i < pts.length; i++) {
    const p = toMap(pts[i].x, pts[i].y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw AI dots
  for (const ai of game.ai) {
    const mp = toMap(ai.x, ai.y);
    ctx.fillStyle = ai.color;
    ctx.shadowColor = ai.color;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player dot (bigger)
  const pp = toMap(game.player.x, game.player.y);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
// SECTION 16: RACE INITIALIZATION
// ============================================================

function placeCollectibles(trackPoints, trackWidth) {
  const collectibles = [];
  const totalLen = getTrackLength(trackPoints);
  const numCoins = 20;
  const numNitros = 6;
  const numShields = 3;

  for (let i = 0; i < numCoins; i++) {
    const t = (i / numCoins) + 0.05 + Math.random() * 0.02;
    const pos = getPositionAlongTrack(trackPoints, t % 1);
    const offset = (Math.random() - 0.5) * trackWidth * 0.8;
    const perpAngle = pos.angle + Math.PI / 2;
    collectibles.push(new Collectible(
      pos.x + Math.cos(perpAngle) * offset,
      pos.y + Math.sin(perpAngle) * offset,
      'coin'
    ));
  }

  for (let i = 0; i < numNitros; i++) {
    const t = (i / numNitros) + 0.1 + Math.random() * 0.05;
    const pos = getPositionAlongTrack(trackPoints, t % 1);
    collectibles.push(new Collectible(pos.x, pos.y, 'nitro'));
  }

  for (let i = 0; i < numShields; i++) {
    const t = (i / numShields) + 0.2 + Math.random() * 0.1;
    const pos = getPositionAlongTrack(trackPoints, t % 1);
    collectibles.push(new Collectible(pos.x, pos.y, 'shield'));
  }

  return collectibles;
}

function startRace(trackDef, carDef, difficulty, mode) {
  // Clean up previous game
  stopGameLoop();
  if (game) {
    game.running = false;
    game.finished = true;
  }
  floatTexts.length = 0;

  showScreen('game');
  resizeGameCanvas();

  // Hide overlays
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('results-overlay').style.display = 'none';
  document.getElementById('countdown-overlay').style.display = 'none';

  // Build track
  const rawPoints = generateTrackPoints(trackDef.id);
  const trackPoints = buildTrackPath(rawPoints, gameCanvas.width, gameCanvas.height);

  // Create game state
  game = createGameState(trackDef, carDef, difficulty, mode);
  game.trackPoints = trackPoints;
  game.running = true;

  // Start positions — stagger behind start line
  const startPos = trackPoints[0];
  const startNext = trackPoints[1];
  const sDx = startNext.x - startPos.x;
  const sDy = startNext.y - startPos.y;
  const sLen = Math.sqrt(sDx * sDx + sDy * sDy) || 1;
  const sAngle = Math.atan2(sDy, sDx);
  const perpX = -sDy / sLen;
  const perpY = sDx / sLen;

  // Place player
  const playerCarDef = carDef;
  const playerPos = {
    x: startPos.x + perpX * 20,
    y: startPos.y + perpY * 20
  };
  game.player = new Car(
    playerPos.x, playerPos.y, sAngle,
    playerCarDef.color, playerCarDef.accentColor,
    game.effectiveStats,
    true
  );

  // Place AI cars
  const aiCarDefs = CAR_DEFS.filter(c => c.id !== carDef.id);
  const aiColors = ['#ff00aa', '#ffe600', '#aa00ff', '#00ff88', '#ff6600'];
  const aiAccents = ['#cc0088', '#cc9900', '#7700cc', '#00cc66', '#cc4400'];

  for (let i = 0; i < trackDef.aiCount; i++) {
    const lane = (i % 2 === 0 ? -1 : 1) * (Math.floor(i / 2) + 1) * 25;
    const behind = (i + 1) * 40;
    const ax = startPos.x + perpX * lane - Math.cos(sAngle) * behind;
    const ay = startPos.y + perpY * lane - Math.sin(sAngle) * behind;

    const aiStats = {
      speed:        55 + Math.random() * 25,
      acceleration: 50 + Math.random() * 25,
      handling:     50 + Math.random() * 25,
      nitro:        50 + Math.random() * 25
    };

    const aiCar = new Car(
      ax, ay, sAngle,
      aiColors[i % aiColors.length],
      aiAccents[i % aiAccents.length],
      aiStats,
      false
    );
    aiCar.aiNitroChance = 0.001 + Math.random() * 0.003;
    game.ai.push(aiCar);
  }

  // Place collectibles
  game.collectibles = placeCollectibles(trackPoints, game.trackWidth);

  // Setup input
  setupInputListeners();

  // Start engine sound
  startEngineSound();

  // Start game loop (renders during countdown too)
  startGameLoop();

  // Countdown
  doCountdown();
}

function doCountdown() {
  game.started = false;
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdown-number');
  overlay.style.display = 'flex';

  let count = 3;
  numEl.textContent = '3';
  playCountdownBeep(false);

  const tick = setInterval(() => {
    count--;
    if (count > 0) {
      numEl.textContent = count;
      numEl.style.animation = 'none';
      numEl.offsetHeight; // reflow
      numEl.style.animation = '';
      playCountdownBeep(false);
    } else {
      clearInterval(tick);
      numEl.textContent = 'GO!';
      numEl.style.color = '#00ff88';
      numEl.style.animation = 'none';
      numEl.offsetHeight;
      numEl.style.animation = '';
      playCountdownBeep(true);
      game.started = true;
      setTimeout(() => {
        overlay.style.display = 'none';
        numEl.style.color = '';
      }, 700);
    }
  }, 900);
}

// ============================================================
// SECTION 17: RACE FINISH & RESULTS
// ============================================================

function finishRace() {
  if (!game || game.finished) return;
  game.finished = true;
  game.started = false;
  stopEngineSound();
  playFinishSound();

  // Calculate score
  const posBonus = [1000, 750, 500, 300, 100];
  const posPts = posBonus[Math.min(game.position - 1, posBonus.length - 1)];
  const coinPts = game.coins * 5;
  const driftPts = Math.floor(game.driftScore * 2);
  const timePts = game.mode === 'timetrial' ? 500 : 200;
  const totalScore = posPts + coinPts + driftPts + timePts;
  const xpGained = Math.floor(totalScore / 10);

  // Save progress
  saveData.coins += game.coins;
  saveData.xp += xpGained;

  // Best time
  const raceTimeStr = formatTime(game.raceTime);
  if (!saveData.bestTimes[game.trackDef.id] || game.raceTime < saveData.bestTimes[game.trackDef.id]) {
    saveData.bestTimes[game.trackDef.id] = game.raceTime;
    showToast('🏆 New Best Time!');
  }

  // Career progress
  if (game.mode === 'career' && game.position <= Math.ceil(game.totalCars / 2)) {
    if (!saveData.completedCareerRaces.includes(game.trackDef.id)) {
      saveData.completedCareerRaces.push(game.trackDef.id);
      saveData.careerWins++;
      showToast('Career race completed!');
    }
  }

  saveSave();
  updateMenuStats();

  // Position label
  const posLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const posLabel = posLabels[game.position - 1] || `${game.position}th`;
  const badge = game.position === 1 ? '🏆' : game.position === 2 ? '🥈' : game.position === 3 ? '🥉' : '🏁';
  const title = game.position === 1 ? 'RACE COMPLETE!' : game.position <= 3 ? 'RACE COMPLETE' : 'RACE FINISHED';

  // Show results
  document.getElementById('results-badge').textContent = badge;
  document.getElementById('results-title').textContent = title;
  document.getElementById('res-position').textContent = posLabel;
  document.getElementById('res-time').textContent = raceTimeStr;
  document.getElementById('res-coins').textContent = `+${game.coins}`;
  document.getElementById('res-score').textContent = totalScore.toLocaleString();
  document.getElementById('results-xp').textContent = `+${xpGained} XP`;

  setTimeout(() => {
    document.getElementById('results-overlay').style.display = 'flex';
  }, 1000);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(2,'0')}`;
}

function togglePause() {
  if (!game || game.finished) return;
  game.paused = !game.paused;
  const overlay = document.getElementById('pause-overlay');
  overlay.style.display = game.paused ? 'flex' : 'none';
  if (game.paused) {
    stopEngineSound();
  } else {
    startEngineSound();
  }
}

// ============================================================
// SECTION 18: MENU BUILDERS
// ============================================================

function buildQuickRaceScreen() {
  // Car select
  const carContainer = document.getElementById('qr-car-select');
  carContainer.innerHTML = '';
  CAR_DEFS.forEach(car => {
    const isLocked = !saveData.unlockedCars.includes(car.id);
    const div = document.createElement('div');
    div.className = `car-option${saveData.selectedCarId === car.id ? ' selected' : ''}${isLocked ? ' locked' : ''}`;
    div.innerHTML = `
      <span class="car-emoji">${car.emoji}</span>
      <div class="car-name">${car.name}</div>
      ${buildStatBars(car.baseStats)}
      ${isLocked ? `<div style="font-size:0.65rem;color:#ff6600;margin-top:0.3rem">🔒 ${car.price} coins</div>` : ''}
    `;
    if (!isLocked) {
      div.addEventListener('click', () => {
        saveData.selectedCarId = car.id;
        saveSave();
        buildQuickRaceScreen();
        playClickSound();
      });
    }
    carContainer.appendChild(div);
  });

  // Track select
  const trackContainer = document.getElementById('qr-track-select');
  trackContainer.innerHTML = '';
  TRACK_DEFS.forEach(track => {
    const div = document.createElement('div');
    div.className = `track-option${saveData.selectedTrackId === track.id ? ' selected' : ''}`;
    div.innerHTML = `
      <span class="track-icon">${track.icon}</span>
      <div class="track-name">${track.name}</div>
      <div class="track-diff">${track.difficulty}</div>
    `;
    div.addEventListener('click', () => {
      saveData.selectedTrackId = track.id;
      saveSave();
      buildQuickRaceScreen();
      playClickSound();
    });
    trackContainer.appendChild(div);
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === saveData.difficulty);
    btn.addEventListener('click', () => {
      saveData.difficulty = btn.dataset.diff;
      saveSave();
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playClickSound();
    });
  });
}

function buildStatBars(stats) {
  return `
    <div class="car-stats">
      ${['speed','acceleration','handling','nitro'].map(k => `
        <div class="stat-bar-row">
          <span>${k.charAt(0).toUpperCase()}</span>
          <div class="stat-bar-bg"><div class="stat-bar" style="width:${stats[k]}%"></div></div>
        </div>
      `).join('')}
    </div>
  `;
}

function buildCareerScreen() {
  const container = document.getElementById('career-races');
  container.innerHTML = '';

  TRACK_DEFS.forEach((track, i) => {
    const completed = saveData.completedCareerRaces.includes(track.id);
    const available = saveData.careerWins >= track.requiredCareerWins;
    const locked = !available;

    const div = document.createElement('div');
    div.className = `career-race${locked ? ' locked' : ''}${completed ? ' completed' : ''}`;

    const statusText = completed ? '✓ COMPLETED' : locked ? `🔒 WIN ${track.requiredCareerWins} RACES` : 'AVAILABLE';
    const statusClass = completed ? 'done' : locked ? 'locked-status' : 'available';

    div.innerHTML = `
      <div class="career-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="career-info">
        <div class="career-race-name">${track.name}</div>
        <div class="career-race-desc">${track.description}</div>
      </div>
      <div class="career-status ${statusClass}">${statusText}</div>
    `;

    if (!locked) {
      div.addEventListener('click', () => {
        playClickSound();
        const carDef = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
        startRace(track, carDef, saveData.difficulty, 'career');
        currentCareerTrack = track;
        currentCareerIndex = i;
      });
    }

    container.appendChild(div);
  });
}

function buildTimeTrial() {
  const trackContainer = document.getElementById('tt-track-select');
  trackContainer.innerHTML = '';
  TRACK_DEFS.forEach(track => {
    const bestT = saveData.bestTimes[track.id];
    const div = document.createElement('div');
    div.className = `track-option${saveData.selectedTrackId === track.id ? ' selected' : ''}`;
    div.innerHTML = `
      <span class="track-icon">${track.icon}</span>
      <div class="track-name">${track.name}</div>
      <div class="track-diff">Target: ${formatTime(track.targetTime)}</div>
      <div class="track-diff" style="color:${bestT ? '#00ff88':'#666'}">
        Best: ${bestT ? formatTime(bestT) : '--:--'}
      </div>
    `;
    div.addEventListener('click', () => {
      saveData.selectedTrackId = track.id;
      saveSave();
      buildTimeTrial();
      playClickSound();
    });
    trackContainer.appendChild(div);
  });
}

function buildGarage() {
  document.getElementById('garage-coins').textContent = saveData.coins;
  const showcase = document.getElementById('garage-showcase');
  showcase.innerHTML = '';

  CAR_DEFS.forEach(car => {
    const isLocked = !saveData.unlockedCars.includes(car.id);
    const isSelected = saveData.selectedCarId === car.id;
    const div = document.createElement('div');
    div.className = `garage-car-card${isSelected ? ' active' : ''}${isLocked ? ' locked-car' : ''}`;
    div.innerHTML = `
      ${isLocked ? `<div class="car-lock-badge">🔒 ${car.price}</div>` : ''}
      <span style="font-size:3rem">${car.emoji}</span>
      <div class="car-name" style="margin-top:0.5rem">${car.name}</div>
      ${buildStatBars(car.baseStats)}
      ${isLocked ? `<div class="unlock-cost">🪙 ${car.price} to unlock</div>` : ''}
    `;
    div.addEventListener('click', () => {
      playClickSound();
      if (isLocked) {
        if (saveData.coins >= car.price) {
          if (confirm(`Unlock ${car.name} for ${car.price} coins?`)) {
            saveData.coins -= car.price;
            saveData.unlockedCars.push(car.id);
            saveSave();
            buildGarage();
            showToast(`${car.name} unlocked!`);
          }
        } else {
          showToast(`Need ${car.price - saveData.coins} more coins!`);
        }
      } else {
        saveData.selectedCarId = car.id;
        saveSave();
        buildGarage();
      }
    });
    showcase.appendChild(div);
  });

  buildUpgradePanel();
}

function buildUpgradePanel() {
  const panel = document.getElementById('upgrade-panel');
  panel.innerHTML = '';

  const car = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
  const isLocked = !saveData.unlockedCars.includes(car.id);
  if (isLocked) {
    panel.innerHTML = `<p style="color:var(--text-muted);margin-top:1rem">Unlock this car to upgrade it.</p>`;
    return;
  }

  const carUpgrades = saveData.upgrades[car.id] || {};
  const h3 = document.createElement('h3');
  h3.textContent = `UPGRADES — ${car.name}`;
  panel.appendChild(h3);

  UPGRADE_DEFS.forEach(upg => {
    const level = carUpgrades[upg.key] || 0;
    const maxed = level >= upg.maxLevel;
    const cost = upg.costPerLevel * (level + 1);
    const canAfford = saveData.coins >= cost;

    const row = document.createElement('div');
    row.className = 'upgrade-row';
    const pips = Array.from({length: upg.maxLevel}, (_, i) =>
      `<div class="upg-pip${i < level ? ' filled' : ''}"></div>`
    ).join('');

    row.innerHTML = `
      <div class="upg-name">${upg.name}</div>
      <div class="upg-level-bar">${pips}</div>
      <div class="upg-cost">${maxed ? 'MAX' : `🪙 ${cost}`}</div>
      <button class="upg-btn${maxed ? ' maxed' : ''}" 
        data-car="${car.id}" data-key="${upg.key}"
        ${maxed || !canAfford ? 'disabled' : ''}>
        ${maxed ? 'MAXED' : 'UPGRADE'}
      </button>
    `;

    const btn = row.querySelector('.upg-btn');
    if (btn && !maxed) {
      btn.addEventListener('click', () => {
        playClickSound();
        if (saveData.coins >= cost && level < upg.maxLevel) {
          saveData.coins -= cost;
          saveData.upgrades[car.id][upg.key] = level + 1;
          saveSave();
          buildGarage();
          showToast(`${upg.name} upgraded to level ${level + 1}!`);
        } else if (!canAfford) {
          showToast(`Need ${cost - saveData.coins} more coins!`);
        }
      });
    }
    panel.appendChild(row);
  });
}

function buildSettings() {
  const sfxBtn = document.getElementById('toggle-sfx');
  const musicBtn = document.getElementById('toggle-music');
  const minimapBtn = document.getElementById('toggle-minimap');
  const particlesBtn = document.getElementById('toggle-particles');
  const hudBtn = document.getElementById('toggle-control-hud');

  function setToggle(btn, val, onText, offText) {
    if (!btn) return;
    btn.textContent = val ? onText : offText;
    btn.classList.toggle('off', !val);
  }

  setToggle(sfxBtn, saveData.settings.sfx, 'ON', 'OFF');
  setToggle(musicBtn, saveData.settings.music, 'ON', 'OFF');
  setToggle(minimapBtn, saveData.settings.minimap, 'ON', 'OFF');
  setToggle(particlesBtn, saveData.settings.particles, 'HIGH', 'LOW');
  setToggle(hudBtn, saveData.settings.controlHud !== false, 'ON', 'OFF');

  if (sfxBtn) sfxBtn.onclick = () => {
    saveData.settings.sfx = !saveData.settings.sfx;
    setToggle(sfxBtn, saveData.settings.sfx, 'ON', 'OFF');
    saveSave();
    if (saveData.settings.sfx) playClickSound();
  };
  if (musicBtn) musicBtn.onclick = () => {
    saveData.settings.music = !saveData.settings.music;
    setToggle(musicBtn, saveData.settings.music, 'ON', 'OFF');
    saveSave();
  };
  if (minimapBtn) minimapBtn.onclick = () => {
    saveData.settings.minimap = !saveData.settings.minimap;
    setToggle(minimapBtn, saveData.settings.minimap, 'ON', 'OFF');
    saveSave();
  };
  if (particlesBtn) particlesBtn.onclick = () => {
    saveData.settings.particles = !saveData.settings.particles;
    setToggle(particlesBtn, saveData.settings.particles, 'HIGH', 'LOW');
    saveSave();
  };
  if (hudBtn) hudBtn.onclick = () => {
    saveData.settings.controlHud = saveData.settings.controlHud === false ? true : false;
    setToggle(hudBtn, saveData.settings.controlHud, 'ON', 'OFF');
    saveSave();
  };
}

function updateMenuStats() {
  const coinsEl = document.getElementById('menu-coins');
  const bestEl = document.getElementById('menu-besttime');
  if (coinsEl) coinsEl.textContent = saveData.coins;
  if (bestEl) {
    const bestTrack = saveData.selectedTrackId || 'city_sprint';
    const bt = saveData.bestTimes[bestTrack];
    bestEl.textContent = bt ? formatTime(bt) : '--:--';
  }
}

// ============================================================
// SECTION 19: CAREER STATE
// ============================================================

let currentCareerTrack = null;
let currentCareerIndex = 0;

// ============================================================
// SECTION 20: EVENT LISTENERS & INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initToast();
  initMenuBackground();
  updateMenuStats();
  applyTheme(saveData.settings.theme || 'cyberpunk');
  setupVirtualControls();

  // Theme Chip Click Listeners
  document.querySelectorAll('.theme-chip, .theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      const theme = btn.dataset.theme;
      applyTheme(theme);
    });
  });

  // ---- Main Menu Buttons ----
  document.getElementById('btn-play').addEventListener('click', () => {
    playClickSound();
    buildQuickRaceScreen();
    showScreen('quickrace');
  });

  document.getElementById('btn-career').addEventListener('click', () => {
    playClickSound();
    buildCareerScreen();
    showScreen('career');
  });

  document.getElementById('btn-timetrial').addEventListener('click', () => {
    playClickSound();
    buildTimeTrial();
    showScreen('timetrial');
  });

  document.getElementById('btn-garage').addEventListener('click', () => {
    playClickSound();
    buildGarage();
    showScreen('garage');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    playClickSound();
    buildSettings();
    showScreen('settings');
  });

  document.getElementById('btn-howtoplay').addEventListener('click', () => {
    playClickSound();
    showScreen('howtoplay');
  });

  // ---- Back Buttons ----
  ['qr-back', 'career-back', 'tt-back', 'garage-back', 'settings-back', 'htp-back'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      playClickSound();
      showScreen('menu');
    });
  });

  // ---- Quick Race Start ----
  document.getElementById('qr-start').addEventListener('click', () => {
    playClickSound();
    const carDef = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
    const trackDef = TRACK_DEFS.find(t => t.id === saveData.selectedTrackId) || TRACK_DEFS[0];
    startRace(trackDef, carDef, saveData.difficulty, 'quickrace');
  });

  // ---- Time Trial Start ----
  document.getElementById('tt-start').addEventListener('click', () => {
    playClickSound();
    const carDef = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
    const trackDef = TRACK_DEFS.find(t => t.id === saveData.selectedTrackId) || TRACK_DEFS[0];
    startRace(trackDef, carDef, 'medium', 'timetrial');
  });

  // ---- Pause Menu ----
  document.getElementById('btn-resume').addEventListener('click', () => {
    playClickSound();
    togglePause();
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    playClickSound();
    document.getElementById('pause-overlay').style.display = 'none';
    if (game) {
      const { trackDef, carDef, difficulty, mode } = game;
      startRace(trackDef, carDef, difficulty, mode);
    }
  });

  document.getElementById('btn-pause-settings').addEventListener('click', () => {
    playClickSound();
    buildSettings();
    showScreen('settings');
    if (game) game.paused = true;
  });

  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    playClickSound();
    stopGameLoop();
    removeInputListeners();
    document.getElementById('pause-overlay').style.display = 'none';
    showScreen('menu');
    updateMenuStats();
    if (menuAnimFrame === null) initMenuBackground();
  });

  // ---- Results Buttons ----
  document.getElementById('btn-retry').addEventListener('click', () => {
    playClickSound();
    if (game) {
      const { trackDef, carDef, difficulty, mode } = game;
      startRace(trackDef, carDef, difficulty, mode);
    }
  });

  document.getElementById('btn-next-race').addEventListener('click', () => {
    playClickSound();
    if (game && game.mode === 'career' && currentCareerTrack) {
      const nextIdx = currentCareerIndex + 1;
      if (nextIdx < TRACK_DEFS.length) {
        const nextTrack = TRACK_DEFS[nextIdx];
        const carDef = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
        currentCareerIndex = nextIdx;
        currentCareerTrack = nextTrack;
        startRace(nextTrack, carDef, saveData.difficulty, 'career');
      } else {
        showToast('All career races completed!');
        stopGameLoop();
        removeInputListeners();
        showScreen('menu');
        updateMenuStats();
      }
    } else if (game) {
      // Quick race — next track
      const curIdx = TRACK_DEFS.findIndex(t => t.id === game.trackDef.id);
      const nextTrack = TRACK_DEFS[(curIdx + 1) % TRACK_DEFS.length];
      const carDef = CAR_DEFS.find(c => c.id === saveData.selectedCarId) || CAR_DEFS[0];
      startRace(nextTrack, carDef, saveData.difficulty, 'quickrace');
    }
  });

  document.getElementById('btn-res-garage').addEventListener('click', () => {
    playClickSound();
    stopGameLoop();
    removeInputListeners();
    document.getElementById('results-overlay').style.display = 'none';
    buildGarage();
    showScreen('garage');
  });

  document.getElementById('btn-res-menu').addEventListener('click', () => {
    playClickSound();
    stopGameLoop();
    removeInputListeners();
    document.getElementById('results-overlay').style.display = 'none';
    showScreen('menu');
    updateMenuStats();
    if (menuAnimFrame === null) initMenuBackground();
  });

  // ---- Settings - Reset ----
  document.getElementById('btn-reset-progress').addEventListener('click', () => {
    if (confirm('Reset ALL progress? This cannot be undone!')) {
      resetSave();
      buildSettings();
    }
  });

  // ---- Window resize ----
  window.addEventListener('resize', () => {
    if (currentScreen === 'game') {
      resizeGameCanvas();
      if (game && game.trackPoints) {
        // Rebuild track for new dimensions
        const rawPoints = generateTrackPoints(game.trackDef.id);
        game.trackPoints = buildTrackPath(rawPoints, gameCanvas.width, gameCanvas.height);
      }
    }
  });

  // ---- Init canvas ----
  initGameCanvas();

  // ---- Init neon cursor ----
  initNeonCursor();
});

// ============================================================
// NEON HAND CURSOR SYSTEM
// ============================================================

function initNeonCursor() {
  // ── 1. Create cursor element ──────────────────────────────
  const cursor = document.createElement('div');
  cursor.id = 'neon-cursor';

  // Pointing-hand SVG (index finger up, neon outline style)
  cursor.innerHTML = `
    <svg class="cursor-hand" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- index finger -->
      <rect x="9" y="0" width="6" height="16" rx="3"
            fill="rgba(0,245,255,0.12)" stroke="#00f5ff" stroke-width="1.5"/>
      <!-- middle finger -->
      <rect x="15" y="5" width="5.5" height="13" rx="2.75"
            fill="rgba(0,245,255,0.08)" stroke="#00f5ff" stroke-width="1.2" opacity="0.85"/>
      <!-- ring finger -->
      <rect x="3.5" y="5" width="5.5" height="13" rx="2.75"
            fill="rgba(0,245,255,0.08)" stroke="#00f5ff" stroke-width="1.2" opacity="0.85"/>
      <!-- pinky -->
      <rect x="-1" y="8" width="5" height="11" rx="2.5"
            fill="rgba(0,245,255,0.06)" stroke="#00f5ff" stroke-width="1" opacity="0.7"/>
      <!-- palm -->
      <rect x="3.5" y="14" width="17" height="14" rx="4"
            fill="rgba(0,245,255,0.1)" stroke="#00f5ff" stroke-width="1.5"/>
      <!-- thumb -->
      <ellipse cx="2.5" cy="20" rx="3" ry="4"
               fill="rgba(0,245,255,0.1)" stroke="#00f5ff" stroke-width="1.2"/>
      <!-- fingernail highlight on index -->
      <rect x="10.5" y="1.5" width="3" height="4" rx="1.5" fill="rgba(0,245,255,0.3)"/>
    </svg>
    <div class="cursor-ring"></div>
    <div class="cursor-dot"></div>
  `;
  document.body.appendChild(cursor);

  // ── 2. Tracking state ────────────────────────────────────
  let mouseX = -200, mouseY = -200;
  let cursorX = -200, cursorY = -200;
  let trailTimer = 0;
  let isOverBtn = false;
  let rafId = null;

  // Selectors for "interactive" elements on the menu
  const INTERACTIVE = '#screen-menu .menu-btn, #screen-menu .logo';

  // ── 3. Mouse move → smooth follow with lerp ───────────────
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Spawn a faint trail dot every ~60 px of movement
    if (currentScreen === 'menu') spawnTrailDot(e.clientX, e.clientY);

    // Check hover
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const hovering = el && el.closest('#screen-menu .menu-btn');
    if (hovering !== isOverBtn) {
      isOverBtn = !!hovering;
      cursor.classList.toggle('over-btn', isOverBtn);
    }
  });

  // ── 4. Click burst ────────────────────────────────────────
  document.addEventListener('mousedown', e => {
    if (currentScreen !== 'menu') return;
    cursor.classList.add('clicking');
    spawnClickBurst(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
  });

  // ── 5. Hide/show with screen transitions ─────────────────
  // We observe class changes on .screen.active
  const observer = new MutationObserver(() => {
    const onMenu = currentScreen === 'menu';
    cursor.style.display = onMenu ? 'block' : 'none';
  });
  observer.observe(document.getElementById('app'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  cursor.style.display = 'block'; // start visible (menu is default)

  // ── 6. Animation loop — smooth lerp follow ────────────────
  function animateCursor() {
    // Lerp toward mouse
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;

    cursor.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;
    rafId = requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

// ── Spawn a small trail dot at (x, y) ──────────────────────
let _lastTrailX = 0, _lastTrailY = 0;
function spawnTrailDot(x, y) {
  const dx = x - _lastTrailX, dy = y - _lastTrailY;
  if (dx * dx + dy * dy < 900) return; // only every ~30px
  _lastTrailX = x; _lastTrailY = y;

  const dot = document.createElement('div');
  dot.className = 'cursor-trail-dot';
  const size = 3 + Math.random() * 3;
  dot.style.cssText = `
    width:${size}px; height:${size}px;
    left:${x - size / 2}px; top:${y - size / 2}px;
    opacity:0.6;
  `;
  document.body.appendChild(dot);
  // Self-remove after animation ends (0.4 s)
  setTimeout(() => dot.remove(), 420);
}

// ── Spawn click burst sparks centred at (x, y) ─────────────
function spawnClickBurst(x, y) {
  const colors = ['#00f5ff', '#ff00aa', '#ffe600', '#aa00ff', '#00ff88'];
  const burst = document.createElement('div');
  burst.className = 'cursor-burst';
  burst.style.cssText = `left:${x}px; top:${y}px;`;

  const COUNT = 10;
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const dist  = 28 + Math.random() * 28;
    const bx    = Math.round(Math.cos(angle) * dist);
    const by    = Math.round(Math.sin(angle) * dist);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = (Math.random() * 60).toFixed(0);

    const span = document.createElement('span');
    span.style.cssText = `
      --bx:${bx}px; --by:${by}px;
      background:${color};
      box-shadow:0 0 6px ${color};
      animation-delay:${delay}ms;
      left:-2.5px; top:-2.5px;
    `;
    burst.appendChild(span);
  }

  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 650);
}

