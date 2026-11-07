import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import PlayerToken from './PlayerToken';
import Connectors from './Connectors';
import { squareToXZ, TILE } from '../utils/GameEngine';
import Dice3D from './Dice3D';

const COLOR_A = '#f6d9e6';
const COLOR_B = '#b88ad8';

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

function Tiles() {
  const tiles = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => {
        const n = i + 1;
        const [x, z] = squareToXZ(n);
        const row = Math.floor(i / 10);
        const col = i % 10;
        return { n, x, z, color: (row + col) % 2 === 0 ? COLOR_A : COLOR_B };
      }),
    []
  );

  return (
    <group>
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[10.6, 0.2, 10.6]} />
        <meshStandardMaterial color="#2a1745" />
      </mesh>

      {tiles.map((t) => (
        <group key={t.n} position={[t.x, 0, t.z]}>
          <mesh receiveShadow>
            <boxGeometry args={[TILE * 0.96, 0.12, TILE * 0.96]} />
            <meshStandardMaterial color={t.color} roughness={0.6} />
          </mesh>
          <Text
            position={[0, 0.07, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.26}
            color={t.n === 100 ? '#e11d48' : '#3b1d5a'}
            anchorX="center"
            anchorY="middle"
          >
            {t.n === 100 ? '♥ 100' : String(t.n)}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function GameBoard({ room }) {
  return (
    <Canvas shadows camera={{ position: [0, 11, 10], fov: 45 }} dpr={[1, 2]} style={{ touchAction: 'none' }}>
      <FitCamera />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 12, 6]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />

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
  );
}