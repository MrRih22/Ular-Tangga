import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { MathUtils } from 'three';
import { squareToXZ, STEP_MS } from '../utils/GameEngine';
import { AnimalModel, TAG_HEIGHT } from './Animals';
import { playLadderClimb, playSnakeSlide } from '../utils/sfx';

export default function PlayerToken({ square, name, color, avatar = 'cat', offsetX = 0 }) {
  const group = useRef();
  const face = useRef();
  const jumpUntil = useRef(0);
  const [shown, setShown] = useState(square);

  // Jalan petak demi petak; naik tangga / turun ular = lompat + suara
  useEffect(() => {
    if (shown === square) return;
    const diff = square - shown;
    const isJump = diff < 0 || diff > 6;
    const t = setTimeout(
      () => {
        if (isJump) {
          jumpUntil.current = performance.now() + 1500;
          if (diff > 0) playLadderClimb();
          else playSnakeSlide();
          setShown(square);
        } else {
          setShown((s) => s + 1);
        }
      },
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
    const jumping = performance.now() < jumpUntil.current;
    const lam = jumping ? 2.4 : 9; // naik tangga / meluncur dibuat lebih pelan
    const gx = tx + offsetX;
    const dx = gx - g.position.x;
    const dz = tz - g.position.z;
    const moving = Math.abs(dx) + Math.abs(dz) > 0.03;

    g.position.x = MathUtils.damp(g.position.x, gx, lam, dt);
    g.position.z = MathUtils.damp(g.position.z, tz, lam, dt);
    g.position.y = 0.08 + (moving ? Math.abs(Math.sin(performance.now() / (jumping ? 160 : 110))) * 0.2 : 0);

    if (moving && face.current) {
      let d = Math.atan2(dx, dz) - face.current.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      face.current.rotation.y += d * Math.min(1, dt * 10);
    }
  });

  return (
    <group ref={group} position={initial.current}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.27, 0.3, 0.06, 32]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.25} clearcoat={1} />
      </mesh>

      <group ref={face} position={[0, 0.06, 0]} scale={0.85}>
        <AnimalModel type={avatar} />
      </group>

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