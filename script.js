const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const drawButton = document.getElementById('drawButton');
const slowMoButton = document.getElementById('slowMoButton');
const resetButton = document.getElementById('resetButton');
const presetSelect = document.getElementById('presetSelect');
const secondTypeSelect = document.getElementById('secondTypeSelect');
const ballCountInput = document.getElementById('ballCountInput');
const ballDrawInput  = document.getElementById('ballDrawInput');
const starCountInput = document.getElementById('starCountInput');
const starDrawInput  = document.getElementById('starDrawInput');
const mixTimeInput   = document.getElementById('mixTimeInput');

const subtitleEl     = document.getElementById('subtitle');
const titleEl        = document.getElementById('title');
const lastDrawnEl    = document.getElementById('lastDrawn');
const ballsRowEl     = document.getElementById('ballsRow');
const secondLabelEl  = document.getElementById('secondLabel');
const secondValuesEl = document.getElementById('secondValues');

const soundAir      = document.getElementById('soundAir');
const soundFlap     = document.getElementById('soundFlap');
const soundBall     = document.getElementById('soundBall');
const soundFanfare  = document.getElementById('soundFanfare');

const W = canvas.width;
const H = canvas.height;

const CX = W / 2;
const CY = H / 2 - 10;
const SPHERE_RADIUS = 190;
const BALL_RADIUS   = 18;

const muteButton = document.getElementById('muteButton');

let soundMuted = false;

let blurredBgCanvas = null;
let blurredBgReady  = false;

function applyMuteState() {
  const mute = soundMuted;

  [soundAir, soundFlap, soundBall, soundFanfare].forEach(snd => {
    if (!snd) return;
    snd.muted = mute;  // sorgt dafür, dass ALLE sofort stumm / laut sind
  });

  if (muteButton) {
    muteButton.textContent = mute ? '🔇 Sound: Aus' : '🔊 Sound: An';
  }
}

// Lautstärken (anpassbar)
if (soundAir)     soundAir.volume = 0.7;
if (soundFlap)    soundFlap.volume = 1.0;
if (soundBall)    soundBall.volume = 1.0;
if (soundFanfare) soundFanfare.volume = 1.0;

// NEU: initialen Mute-Status anwenden
applyMuteState();

// Themes (inkl. Canvas-Hintergrundbilder & Textfarben)
const THEMES = {
  custom: {
    name: 'custom',
    bgTop:    '#ffe8f2',
    bgMid:    '#f4f7ff',
    bgBottom: '#c6d0ff',
    bgImage:  null,

    sphereInner1: '#ffffff',
    sphereInner2: '#f4f4ff',
    sphereInner3: '#d0d8ff',
    sphereBorder: 'rgba(180,190,240,0.9)',

    floorLight: 'rgba(255,255,255,0.4)',
    floorDark:  'rgba(150,160,220,0.2)',

    ballColors: [
      '#ff9ebe','#ffd47a','#a5e6a3','#9ad6ff',
      '#c7b6ff','#ffb5e8','#f9e0ae','#b4f1f1'
    ],
    goldColor:  '#f2c24b',
    starStroke: 'rgba(120,90,30,0.9)',
    extraStroke:'rgba(130,95,35,0.9)',

    uiAccent: '#ff6fa6',
    textColor: '#ffffff'
  },
  euromillions: {
    name: 'euromillions',
    bgTop:    '#020b3b',
    bgMid:    '#061a5c',
    bgBottom: '#000111',
    bgImage:  'em.jpg',

    sphereInner1: '#12245a',
    sphereInner2: '#07173c',
    sphereInner3: '#020717',
    sphereBorder: 'rgba(250,242,210,0.95)',

    floorLight: 'rgba(255,255,255,0.25)',
    floorDark:  'rgba(0,0,40,0.6)',

    ballColors: [
      '#eef0f5'
    ],
    goldColor:  '#f7d54a',
    starStroke: 'rgba(248,230,160,0.95)',
    extraStroke:'rgba(248,230,160,0.95)',

    uiAccent: '#f7d54a',
    textColor: '#000000'
  },
  swisslotto: {
    name: 'swisslotto',
    bgTop:    '#ffede7',
    bgMid:    '#ffb39c',
    bgBottom: '#bf1a2f',
    bgImage:  'sl.jpg',

    sphereInner1: '#ffe3d6',
    sphereInner2: '#ffaf82',
    sphereInner3: '#e3513d',
    sphereBorder: 'rgba(255,255,255,0.95)',

    floorLight: 'rgba(255,255,255,0.5)',
    floorDark:  'rgba(180,40,40,0.4)',

    ballColors: [
      '#eef0f5'
    ],
    goldColor:  '#ffe36c',
    starStroke: 'rgba(180,70,20,0.95)',
    extraStroke:'rgba(180,70,20,0.95)',

    uiAccent: '#e53935',
    textColor: '#000000'
  },
  eurojackpot: {
    name: 'eurojackpot',
    bgTop:    '#0b2a4a',
    bgMid:    '#18436e',
    bgBottom: '#020814',
    bgImage:  'ej.jpg',

    sphereInner1: '#fdf7d2',
    sphereInner2: '#f0e38f',
    sphereInner3: '#d4b942',
    sphereBorder: 'rgba(255,255,255,0.95)',

    floorLight: 'rgba(255,255,255,0.5)',
    floorDark:  'rgba(10,10,40,0.6)',

    // alle Kugeln gelb
    ballColors: [
      '#ffd84a'
    ],
    goldColor:  '#ffd84a',
    starStroke: 'rgba(150,120,40,0.9)',
    extraStroke:'rgba(150,120,40,0.9)',

    uiAccent: '#ffd84a',
    textColor: '#000000'
  }
};

let currentThemeKey = 'custom';
function getTheme() {
  return THEMES[currentThemeKey] || THEMES.custom;
}

// Canvas-spezifische Hintergrundbilder
const themeBgImages = {};
function ensureThemeImageLoaded() {
  const t = getTheme();
  if (!t.bgImage) return;
  if (themeBgImages[currentThemeKey]) return;
  const img = new Image();
  img.src = t.bgImage;
  themeBgImages[currentThemeKey] = img;
}

