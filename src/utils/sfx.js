let ctx = null;
let master = null;
let noise = null;
let muted = false;
let musicMuted = false;
try {
  muted = localStorage.getItem('ls_sfx_muted') === '1';
  musicMuted = localStorage.getItem('ls_music_muted') === '1';
} catch { /* abaikan */ }

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Browser/iOS mewajibkan audio "dibuka" lewat sentuhan pertama
export const unlockAudio = () => {
  getCtx();
  if (musicWanted && !musicMuted && !mTimer) startMusic(); // nyalakan musik yang tertahan
};
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'keydown'].forEach((e) =>
    window.addEventListener(e, unlockAudio, { passive: true })
  );
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('ls_sfx_muted', m ? '1' : '0'); } catch { /* abaikan */ }
}

function noiseBuf() {
  if (!noise) {
    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function noiseBurst(t, dur, { type = 'bandpass', freq = 2000, q = 1, gain = 0.4, attack = 0.002, out = null } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf();
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out || master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

function tone(t, dur, { type = 'sine', f0 = 440, f1 = null, gain = 0.25, attack = 0.005, out = null } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out || master);
<<<<<<< HEAD
=======
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* ============ EFEK SUARA ============ */

function clack(t, a) {
  noiseBurst(t, 0.07, { type: 'highpass', freq: 1800, q: 0.7, gain: 0.5 * a });
  noiseBurst(t + 0.012, 0.05, { type: 'bandpass', freq: 3200, q: 3, gain: 0.3 * a });
  tone(t, 0.1, { type: 'sine', f0: 230, f1: 90, gain: 0.35 * a });
}

/** Dadu dilempar: whoosh + 3 pantulan (selaras animasi 1700 ms) */
export function playDiceRoll() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  noiseBurst(t0, 0.3, { type: 'bandpass', freq: 900, q: 0.7, gain: 0.25, attack: 0.12 });
  [[0.2, 0.9], [0.6, 0.55], [1.0, 0.3]].forEach(([p, a]) => {
    const t = t0 + p * 1.7;
    clack(t, a);
    clack(t + 0.07, a * 0.35);
  });
}

/** Naik tangga: ketukan kayu menanjak + denting ceria */
export function playLadderClimb() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  for (let i = 0; i < 7; i++) {
    const t = t0 + i * 0.12;
    noiseBurst(t, 0.06, { type: 'bandpass', freq: 1400 + i * 140, q: 4, gain: 0.35 });
    tone(t, 0.1, { type: 'triangle', f0: 300 + i * 55, gain: 0.22 });
  }
  const tc = t0 + 0.95;
  tone(tc, 0.5, { type: 'sine', f0: 880, gain: 0.2 });
  tone(tc + 0.1, 0.5, { type: 'sine', f0: 1175, gain: 0.2 });
  tone(tc + 0.2, 0.7, { type: 'sine', f0: 1568, gain: 0.2 });
}

/** Turun ular: desis + seluncur menurun + "buk" di ujung */
export function playSnakeSlide() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  noiseBurst(t0, 0.8, { type: 'bandpass', freq: 6500, q: 0.9, gain: 0.22, attack: 0.25 });
  tone(t0 + 0.12, 0.8, { type: 'triangle', f0: 900, f1: 140, gain: 0.22 });
  tone(t0 + 0.14, 0.8, { type: 'sine', f0: 910, f1: 145, gain: 0.1 });
  const te = t0 + 1.0;
  tone(te, 0.25, { type: 'sine', f0: 140, f1: 45, gain: 0.5 });
  noiseBurst(te, 0.12, { type: 'lowpass', freq: 500, q: 0.7, gain: 0.35 });
}

/* ============ MUSIK LATAR ============ */

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PROG = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]; // C - Am - F - G
const PENT = [72, 74, 76, 79, 81, 84, 88];                              // melodi pentatonik C
const STEP = 0.3125;                                                    // nada 1/8 pada ~96 BPM
const MUSIC_VOL = 0.7;

let musicBus = null;
let musicIn = null;
let mTimer = null;
let mNext = 0;
let mStep = 0;
let musicWanted = false;

function ensureMusicBus() {
  if (musicBus) return;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.0001;
  musicBus.connect(ctx.destination);

  musicIn = ctx.createGain();
  musicIn.connect(musicBus);

  // gema lembut supaya terasa luas
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  musicIn.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(musicBus);
}

const mNote = (t, dur, midi, o) =>
  tone(t, dur, { f0: mtof(midi), out: musicIn, ...o });

function scheduleStep(t, step) {
  const bar = Math.floor(step / 8) % 4;
  const pos = step % 8;
  const chord = PROG[bar];

  if (pos === 0) {
    // pad akor
    chord.forEach((m) => mNote(t, STEP * 8.2, m, { type: 'sine', gain: 0.1, attack: 0.6 }));
    mNote(t, STEP * 3.5, chord[0] - 24, { type: 'triangle', gain: 0.3, attack: 0.01 });
  }
  if (pos === 4) mNote(t, STEP * 3, chord[0] - 17, { type: 'triangle', gain: 0.22, attack: 0.01 });

  // drum lembut
  if (pos === 0 || pos === 4) tone(t, 0.2, { type: 'sine', f0: 140, f1: 45, gain: 0.35, out: musicIn });
  if (pos === 2 || pos === 6) {
    noiseBurst(t, 0.12, { type: 'bandpass', freq: 1800, q: 0.8, gain: 0.1, out: musicIn });
  }
  if (pos % 2 === 1) noiseBurst(t, 0.03, { type: 'highpass', freq: 7000, q: 0.5, gain: 0.05, out: musicIn });

  // melodi acak (selalu beda tiap putaran)
  if ((pos % 2 === 0 || Math.random() < 0.25) && Math.random() < 0.6) {
    const note = PENT[Math.floor(Math.random() * PENT.length)];
    mNote(t, STEP * 2.2, note, { type: 'triangle', gain: 0.14, attack: 0.01 });
  }
}

function tick() {
  if (!ctx) return;
  const horizon = ctx.currentTime + 1.2;
  while (mNext < horizon) {
    scheduleStep(mNext, mStep);
    mNext += STEP;
    mStep += 1;
  }
}

function haltMusic() {
  if (mTimer) {
    clearInterval(mTimer);
    mTimer = null;
  }
  if (musicBus && ctx) {
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  }
}

export const isMusicMuted = () => musicMuted;

/** Mulai musik latar (aman dipanggil berulang) */
export function startMusic() {
  musicWanted = true;
  if (musicMuted) return;
  const c = getCtx();
  if (!c) return;
  c.resume().catch(() => {});
  if (mTimer) return;
  ensureMusicBus();
  mNext = c.currentTime + 0.15;
  mStep = 0;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setValueAtTime(0.0001, c.currentTime);
  musicBus.gain.linearRampToValueAtTime(MUSIC_VOL, c.currentTime + 2.5); // fade in
  mTimer = setInterval(tick, 250);
  tick();
}

export function stopMusic() {
  musicWanted = false;
  haltMusic();
}

export function setMusicMuted(m) {
  musicMuted = m;
  try { localStorage.setItem('ls_music_muted', m ? '1' : '0'); } catch { /* abaikan */ }
  if (m) haltMusic();
  else if (musicWanted) startMusic();
}
>>>>>>> 352e824 (Tambah musik latar dan tombol mute di GameScreen)
