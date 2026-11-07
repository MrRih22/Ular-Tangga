import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sparkles, Stars, Float } from '@react-three/drei';
import PlayerToken from './PlayerToken';
import Connectors from './Connectors';
import { squareToXZ, TILE } from '../utils/GameEngine';

// Palet warna papan yang lebih cerah & hangat
const COLOR_A = '#fff8f0'; // Krem hangat
const COLOR_B = '#ffd1dc'; // Pink pastel lembut
const COLOR_START = '#bbf7d0'; // Hijau mint untuk Start
const COLOR_FINISH = '#fde047'; // Emas cerah untuk Finish (100)

function FitCamera() {
  const { camera, size, controls } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const need = 11.4; // lebar papan + margin
    const dist = Math.max(need / (2 * t * aspect), (need * 0.8) / (2 * t)) * 1.1;
    camera.position.set(0, dist * 0.82, dist * 0.58);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls?.update?.();
  }, [size.width, size.height, camera, controls]);
  return null;
}

/** Partikel latar belakang yang bergerak perlahan agar suasana hidup */
function LivingBackground() {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bintang-bintang di kejauhan */}
      <Stars radius={35} depth={30} count={1800} factor={3.5} saturation={0.6} fade speed={1.2} />

      {/* Kilauan/kunang-kunang melayang di sekitar papan */}
      <Sparkles
        count={70}
        scale={[18, 10, 18]}
        size={4}
        speed={0.45}
        opacity={0.75}
        color="#fde68a"
      />
      <Sparkles
        count={45}
        scale={[16, 8, 16]}
        size={3.5}
        speed={0.35}
        opacity={0.65}
        color="#f9a8d4"
      />
    </group>
  );
}

/** Ikon melayang di atas kotak 100 */
function FinishCrown() {
  const [x, z] = squareToXZ(100);
  return (
    <Float speed={3} rotationIntensity={0.4} floatIntensity={0.6}>
      <Text
        position={[x, 0.75, z]}
        fontSize={0.55}
        color="#e11d48"
        anchorX="center"
        anchorY="middle"
      >
        👑
      </Text>
    </Float>
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
      {/* Bingkai luar papan (kayu/emas hangat) */}
      <mesh receiveShadow position={[0, -0.18, 0]}>
        <boxGeometry args={[10.9, 0.24, 10.9]} />
        <meshStandardMaterial color="#78350f" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Lapisan dalam papan */}
      <mesh receiveShadow position={[0, -0.09, 0]}>
        <boxGeometry args={[10.4, 0.12, 10.4]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} />
      </mesh>

      {tiles.map((t) => (
        <group key={t.n} position={[t.x, 0, t.z]}>
          <mesh receiveShadow>
            <boxGeometry args={[TILE * 0.94, 0.14, TILE * 0.94]} />
            <meshStandardMaterial
              color={t.color}
              roughness={0.4}
              metalness={t.n === 100 ? 0.25 : 0.05}
            />
          </mesh>
          <Text
            position={[0, 0.08, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.26}
            fontWeight="bold"
            color={t.n === 100 ? '#be123c' : t.n === 1 ? '#15803d' : '#4a2545'}
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
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-slate-950 via-sky-950 to-indigo-950">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 11, 10], fov: 45 }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        <FitCamera />

        {/* Pencahayaan lebih hangat & hidup */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[6, 14, 8]}
          intensity={1.4}
          color="#fffbeb"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-6, 6, -6]} intensity={0.6} color="#f9a8d4" />
        <pointLight position={[6, 6, 6]} intensity={0.5} color="#7dd3fc" />

        <LivingBackground />
        <Tiles />
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

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