function applyThemeToPage() {
  const t = getTheme();
  document.body.style.background =
    `radial-gradient(circle at top, ${t.bgTop} 0, ${t.bgMid} 40%, ${t.bgBottom} 100%)`;
  titleEl.style.color = t.uiAccent;
  ensureThemeImageLoaded();
}

// globale Counts
let BALL_COUNT = 50;
let STAR_COUNT = 10;
let BALL_DRAWTARGET = 6;
let STAR_DRAWTARGET = 2;

// Physik
const DAMPING       = 0.975;
const BOUNCE        = 0.95;
const MAX_SPEED     = 700;
const GRAVITY       = 800;
const OUTWARD_FORCE = 130;
const GENTLE_FORCE  = 12;

// Spin-Physik
const SPIN_FACTOR   = 0.010; // wie stark Geschwindigkeit in Drehung umgesetzt wird

// Luftstrahl
const JET_STRENGTH  = 145000;
const JET_RADIUS    = 120;
const JET_HEIGHT    = 150;

// Rotation der großen Kugel
const ROT_OMEGA = { x: 0.2, y: 0.1, z: 0.05 };
const ROT_FORCE_SCALE = 15;

// Optische Rotation
let drumAngle = 0;
const DRUM_ROT_SPEED = 0.2;

// Luftstrahl-Animation
let jetPhase = 0;

// Gate / Klappe
const GATE_DOWN_VECTOR = {x: 0, y: 1, z: 0};
const GATE_ANGLE_DEG   = 25;
const GATE_COS         = Math.cos(GATE_ANGLE_DEG * Math.PI / 180);
const GATE_RADIUS_TOL  = BALL_RADIUS * 1.3;

// Modi
// 'idle' | 'airblast' | 'drawing' | 'highlight'
let mode = 'idle';
let slowMo = false;

// Sequenz-Phasen: 0 = Zahlen, 1 = Zusatz
let phaseIndex = 0;
// shapeMode: 'ball', 'star', 'extra'
let shapeMode  = 'ball';

// zweite Ziehung Typ: 'star' (Sterne) oder 'extra' (Zusatzzahlen)
let secondPhaseMode = 'star';

// Auto-Ziehungen
let autoDrawTarget = 1;
let autoDrawCount  = 0;
let autoDrawing    = false;
let autoMixing     = false;
let autoMixTimer   = 0;

// Highlight / Sequenz-Parameter
const DEFAULT_AUTO_MIX_TIME = 5.0;
let AUTO_MIX_TIME = DEFAULT_AUTO_MIX_TIME;
const HIGHLIGHT_DURATION = 2.0;
const HIGHLIGHT_FADE     = 0.25;
const HIGHLIGHT_POP_TIME = 0.45;
const HIGHLIGHT_POP_MAX  = 1.18;

// Klappen-Anim (0 = zu, 1 = offen)
let flapAnim = 0;

let balls = [];
let lastTimestamp = null;

// Ergebnis
let drawnBalls = [];
let drawnStars = [];
let lastDrawNumber = null;
let lastDrawType   = null;

// Highlight der gezogenen Zahl im Inneren
let highlightBall = null;

// Große 2-Zeilen-Ergebnisanzeige
let frontBalls = [];
let frontStars = [];
let frontSecondMode = 'star';
let frontResultsAlpha = 0;
let frontResultsTargetAlpha = 0;
const FRONT_FADE_SPEED = 8.0;

let frontBobPhase = 0;
const FRONT_BOB_SPEED = 1.1;
const FRONT_BOB_AMPLITUDE = 0;

// Kugeln sollen nach Reset / Ziehung kurz fallen und dann eingefroren werden
let settleElapsed = 0;          // wie lange wir schon im "ruhigen Idle" sind
let calmFrozen   = false;       // ob die Kugeln aktuell komplett eingefroren sind
const SETTLE_TIME = 1.2;        // Sekunden, wie lange sie noch "physikalisch" fallen/rollen dürfen

// Fanfare nur einmal pro kompletter Ziehung
let fanfarePlayed = false;

