"use client";

import { useRef, useMemo, useCallback, Suspense, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Tour Stop Data                                                     */
/* ------------------------------------------------------------------ */

export const TOUR_STOPS = [
  { id: "tokyo", city: "Tokyo", country: "Japan", date: "MAR 15", lat: 35.6762, lng: 139.6503, venue: "Shibuya 109" },
  { id: "paris", city: "Paris", country: "France", date: "APR 02", lat: 48.8566, lng: 2.3522, venue: "Palais de Tokyo" },
  { id: "lagos", city: "Lagos", country: "Nigeria", date: "APR 20", lat: 6.5244, lng: 3.3792, venue: "Eko Atlantic" },
  { id: "nyc", city: "New York", country: "USA", date: "MAY 05", lat: 40.7128, lng: -74.006, venue: "Webster Hall" },
  { id: "london", city: "London", country: "UK", date: "MAY 18", lat: 51.5074, lng: -0.1278, venue: "Fabric" },
  { id: "dubai", city: "Dubai", country: "UAE", date: "JUN 01", lat: 25.2048, lng: 55.2708, venue: "D3 District" },
  { id: "la", city: "Los Angeles", country: "USA", date: "JUN 15", lat: 34.0522, lng: -118.2437, venue: "The Row DTLA" },
  { id: "miami", city: "Miami", country: "USA", date: "JUN 28", lat: 25.7617, lng: -80.1918, venue: "Art Basel Stage" },
];

export type TourStop = (typeof TOUR_STOPS)[number];

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const GLOBE_RADIUS = 1.4;

// Pre-compute transforms AND the Y-rotation that faces each stop toward camera (+Z)
// Math: given local position (px, py, pz), rotating by atan2(-px, pz) around Y
// puts the point at x=0, z=+r (directly facing the camera)
const STOP_TRANSFORMS = TOUR_STOPS.map((stop) => {
  const pos = latLngToVec3(stop.lat, stop.lng, GLOBE_RADIUS);
  const dir = pos.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const facingY = Math.atan2(-pos.x, pos.z);
  return {
    stop,
    pos: pos.toArray() as [number, number, number],
    quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
    facingY,
  };
});

/* ------------------------------------------------------------------ */
/*  Earth Globe — accepts selectedId to control rotation               */
/* ------------------------------------------------------------------ */

function EarthGlobe({ selectedId, onMarkerClick }: { selectedId: string | null; onMarkerClick: (stop: TourStop) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotationY = useRef<number | null>(null);
  const lastSelectedId = useRef<string | null>(null);

  const [waterMask, topoMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth-spec.jpg",
    "/textures/earth-topo.jpg",
  ]);

  useMemo(() => {
    [waterMask, topoMap].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipMapLinearFilter;
      t.anisotropy = 4;
    });
  }, [waterMask, topoMap]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const TWO_PI = Math.PI * 2;

    // Detect selection change
    if (selectedId !== lastSelectedId.current) {
      lastSelectedId.current = selectedId;

      if (selectedId) {
        const data = STOP_TRANSFORMS.find(s => s.stop.id === selectedId);
        if (data) {
          const current = groupRef.current.rotation.y;
          const target = data.facingY;

          // Normalize current to 0..2π
          const curNorm = ((current % TWO_PI) + TWO_PI) % TWO_PI;
          // Normalize target to 0..2π
          const tarNorm = ((target % TWO_PI) + TWO_PI) % TWO_PI;

          // Shortest angular distance
          let diff = tarNorm - curNorm;
          if (diff > Math.PI) diff -= TWO_PI;
          if (diff < -Math.PI) diff += TWO_PI;

          // Set absolute target from current accumulated rotation
          targetRotationY.current = current + diff;
        }
      } else {
        targetRotationY.current = null;
      }
    }

    // Animate
    if (targetRotationY.current !== null) {
      const diff = targetRotationY.current - groupRef.current.rotation.y;
      if (Math.abs(diff) < 0.002) {
        groupRef.current.rotation.y = targetRotationY.current;
      } else {
        groupRef.current.rotation.y += diff * 0.06;
      }
    } else {
      // Auto-rotate
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Light grey base */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 64]} />
        <meshBasicMaterial color="#dcdcdc" />
      </mesh>
      {/* Oceans — slight blue tint */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.001, 128, 64]} />
        <meshBasicMaterial map={waterMask} color="#90a8c0" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* Blue country outlines — additive so only bright border lines show */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.002, 128, 64]} />
        <meshBasicMaterial map={topoMap} color="#2255aa" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Tour markers */}
      {STOP_TRANSFORMS.map(({ stop, pos, quat }) => (
        <TourMarker key={stop.id} pos={pos} quat={quat} stop={stop} isSelected={selectedId === stop.id} onClick={onMarkerClick} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Tour Marker                                                        */
/* ------------------------------------------------------------------ */

function TourMarker({ pos, quat, stop, isSelected, onClick }: {
  pos: [number, number, number];
  quat: [number, number, number, number];
  stop: TourStop;
  isSelected: boolean;
  onClick: (stop: TourStop) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 3 + pos[0] * 2) * 0.4;
      ringRef.current.scale.set(s, s, s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 3 + pos[0] * 2) * 0.15;
    }
  });

  const active = hovered || isSelected;

  return (
    <group position={pos} quaternion={quat}>
      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.04, 0.08, 24]} />
        <meshBasicMaterial color={isSelected ? "#2255aa" : "#4a7abc"} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Clickable dot */}
      <mesh
        position={[0, 0.02, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(stop); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={active ? "#2255aa" : "#4a7abc"} />
      </mesh>

      {/* Pin line */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
        <meshBasicMaterial color="#4a7abc" />
      </mesh>

      {/* Label — clickable even when behind the globe */}
      <Html position={[0, 0.14, 0]} center style={{ whiteSpace: "nowrap", userSelect: "none" }}>
        <div
          onClick={() => onClick(stop)}
          style={{
          cursor: "pointer",
          background: active ? "#4a7abc" : "rgba(255,255,255,0.9)",
          color: active ? "#fff" : "#333",
          fontSize: "9px",
          fontWeight: "bold",
          padding: "2px 6px",
          borderRadius: "3px",
          border: `1px solid ${active ? "#2255aa" : "#b8b8b8"}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}>
          {stop.city.toUpperCase()}
        </div>
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner 3D Scene                                                     */
/* ------------------------------------------------------------------ */

function GlobeInner({ selectedId, onMarkerClick }: { selectedId: string | null; onMarkerClick: (stop: TourStop) => void }) {
  return (
    <>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} dampingFactor={0.1} enableDamping />
      <color attach="background" args={["#c8c8c8"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#b0b8c0" />
      <Suspense fallback={null}>
        <EarthGlobe selectedId={selectedId} onMarkerClick={onMarkerClick} />
      </Suspense>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom Sheet                                                       */
/* ------------------------------------------------------------------ */

function BottomSheet({ stop, onClose }: { stop: TourStop | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {stop && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 350, mass: 0.8 }}
          className="absolute bottom-0 left-0 right-0 z-40"
          style={{ minHeight: "160px" }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, #f4f4f4 0%, #e4e4e4 100%)",
            borderTop: "1px solid #b8b8b8",
            borderRadius: "12px 12px 0 0",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.1)",
          }} />

          <div style={{ position: "relative", zIndex: 10, padding: "14px 16px" }}>
            <div style={{ width: "36px", height: "4px", background: "#ccc", borderRadius: "2px", margin: "0 auto 12px" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <h2 className="text-[16px] sm:text-[18px]" style={{ fontWeight: "bold", color: "#222" }}>{stop.city}</h2>
                <p className="text-[11px] sm:text-[12px]" style={{ color: "#888", marginTop: "2px" }}>{stop.country}</p>
              </div>
              <div style={{
                padding: "4px 12px",
                background: "linear-gradient(180deg, #8eadc4 0%, #4d7a9a 100%)",
                borderRadius: "4px",
                border: "1px solid #3d6580",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
              }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", textShadow: "0 -1px 0 rgba(0,0,0,0.2)" }}>{stop.date}</span>
              </div>
            </div>

            <div style={{ height: "1px", background: "#c8c8c8", marginBottom: "12px" }} />

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Venue</div>
                <div style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}>{stop.venue}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Coordinates</div>
                <div style={{ fontSize: "11px", color: "#555", fontFamily: "var(--font-mono)" }}>{stop.lat.toFixed(4)}°, {stop.lng.toFixed(4)}°</div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginTop: "16px", width: "100%", padding: "10px", textAlign: "center",
                fontSize: "14px", fontWeight: "bold", color: "#4a7abc",
                background: "linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%)",
                border: "1px solid #b8b8b8", borderRadius: "6px", cursor: "pointer",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported GlobeScene                                                */
/* ------------------------------------------------------------------ */

export default function GlobeScene({
  onLockedTerritory,
}: {
  onLockedTerritory: () => void;
}) {
  const [selected, setSelected] = useState<TourStop | null>(null);

  const handleMarkerClick = useCallback((stop: TourStop) => {
    setSelected(stop);
  }, []);

  return (
    <div className="absolute inset-0" style={{ background: "#c8c8c8" }}>
      <Canvas
        camera={{ position: [0, 0.4, 3.8], fov: 48, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <GlobeInner selectedId={selected?.id ?? null} onMarkerClick={handleMarkerClick} />
      </Canvas>

      {/* Desktop: sidebar list */}
      <div className="absolute top-3 left-3 hidden sm:block" style={{
        maxWidth: "220px",
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #b8b8b8",
        borderRadius: "6px",
        padding: "10px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#888", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}>
          World Tour
        </p>
        <div className="flex flex-col gap-1">
          {TOUR_STOPS.map((stop) => (
            <button
              key={stop.id}
              onClick={() => setSelected(stop)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                fontSize: "12px",
                color: selected?.id === stop.id ? "#fff" : "#333",
                fontWeight: selected?.id === stop.id ? "bold" : 500,
                padding: "6px 8px",
                background: selected?.id === stop.id ? "#4a7abc" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span>{stop.city}</span>
              <span style={{ color: selected?.id === stop.id ? "rgba(255,255,255,0.7)" : "#999", fontSize: "10px" }}>{stop.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: compact bottom bar with horizontal scroll */}
      <div className="absolute bottom-0 left-0 right-0 sm:hidden" style={{
        background: "rgba(255,255,255,0.95)",
        borderTop: "1px solid #b8b8b8",
        padding: "6px 4px",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", gap: "4px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TOUR_STOPS.map((stop) => (
            <button
              key={stop.id}
              onClick={() => setSelected(stop)}
              style={{
                flexShrink: 0,
                fontSize: "11px",
                color: selected?.id === stop.id ? "#fff" : "#555",
                fontWeight: selected?.id === stop.id ? "bold" : 500,
                padding: "6px 12px",
                background: selected?.id === stop.id ? "#4a7abc" : "#e8e8e8",
                border: "1px solid " + (selected?.id === stop.id ? "#3a6a9a" : "#c0c0c0"),
                borderRadius: "16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {stop.city}
            </button>
          ))}
        </div>
      </div>

      <BottomSheet stop={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
