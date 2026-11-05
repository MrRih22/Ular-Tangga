import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { MathUtils } from 'three';
import { squareToXZ, STEP_MS } from '../utils/GameEngine';
import { AnimalModel, TAG_HEIGHT } from './Animals';

export default function PlayerToken({ square, name, color, avatar = 'cat', offsetX = 0 }) {
  const group = useRef();
  const face = useRef();
  const [shown, setShown] = useState(square);

  // Geser kotak demi kotak (maju); lompat untuk ular/tangga
  useEffect(() => {
    if (shown === square) return;
    const diff = square - shown;
    const isJump = diff < 0 || diff > 6;
    const t = setTimeout(
      () => setShown((s) => (isJump ? square : s + 1)),
      isJump ? 500 : STEP_MS
    );
    return () => clearTimeout(t);
  }, [square, shown]);

  const [tx, tz] = squareToXZ(shown);
  const initial = useRef(null);
  if (!initial.current) {
    const [ix, iz] = squareToXZ(square);
    initial.current = [ix + offsetX, 0.08, iz];
  }

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const gx = tx + offsetX;
    const dx = gx - g.position.x;
    const dz = tz - g.position.z;
    const moving = Math.abs(dx) + Math.abs(dz) > 0.03;

    g.position.x = MathUtils.damp(g.position.x, gx, 9, dt);
    g.position.z = MathUtils.damp(g.position.z, tz, 9, dt);
    g.position.y = 0.08 + (moving ? Math.abs(Math.sin(performance.now() / 110)) * 0.22 : 0);

    if (moving && face.current) {
      const target = Math.atan2(dx, dz);
      let d = target - face.current.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      face.current.rotation.y += d * Math.min(1, dt * 10);
    }
  });

  return (
    <group ref={group} position={initial.current}>
      {/* cincin warna pemain di kaki */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <group ref={face} scale={0.85}>
        <AnimalModel type={avatar} />
      </group>

      {/* Name tag 3D melayang */}
      <Html position={[0, (TAG_HEIGHT[avatar] || 1.1) * 0.85 + 0.25, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
        <div
          style={{ borderColor: color }}
          className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                     bg-black/60 backdrop-blur border text-white select-none pointer-events-none"
        >
          {name}
        </div>
      </Html>
    </group>
  );
}