function randRange(min, max) {
  return min + Math.random() * (max - min);
}
function length3(x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
}
function dot3(ax, ay, az, bx, by, bz) {
  return ax*bx + ay*by + az*bz;
}
function shadeColor(color, percent) {
  const num = parseInt(color.slice(1), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function themeBallColor() {
  const t = getTheme();
  const arr = t.ballColors;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sounds
function playAir() {
  if (!soundAir) return;
  try { soundAir.currentTime = 0; soundAir.play(); } catch(e){}
}
function stopAir() {
  if (!soundAir) return;
  try { soundAir.pause(); soundAir.currentTime = 0; } catch(e){}
}
function playFlap() {
  if (!soundFlap) return;
  try { soundFlap.currentTime = 0; soundFlap.play(); } catch(e){}
}
function playBallSound() {
  if (!soundBall) return;
  try { soundBall.currentTime = 0; soundBall.play(); } catch(e){}
}
function playFanfare() {
  if (!soundFanfare) return;
  try {
    soundFanfare.pause();
    soundFanfare.currentTime = 0;
    soundFanfare.play();
  } catch(e){}
}

function readInputs() {
  let bd = parseInt(ballDrawInput.value, 10);
  let bc = parseInt(ballCountInput.value, 10);
  if (isNaN(bd) || bd < 0) bd = 0;
  if (isNaN(bc) || bc < 0) bc = 0;
  if (bc > 200) bc = 200;
  if (bd > bc) bd = bc;
  BALL_DRAWTARGET = bd;
  BALL_COUNT      = bc;
  ballDrawInput.value  = String(bd);
  ballCountInput.value = String(bc);

  let sd = parseInt(starDrawInput.value, 10);
  let sc = parseInt(starCountInput.value, 10);
  if (isNaN(sd) || sd < 0) sd = 0;
  if (isNaN(sc) || sc < 0) sc = 0;
  if (sc > 200) sc = 200;
  if (sd > sc) sd = sc;
  STAR_DRAWTARGET = sd;
  STAR_COUNT      = sc;
  starDrawInput.value  = String(sd);
  starCountInput.value = String(sc);

  let mt = parseFloat(mixTimeInput.value);
  if (isNaN(mt) || mt <= 0) mt = DEFAULT_AUTO_MIX_TIME;
  if (mt > 60) mt = 60;
  AUTO_MIX_TIME = mt;
  mixTimeInput.value = String(mt);
}

function updateSecondLabel() {
  if (presetSelect.value === 'eurojackpot') {
    secondLabelEl.textContent = 'Eurozahlen:';
    return;
  }
  if (secondPhaseMode === 'star') {
    secondLabelEl.textContent = 'Sterne:';
  } else {
    secondLabelEl.textContent = 'Zusatzzahlen:';
  }
}

function updateSubtitleText() {
  const preset = presetSelect.value;
  if (preset === 'euromillions') {
    subtitleEl.innerHTML = 'Euromillions: 5 Zahlen aus 50 &amp; 2 Sterne aus 12. Ziehung: zuerst Zahlen, dann Sterne ✨';
  } else if (preset === 'eurojackpot') {
    subtitleEl.innerHTML = 'Eurojackpot: 5 Zahlen aus 50 &amp; 2 Eurozahlen aus 12. Ziehung: zuerst Zahlen, dann Eurozahlen ✨';
  } else if (preset === 'swisslotto') {
    subtitleEl.innerHTML = 'Swiss Lotto: 6 Zahlen aus 42 &amp; 1 Zusatzzahl aus 6. Ziehung: zuerst Zahlen, dann Zusatzzahl ✨';
  } else {
    subtitleEl.innerHTML = 'Zuerst Zahlen, dann Zusatz (Sterne oder Zusatzzahlen) ✨';
  }
}

function applyPreset(preset) {
  if (preset === 'euromillions') {
    ballDrawInput.value  = '5';
    ballCountInput.value = '50';
    starDrawInput.value  = '2';
    starCountInput.value = '12';
    secondPhaseMode = 'star';
    secondTypeSelect.value = 'star';
    currentThemeKey = 'euromillions';
  } else if (preset === 'eurojackpot') {
    ballDrawInput.value  = '5';
    ballCountInput.value = '50';
    starDrawInput.value  = '2';
    starCountInput.value = '12';
    secondPhaseMode = 'extra';
    secondTypeSelect.value = 'extra';
    currentThemeKey = 'eurojackpot';
  } else if (preset === 'swisslotto') {
    ballDrawInput.value  = '6';
    ballCountInput.value = '42';
    starDrawInput.value  = '1';
    starCountInput.value = '6';
    secondPhaseMode = 'extra';
    secondTypeSelect.value = 'extra';
    currentThemeKey = 'swisslotto';
  } else {
    currentThemeKey = 'custom';
    applyThemeToPage();
    updateSecondLabel();
    updateSubtitleText();
    resetAll();
    return;
  }
  applyThemeToPage();
  updateSecondLabel();
  updateSubtitleText();
  resetAll();
}

function initPhase(type, count) {
  shapeMode = type;
  balls = [];

  const t = getTheme();
  const innerR = SPHERE_RADIUS - BALL_RADIUS * 2;
  const isGoldenPhase = (type === 'star' || type === 'extra');

  for (let n = 1; n <= count; n++) {
    let x, y, z, tries = 0;
    do {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(randRange(-1, 1));
      const r     = innerR * Math.cbrt(Math.random());
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi);
      z = r * Math.sin(phi) * Math.sin(theta);
      tries++;
    } while (tries < 300 && balls.some(b => {
      const dx = b.x - x;
      const dy = b.y - y;
      const dz = b.z - z;
      return length3(dx, dy, dz) < BALL_RADIUS * 2.2;
    }));

    balls.push({
      x, y, z,
      vx: 0,
      vy: 0,
      vz: 0,
      color: isGoldenPhase ? t.goldColor : themeBallColor(),
      number: n,
      exiting: false,
      exitStep: 0,
      startExit: null,
      spinAngle: Math.random() * Math.PI * 2,
      spinVel: 0,
      asleep: false
    });
  }
}

function resetAll() {
  readInputs();

  phaseIndex = 0;
  lastDrawNumber = null;
  lastDrawType   = null;
  drawnBalls = [];
  drawnStars = [];
  highlightBall = null;

  frontBalls = [];
  frontStars = [];
  frontSecondMode = secondPhaseMode;
  frontResultsTargetAlpha = 0;
  frontResultsAlpha = 0;

  mode = 'idle';
  autoDrawTarget = 1;
  autoDrawCount  = 0;
  autoDrawing    = false;
  autoMixing     = false;
  autoMixTimer   = 0;
  flapAnim       = 0;
  drumAngle      = 0;
  jetPhase       = 0;

  settleElapsed = 0;
  calmFrozen = false;

  fanfarePlayed = false;

  if (BALL_COUNT > 0) {
    initPhase('ball', BALL_COUNT);
  } else if (STAR_COUNT > 0) {
    phaseIndex = 1;
    const typeForSecond = (secondPhaseMode === 'star') ? 'star' : 'extra';
    initPhase(typeForSecond, STAR_COUNT);
  } else {
    balls = [];
  }

  // sicherheitshalber alle Kugeln "aufwecken"
  for (const b of balls) {
    b.asleep = false;
  }

  applyThemeToPage();
  updateSecondLabel();
  updateSubtitleText();
  updateUI();
  drawButton.textContent = 'Ziehung starten 💨';
  drawButton.disabled = false;
  stopAir();
}

function applyAirJet(dt) {
  const nozzleBottomY = SPHERE_RADIUS - BALL_RADIUS * 2;
  const nozzleTopY    = nozzleBottomY - JET_HEIGHT;
  const pulse = 1 + 0.2 * Math.sin(jetPhase * 3 + Math.sin(jetPhase * 1.3));

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    if (b.y < nozzleTopY || b.y > nozzleBottomY) continue;

    const rXZ = Math.sqrt(b.x*b.x + b.z*b.z);
    if (rXZ > JET_RADIUS) continue;

    const radialFactor = 1 - (rXZ / JET_RADIUS);
    const verticalFactor = 1 - (b.y - nozzleTopY) / (nozzleBottomY - nozzleTopY);
    const f = Math.max(0, radialFactor * verticalFactor);
    if (f <= 0) continue;

    const strength = JET_STRENGTH * f * pulse;
    b.vy -= strength * dt;

    const swirl = strength * 0.04;
    b.vx += randRange(-1, 1) * swirl * dt;
    b.vz += randRange(-1, 1) * swirl * dt;
  }
}

function applyRotationalSwirl(dt) {
  const ox = ROT_OMEGA.x;
  const oy = ROT_OMEGA.y;
  const oz = ROT_OMEGA.z;

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    const rx = b.x, ry = b.y, rz = b.z;
    const tx = oy * rz - oz * ry;
    const ty = oz * rx - ox * rz;
    const tz = ox * ry - oy * rx;
    b.vx += tx * ROT_FORCE_SCALE * dt;
    b.vy += ty * ROT_FORCE_SCALE * dt;
    b.vz += tz * ROT_FORCE_SCALE * dt;
  }
}

