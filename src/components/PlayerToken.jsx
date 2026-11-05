import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { MathUtils } from 'three';
import { squareToXZ, STEP_MS } from '../utils/GameEngine';

export default function PlayerToken({ square, name, color, offsetX = 0 }) {
  const group = useRef();
  const [shown, setShown] = useState(square);

  // Geser kotak demi kotak (maju); lompat langsung untuk ular/tangga
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
    initial.current = [ix + offsetX, 0.35, iz];
  }

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x = MathUtils.damp(g.position.x, tx + offsetX, 9, dt);
    g.position.z = MathUtils.damp(g.position.z, tz, 9, dt);
    const moving = Math.abs(g.position.x - (tx + offsetX)) + Math.abs(g.position.z - tz) > 0.03;
    g.position.y = 0.35 + (moving ? Math.abs(Math.sin(performance.now() / 110)) * 0.25 : 0);
  });

  return (
    <group ref={group} position={initial.current}>
      {/* badan pion */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 0.45, 24]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.35} />
      </mesh>
      {/* kepala pion */}
      <mesh castShadow position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.35} />
      </mesh>

      {/* Name tag 3D melayang */}
      <Html position={[0, 1.0, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
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