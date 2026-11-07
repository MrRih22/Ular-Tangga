import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { squareToXZ } from '../utils/GameEngine';

const PALETTE = [
  { base: '#2f8f4e', dark: '#14532d', belly: '#ecf8c9' },
  { base: '#d9480f', dark: '#431407', belly: '#fde68a' },
  { base: '#7c3aed', dark: '#2e1065', belly: '#ede9fe' },
  { base: '#0e8aa8', dark: '#083344', belly: '#cffafe' },
  { base: '#b7791f', dark: '#422006', belly: '#fef3c7' },
  { base: '#be185d', dark: '#500724', belly: '#fce7f3' },
];

const N = 70;  // cincin sepanjang tubuh
const M = 14;  // titik melingkar per cincin

/* ---------- tekstur sisik ---------- */
function makeSnakeTexture({ base, dark, belly }) {
  const w = 256, h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  // perut (v 0.6 - 0.9)
  g.fillStyle = belly;
  g.fillRect(0, h * 0.6, w, h * 0.3);
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.lineWidth = 2;
  for (let x = 0; x < w; x += 16) {
    g.beginPath();
    g.moveTo(x, h * 0.6);
    g.lineTo(x, h * 0.9);
    g.stroke();
  }
  // belah ketupat di punggung (v ~ 0.25)
  g.fillStyle = dark;
  for (let x = 0; x < w; x += 64) {
    g.beginPath();
    g.moveTo(x + 32, h * 0.08);
    g.lineTo(x + 56, h * 0.25);
    g.lineTo(x + 32, h * 0.42);
    g.lineTo(x + 8, h * 0.25);
    g.closePath();
    g.fill();
    g.fillStyle = belly;
    g.beginPath();
    g.arc(x + 32, h * 0.25, 5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = dark;
  }
  // bintik di sisi badan
  [0.0, 0.5, 1.0].forEach((v) => {
    for (let x = 16; x < w; x += 32) {
      g.beginPath();
      g.arc(x, h * v, 6, 0, Math.PI * 2);
      g.fill();
    }
  });
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.repeat.set(7, 1);
  return tex;
}

/* ---------- geometri tubuh ---------- */
function makeBodyGeometry() {
  const g = new BufferGeometry();
  const count = (N + 1) * (M + 1);
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(count * 3), 3));
  const uv = new Float32Array(count * 2);
  const idx = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= M; j++) {
      const k = i * (M + 1) + j;
      uv[k * 2] = i / N;
      uv[k * 2 + 1] = j / M;
      if (i < N && j < M) {
        const a = k, b = k + 1, c = k + (M + 1), d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const radiusAt = (t) => {
  const taper = Math.min(1, t / 0.35);
  let r = 0.115 * (0.16 + 0.84 * Math.pow(taper, 0.7));
  r *= 1 + 0.1 * Math.sin(Math.PI * t);
  if (t > 0.88) r *= 1 - (t - 0.88) * 1.6; // leher mengecil menuju kepala
  return r;
};

/** Isi posisi tubuh pada waktu tertentu; kembalikan info ujung kepala */
function fillBody(geo, p, time) {
  const pos = geo.attributes.position.array;
  const nor = geo.attributes.normal.array;
  const cx = [], cz = [], rr = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const env = Math.min(1, t * 6, (1 - t) * 6);
    const lat = Math.sin(t * p.waves * Math.PI * 2 - time * 1.8) * p.amp * env;
    cx.push(p.tx + p.dx * t + p.sx * lat);
    cz.push(p.tz + p.dz * t + p.sz * lat);
    rr.push(radiusAt(t));
  }

  let last = { tx: p.dx, tz: p.dz };
  for (let i = 0; i <= N; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(N, i + 1);
    let tx = cx[i1] - cx[i0];
    let tz = cz[i1] - cz[i0];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    last = { tx, tz };
    const sx = tz, sz = -tx; // samping = cross(atas, tangen)
    const r = rr[i];
    const cy = r + 0.06;
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const k = (i * (M + 1) + j) * 3;
      pos[k] = cx[i] + sx * ca * r;
      pos[k + 1] = cy + sa * r;
      pos[k + 2] = cz[i] + sz * ca * r;
      nor[k] = sx * ca;
      nor[k + 1] = sa;
      nor[k + 2] = sz * ca;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.normal.needsUpdate = true;

  return { x: cx[N], z: cz[N], y: rr[N] + 0.06, tx: last.tx, tz: last.tz };
}

/* ---------- ular ---------- */
function Snake3D({ head, tail, index }) {
  const pal = PALETTE[index % PALETTE.length];
  const bodyRef = useRef();
  const headRef = useRef();
  const tongueRef = useRef();

  const params = useMemo(() => {
    const [hx, hz] = squareToXZ(Number(head));
    const [tx, tz] = squareToXZ(Number(tail));
    const dx = hx - tx, dz = hz - tz;
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    return {
      tx, tz, dx, dz,
      sx: uz, sz: -ux,
      waves: Math.max(2, Math.round(len / 2.4)),
      amp: 0.4,
      phase: index * 1.3,
    };
  }, [head, tail, index]);

  const geo = useMemo(() => {
    const g = makeBodyGeometry();
    fillBody(g, params, 0);
    return g;
  }, [params]);

  const tex = useMemo(() => makeSnakeTexture(pal), [pal]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime + params.phase;
    const h = fillBody(geo, params, time);
    const hd = headRef.current;
    if (hd) {
      hd.position.set(h.x + h.tx * 0.09, h.y + 0.025, h.z + h.tz * 0.09);
      hd.rotation.y = Math.atan2(h.tx, h.tz);
      hd.rotation.x = Math.sin(time * 1.8) * 0.05;
    }
    const tg = tongueRef.current;
    if (tg) {
      const phase = (time * 0.6) % 3;
      tg.visible = phase < 0.7;
      tg.scale.z = 0.5 + 0.5 * Math.abs(Math.sin(time * 14));
    }
  });

  const Eye = ({ x }) => (
    <group position={[x, 0.04, 0.085]}>
      <mesh>
        <sphereGeometry args={[0.034, 16, 16]} />
        <meshStandardMaterial color="#fde047" roughness={0.3} />
      </mesh>
      <mesh position={[x > 0 ? 0.028 : -0.028, 0, 0.012]} scale={[0.35, 1, 0.6]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );

  return (
    <group>
      <mesh ref={bodyRef} geometry={geo} castShadow frustumCulled={false}>
        <meshPhysicalMaterial map={tex} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>

      <group ref={headRef}>
        {/* tengkorak */}
        <mesh castShadow position={[0, 0, 0.02]} scale={[0.125, 0.075, 0.17]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial color={pal.base} roughness={0.35} clearcoat={0.6} />
        </mesh>
        {/* moncong */}
        <mesh castShadow position={[0, -0.012, 0.15]} scale={[0.075, 0.05, 0.1]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshPhysicalMaterial color={pal.base} roughness={0.35} clearcoat={0.6} />
        </mesh>
        {/* rahang bawah terang */}
        <mesh position={[0, -0.05, 0.08]} scale={[0.105, 0.03, 0.16]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={pal.belly} roughness={0.5} />
        </mesh>
        {/* pola di kepala */}
        <mesh position={[0, 0.06, 0.04]} scale={[0.05, 0.012, 0.08]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={pal.dark} />
        </mesh>
        <Eye x={-0.088} />
        <Eye x={0.088} />
        {/* lubang hidung */}
        {[-0.022, 0.022].map((x) => (
          <mesh key={x} position={[x, 0.012, 0.248]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
        ))}
        {/* lidah bercabang */}
        <group ref={tongueRef} position={[0, -0.035, 0.24]}>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.012, 0.004, 0.12]} />
            <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[-0.017, 0, 0.14]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.008, 0.004, 0.06]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0.017, 0, 0.14]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[0.008, 0.004, 0.06]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ---------- tangga ---------- */
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