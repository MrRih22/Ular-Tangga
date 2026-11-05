import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import PlayerToken from './PlayerToken';
import Connectors from './Connectors';
import { squareToXZ, TILE } from '../utils/GameEngine';

const COLOR_A = '#f6d9e6';
const COLOR_B = '#b88ad8';

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
    <Canvas shadows camera={{ position: [0, 11, 10], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Tiles />
      <Connectors snakes={room.snakes} ladders={room.ladders} />

      <PlayerToken
        square={room.player1_pos}
        name={room.player1_name}
        color="#ff4d8d"
        offsetX={-0.2}
      />
      {room.player2_name && (
        <PlayerToken
          square={room.player2_pos}
          name={room.player2_name}
          color="#4dc3ff"
          offsetX={0.2}
        />
      )}

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}