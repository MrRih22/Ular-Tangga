import { useEffect, useState } from 'react';
import GameBoard from './GameBoard';
import QuestionModal from './QuestionModal';
import VoiceChat from './VoiceChat';
import { useRoom } from '../hooks/useRoom';
import { rollAndMove, finishDiscussion } from '../services/roomService';
import {
  isMuted,
  setMuted,
  unlockAudio,
  startMusic,
  stopMusic,
  isMusicMuted,
  setMusicMuted,
} from '../utils/sfx';

export default function GameScreen({ session, onLeave }) {
  const room = useRoom(session.roomId);
  const [rolling, setRolling] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [musicOff, setMusicOff] = useState(isMusicMuted());

  // Musik latar jalan selama di layar game
  useEffect(() => {
    startMusic();
    return () => stopMusic();
  }, []);

  if (!room) {
    return <div className="h-full flex items-center justify-center text-white/70">Memuat room…</div>;
  }

  const me = session.me;
  const bothPresent = !!room.player1_name && !!room.player2_name;
  const myTurn = room.current_turn === me;
  const canRoll = bothPresent && myTurn && room.phase === 'rolling' && !rolling;
  const turnName = room[`player${room.current_turn}_name`];

  const handleRoll = async () => {
    if (!canRoll) return;
    unlockAudio();
    startMusic(); // jaga-jaga kalau musik belum mulai karena aturan autoplay browser
    setRolling(true);
    try {
      await rollAndMove(room, me);
    } finally {
      setRolling(false);
    }
  };

  const toggleSound = () => {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const toggleMusic = () => {
    unlockAudio();
    const next = !musicOff;
    setMusicMuted(next);
    setMusicOff(next);
  };

  return (
    <div className="relative h-full w-full">
      <GameBoard room={room} />

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto text-xs px-3 py-2 rounded-2xl bg-black/40 backdrop-blur">
          Room: <b className="tracking-widest">{room.room_code}</b>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={toggleMusic}
            className="text-sm px-3 py-2 rounded-2xl bg-black/40 backdrop-blur"
            aria-label="Musik latar"
          >
            {musicOff ? '🔇' : '🎵'}
          </button>
          <button
            onClick={toggleSound}
            className="text-sm px-3 py-2 rounded-2xl bg-black/40 backdrop-blur"
            aria-label="Efek suara"
          >
            {muted ? '🔕' : '🔔'}
          </button>
          <button onClick={onLeave} className="text-xs px-3 py-2 rounded-2xl bg-black/40 backdrop-blur">
            Keluar
          </button>
        </div>
      </div>

      {/* Menunggu pemain 2 */}
      {!bothPresent && (
        <div className="absolute inset-x-0 top-20 flex justify-center px-4">
          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center text-sm">
            Bagikan kode <b className="tracking-widest text-pink-300">{room.room_code}</b> ke pasanganmu…
          </div>
        </div>
      )}

      {/* Tombol dadu */}
      <div className="absolute bottom-0 inset-x-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2">
        <div className="text-sm text-white/80 px-3 py-1 rounded-full bg-black/40 backdrop-blur">
          {!bothPresent
            ? 'Menunggu pasangan bergabung…'
            : room.phase === 'finished'
            ? `🎉 ${room[`player${room.winner}_name`]} menang!`
            : room.phase === 'rolling'
            ? myTurn ? 'Giliranmu! Lempar dadunya' : `Giliran ${turnName}`
            : room.phase === 'moving'
            ? 'Melangkah…'
            : 'Waktunya ngobrol 💬'}
        </div>

        <button
          disabled={!canRoll}
          onClick={handleRoll}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-3xl sm:text-4xl font-bold flex items-center justify-center
                     bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl
                     active:scale-90 transition disabled:opacity-40 disabled:grayscale"
        >
          {room.phase === 'moving' ? '🎲' : room.last_dice ?? '🎲'}
        </button>
      </div>

      <VoiceChat roomCode={room.room_code} me={me} bothPresent={bothPresent} />

      <QuestionModal
        open={room.phase === 'question'}
        question={room.current_question}
        who={turnName}
        onDone={() => finishDiscussion(room)}
      />
    </div>
  );
}