function applyGravityAndShellForce(dt) {
  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    b.vy += GRAVITY * dt;

    const r = length3(b.x, b.y, b.z) || 1;
    const nx = b.x / r;
    const ny = b.y / r;
    const nz = b.z / r;

    if (r < SPHERE_RADIUS - BALL_RADIUS * 3) {
      b.vx += nx * OUTWARD_FORCE * dt;
      b.vy += ny * OUTWARD_FORCE * dt * 0.3;
      b.vz += nz * OUTWARD_FORCE * dt;
    }
  }
}

function applyGravityOnly(dt) {
  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    b.vy += GRAVITY * dt;
  }
}

function integrateBalls(dt) {
  const maxDist = SPHERE_RADIUS - BALL_RADIUS;

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;

    const speed0 = length3(b.vx, b.vy, b.vz);
    if (speed0 > MAX_SPEED) {
      const f = MAX_SPEED / (speed0 || 1);
      b.vx *= f;
      b.vy *= f;
      b.vz *= f;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;

    const distFromCenter = length3(b.x, b.y, b.z);
    if (distFromCenter > maxDist) {
      const nx = b.x / distFromCenter;
      const ny = b.y / distFromCenter;
      const nz = b.z / distFromCenter;

      b.x = nx * maxDist;
      b.y = ny * maxDist;
      b.z = nz * maxDist;

      const dot = b.vx*nx + b.vy*ny + b.vz*nz;
      b.vx = (b.vx - 2*dot*nx) * BOUNCE;
      b.vy = (b.vy - 2*dot*ny) * BOUNCE;
      b.vz = (b.vz - 2*dot*nz) * BOUNCE;

      if (ny < -0.7) {
        let tx = -nz;
        let tz = nx;
        let tlen = Math.sqrt(tx*tx + tz*tz) || 1;
        tx /= tlen; tz /= tlen;
        const side = Math.random() < 0.5 ? 1 : -1;
        const sideSpeed = 140;
        b.vx += tx * side * sideSpeed;
        b.vz += tz * side * sideSpeed;
      }
    }

    // Grunddämpfung
    b.vx *= DAMPING;
    b.vy *= DAMPING;
    b.vz *= DAMPING;

    // Drehgeschwindigkeit aus der lateralen Geschwindigkeit ableiten
    const tangentialSpeed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    b.spinVel += tangentialSpeed * SPIN_FACTOR * dt;
    b.spinVel *= 0.98;

    // KEINE per-Ball-Sleep-Logik mehr hier!
  }
}

function handleCollisions() {
  const n = balls.length;
  for (let i = 0; i < n; i++) {
    const bi = balls[i];
    if (bi.exiting || bi.asleep) continue;
    for (let j = i+1; j < n; j++) {
      const bj = balls[j];
      if (bj.exiting || bj.asleep) continue;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const dz = bj.z - bi.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const minDist = BALL_RADIUS * 2;
      if (dist > 0 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        const overlap = minDist - dist;
        const half = overlap / 2;
        bi.x -= nx * half;
        bi.y -= ny * half;
        bi.z -= nz * half;
        bj.x += nx * half;
        bj.y += ny * half;
        bj.z += nz * half;

        const vix = bi.vx, viy = bi.vy, viz = bi.vz;
        const vjx = bj.vx, vjy = bj.vy, vjz = bj.vz;
        const rvx = vix - vjx;
        const rvy = viy - vjy;
        const rvz = viz - vjz;
        const relVelAlongNormal = rvx*nx + rvy*ny + rvz*nz;
        if (relVelAlongNormal < 0) {
          const impulse = -(1 + BOUNCE) * relVelAlongNormal / 2;
          const ix = impulse * nx;
          const iy = impulse * ny;
          const iz = impulse * nz;
          bi.vx += ix; bi.vy += iy; bi.vz += iz;
          bj.vx -= ix; bj.vy -= iy; bj.vz -= iz;

          // etwas Spin aus dem Stoß ableiten
          const impactSpin = 0.002 * Math.abs(relVelAlongNormal);
          bi.spinVel += impactSpin;
          bj.spinVel -= impactSpin;
        }
      }
    }
  }
}

let selectedBall = null;

function checkGateForFirstBall() {
  if (mode !== 'drawing') return;
  if (selectedBall) return;
  let candidate = null;

  for (const b of balls) {
    if (b.exiting) continue;
    const distFromCenter = length3(b.x, b.y, b.z);
    const dx = b.x, dy = b.y, dz = b.z;
    if (distFromCenter < SPHERE_RADIUS - BALL_RADIUS - GATE_RADIUS_TOL) continue;
    const downDot = dot3(dx, dy, dz, GATE_DOWN_VECTOR.x, GATE_DOWN_VECTOR.y, GATE_DOWN_VECTOR.z) / (distFromCenter || 1);
    if (downDot < GATE_COS) continue;
    if (!candidate || b.y > candidate.y) candidate = b;
  }

  if (candidate) {
    selectedBall = candidate;
    candidate.exiting = true;
    candidate.exitStep = 0;
    candidate.startExit = null;
    candidate.vx = candidate.vy = candidate.vz = 0;
    candidate.asleep = false;
    playFlap();
  }
}

