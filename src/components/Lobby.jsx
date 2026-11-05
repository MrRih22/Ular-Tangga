import { useState } from 'react';
import { createRoom, joinRoom } from '../services/roomService';

export default function Lobby({ onEnter }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn) => {
    if (!name.trim()) return setErr('Isi nama kamu dulu ya');
    setLoading(true);
    setErr('');
    try {
      onEnter({ ...(await fn()), name: name.trim() });
    } catch (e) {
      setErr(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <h1 className="text-3xl font-bold text-center">💜 Love Steps</h1>
        <p className="text-center text-white/60 text-sm mt-1">3D Snakes & Ladders Deep Talk</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namamu"
          className="mt-6 w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-pink-400"
        />

        <button
          disabled={loading}
          onClick={() => run(() => createRoom(name.trim()))}
          className="mt-4 w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 active:scale-95 transition disabled:opacity-50"
        >
          Buat Room Baru
        </button>

        <div className="my-4 text-center text-white/40 text-xs">— atau —</div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Kode Room"
          maxLength={5}
          className="w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/10 outline-none text-center tracking-[0.4em] uppercase focus:border-pink-400"
        />
        <button
          disabled={loading || code.length < 5}
          onClick={() => run(() => joinRoom(code, name.trim()))}
          className="mt-3 w-full py-3 rounded-2xl font-semibold bg-white/15 border border-white/20 active:scale-95 transition disabled:opacity-40"
        >
          Gabung Room
        </button>

        {err && <p className="mt-4 text-center text-sm text-red-300">{err}</p>}
      </div>
    </div>
  );
}