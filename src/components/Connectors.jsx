import { useMemo } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Float32BufferAttribute,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { squareToXZ } from '../utils/GameEngine';

const PALETTE = [
  ['#14532d', '#86efac', '#eab308'], // Hijau zamrud
  ['#7f1d1d', '#fca5a5', '#f59e0b'], // Merah koral
  ['#4c1d95', '#c4b5fd', '#f472b6'], // Ungu eksotis
  ['#7c2d12', '#fdba74', '#fef08a'], // Oranye piton
  ['#164e63', '#67e8f9', '#e2e8f0'], // Biru laut
  ['#831843', '#f9a8d4', '#fde047'], // Magenta
  ['#713f12', '#fde047', '#fef9c3'], // Emas gurun
  ['#1e293b', '#94a3b8', '#e2e8f0'], // Abu-abu batu
];

/** Buat tekstur sisik & corak kulit ular secara prosedural */
function makeSnakeTexture(dark, light, accent) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');

  // Warna dasar tubuh
  g.fillStyle = dark;
  g.fillRect(0, 0, 256, 128);

  // Corak belang/belah ketupat di punggung
  g.fillStyle = light;
  for (let x = 0; x < 256; x += 64) {
    g.beginPath();
    g.moveTo(x + 32, 16);
    g.lineTo(x + 56, 64);
    g.lineTo(x + 32, 112);
    g.lineTo(x + 8, 64);
    g.closePath();
    g.fill();

    // Titik aksen di tengah corak
    g.fillStyle = accent;
    g.beginPath();
    g.arc(x + 32, 64, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = light;
  }

  // Pola sisik halus
  g.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  g.lineWidth = 1.5;
  for (let y = 0; y < 128; y += 16) {
    const offset = (y / 16) % 2 === 0 ? 0 : 8;
    for (let x = -16; x < 272; x += 16) {
      g.beginPath();
      g.arc(x + offset, y, 9, 0, Math.PI);
      g.stroke();
    }
  }

  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 1);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Buat geometri tabung yang meruncing alami dari leher ke ujung ekor */
function createTaperedTube(curve, tubularSegments = 56, radialSegments = 14) {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions = [];
  const uvs = [];
  const indices = [];

  const P = new Vector3();
  const N = new Vector3();
  const B = new Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    N.copy(frames.normals[i]);
    B.copy(frames.binormals[i]);

    // Radius: tipis di ekor (t=0), tebal di badan (t=0.65), sedikit mengecil di leher (t=1)
    const r = 0.015 + 0.115 * Math.sin(Math.pow(t, 0.65) * Math.PI * 0.85);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);

      const vx = P.x + r * (cos * N.x + sin * B.x);
      const vy = P.y + r * (cos * N.y + sin * B.y);
      const vz = P.z + r * (cos * N.z + sin * B.z);

      positions.push(vx, vy, vz);
      uvs.push(t, v);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function Snake3D({ head, tail, index }) {
  const [dark, light, accent] = PALETTE[index % PALETTE.length];

  const { geometry, texture, headPt, angle } = useMemo(() => {
    const [hx, hz] = squareToXZ(Number(head));
    const [tx, tz] = squareToXZ(Number(tail));
    const dx = hx - tx;
    const dz = hz - tz;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const waves = Math.max(3, Math.round(len / 1.15));
    const N = Math.max(28, Math.round(len * 6));

    const vectors = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const env = Math.min(1, t * 5, (1 - t) * 5);
      const off = Math.sin(t * waves * Math.PI) * 0.35 * env;
      const lift = Math.sin(t * Math.PI) * 0.045;
      vectors.push(
        new Vector3(
          tx + dx * t + nx * off,
          0.15 + lift,
          tz + dz * t + nz * off
        )
      );
    }

    const curve = new CatmullRomCurve3(vectors);
    const a = vectors[N];
    const b = vectors[N - 1];

    return {
      geometry: createTaperedTube(curve, 60, 14),
      texture: makeSnakeTexture(dark, light, accent),
      headPt: a,
      angle: Math.atan2(a.x - b.x, a.z - b.z),
    };
  }, [head, tail, dark, light, accent]);

  return (
    <group>
      {/* Tubuh ular meruncing dengan tekstur sisik */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial map={texture} roughness={0.28} metalness={0.12} />
      </mesh>

      {/* Kepala ular realistis (diam) */}
      <group position={[headPt.x, 0.22, headPt.z]} rotation={[0, angle, 0]}>
        {/* Rahang belakang */}
        <mesh scale={[1.25, 0.72, 1.15]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={dark} roughness={0.28} metalness={0.1} />
        </mesh>

        {/* Moncong depan */}
        <mesh position={[0, -0.015, 0.14]} scale={[0.85, 0.58, 1.1]} castShadow>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial color={dark} roughness={0.28} metalness={0.1} />
        </mesh>

        {/* Mata reptil dengan pupil vertikal */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.095, 0.065, 0.09]}>
            <mesh>
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshStandardMaterial color="#fef08a" roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.032]} scale={[0.4, 1.15, 0.4]}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshStandardMaterial color="#09090b" />
            </mesh>
          </group>
        ))}

        {/* Lubang hidung */}
        {[-1, 1].map((s) => (
          <mesh key={`n${s}`} position={[s * 0.035, 0.025, 0.23]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
        ))}

        {/* Lidah bercabang */}
        <group position={[0, -0.025, 0.25]}>
          <mesh>
            <boxGeometry args={[0.018, 0.008, 0.12]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[-0.018, 0, 0.075]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.012, 0.008, 0.06]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[0.018, 0, 0.075]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[0.012, 0.008, 0.06]} />
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