function updateExitingBall(dt) {
  if (!selectedBall) return;
  const b = selectedBall;
  if (!b.exiting) return;

  b.exitStep += dt * 0.85;
  if (b.exitStep > 1) b.exitStep = 1;

  if (!b.startExit) {
    const len = length3(b.x, b.y, b.z) || 1;
    const factor = (SPHERE_RADIUS - BALL_RADIUS) / len;
    b.startExit = {
      x: b.x * factor,
      y: b.y * factor,
      z: b.z * factor
    };
  }
  const s = b.startExit;
  const t = b.exitStep;

  const targetX = 0;
  const targetY = SPHERE_RADIUS + BALL_RADIUS * 3;
  const targetZ = SPHERE_RADIUS * 0.3;

  b.x = s.x + (targetX - s.x) * t;
  b.y = s.y + (targetY - s.y) * t;
  b.z = s.z + (targetZ - s.z) * t;

  if (t >= 1) {
    const idx = balls.indexOf(b);
    if (idx !== -1) balls.splice(idx, 1);

    lastDrawNumber = b.number;
    lastDrawType   = shapeMode;
    if (shapeMode === 'ball') drawnBalls.push(b.number);
    else drawnStars.push(b.number);
    autoDrawCount++;
    playBallSound();
    updateUI();

    const tTheme = getTheme();
    highlightBall = {
      number: b.number,
      type: shapeMode,
      color: b.color || tTheme.goldColor,
      age: 0
    };
    selectedBall = null;
    mode = 'highlight';
  }
}

function proceedAfterPhaseEnd() {
  stopAir();
  selectedBall = null;

  if (phaseIndex === 0) {
    const anySecond = (STAR_COUNT > 0 && STAR_DRAWTARGET > 0);
    if (anySecond) {
      phaseIndex = 1;
      const typeForSecond = (secondPhaseMode === 'star') ? 'star' : 'extra';
      initPhase(typeForSecond, STAR_COUNT);
      autoDrawTarget = STAR_DRAWTARGET;
      autoDrawCount  = 0;
      autoDrawing    = true;
      autoMixing     = true;
      autoMixTimer   = 0;
      mode = 'airblast';
      playAir();
      drawButton.textContent = 'Ziehung läuft…';
      drawButton.disabled = true;
      return;
    }
  }

  // komplette Ziehung abgeschlossen -> Frontanzeige vorbereiten
  frontBalls = [...drawnBalls];
  frontStars = [...drawnStars];
  frontSecondMode = secondPhaseMode;
  frontResultsTargetAlpha = 1;

  // Fanfare nur, wenn zwei Zeilen (Zahlen + Zusatz/Eurozahlen)
  if (!fanfarePlayed && frontBalls.length > 0 && frontStars.length > 0) {
    playFanfare();
    fanfarePlayed = true;
  }

  mode = 'idle';
  autoDrawing = false;
  autoMixing  = false;
  autoDrawCount  = 0;
  autoDrawTarget = 1;
  drawButton.textContent = 'Ziehung starten 💨';
  drawButton.disabled = false;
}

function updateHighlight(dt) {
  if (!highlightBall) return;

  highlightBall.age += dt;
  const t = highlightBall.age;

  if (t >= HIGHLIGHT_DURATION) {
    highlightBall = null;

    const currentTotalRemaining = balls.length;
    if (currentTotalRemaining === 0) {
      proceedAfterPhaseEnd();
    } else {
      const currentTarget = autoDrawTarget;
      if (!autoDrawing || autoDrawCount >= currentTarget) {
        proceedAfterPhaseEnd();
      } else {
        mode = 'airblast';
        autoMixing = true;
        autoMixTimer = 0;
        playAir();
        drawButton.textContent = 'Ziehung läuft…';
        drawButton.disabled = true;
      }
    }
  }
}

function updateUI() {
  if (lastDrawNumber != null) {
    let label;
    if (lastDrawType === 'star') {
      label = 'Stern ' + lastDrawNumber;
    } else if (lastDrawType === 'extra') {
      if (presetSelect.value === 'eurojackpot') {
        label = 'Eurozahl ' + lastDrawNumber;
      } else {
        label = 'Zusatzzahl ' + lastDrawNumber;
      }
    } else {
      label = 'Zahl ' + lastDrawNumber;
    }
    lastDrawnEl.innerHTML = `Letzte Ziehung: <span>${label}</span>`;
  } else {
    lastDrawnEl.innerHTML = 'Letzte Ziehung: <span>–</span>';
  }

  if (drawnBalls.length === 0) {
    ballsRowEl.innerHTML =
      '<span class="resultRowLabel">Zahlen:</span>' +
      '<span class="chip empty">–</span>';
  } else {
    const sorted = [...drawnBalls].sort((a,b)=>a-b);
    ballsRowEl.innerHTML =
      '<span class="resultRowLabel">Zahlen:</span>' +
      sorted.map(n => `<span class="chip">${n}</span>`).join('');
  }

  updateSecondLabel();

  if (drawnStars.length === 0) {
    secondValuesEl.innerHTML = '<span class="chip starChip empty">–</span>';
  } else {
    const sorted = [...drawnStars].sort((a,b)=>a-b);
    secondValuesEl.innerHTML =
      sorted.map(n => `<span class="chip starChip">${n}</span>`).join('');
  }
}

function updateFlap(dt) {
  const target = (mode === 'drawing') ? 1 : 0;
  const speed = 2.0;
  if (flapAnim < target) {
    flapAnim = Math.min(target, flapAnim + speed * dt);
  } else if (flapAnim > target) {
    flapAnim = Math.max(target, flapAnim - speed * dt);
  }
}

function projectBall(b) {
  const depth = (b.z + SPHERE_RADIUS) / (2 * SPHERE_RADIUS);
  const scale = 0.5 + 0.7 * depth;
  const radius2D = BALL_RADIUS * scale;
  const screenX = CX + b.x;
  const screenY = CY + b.y * 0.7;
  return {screenX, screenY, radius2D, depth};
}

