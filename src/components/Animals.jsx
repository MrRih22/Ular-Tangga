export const AVATARS = [
  { id: 'rabbit', label: 'Kelinci', emoji: '🐰' },
  { id: 'panda', label: 'Panda', emoji: '🐼' },
  { id: 'giraffe', label: 'Jerapah', emoji: '🦒' },
  { id: 'trex', label: 'T-Rex', emoji: '🦖' },
  { id: 'turtle', label: 'Kura-kura', emoji: '🐢' },
  { id: 'cat', label: 'Kucing', emoji: '🐱' },
];

// Tinggi name tag di atas tiap hewan
export const TAG_HEIGHT = {
  rabbit: 1.2, panda: 1.1, giraffe: 1.5, trex: 1.1, turtle: 0.8, cat: 1.1,
};

// ---------- helper bentuk ----------
const S = ({ p = [0, 0, 0], r = [1, 1, 1], c, rot = [0, 0, 0] }) => (
  <mesh position={p} scale={r} rotation={rot} castShadow>
    <sphereGeometry args={[1, 20, 20]} />
    <meshStandardMaterial color={c} roughness={0.55} />
  </mesh>
);
const Cyl = ({ p, r = [0.04, 0.04], h = 0.3, c, rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot} castShadow>
    <cylinderGeometry args={[r[0], r[1], h, 12]} />
    <meshStandardMaterial color={c} roughness={0.55} />
  </mesh>
);
const Cone = ({ p, r = 0.06, h = 0.15, c, rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot} castShadow>
    <coneGeometry args={[r, h, 12]} />
    <meshStandardMaterial color={c} roughness={0.55} />
  </mesh>
);
const Eyes = ({ y, z, x = 0.07, s = 0.028, c = '#111' }) => (
  <>
    {[-1, 1].map((k) => (
      <S key={k} p={[k * x, y, z]} r={[s, s, s]} c={c} />
    ))}
  </>
);

// ---------- hewan (menghadap +z) ----------
function Rabbit() {
  return (
    <group>
      <S p={[0, 0.25, 0]} r={[0.2, 0.22, 0.2]} c="#ffffff" />
      <S p={[0, 0.58, 0.03]} r={[0.16, 0.15, 0.15]} c="#ffffff" />
      {[-1, 1].map((k) => (
        <group key={k}>
          <S p={[k * 0.07, 0.86, 0]} r={[0.045, 0.18, 0.035]} c="#ffffff" rot={[0, 0, -k * 0.12]} />
          <S p={[k * 0.07, 0.86, 0.02]} r={[0.025, 0.13, 0.015]} c="#fda4af" rot={[0, 0, -k * 0.12]} />
        </group>
      ))}
      <Eyes y={0.62} z={0.16} />
      <S p={[0, 0.55, 0.18]} r={[0.03, 0.025, 0.025]} c="#fb7185" />
      <S p={[0, 0.22, -0.2]} r={[0.07, 0.07, 0.07]} c="#ffffff" />
      {[-1, 1].map((k) => (
        <S key={k} p={[k * 0.09, 0.04, 0.1]} r={[0.07, 0.05, 0.1]} c="#f3f4f6" />
      ))}
    </group>
  );
}

function Panda() {
  return (
    <group>
      <S p={[0, 0.27, 0]} r={[0.24, 0.25, 0.2]} c="#ffffff" />
      <S p={[0, 0.65, 0.03]} r={[0.2, 0.18, 0.18]} c="#ffffff" />
      {[-1, 1].map((k) => (
        <group key={k}>
          <S p={[k * 0.15, 0.82, 0]} r={[0.07, 0.07, 0.05]} c="#111111" />
          <S p={[k * 0.08, 0.67, 0.16]} r={[0.045, 0.06, 0.025]} c="#111111" rot={[0, 0, k * 0.4]} />
          <S p={[k * 0.08, 0.675, 0.185]} r={[0.015, 0.015, 0.01]} c="#ffffff" />
          <S p={[k * 0.26, 0.3, 0.04]} r={[0.07, 0.14, 0.07]} c="#111111" />
          <S p={[k * 0.12, 0.05, 0.08]} r={[0.08, 0.07, 0.1]} c="#111111" />
        </group>
      ))}
      <S p={[0, 0.6, 0.2]} r={[0.04, 0.03, 0.03]} c="#111111" />
    </group>
  );
}

function Giraffe() {
  const body = '#f6c244';
  const spot = '#b45309';
  return (
    <group>
      <S p={[0, 0.34, 0]} r={[0.2, 0.2, 0.3]} c={body} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <Cyl key={i} p={[x * 0.1, 0.1, z * 0.17]} h={0.22} r={[0.035, 0.03]} c={body} />
      ))}
      <Cyl p={[0, 0.78, 0.18]} h={0.8} r={[0.06, 0.09]} c={body} rot={[0.26, 0, 0]} />
      <S p={[0, 1.2, 0.3]} r={[0.1, 0.09, 0.15]} c={body} />
      <S p={[0, 1.17, 0.4]} r={[0.07, 0.05, 0.06]} c="#fde68a" />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Cyl p={[k * 0.05, 1.32, 0.26]} h={0.1} r={[0.015, 0.015]} c={body} />
          <S p={[k * 0.05, 1.38, 0.26]} r={[0.025, 0.025, 0.025]} c={spot} />
          <S p={[k * 0.11, 1.24, 0.24]} r={[0.05, 0.03, 0.02]} c={body} />
        </group>
      ))}
      <Eyes y={1.24} z={0.4} x={0.07} s={0.022} />
      <S p={[0.19, 0.4, 0.08]} r={[0.02, 0.06, 0.06]} c={spot} />
      <S p={[-0.19, 0.3, -0.08]} r={[0.02, 0.06, 0.06]} c={spot} />
      <S p={[0.1, 0.5, -0.1]} r={[0.07, 0.03, 0.06]} c={spot} />
      <S p={[-0.1, 0.52, 0.12]} r={[0.06, 0.03, 0.05]} c={spot} />
      <S p={[0.04, 0.9, 0.2]} r={[0.05, 0.05, 0.03]} c={spot} />
    </group>
  );
}

