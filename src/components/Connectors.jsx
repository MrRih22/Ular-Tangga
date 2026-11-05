import { useMemo } from 'react';
import { squareToXZ } from '../utils/GameEngine';

const PALETTE = [
  ['#16a34a', '#bbf7d0'],
  ['#dc2626', '#fecaca'],
  ['#7c3aed', '#ddd6fe'],
  ['#ea580c', '#fed7aa'],
  ['#0891b2', '#a5f3fc'],
  ['#db2777', '#fbcfe8'],
  ['#ca8a04', '#fef08a'],
  ['#475569', '#cbd5e1'],
];

function Snake3D({ head, tail, index }) {
  const { pts, angle } = useMemo(() => {
    const [hx, hz] = squareToXZ(Number(head));
    const [tx, tz] = squareToXZ(Number(tail));
    const dx = hx - tx;
    const dz = hz - tz;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const waves = Math.max(3, Math.round(len / 1.2));
    const N = Math.max(20, Math.round(len * 5));

    const out = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const env = Math.min(1, t * 5, (1 - t) * 5);
      const off = Math.sin(t * waves * Math.PI) * 0.32 * env;
      out.push({
        x: tx + dx * t + nx * off,
        z: tz + dz * t + nz * off,
        r: 0.045 + 0.1 * Math.pow(t, 0.8),
      });
    }
    const a = out[N];
    const b = out[N - 1];
    return { pts: out, angle: Math.atan2(a.x - b.x, a.z - b.z) };
  }, [head, tail]);

  const [dark, light] = PALETTE[index % PALETTE.length];
  const headPt = pts[pts.length - 1];

  return (
    <group>
      {pts.slice(0, -1).map((p, i) => (
        <mesh key={i} position={[p.x, p.r + 0.06, p.z]} castShadow>
          <sphereGeometry args={[p.r, 10, 10]} />
          <meshStandardMaterial color={i % 6 < 3 ? dark : light} roughness={0.4} />
        </mesh>
      ))}

      {/* Kepala */}
      <group position={[headPt.x, 0.24, headPt.z]} rotation={[0, angle, 0]}>
        <mesh scale={[1.1, 0.85, 1.35]} castShadow>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={dark} roughness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.085, 0.09, 0.12]}>
            <mesh>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        ))}
        {/* Lidah */}
        <mesh position={[0, -0.02, 0.3]}>
          <boxGeometry args={[0.025, 0.01, 0.16]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        <mesh position={[-0.025, -0.02, 0.4]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.015, 0.01, 0.08]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        <mesh position={[0.025, -0.02, 0.4]} rotation={[0, -0.5, 0]}>
          <boxGeometry args={[0.015, 0.01, 0.08]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
      </group>
    </group>
  );
}

function Ladder3D({ bottom, top }) {
  const { mid, len, angle } = useMemo(() => {
    const [x1, z1] = squareToXZ(Number(bottom));
    const [x2, z2] = squareToXZ(Number(top));
    const dx = x2 - x1;
    const dz = z2 - z1;
    return {
      mid: [(x1 + x2) / 2, 0.14, (z1 + z2) / 2],
      len: Math.hypot(dx, dz),
      angle: Math.atan2(dx, dz),
    };
  }, [bottom, top]);

  const rungs = [];
  for (let z = -len / 2 + 0.25; z < len / 2 - 0.1; z += 0.4) rungs.push(z);

  return (
    <group position={mid} rotation={[0, angle, 0]}>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, len, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      ))}
      {rungs.map((z) => (
        <mesh key={z} position={[0, 0.01, z]} castShadow>
          <boxGeometry args={[0.36, 0.035, 0.05]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function Connectors({ snakes, ladders }) {
  return (
    <group>
      {Object.entries(snakes || {}).map(([head, tail], i) => (
        <Snake3D key={`s${head}`} head={head} tail={tail} index={i} />
      ))}
      {Object.entries(ladders || {}).map(([bottom, top]) => (
        <Ladder3D key={`l${bottom}`} bottom={bottom} top={top} />
      ))}
    </group>
  );
}