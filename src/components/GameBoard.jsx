import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sparkles, Stars, Float } from '@react-three/drei';
import PlayerToken from './PlayerToken';
import Connectors from './Connectors';
import { squareToXZ, TILE } from '../utils/GameEngine';

// Palet warna papan profesional & kontras tinggi
const COLOR_A = '#fffaf5';      // Ivory hangat
const COLOR_B = '#ffe4e6';      // Rose pastel lembut
const COLOR_START = '#dcfce7';  // Hijau mint lembut
const COLOR_FINISH = '#fef08a'; // Emas lembut

function FitCamera() {
  const { camera, size, controls } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const need = 11.6;
    const dist = Math.max(need / (2 * t * aspect), (need * 0.8) / (2 * t)) * 1.1;
    camera.position.set(0, dist * 0.82, dist * 0.58);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls?.update?.();
  }, [size.width, size.height, camera, controls]);
  return null;
}

/** 1. Latar belakang bintang & partikel melayang */
function LivingBackground() {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={40} depth={30} count={2000} factor={3.5} saturation={0.5} fade speed={1} />
      <Sparkles count={60} scale={[20, 10, 20]} size={3.5} speed={0.4} opacity={0.7} color="#fde68a" />
      <Sparkles count={40} scale={[18, 8, 18]} size={3} speed={0.3} opacity={0.55} color="#7dd3fc" />
    </group>
  );
}

/** 2. Cincin cahaya berputar pelan di bawah papan */
function OrbitalRings() {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.12;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.08;
  });

  return (
    <group position={[0, -0.45, 0]}>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.2, 8.32, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.4, 9.5, 64]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

/** 3. Pilar kristal melayang di 4 sudut papan */
function CornerCrystals() {
  const corners = [
    [-5.35, 0.55, -5.35, '#38bdf8'],
    [5.35, 0.55, -5.35, '#fb7185'],
    [-5.35, 0.55, 5.35, '#fb7185'],
    [5.35, 0.55, 5.35, '#38bdf8'],
  ];

  return (
    <group>
      {corners.map(([x, y, z, color], idx) => (
        <Float key={idx} speed={2.2} rotationIntensity={1.2} floatIntensity={0.45}>
          <mesh position={[x, y, z]} castShadow>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** 4. Mahkota berputar & melayang di atas kotak 100 */
function FinishCrown() {
  const [x, z] = squareToXZ(100);
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 1.2;
  });

  return (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={ref} position={[x, 0.72, z]}>
        <Text fontSize={0.52} color="#e11d48" anchorX="center" anchorY="middle">
          👑
        </Text>
      </group>
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
      {/* Bingkai luar kayu gelap elegan */}
      <mesh receiveShadow position={[0, -0.22, 0]}>
        <boxGeometry args={[11.1, 0.26, 11.1]} />
        <meshStandardMaterial color="#271c19" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Lis emas di sekeliling papan */}
      <mesh receiveShadow position={[0, -0.11, 0]}>
        <boxGeometry args={[10.55, 0.14, 10.55]} />
        <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.65} />
      </mesh>

      {/* Dasar papan */}
      <mesh receiveShadow position={[0, -0.07, 0]}>
        <boxGeometry args={[10.25, 0.1, 10.25]} />
        <meshStandardMaterial color="#fff1f2" roughness={0.5} />
      </mesh>

      {tiles.map((t) => (
        <group key={t.n} position={[t.x, 0, t.z]}>
          <mesh receiveShadow>
            <boxGeometry args={[TILE * 0.93, 0.13, TILE * 0.93]} />
            <meshStandardMaterial
              color={t.color}
              roughness={0.35}
              metalness={t.n === 100 ? 0.25 : 0.05}
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
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 11, 10], fov: 45 }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        <FitCamera />
        <fog attach="fog" args={['#082f49', 22, 55]} />

        {/* Three-point lighting */}
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[7, 15, 8]}
          intensity={1.5}
          color="#fffbeb"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-7, 6, -7]} intensity={0.7} color="#fda4af" />
        <pointLight position={[7, 6, 7]} intensity={0.6} color="#7dd3fc" />

        <LivingBackground />
        <OrbitalRings />
        <CornerCrystals />
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
