"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Environment, Float, Grid, Lightformer, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
 * VYRA — Hero 3D scene
 * A floating auction podium with a rotating chronograph,
 * data rings, orbiting bidder nodes and rising bid particles.
 * Mouse parallax on the camera. Fully procedural — no assets.
 * ============================================================ */

type Group = ThreeElements["group"];

/* ---------------- chronograph watch ---------------- */

function WatchModel({ fast = false }: { fast?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const secondHand = useRef<THREE.Mesh>(null);
  const minuteHand = useRef<THREE.Group>(null);
  const hourHand = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.28;
    if (secondHand.current)
      secondHand.current.rotation.z = -state.clock.elapsedTime * (fast ? 1.1 : 0.8);
    if (minuteHand.current) minuteHand.current.rotation.z = -state.clock.elapsedTime * 0.09;
    if (hourHand.current) hourHand.current.rotation.z = -state.clock.elapsedTime * 0.012;
  });

  const steel = { metalness: 0.92, roughness: 0.24, color: "#c8ccd4" } as const;
  const dark = { metalness: 0.6, roughness: 0.4, color: "#0b0b14" } as const;

  return (
    <group ref={group} scale={0.92}>
      {/* case */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.26, 64]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* bezel */}
      <mesh position={[0, 0, 0.1]}>
        <torusGeometry args={[0.93, 0.1, 24, 72]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* dial */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.115]}>
        <cylinderGeometry args={[0.84, 0.84, 0.03, 64]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* subdials */}
      {[
        [0, 0.36],
        [-0.34, -0.14],
        [0.34, -0.14],
      ].map(([x, y], i) => (
        <group key={i} position={[x, y, 0.14]}>
          <mesh>
            <cylinderGeometry args={[0.17, 0.17, 0.02, 32]} />
            <meshStandardMaterial color="#101020" metalness={0.5} roughness={0.35} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <torusGeometry args={[0.17, 0.012, 12, 32]} />
            <meshStandardMaterial
              color={i === 1 ? "#67e8f9" : "#8b9bb0"}
              emissive={i === 1 ? "#22d3ee" : "#000000"}
              emissiveIntensity={i === 1 ? 1.4 : 0}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
      {/* hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 0.68;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * r, Math.cos(a) * r, 0.14]}
            rotation={[0, 0, -a]}
          >
            <boxGeometry args={[0.028, i % 3 === 0 ? 0.11 : 0.06, 0.015]} />
            <meshStandardMaterial
              color="#d7dce6"
              emissive="#9be7f5"
              emissiveIntensity={i % 3 === 0 ? 0.35 : 0.12}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      {/* hands */}
      <group position={[0, 0, 0.16]}>
        <group ref={hourHand}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.05, 0.34, 0.018]} />
            <meshStandardMaterial color="#e8ecf2" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
        <group ref={minuteHand}>
          <mesh position={[0, 0.24, 0.012]}>
            <boxGeometry args={[0.036, 0.5, 0.014]} />
            <meshStandardMaterial color="#e8ecf2" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
        <mesh ref={secondHand} position={[0, 0, 0.03]}>
          <boxGeometry args={[0.014, 0.62, 0.01]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.2} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
          <meshStandardMaterial color="#d7dce6" metalness={0.85} roughness={0.25} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
      </group>
      {/* crown + pushers */}
      <mesh position={[1.06, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {[0.42, -0.34].map((y, i) => (
        <mesh key={i} position={[1.02, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 20]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
      {/* crystal */}
      <mesh position={[0, 0, 0.2]}>
        <circleGeometry args={[0.86, 64]} />
        <meshPhysicalMaterial
          color="#bfe9f5"
          transparent
          opacity={0.14}
          roughness={0.04}
          metalness={0}
          clearcoat={1}
        />
      </mesh>
      {/* caseback glint ring */}
      <mesh position={[0, 0, -0.14]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.99, 0.02, 12, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------------- podium ---------------- */

function Podium() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.5;
  });
  return (
    <group position={[0, 0, 0]}>
      {/* base discs */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[2.1, 2.3, 0.14, 72]} />
        <meshStandardMaterial color="#0d0d17" metalness={0.75} roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[1.85, 2.05, 0.16, 72]} />
        <meshStandardMaterial color="#12121e" metalness={0.8} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.55, 1.8, 0.18, 72]} />
        <meshStandardMaterial color="#151523" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* top surface */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.5, 1.58, 0.05, 72]} />
        <meshStandardMaterial color="#171728" metalness={0.9} roughness={0.22} />
      </mesh>
      {/* glowing rim */}
      <mesh ref={ring} position={[0, 0.235, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.48, 0.014, 12, 96]} />
        <meshBasicMaterial color="#34e4f7" />
      </mesh>
      {/* under-glow */}
      <pointLight position={[0, 0.5, 0]} color="#22d3ee" intensity={5} distance={5.5} decay={2} />
    </group>
  );
}