function TRex() {
  const g = '#4ade80';
  const dark = '#16a34a';
  return (
    <group>
      <S p={[0, 0.38, 0]} r={[0.19, 0.24, 0.27]} c={g} rot={[0.35, 0, 0]} />
      <S p={[0, 0.34, 0.1]} r={[0.13, 0.19, 0.17]} c="#bbf7d0" rot={[0.35, 0, 0]} />
      <S p={[0, 0.72, 0.2]} r={[0.14, 0.12, 0.2]} c={g} />
      <S p={[0, 0.63, 0.26]} r={[0.1, 0.04, 0.15]} c="#86efac" />
      <Eyes y={0.8} z={0.22} x={0.1} s={0.03} />
      <Cone p={[0, 0.3, -0.4]} r={0.13} h={0.6} c={g} rot={[-Math.PI / 2 - 0.15, 0, 0]} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <S p={[k * 0.15, 0.52, 0.2]} r={[0.035, 0.035, 0.07]} c={g} />
          <S p={[k * 0.11, 0.1, 0.02]} r={[0.075, 0.12, 0.11]} c={dark} />
          <Cone p={[k * 0.04, 0.9, 0.0]} r={0.035} h={0.09} c={dark} rot={[0, 0, 0]} />
        </group>
      ))}
      {[0.55, 0.45, 0.35].map((y, i) => (
        <Cone key={i} p={[0, y + 0.1, -0.16 - i * 0.06]} r={0.035} h={0.1} c={dark} rot={[-0.4, 0, 0]} />
      ))}
    </group>
  );
}

function Turtle() {
  return (
    <group scale={1.3}>
      <S p={[0, 0.1, 0]} r={[0.3, 0.07, 0.33]} c="#a3e635" />
      <mesh position={[0, 0.12, 0]} scale={[0.3, 0.22, 0.33]} castShadow>
        <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#65a30d" roughness={0.5} />
      </mesh>
      <S p={[0, 0.34, 0]} r={[0.1, 0.03, 0.1]} c="#3f6212" />
      <S p={[0.16, 0.26, 0.05]} r={[0.07, 0.03, 0.07]} c="#3f6212" rot={[0, 0, -0.5]} />
      <S p={[-0.16, 0.26, 0.05]} r={[0.07, 0.03, 0.07]} c="#3f6212" rot={[0, 0, 0.5]} />
      <S p={[0, 0.25, -0.18]} r={[0.07, 0.03, 0.07]} c="#3f6212" rot={[-0.5, 0, 0]} />
      <S p={[0, 0.2, 0.36]} r={[0.09, 0.08, 0.1]} c="#bef264" />
      <Eyes y={0.24} z={0.43} x={0.05} s={0.02} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <S key={i} p={[x * 0.24, 0.05, z * 0.2]} r={[0.07, 0.05, 0.08]} c="#bef264" />
      ))}
      <Cone p={[0, 0.1, -0.36]} r={0.04} h={0.12} c="#a3e635" rot={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

function Cat() {
  const o = '#fb923c';
  return (
    <group>
      <S p={[0, 0.27, 0]} r={[0.18, 0.22, 0.2]} c={o} />
      <S p={[0, 0.62, 0.03]} r={[0.17, 0.15, 0.15]} c={o} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Cone p={[k * 0.1, 0.8, 0]} r={0.06} h={0.15} c={o} rot={[0, 0, -k * 0.2]} />
          <Cone p={[k * 0.1, 0.79, 0.015]} r={0.03} h={0.1} c="#fda4af" rot={[0, 0, -k * 0.2]} />
          <S p={[k * 0.07, 0.65, 0.16]} r={[0.035, 0.04, 0.02]} c="#16a34a" />
          <S p={[k * 0.07, 0.65, 0.18]} r={[0.012, 0.03, 0.01]} c="#111111" />
          <S p={[k * 0.09, 0.04, 0.1]} r={[0.07, 0.05, 0.09]} c="#ffffff" />
          {[-1, 0, 1].map((i) => (
            <mesh key={i} position={[k * 0.2, 0.56 + i * 0.025, 0.15]} rotation={[0, 0, k * i * 0.2]}>
              <boxGeometry args={[0.14, 0.006, 0.006]} />
              <meshStandardMaterial color="#fafafa" />
            </mesh>
          ))}
        </group>
      ))}
      <S p={[0, 0.57, 0.14]} r={[0.07, 0.05, 0.05]} c="#ffffff" />
      <S p={[0, 0.6, 0.18]} r={[0.02, 0.015, 0.015]} c="#fb7185" />
      <S p={[0, 0.7, 0.14]} r={[0.025, 0.05, 0.02]} c="#c2410c" />
      <Cyl p={[0, 0.45, -0.24]} h={0.5} r={[0.035, 0.05]} c={o} rot={[-0.55, 0, 0]} />
      <S p={[0, 0.2, 0.17]} r={[0.1, 0.14, 0.04]} c="#ffedd5" />
    </group>
  );
}

const MODELS = { rabbit: Rabbit, panda: Panda, giraffe: Giraffe, trex: TRex, turtle: Turtle, cat: Cat };

export function AnimalModel({ type = 'cat' }) {
  const Model = MODELS[type] || Cat;
  return <Model />;
}