function drawStarShape(ctx, outerR, innerR, roundness = 0.20) {
  const spikes = 5;
  const pts = [];

  // ursprüngliche Stern-Punkte berechnen (Ecken)
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const r = (i % 2 === 0) ? outerR : innerR;
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  const n = pts.length;
  if (n < 3) return;

  const baseRadius = outerR;
  const cornerBase = baseRadius * roundness; // wie stark abrunden

  ctx.beginPath();

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]; // vorheriger Punkt
    const p1 = pts[i];               // aktueller Punkt (die Ecke)
    const p2 = pts[(i + 1) % n];     // nächster Punkt

    // Vektoren vom Eckpunkt zu den Nachbarn
    let v10x = p0.x - p1.x;
    let v10y = p0.y - p1.y;
    let v12x = p2.x - p1.x;
    let v12y = p2.y - p1.y;

    const len10 = Math.hypot(v10x, v10y) || 1;
    const len12 = Math.hypot(v12x, v12y) || 1;

    v10x /= len10; v10y /= len10;
    v12x /= len12; v12y /= len12;

    // tatsächlicher "Rundungsradius" darf nicht größer sein als halbe Segmentlänge
    const maxCorner = 0.5 * Math.min(len10, len12);
    const corner = Math.min(cornerBase, maxCorner);

    // Start- und Endpunkt der Kurve an dieser Ecke
    const p1a = {
      x: p1.x + v10x * corner,
      y: p1.y + v10y * corner
    };
    const p1b = {
      x: p1.x + v12x * corner,
      y: p1.y + v12y * corner
    };

    if (i === 0) {
      ctx.moveTo(p1a.x, p1a.y);
    } else {
      ctx.lineTo(p1a.x, p1a.y);
    }

    // Quadratische Kurve über die Ecke (p1) von p1a nach p1b
    ctx.quadraticCurveTo(p1.x, p1.y, p1b.x, p1b.y);
  }

  ctx.closePath();
}