/* ---------------- data rings ---------------- */

function DataRings({ detail = true }: { detail?: boolean }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);
  const ticks = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.16;
    if (b.current) b.current.rotation.z -= delta * 0.11;
    if (c.current) c.current.rotation.z += delta * 0.07;
    if (ticks.current) ticks.current.rotation.y += delta * 0.1;
  });

  const tickData = useMemo(
    () =>
      Array.from({ length: 72 }).map((_, i) => {
        const angle = (i / 72) * Math.PI * 2;
        const major = i % 6 === 0;
        return { angle, major, x: Math.sin(angle) * 3.55, z: Math.cos(angle) * 3.55 };
      }),
    []
  );

  return (
    <group position={[0, 1.35, 0]}>
      <mesh ref={a} rotation={[Math.PI / 2 + 0.1, 0.12, 0]}>
        <torusGeometry args={[2.5, 0.008, 8, 128]} />
        <meshBasicMaterial color="#39dff0" transparent opacity={0.5} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 2 - 0.22, -0.28, 0.3]}>
        <torusGeometry args={[3.1, 0.006, 8, 128]} />
        <meshBasicMaterial color="#8f7bff" transparent opacity={0.34} />
      </mesh>
      <mesh ref={c} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.7, 0.01, 8, 128, Math.PI * 1.25]} />
        <meshBasicMaterial color="#9be7f5" transparent opacity={0.22} />
      </mesh>
      {detail && (
        <group ref={ticks}>
          {tickData.map(({ angle, major, x, z }, i) => (
            <mesh key={i} position={[x, Math.sin(angle * 2) * 0.05, z]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.012, major ? 0.16 : 0.07, 0.012]} />
              <meshBasicMaterial color={major ? "#59e6f5" : "#2b3350"} transparent opacity={major ? 0.75 : 0.5} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/* ---------------- rising bid particles ---------------- */

function BidParticles({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const attr = useRef<THREE.BufferAttribute>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * 3.4;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.sin(a) * r;
      arr[i * 3 + 1] = Math.random() * 5.2;
      arr[i * 3 + 2] = Math.cos(a) * r;
    }
    return arr;
  }, [count]);

  const speeds = useMemo(() => Array.from({ length: count }, () => 0.24 + Math.random() * 0.6), [count]);

  useFrame((_, delta) => {
    const a = attr.current;
    if (!a) return;
    const arr = a.array as Float32Array;
    const d = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * d;
      arr[i * 3] += Math.sin((arr[i * 3 + 1] + i) * 0.7) * d * 0.12;
      if (arr[i * 3 + 1] > 5.4) arr[i * 3 + 1] = -0.1;
    }
    a.needsUpdate = true;
    if (ref.current) ref.current.rotation.y += d * 0.03;
  });

  return (
    <points ref={ref} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute ref={attr} args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#59e6f5"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------- orbiting bidder nodes ---------------- */

function BidderNodes({ count = 7 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        radius: 2.4 + (i % 3) * 0.7,
        speed: 0.14 + (i % 4) * 0.06,
        phase: (i / count) * Math.PI * 2,
        y: 0.55 + (i % 3) * 0.55,
        color: i % 3 === 0 ? "#67e8f9" : i % 3 === 1 ? "#9d8bff" : "#e8ecf2",
        size: 0.05 + (i % 2) * 0.025,
      })),
    [count]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const n = nodes[i];
      if (!n) return;
      const a = n.phase + t * n.speed;
      child.position.set(Math.sin(a) * n.radius, n.y + Math.sin(t * 0.8 + n.phase) * 0.12, Math.cos(a) * n.radius);
      const pulse = 1 + Math.sin(t * 2.4 + n.phase * 3) * 0.35;
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={group}>
      {nodes.map((n, i) => (
        <mesh key={i}>
          <sphereGeometry args={[n.size, 16, 16]} />
          <meshBasicMaterial color={n.color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- light beam hologram ---------------- */

function LightBeam() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.05 + Math.abs(Math.sin(state.clock.elapsedTime * 0.9)) * 0.05;
  });
  return (
    <mesh ref={mesh} position={[0, 2.6, 0]}>
      <coneGeometry args={[1.5, 3.4, 48, 1, true]} />
      <meshBasicMaterial color="#59e6f5" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ---------------- camera parallax rig ---------------- */

function CameraRig({ enabled = true, mobile = false }: { enabled?: boolean; mobile?: boolean }) {
  const target = useMemo(() => new THREE.Vector3(0, mobile ? 1.5 : 1.25, 0), [mobile]);
  useFrame((state, delta) => {
    if (!enabled) return;
    const { pointer, camera } = state;
    const k = Math.min(1, delta * 2.4);
    const baseZ = mobile ? 10.4 : 7.4;
    const baseY = mobile ? 1.9 : 1.45;
    const swing = mobile ? 0.55 : 1.05;
    camera.position.x += (pointer.x * swing - camera.position.x) * k;
    camera.position.y += (baseY + pointer.y * 0.55 - camera.position.y) * k;
    camera.position.z += (baseZ - camera.position.z) * k;
    camera.lookAt(target);
  });
  return null;
}

/* ---------------- assembled scene ---------------- */

export interface HeroSceneProps {
  quality?: "high" | "low";
  reducedMotion?: boolean;
}

export function HeroScene({ quality = "high", reducedMotion = false }: HeroSceneProps) {
  const high = quality === "high" && !reducedMotion;
  const isMobile = quality === "low";
  return (
    <Canvas
      dpr={high ? [1, 1.75] : [0.8, 1.25]}
      camera={{ position: [0, isMobile ? 1.9 : 1.45, isMobile ? 10.4 : 7.4], fov: isMobile ? 46 : 40 }}
      gl={{ antialias: high, alpha: true, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      className="!absolute !inset-0"
      aria-hidden
    >
      <fog attach="fog" args={["#08080f", 9.5, 22]} />

      <ambientLight intensity={0.35} color="#9fb0c8" />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#e8f4ff" />
      <spotLight position={[-6, 5, 3]} angle={0.5} penumbra={0.9} intensity={26} color="#22d3ee" distance={20} />
      <spotLight position={[6, 4, -2]} angle={0.6} penumbra={1} intensity={20} color="#8b5cf6" distance={20} />
      <pointLight position={[0, 0.6, 2.4]} intensity={2.2} color="#67e8f9" distance={7} />

      <CameraRig enabled={!reducedMotion} mobile={isMobile} />

      <Float speed={1.3} rotationIntensity={reducedMotion ? 0 : 0.12} floatIntensity={reducedMotion ? 0 : 0.55} floatingRange={[-0.06, 0.1]}>
        <group position={[0, 1.45, 0]}>
          <WatchModel fast={false} />
        </group>
      </Float>

      <Podium />
      <DataRings detail={high} />
      <LightBeam />
      <BidderNodes count={high ? 7 : 4} />
      <BidParticles count={high ? 150 : 55} />

      {high && (
        <Grid
          position={[0, -0.24, 0]}
          args={[26, 26]}
          cellSize={0.55}
          cellThickness={0.6}
          cellColor="#1c1c30"
          sectionSize={2.75}
          sectionThickness={1}
          sectionColor="#23425c"
          fadeDistance={19}
          fadeStrength={2.2}
          infiniteGrid
        />
      )}

      <Sparkles count={high ? 90 : 30} scale={[9, 5, 9]} size={2} speed={0.32} color="#9be7f5" opacity={0.45} position={[0, 2.2, 0]} />

      {/* local procedural environment — no network fetch */}
      <Environment resolution={high ? 128 : 64} frames={1}>
        <Lightformer intensity={2.4} color="#bfeffa" position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 1]} />
        <Lightformer intensity={1.6} color="#22d3ee" position={[-5, 1.5, 2]} scale={[4, 2, 1]} />
        <Lightformer intensity={1.3} color="#8b5cf6" position={[5, 1, -1]} scale={[4, 2, 1]} />
        <Lightformer intensity={0.7} color="#ffffff" position={[0, 1, 6]} scale={[6, 1.4, 1]} />
      </Environment>
    </Canvas>
  );
}
