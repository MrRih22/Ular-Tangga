import { useState } from 'react';
import GameBoard from './GameBoard';
import QuestionModal from './QuestionModal';
import VoiceChat from './VoiceChat';
import DiceOverlay from './DiceOverlay';
import { useRoom } from '../hooks/useRoom';
import { rollAndMove, finishDiscussion } from '../services/roomService';

export default function GameScreen({ session, onLeave }) {
  const room = useRoom(session.roomId);
  const [rolling, setRolling] = useState(false);
  const [diceBusy, setDiceBusy] = useState(false);

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
    setRolling(true);
    try {
      await rollAndMove(room, me);
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <GameBoard room={room} />

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto text-xs px-3 py-2 rounded-2xl bg-black/40 backdrop-blur">
          Room: <b className="tracking-widest">{room.room_code}</b>
        </div>
        <button
          onClick={onLeave}
          className="pointer-events-auto text-xs px-3 py-2 rounded-2xl bg-black/40 backdrop-blur"
        >
          Keluar
        </button>
      </div>

      {/* Menunggu pemain 2 */}
      {!bothPresent && (
        <div className="absolute inset-x-0 top-20 flex justify-center px-4">
          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center text-sm">
            Bagikan kode <b className="tracking-widest text-pink-300">{room.room_code}</b> ke pasanganmu…
          </div>
        </div>
      )}

      {/* Dadu */}
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
          className="w-24 h-24 rounded-3xl text-4xl font-bold flex items-center justify-center
                     bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl
                     active:scale-90 transition disabled:opacity-40 disabled:grayscale"
        >
          {diceBusy ? '🎲' : room.last_dice ?? '🎲'}
        </button>
      </div>

      <DiceOverlay
        phase={room.phase}
        value={room.last_dice}
        onStart={() => setDiceBusy(true)}
        onLanded={() => setDiceBusy(false)}
      />

      <VoiceChat roomCode={room.room_code} me={me} bothPresent={bothPresent} />

      <QuestionModal
        open={room.phase === 'question'}
        question={room.current_question}
        onDone={() => finishDiscussion(room)}
      />
    </div>
  );
}