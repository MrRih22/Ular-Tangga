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
