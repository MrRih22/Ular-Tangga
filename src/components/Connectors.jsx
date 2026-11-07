import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
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
  const { curve, headPt, angle } = useMemo(() => {
    const [hx, hz] = squareToXZ(Number(head));
    const [tx, tz] = squareToXZ(Number(tail));
    const dx = hx - tx;
    const dz = hz - tz;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const waves = Math.max(3, Math.round(len / 1.2));
    const N = Math.max(24, Math.round(len * 6));

    const vectors = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const env = Math.min(1, t * 5, (1 - t) * 5);
      const off = Math.sin(t * waves * Math.PI) * 0.34 * env;
      const lift = Math.sin(t * Math.PI) * 0.04;
      vectors.push(
        new Vector3(
          tx + dx * t + nx * off,
          0.16 + lift,
          tz + dz * t + nz * off
        )
      );
    }

    const a = vectors[N];
    const b = vectors[N - 1];
    return {
      curve: new CatmullRomCurve3(vectors),
      headPt: a,
      angle: Math.atan2(a.x - b.x, a.z - b.z),
    };
  }, [head, tail]);

  const [dark, light] = PALETTE[index % PALETTE.length];

  return (
    <group>
      {/* Tubuh ular kontinu yang mulus */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 48, 0.11, 12, false]} />
        <meshStandardMaterial color={dark} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Garis punggung/corak terang */}
      <mesh position={[0, 0.03, 0]}>
        <tubeGeometry args={[curve, 48, 0.065, 8, false]} />
        <meshStandardMaterial color={light} roughness={0.4} />
      </mesh>

      {/* Ujung ekor meruncing */}
      <mesh position={[curve.getPoint(0).x, 0.14, curve.getPoint(0).z]} castShadow>
        <coneGeometry args={[0.09, 0.22, 10]} />
        <meshStandardMaterial color={light} roughness={0.4} />
      </mesh>

      {/* Kepala ular (diam) */}
      <group position={[headPt.x, 0.25, headPt.z]} rotation={[0, angle, 0]}>
        <mesh scale={[1.15, 0.8, 1.4]} castShadow>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={dark} roughness={0.35} />
        </mesh>

        {/* Mata */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.09, 0.08, 0.11]}>
            <mesh>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0, 0.032]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        ))}

        {/* Lidah bercabang */}
        <group position={[0, -0.02, 0.24]}>
          <mesh>
            <boxGeometry args={[0.022, 0.01, 0.14]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[-0.022, 0, 0.09]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.014, 0.01, 0.07]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[0.022, 0, 0.09]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[0.014, 0.01, 0.07]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
        </group>
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
