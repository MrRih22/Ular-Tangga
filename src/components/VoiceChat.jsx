import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const PREFIX = 'lovesteps';
const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Produksi: tambahkan TURN agar stabil di jaringan seluler, contoh:
    // { urls: 'turn:YOUR_TURN_HOST:3478', username: 'USER', credential: 'PASS' },
  ],
};

export default function VoiceChat({ roomCode, me, bothPresent }) {
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [status, setStatus] = useState('idle'); // idle|waiting|connected|denied|error

  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const connectedRef = useRef(false);

  // Mulai otomatis saat 2 pemain sudah ada di room
  useEffect(() => {
    if (!bothPresent) return;
    let cancelled = false;
    let peer = null;
    let retry = null;
    let currentCall = null;

    (async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
      } catch {
        setStatus('denied');
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      peer = new Peer(`${PREFIX}-${roomCode}-p${me}`, { config: ICE });

      const attach = (call) => {
        currentCall = call;
        call.on('stream', (remote) => {
          connectedRef.current = true;
          if (audioRef.current) {
            audioRef.current.srcObject = remote;
            audioRef.current.play().catch(() => {});
          }
          setStatus('connected');
        });
        call.on('close', () => {
          connectedRef.current = false;
          setStatus('waiting');
        });
      };

      peer.on('call', (call) => {
        call.answer(stream);
        attach(call);
      });

      peer.on('open', () => {
        setStatus('waiting');
        // Player 2 yang menelepon Player 1 (retry sampai tersambung)
        if (me === 2) {
          const dial = () => {
            if (connectedRef.current || !peer || peer.destroyed) return;
            attach(peer.call(`${PREFIX}-${roomCode}-p1`, stream));
          };
          dial();
          retry = setInterval(dial, 4000);
        }
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') return; // lawan belum siap, retry
        console.warn('Peer error:', err.type);
        if (err.type === 'unavailable-id') setStatus('error');
      });
    })();

    return () => {
      cancelled = true;
      clearInterval(retry);
      connectedRef.current = false;
      currentCall?.close();
      peer?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [bothPresent, roomCode, me]);

  // Mute / unmute mic
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn, status]);

  // Speaker on/off
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !speakerOn;
  }, [speakerOn, status]);

  const label = {
    idle: 'Menunggu pasangan…',
    waiting: 'Menyambungkan suara…',
    connected: 'Suara terhubung',
    denied: 'Izin mikrofon ditolak',
    error: 'Gagal terhubung, muat ulang',
  }[status];

  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      <div className="fixed left-3 bottom-24 z-30 flex flex-col items-start gap-2">
        <span
          className={`text-[11px] px-2 py-1 rounded-full backdrop-blur bg-black/50 ${
            status === 'connected' ? 'text-green-300' : 'text-white/70'
          }`}
        >
          {label}
        </span>

        <button
          onClick={() => setMicOn((v) => !v)}
          className={`w-12 h-12 rounded-full text-xl backdrop-blur border border-white/20 active:scale-90 transition ${
            micOn ? 'bg-white/15' : 'bg-red-500/70'
          }`}
          aria-label="Toggle mic"
        >
          {micOn ? '🎙️' : '🔇'}
        </button>

        <button
          onClick={() => setSpeakerOn((v) => !v)}
          className={`w-12 h-12 rounded-full text-xl backdrop-blur border border-white/20 active:scale-90 transition ${
            speakerOn ? 'bg-white/15' : 'bg-red-500/70'
          }`}
          aria-label="Toggle speaker"
        >
          {speakerOn ? '🔊' : '🔈'}
        </button>
      </div>
    </>
  );
}