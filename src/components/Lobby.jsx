import { useState } from 'react';
import { createRoom, joinRoom } from '../services/roomService';
import { AVATARS } from './Animals';

export default function Lobby({ onEnter }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [avatar, setAvatar] = useState('cat');
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
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">💜 Love Steps</h1>
          <p className="text-center text-white/60 text-xs sm:text-sm mt-1">3D Snakes & Ladders Deep Talk</p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namamu"
            className="mt-5 w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-pink-400"
          />

          <p className="mt-4 mb-2 text-xs text-white/60">Pilih pionmu</p>
          <div className="grid grid-cols-3 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                className={`py-2 rounded-2xl border text-center transition active:scale-95 ${
                  avatar === a.id
                    ? 'bg-pink-500/30 border-pink-300 scale-105'
                    : 'bg-black/25 border-white/10'
                }`}
              >
                <div className="text-3xl leading-none">{a.emoji}</div>
                <div className="text-[11px] mt-1">{a.label}</div>
              </button>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={() => run(() => createRoom(name.trim(), avatar))}
            className="mt-5 w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 active:scale-95 transition disabled:opacity-50"
          >
            Buat Room Baru
          </button>

          <div className="my-3 text-center text-white/40 text-xs">— atau —</div>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Kode Room"
            maxLength={5}
            className="w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/10 outline-none text-center tracking-[0.4em] uppercase focus:border-pink-400"
          />
          <button
            disabled={loading || code.length < 5}
            onClick={() => run(() => joinRoom(code, name.trim(), avatar))}
            className="mt-3 w-full py-3 rounded-2xl font-semibold bg-white/15 border border-white/20 active:scale-95 transition disabled:opacity-40"
          >
            Gabung Room
          </button>

          {err && <p className="mt-4 text-center text-sm text-red-300">{err}</p>}
        </div>
      </div>
    </div>
  );
}