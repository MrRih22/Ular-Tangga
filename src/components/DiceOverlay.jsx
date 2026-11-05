import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { DICE_MS } from '../utils/GameEngine';

// Nilai tiap sisi kubus: +x, -x, +y, -y, +z, -z (sisi berlawanan jumlahnya 7)
const FACE_VALUES = [2, 5, 1, 6, 3, 4];

// Rotasi akhir agar angka tertentu menghadap kamera (+z)
const FINAL_ROT = {
  1: [Math.PI / 2, 0, 0],
  2: [0, -Math.PI / 2, 0],
  3: [0, 0, 0],
  4: [0, Math.PI, 0],
  5: [0, Math.PI / 2, 0],
  6: [-Math.PI / 2, 0, 0],
};

const PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
};

function makeFaceTexture(v) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#fff8fb';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#e9c3d6';
  g.lineWidth = 10;
  g.strokeRect(5, 5, 246, 246);
  g.fillStyle = v === 1 ? '#e11d48' : '#2a1745';
  PIPS[v].forEach(([x, y]) => {
    g.beginPath();
    g.arc(x * 256, y * 256, v === 1 ? 38 : 26, 0, Math.PI * 2);
    g.fill();
  });
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function Die({ value, playKey }) {
  const ref = useRef();
  const start = useRef(performance.now());
  const spin = useRef([0, 0, 0]);
  const textures = useMemo(() => FACE_VALUES.map(makeFaceTexture), []);

  useEffect(() => {
    const sign = () => (Math.random() < 0.5 ? -1 : 1);
    const turns = (min, extra) => (min + Math.floor(Math.random() * extra)) * Math.PI * 2 * sign();
    start.current = performance.now();
    spin.current = [turns(3, 3), turns(3, 3), turns(1, 2)];
  }, [playKey]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = Math.min((performance.now() - start.current) / DICE_MS, 1);
    const k = Math.pow(1 - t, 3); // sisa jarak (ease-out)
    const [fx, fy, fz] = FINAL_ROT[value] || [0, 0, 0];

    g.rotation.set(
      fx + spin.current[0] * k,
      fy + spin.current[1] * k,
      fz + spin.current[2] * k
    );

    const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * 1.6 * Math.pow(1 - t, 1.5);
    g.position.set(-2.8 * k, bounce - 2.4 * k, 0);
  });

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      {textures.map((tex, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} roughness={0.35} />
      ))}
    </mesh>
  );
}

export default function DiceOverlay({ phase, value, onStart, onLanded }) {
  const [play, setPlay] = useState({ key: 0, value: 1, visible: false });
  const valRef = useRef(value);
  valRef.current = value;
  const prev = useRef(phase);

  useEffect(() => {
    if (phase === 'moving' && prev.current !== 'moving') {
      setPlay((p) => ({ key: p.key + 1, value: valRef.current || 1, visible: true }));
      onStart?.();
      setTimeout(() => onLanded?.(), DICE_MS);
      setTimeout(() => setPlay((p) => ({ ...p, visible: false })), DICE_MS + 1100);
    }
    prev.current = phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!play.visible) return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none bg-black/20">
      <Canvas gl={{ alpha: true }} camera={{ position: [0, 0, 7], fov: 40 }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 6]} intensity={1.6} />
        <Die value={play.value} playKey={play.key} />
      </Canvas>
    </div>
  );
}