function drawFrontResults() {
  if (frontResultsAlpha <= 0.001) return;
  if (frontBalls.length === 0 && frontStars.length === 0) return;

  const t = getTheme();
  const baseRadius = 34;
  const spacing = 12;
  const row1YBase = CY - 40;
  const row2YBase = CY + 40;

  const bobOffset = Math.sin(frontBobPhase) * FRONT_BOB_AMPLITUDE;
  const row1Y = row1YBase + bobOffset;
  const row2Y = row2YBase + bobOffset;

  function drawResultRow(numbers, y, type) {
    if (!numbers || numbers.length === 0) return;

    const sorted = [...numbers].sort((a,b)=>a-b);
    const totalWidth = sorted.length * (baseRadius * 2) +
                       (sorted.length - 1) * spacing;
    let x = CX - totalWidth / 2 + baseRadius;

    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i];

      ctx.save();
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * frontResultsAlpha;
      ctx.translate(x, y);

      let color;
      if (type === 'ball') {
        const arr = t.ballColors;
        color = arr[(n - 1) % arr.length];
      } else {
        color = t.goldColor;
      }

      const shadedBase = shadeColor(color, 0);

      if (type === 'star') {
        const outerR = baseRadius;
        const innerR = outerR * 0.45;
        drawStarShape(ctx, outerR, innerR);

        const starGrad = ctx.createRadialGradient(
          -outerR * 0.3, -outerR * 0.4, outerR * 0.25,
          0, 0, outerR
        );
        starGrad.addColorStop(0, '#ffffff');
        starGrad.addColorStop(0.25, shadedBase);
        starGrad.addColorStop(1, shadeColor(shadedBase, -35));

        ctx.fillStyle = starGrad;
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = t.starStroke;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(-outerR * 0.35, -outerR * 0.35,
                    outerR * 0.25, outerR * 0.16,
                    -0.4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
      } else if (type === 'extra') {
        const r = baseRadius;
        const grad = ctx.createRadialGradient(
          -r/3, -r/3, r/4,
          0, 0, r
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, shadedBase);
        grad.addColorStop(1, shadeColor(shadedBase, -30));

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = t.extraStroke;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-r/3, -r/3, r/4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
      } else {
        const r = baseRadius;
        const grad = ctx.createRadialGradient(
          -r/3, -r/3, r/4,
          0, 0, r
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, shadedBase);
        grad.addColorStop(1, shadeColor(shadedBase, -30));

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(150,150,180,0.7)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-r/3, -r/3, r/5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
      }

      ctx.fillStyle = t.textColor;
      ctx.font = `bold ${baseRadius * 1.0}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 5;
      ctx.strokeText(String(n), 0, 2);
      ctx.fillText(String(n), 0, 2);

      ctx.globalAlpha = prevAlpha;
      ctx.restore();
      x += baseRadius * 2 + spacing;
    }
  }

  drawResultRow(frontBalls, row1Y, 'ball');

  if (frontStars.length > 0) {
    const typeForSecond =
      (frontSecondMode === 'star') ? 'star' : 'extra';
    drawResultRow(frontStars, row2Y, typeForSecond);
  }
}

function drawBaseScene() {
  const t = getTheme();
  ensureThemeImageLoaded();

  const img = themeBgImages[currentThemeKey] || null;

  const bgGrad = ctx.createRadialGradient(
    CX, CY - 80, 40,
    CX, CY, SPHERE_RADIUS + 80
  );

  bgGrad.addColorStop(0, t.bgTop);
  bgGrad.addColorStop(0.5, t.bgMid);
  bgGrad.addColorStop(1, t.bgBottom);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else {
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(CX, H - 30, 130, 18, 0, 0, Math.PI * 2);
  const floorGrad = ctx.createRadialGradient(
    CX, H - 34, 10,
    CX, H - 30, 130
  );
  floorGrad.addColorStop(0, t.floorLight);
  floorGrad.addColorStop(1, t.floorDark);
  ctx.fillStyle = floorGrad;
  ctx.fill();
  ctx.restore();

  if (mode === 'airblast') {
    ctx.save();
    ctx.translate(CX, CY);
    const flicker = 0.6 + 0.4 * Math.sin(jetPhase * 5);
    const jetGrad = ctx.createRadialGradient(
      0, SPHERE_RADIUS * 0.4, 10,
      0, SPHERE_RADIUS * 0.1, SPHERE_RADIUS * 0.8
    );
    jetGrad.addColorStop(0, `rgba(255,255,255,${0.45 * flicker})`);
    jetGrad.addColorStop(0.4, `rgba(180,220,255,${0.35 * flicker})`);
    jetGrad.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(0, 0, SPHERE_RADIUS - 4, 0, Math.PI * 2);
    ctx.fillStyle = jetGrad;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(CX, CY);
  const rad = SPHERE_RADIUS;

  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();

  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.stroke();

  ctx.restore();

  const sorted = [...balls].sort((a, b) => a.z - b.z);
  for (const b of sorted) {
    const {screenX, screenY, radius2D, depth} = projectBall(b);
    ctx.save();
    ctx.translate(screenX, screenY);

  // NEU: immer drehen – egal ob Ball, Stern oder Extra
  ctx.rotate(b.spinAngle || 0);

    const baseColor = b.color;
    const shade = Math.round((depth - 0.5) * 60);
    const shadedBase = shadeColor(baseColor, shade);

    if (shapeMode === 'star') {
      const outerR = radius2D * 1.6;
      const innerR = outerR * 0.45;
      drawStarShape(ctx, outerR, innerR);

      const starGrad = ctx.createRadialGradient(
        -outerR * 0.3, -outerR * 0.4, outerR * 0.2,
        0, 0, outerR
      );
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.25, shadedBase);
      starGrad.addColorStop(1, shadeColor(shadedBase, -35));

      ctx.fillStyle = starGrad;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = getTheme().starStroke;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-outerR * 0.35, -outerR * 0.35, outerR * 0.22, outerR * 0.14, -0.4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(
        -radius2D/3, -radius2D/3, radius2D/4,
        0, 0, radius2D
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, shadedBase);
      grad.addColorStop(1, shadeColor(shadedBase, -30));

      ctx.beginPath();
      ctx.arc(0, 0, radius2D, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = (shapeMode === 'extra')
        ? getTheme().extraStroke
        : 'rgba(150,150,180,0.7)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-radius2D/3, -radius2D/3, radius2D/5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    }

    const theme = getTheme();
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${Math.max(10, radius2D * 0.8)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.strokeText(String(b.number), 0, 1);
    ctx.fillText(String(b.number), 0, 1);

    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - 30, CY + SPHERE_RADIUS + 5);
  ctx.lineTo(CX + 30, CY + SPHERE_RADIUS + 5);
  ctx.lineTo(CX + 52, H - 44);
  ctx.lineTo(CX - 52, H - 44);
  ctx.closePath();
  const chuteGrad = ctx.createLinearGradient(
    CX, CY + SPHERE_RADIUS + 5,
    CX, H - 44
  );
  chuteGrad.addColorStop(0, '#f5f0ff');
  chuteGrad.addColorStop(1, '#d9def8');
  ctx.fillStyle = chuteGrad;
  ctx.fill();
  ctx.restore();

  ctx.save();
  const hingeX = CX;
  const hingeY = CY + SPHERE_RADIUS - 2;
  ctx.translate(hingeX, hingeY);

  const open = flapAnim;
  const doorWidth  = 80;
  const doorHeight = 18;

  const maxAngle = -0.9;
  const angle = open * maxAngle;
  const drop = open * 10;
  ctx.translate(0, drop);
  ctx.rotate(angle);

  const baseScaleY = 0.9;
  const openScaleY = 0.6;
  const scaleY = baseScaleY + (openScaleY - baseScaleY) * open;
  ctx.scale(1, scaleY);

  const doorGrad = ctx.createLinearGradient(
    -doorWidth/2, 0,
    -doorWidth/2, doorHeight
  );
  doorGrad.addColorStop(0, open > 0 ? '#ff9fb5' : '#ffc048');
  doorGrad.addColorStop(1, '#fdd9ff');

  ctx.beginPath();
  const r2 = 6;
  const x = -doorWidth/2;
  const y = 0;
  const w = doorWidth;
  const h = doorHeight;
  ctx.moveTo(x + r2, y);
  ctx.lineTo(x + w - r2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
  ctx.lineTo(x + w, y + h - r2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
  ctx.lineTo(x + r2, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r2);
  ctx.lineTo(x, y + r2);
  ctx.quadraticCurveTo(x, y, x + r2, y);
  ctx.closePath();
  ctx.fillStyle = doorGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(150,120,170,0.8)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 4, y + 2);
  ctx.lineTo(x + w - 4, y + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  if (highlightBall) {
    const tTheme = getTheme();
    const tt = highlightBall.age;
    const d = HIGHLIGHT_DURATION;

    let alpha = 1;
    if (tt < HIGHLIGHT_FADE) {
      alpha = tt / HIGHLIGHT_FADE;
    } else if (tt > d - HIGHLIGHT_FADE) {
      alpha = (d - tt) / HIGHLIGHT_FADE;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    const baseRadius = SPHERE_RADIUS * 0.9;
    let popScale = 1.0;
    if (tt < HIGHLIGHT_POP_TIME) {
      const p = tt / HIGHLIGHT_POP_TIME;
      popScale = HIGHLIGHT_POP_MAX - (HIGHLIGHT_POP_MAX - 1.0) * p;
    } else {
      popScale = 1.0;
    }
    const radius2D = baseRadius * popScale;

    const baseColor = highlightBall.color || tTheme.goldColor;
    const shadedBase = shadeColor(baseColor, 0);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(0, 0, radius2D + 12, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    if (highlightBall.type === 'star') {
      const outerR = radius2D;
      const innerR = outerR * 0.45;
      drawStarShape(ctx, outerR, innerR);

      const starGrad = ctx.createRadialGradient(
        -outerR * 0.3, -outerR * 0.4, outerR * 0.25,
        0, 0, outerR
      );
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.25, shadedBase);
      starGrad.addColorStop(1, shadeColor(shadedBase, -35));

      ctx.fillStyle = starGrad;
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = getTheme().starStroke;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-outerR * 0.35, -outerR * 0.35, outerR * 0.25, outerR * 0.16, -0.4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(
        -radius2D/3, -radius2D/3, radius2D/4,
        0, 0, radius2D
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, shadedBase);
      grad.addColorStop(1, shadeColor(shadedBase, -30));

      ctx.beginPath();
      ctx.arc(0, 0, radius2D, 0, Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = getTheme().extraStroke;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-radius2D/3, -radius2D/3, radius2D/4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    }

    const theme = getTheme();
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${radius2D * 0.6}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 6;
    ctx.strokeText(String(highlightBall.number), 0, 5);
    ctx.fillText(String(highlightBall.number), 0, 5);

    ctx.restore();
  }
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);

  if (frontResultsAlpha > 0.001) {
    // Wenn wir schon ein gecachtes, geblurtes Bild haben:
    if (blurredBgReady && blurredBgCanvas) {
      // einfach nur das gecachte Bild zeichnen, ohne Blur-Filter
      ctx.save();
      ctx.globalAlpha = 1.0; // ggf. hier noch mit frontResultsAlpha spielen, wenn du willst
      ctx.drawImage(blurredBgCanvas, 0, 0, W, H);
      ctx.restore();
    } else {
      // Blur wird LIVE berechnet (nur solange kein Cache vorhanden ist)
      ctx.save();
      ctx.filter = 'blur(4px)';
      ctx.globalAlpha = 0.8 * (1 - 0.3 * frontResultsAlpha);
      drawBaseScene();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.2 * frontResultsAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Sobald das Overlay „fertig“ eingeblendet ist -> einmalig cachen
      if (frontResultsAlpha >= 0.999 && frontResultsTargetAlpha > 0.9) {
        if (!blurredBgCanvas) {
          blurredBgCanvas = document.createElement('canvas');
          blurredBgCanvas.width  = W;
          blurredBgCanvas.height = H;
        }
        const bctx = blurredBgCanvas.getContext('2d');
        bctx.clearRect(0, 0, W, H);
        // Canvas enthält jetzt den geblurten Hintergrund + weiße Tönung
        bctx.drawImage(canvas, 0, 0, W, H);
        blurredBgReady = true;
      }
    }
  } else {
    // Kein Front-Overlay mehr sichtbar -> Cache verwerfen
    blurredBgReady = false;
    blurredBgCanvas = null;

    drawBaseScene();
  }

  // Ergebnisse immer oben drauf
  drawFrontResults();
}

function handleStartSequence() {
  if (mode !== 'idle') return;

  frontResultsTargetAlpha = 0;

  resetAll();
  readInputs();

  const totalBallsPlanned = BALL_DRAWTARGET;
  const totalStarsPlanned = STAR_DRAWTARGET;
  if (BALL_COUNT === 0 && STAR_COUNT === 0) return;
  if (totalBallsPlanned === 0 && totalStarsPlanned === 0) return;

  if (BALL_DRAWTARGET > 0 && BALL_COUNT > 0) {
    phaseIndex = 0;
    initPhase('ball', BALL_COUNT);
    autoDrawTarget = BALL_DRAWTARGET;
  } else if (STAR_DRAWTARGET > 0 && STAR_COUNT > 0) {
    phaseIndex = 1;
    const typeForSecond = (secondPhaseMode === 'star') ? 'star' : 'extra';
    initPhase(typeForSecond, STAR_COUNT);
    autoDrawTarget = STAR_DRAWTARGET;
  } else {
    return;
  }

  autoDrawCount = 0;
  autoDrawing   = true;
  autoMixing    = true;
  autoMixTimer  = 0;
  highlightBall = null;

  mode = 'airblast';
  drawButton.disabled = true;
  drawButton.textContent = 'Ziehung läuft…';
  playAir();
}

function handleSlowMo() {
  slowMo = !slowMo;
  slowMoButton.textContent = slowMo ? 'Slow-Mo: An 🎬' : 'Slow-Mo: Aus 🎬';
}

function handleReset() {
  resetAll();
}

function handleKey(e) {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!drawButton.disabled) handleStartSequence();
  }
}

function loop(timestamp) {
  if (lastTimestamp == null) lastTimestamp = timestamp;
  let dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  dt = Math.min(dt, 0.03);
  let dtSim = dt * (slowMo ? 0.35 : 1);

  // Front-Ergebnis ein-/ausblenden
  if (frontResultsAlpha < frontResultsTargetAlpha) {
    frontResultsAlpha = Math.min(
      frontResultsTargetAlpha,
      frontResultsAlpha + FRONT_FADE_SPEED * dtSim
    );
  } else if (frontResultsAlpha > frontResultsTargetAlpha) {
    frontResultsAlpha = Math.max(
      frontResultsTargetAlpha,
      frontResultsAlpha - FRONT_FADE_SPEED * dtSim
    );
  }

  const overlayFrozen =
    (frontResultsAlpha > 0.01 && frontResultsTargetAlpha > 0.5);

  frontBobPhase += dtSim * FRONT_BOB_SPEED;

  if (!overlayFrozen) {
    jetPhase += dtSim;

    // Physik-Updates je nach Modus
    if (mode === 'drawing') {
      applyGravityOnly(dtSim);

    } else {
      // airblast, idle, highlight
      applyGravityAndShellForce(dtSim);
    }

    if (mode === 'idle') {
      // früher: gentleStir -> später evt. wieder aktivierbar
      drumAngle *= 0.98;

    } else if (mode === 'airblast') {
      applyAirJet(dtSim);
      applyRotationalSwirl(dtSim);
      drumAngle += DRUM_ROT_SPEED * dtSim;

      if (autoMixing) {
        autoMixTimer += dtSim;
        if (autoMixTimer >= AUTO_MIX_TIME) {
          autoMixing = false;
          mode = 'drawing';
          stopAir();
        }
      }

    } else if (mode === 'drawing') {
      checkGateForFirstBall();
      drumAngle *= 0.98;

    } else if (mode === 'highlight') {
      drumAngle *= 0.98;
    }

    // Ball-Integrationen
    integrateBalls(dtSim);
    handleCollisions();
    updateExitingBall(dtSim);
    updateFlap(dtSim);
    updateHighlight(dtSim);

    // Spin-Update
    for (const b of balls) {
      if (b.exiting) continue;
      b.spinAngle += b.spinVel * dtSim;
    }
  }

  drawScene();
  requestAnimationFrame(loop);
}

// Start
applyThemeToPage();
resetAll();
requestAnimationFrame(loop);

drawButton.addEventListener('click', handleStartSequence);
slowMoButton.addEventListener('click', handleSlowMo);
resetButton.addEventListener('click', handleReset);
window.addEventListener('keydown', handleKey);

muteButton.addEventListener('click', () => {
  soundMuted = !soundMuted;
  applyMuteState();
});

presetSelect.addEventListener('change', () => {
  const v = presetSelect.value;
  if (v === 'custom') {
    currentThemeKey = 'custom';
    applyThemeToPage();
    updateSubtitleText();
    resetAll();
  } else {
    applyPreset(v);
  }
});

secondTypeSelect.addEventListener('change', () => {
  secondPhaseMode = secondTypeSelect.value;
  updateSecondLabel();
  updateSubtitleText();
});
