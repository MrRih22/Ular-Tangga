import { supabase } from '../lib/supabaseClient';
import {
  generateSnakesAndLadders,
  computeMove,
  rollDice,
  STEP_MS,
  DICE_MS,
} from '../utils/GameEngine';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const makeCode = () =>
  Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

/** Player 1 membuat room baru (ular & tangga diacak di sini) */
export async function createRoom(name, avatar = 'cat') {
  const { snakes, ladders } = generateSnakesAndLadders();
  const { data, error } = await supabase
    .from('game_rooms')
    .insert({ room_code: makeCode(), player1_name: name, player1_avatar: avatar, snakes, ladders })
    .select()
    .single();
  if (error) throw error;
  return { roomId: data.id, roomCode: data.room_code, me: 1 };
}

/** Player 2 bergabung dengan kode room */
export async function joinRoom(code, name, avatar = 'cat') {
  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', code.trim().toUpperCase())
    .single();
  if (error || !room) throw new Error('Room tidak ditemukan');
  if (room.player2_name) throw new Error('Room sudah penuh');

  const { error: upErr } = await supabase
    .from('game_rooms')
    .update({ player2_name: name, player2_avatar: avatar })
    .eq('id', room.id)
    .is('player2_name', null);
  if (upErr) throw upErr;
  return { roomId: room.id, roomCode: room.room_code, me: 2 };
}

/**
 * Ambil 1 kartu Truth/Dare acak yang BELUM pernah muncul di room ini.
 * Mengembalikan null jika semua 100 kartu sudah terpakai.
 */
async function fetchRandomQuestion(roomId) {
  const { data, error } = await supabase.rpc('draw_question', { p_room: roomId });
  if (error) {
    console.error('draw_question gagal:', error);
    return {
      id: 0,
      kind: 'truth',
      category: 'receh',
      question: 'Ceritakan hal paling memalukan yang pernah kamu lakukan!',
    };
  }

  // Jika semua 100 kartu sudah habis, kembalikan null
  if (!data || (Array.isArray(data) && !data.length)) {
    return null;
  }

  const q = Array.isArray(data) ? data[0] : data;
  return { id: q.id, kind: q.kind, question: q.question, category: q.category };
}

/**
 * Lempar dadu -> tembak posisi ke Supabase.
 * Hanya client yang melempar yang menjalankan urutan ini;
 * kedua layar ikut berubah lewat Realtime.
 */
export async function rollAndMove(room, me) {
  if (room.phase !== 'rolling' || room.current_turn !== me) return;

  const posKey = `player${me}_pos`;
  const from = room[posKey];
  const dice = rollDice();
  const { landing, final } = computeMove(from, dice, room.snakes, room.ladders);

  // Tahap 1: dadu dilempar (pion belum bergerak), animasi tampil di kedua layar
  const { data: locked, error } = await supabase
    .from('game_rooms')
    .update({ phase: 'moving', last_dice: dice })
    .eq('id', room.id)
    .eq('phase', 'rolling')
    .select()
    .maybeSingle();
  if (error) {
    console.error('Gagal update room:', error);
    alert('Gagal mengirim lemparan: ' + error.message);
    return;
  }
  if (!locked) return;

  await sleep(DICE_MS + 700); // tunggu dadu mendarat

  // Tahap 2: pion melangkah
  await supabase.from('game_rooms').update({ [posKey]: landing }).eq('id', room.id);
  await sleep(Math.max(landing - from, 0) * STEP_MS + 500);

  // Tahap 3: ular / tangga
  if (final !== landing) {
    await supabase.from('game_rooms').update({ [posKey]: final }).eq('id', room.id);
    await sleep(1900); // waktu untuk animasi + suara naik tangga / turun ular
  }

  // Menang
  if (final === 100) {
    await supabase
      .from('game_rooms')
      .update({ phase: 'finished', winner: me })
      .eq('id', room.id);
    return;
  }

  // Tahap 4: kartu Truth or Dare (tidak berulang di room ini)
  const q = await fetchRandomQuestion(room.id);

  // Jika kartu sudah habis (null), langsung ganti giliran tanpa memunculkan kartu
  if (!q) {
    await supabase
      .from('game_rooms')
      .update({
        phase: 'rolling',
        current_question: null,
        current_turn: me === 1 ? 2 : 1,
      })
      .eq('id', room.id);
    return;
  }

  await supabase
    .from('game_rooms')
    .update({ phase: 'question', current_question: q })
    .eq('id', room.id);
}

/** Tombol "Selesai, lanjut!" -> giliran pemain berikutnya */
export async function finishDiscussion(room) {
  await supabase
    .from('game_rooms')
    .update({
      phase: 'rolling',
      current_question: null,
      current_turn: room.current_turn === 1 ? 2 : 1,
    })
    .eq('id', room.id)
    .eq('phase', 'question');
}
