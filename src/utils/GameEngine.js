export const BOARD_SIZE = 100;
export const COLS = 10;
export const TILE = 1;          // ukuran 1 kotak (unit 3D)
export const STEP_MS = 350;     // jeda per langkah pion

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const rowOf = (n) => Math.floor((n - 1) / COLS);

/** Lempar dadu 1-6 */
export const DICE_MS = 1700; // durasi animasi dadu

// Dadu "kantong acak": 1-6 diacak, habis baru diacak ulang
let bag = [];
let lastDice = 0;
export function rollDice() {
  if (bag.length === 0) {
    bag = [1, 2, 3, 4, 5, 6];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    // jangan sampai angka pertama sama dengan lemparan terakhir
    if (bag[bag.length - 1] === lastDice) {
      const j = rand(0, bag.length - 2);
      [bag[bag.length - 1], bag[j]] = [bag[j], bag[bag.length - 1]];
    }
  }
  lastDice = bag.pop();
  return lastDice;
}

/**
 * Acak ular & tangga secara prosedural, rasio 50:50.
 * snakes  = { kepala: ekor }  (kepala > ekor)
 * ladders = { bawah: atas }   (bawah < atas)
 * Semua ujung unik & jarak minimal 2 baris supaya tidak terlalu pendek.
 */
export function generateSnakesAndLadders(countEach = 7) {
  const used = new Set([1, 100]);
  const snakes = {};
  const ladders = {};

  const pickPair = () => {
    for (let t = 0; t < 1000; t++) {
      const a = rand(2, 99);
      const b = rand(2, 99);
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      if (rowOf(high) - rowOf(low) < 2) continue;
      if (used.has(low) || used.has(high)) continue;
      used.add(low);
      used.add(high);
      return { low, high };
    }
    return null;
  };

  for (let i = 0; i < countEach; i++) {
    const s = pickPair();
    if (s) snakes[s.high] = s.low;
    const l = pickPair();
    if (l) ladders[l.low] = l.high;
  }
  return { snakes, ladders };
}

/**
 * Hitung hasil lemparan.
 * landing = kotak hasil melangkah (sebelum ular/tangga)
 * final   = kotak akhir setelah ular/tangga
 */
export function computeMove(pos, dice, snakes, ladders) {
  const target = pos + dice;
  if (target > BOARD_SIZE) return { landing: pos, final: pos, bounced: true };
  const final = snakes[target] ?? ladders[target] ?? target;
  return { landing: target, final, bounced: false };
}

/** Nomor kotak (0-100) -> koordinat dunia 3D [x, z]. 0 = start di luar papan. */
export function squareToXZ(n) {
  if (n <= 0) return [-4.5 * TILE, 5.6 * TILE];
  const idx = n - 1;
  const row = Math.floor(idx / COLS);
  let col = idx % COLS;
  if (row % 2 === 1) col = COLS - 1 - col; // zig-zag
  return [(col - 4.5) * TILE, (4.5 - row) * TILE];
}