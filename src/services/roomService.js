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
    .select
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

/** Ambil 1 pertanyaan acak */
async function fetchRandomQuestion() {
  const { data, error } = await supabase.rpc('get_random_question');
  if (error || !data?.length) return { id: 0, question: 'Ceritakan hal yang kamu syukuri hari ini.', category: 'umum' };
  const q = Array.isArray(data) ? data[0] : data;
  return { id: q.id, question: q.question, category: q.category };
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
    await sleep(1200);
  }

  // Menang
  if (final === 100) {
    await supabase
      .from('game_rooms')
      .update({ phase: 'finished', winner: me })
      .eq('id', room.id);
    return;
  }

  // Tahap 4: pertanyaan deep talk
  const q = await fetchRandomQuestion();
  await supabase
    .from('game_rooms')
    .update({ phase: 'question', current_question: q })
    .eq('id', room.id);
}

/** Tombol "Selesai Berdiskusi" -> giliran pemain berikutnya */
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