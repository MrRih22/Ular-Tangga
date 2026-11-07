import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sparkles, Stars, Float } from '@react-three/drei';
import { Vector3 } from 'three';
import PlayerToken from './PlayerToken';
import Connectors from './Connectors';
import { squareToXZ, TILE } from '../utils/GameEngine';

const COLOR_A = '#ffffff';      // Putih bersih
const COLOR_B = '#ffe4ec';      // Pink pastel cerah
const COLOR_START = '#bbf7d0';  // Hijau cerah
const COLOR_FINISH = '#fde047'; // Emas cerah

/** Kamera dinamis: otomatis menyesuaikan layar & mengikuti pion saat fase 'moving' */
function CameraRig({ room }) {
  const { camera, size, controls } = useThree();
  const targetPos = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    const aspect = size.width / size.height;
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const need = 11.6;
    const dist = Math.max(need / (2 * t * aspect), (need * 0.8) / (2 * t)) * 1.1;
    camera.position.set(0, dist * 0.82, dist * 0.58);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controls) controls.update();
  }, [size.width, size.height, camera, controls]);

  useFrame((_, delta) => {
    if (!controls || !controls.target) return;

    if (room.phase === 'moving') {
      const activeSq = room.current_turn === 1 ? room.player1_pos : room.player2_pos;
      const [px, pz] = squareToXZ(activeSq || 1);
      targetPos.current.set(px * 0.45, 0, pz * 0.45);
    } else {
      targetPos.current.set(0, 0, 0);
    }

    controls.target.lerp(targetPos.current, Math.min(1, delta * 3.5));
  });

  return null;
}

/** Animasi masuk papan yang aman */
function BoardEntrance({ children }) {
  const groupRef = useRef();
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + delta * 1.8);
    const ease = 1 - Math.pow(1 - progress.current, 3);
    const s = 0.9 + 0.1 * ease;
    groupRef.current.scale.set(s, s, s);
    groupRef.current.position.y = (1 - ease) * -0.4;
  });

  return <group ref={groupRef}>{children}</group>;
}

/** Latar belakang bintang & partikel melayang */
function LivingBackground() {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={42} depth={30} count={2000} factor={3.5} saturation={0.5} fade speed={0.8} />
      <Sparkles count={50} scale={[22, 12, 22]} size={3.5} speed={0.35} opacity={0.65} color="#fde68a" />
      <Sparkles count={35} scale={[18, 9, 18]} size={3} speed={0.25} opacity={0.5} color="#7dd3fc" />
    </group>
  );
}

/** Sorotan cahaya berdenyut di bawah pion yang sedang mendapat giliran */
function ActiveTurnHalo({ square, color }) {
  const ref = useRef();
  const [x, z] = squareToXZ(square || 0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 4.5) * 0.12;
    ref.current.scale.set(s, s, 1);
    ref.current.material.opacity = 0.5 + Math.sin(t * 4.5) * 0.25;
  });

  if (!square || square <= 0) return null;

  return (
    <mesh ref={ref} position={[x, 0.085, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.32, 0.44, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

/** Mahkota berputar & halo emas di atas kotak 100 */
function FinishCrown() {
  const [x, z] = squareToXZ(100);
  const crownRef = useRef();
  const haloRef = useRef();

  useFrame(({ clock }, delta) => {
    if (crownRef.current) crownRef.current.rotation.y += delta * 1.2;
    if (haloRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.08;
      haloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      <mesh ref={haloRef} position={[x, 0.085, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.44, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.75} />
      </mesh>
      <Float speed={3} rotationIntensity={0.15} floatIntensity={0.45}>
        <group ref={crownRef} position={[x, 0.72, z]}>
          <Text fontSize={0.5} color="#e11d48" anchorX="center" anchorY="middle">
            👑
          </Text>
        </group>
      </Float>
    </group>
  );
}

function Tiles() {
  const tiles = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => {
        const n = i + 1;
        const [x, z] = squareToXZ(n);
        const row = Math.floor(i / 10);
        const col = i % 10;

        let color = (row + col) % 2 === 0 ? COLOR_A : COLOR_B;
        if (n === 1) color = COLOR_START;
        if (n === 100) color = COLOR_FINISH;

        return { n, x, z, color };
      }),
    []
  );

  return (
    <group>
      {/* Bingkai luar papan */}
      <mesh receiveShadow position={[0, -0.22, 0]}>
        <boxGeometry args={[11.1, 0.26, 11.1]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Lis emas/kuning cerah */}
      <mesh receiveShadow position={[0, -0.11, 0]}>
        <boxGeometry args={[10.55, 0.14, 10.55]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Dasar papan */}
      <mesh receiveShadow position={[0, -0.07, 0]}>
        <boxGeometry args={[10.2, 0.1, 10.2]} />
        <meshStandardMaterial color="#fff1f2" roughness={0.5} />
      </mesh>

      {tiles.map((t) => (
        <group key={t.n} position={[t.x, 0, t.z]}>
          <mesh receiveShadow>
            <boxGeometry args={[TILE * 0.93, 0.13, TILE * 0.93]} />
            <meshStandardMaterial
              color={t.color}
              roughness={0.35}
              metalness={t.n === 100 ? 0.2 : 0.05}
            />
          </mesh>
          <Text
            position={[0, 0.075, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={t.n === 1 ? 0.2 : 0.25}
            fontWeight="bold"
            color={t.n === 100 ? '#be123c' : t.n === 1 ? '#15803d' : '#3f2a38'}
            anchorX="center"
            anchorY="middle"
          >
            {t.n === 100 ? '♥ 100' : t.n === 1 ? 'START' : String(t.n)}
          </Text>
        </group>
      ))}

      <FinishCrown />
    </group>
  );
}

export default function GameBoard({ room }) {
  const activeSquare = room.current_turn === 1 ? room.player1_pos : room.player2_pos;
  const activeColor = room.current_turn === 1 ? '#ff4d8d' : '#4dc3ff';

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-slate-950 via-sky-950 to-indigo-950">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 11, 10], fov: 45 }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        <CameraRig room={room} />
        <fog attach="fog" args={['#082f49', 24, 58]} />

        <ambientLight intensity={0.85} />
        <directionalLight
          position={[7, 15, 8]}
          intensity={1.5}
          color="#fffbeb"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-7, 6, -7]} intensity={0.6} color="#fda4af" />
        <pointLight position={[7, 6, 7]} intensity={0.6} color="#7dd3fc" />

        <LivingBackground />

        <BoardEntrance>
          <Tiles />
          <ActiveTurnHalo square={activeSquare} color={activeColor} />
          <Connectors snakes={room.snakes} ladders={room.ladders} />

          <PlayerToken
            square={room.player1_pos}
            name={room.player1_name}
            avatar={room.player1_avatar || 'cat'}
            color="#ff4d8d"
            offsetX={-0.2}
          />
          {room.player2_name && (
            <PlayerToken
              square={room.player2_pos}
              name={room.player2_name}
              avatar={room.player2_avatar || 'cat'}
              color="#4dc3ff"
              offsetX={0.2}
            />
          )}
        </BoardEntrance>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
