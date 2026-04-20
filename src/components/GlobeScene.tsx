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
  { id: "tokyo", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { id: "paris", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "lagos", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { id: "nyc", city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { id: "london", city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: "dubai", city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { id: "la", city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { id: "miami", city: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { id: "seoul", city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { id: "shanghai", city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { id: "mumbai", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { id: "sydney", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { id: "berlin", city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { id: "cairo", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { id: "moscow", city: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { id: "rio", city: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { id: "mexico", city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { id: "istanbul", city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
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
/*  Latitude/Longitude Grid                                            */
/* ------------------------------------------------------------------ */

function LatLongGrid() {
  const lines = useMemo(() => {
    const r = GLOBE_RADIUS + 0.005;
    const result: THREE.Vector3[][] = [];

    // Latitude circles (horizontal)
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let lng = 0; lng <= 360; lng += 4) {
        const theta = (lng * Math.PI) / 180;
        points.push(new THREE.Vector3(
          -(r * Math.sin(phi) * Math.cos(theta)),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ));
      }
      result.push(points);
    }

    // Longitude lines (vertical meridians)
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      const theta = (lng * Math.PI) / 180;
      for (let lat = -90; lat <= 90; lat += 4) {
        const phi = (90 - lat) * (Math.PI / 180);
        points.push(new THREE.Vector3(
          -(r * Math.sin(phi) * Math.cos(theta)),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ));
      }
      result.push(points);
    }

    return result;
  }, []);

  return (
    <>
      {lines.map((points, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: "#6a92b0", transparent: true, opacity: 0.2 })
          )} />
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Glowing Arcs between tour stops                                    */
/* ------------------------------------------------------------------ */

function TourArcs() {
  const arcs = useMemo(() => {
    const result: { points: THREE.Vector3[]; key: string }[] = [];
    const r = GLOBE_RADIUS;

    // Connect each tour stop to the next in sequence (forming a tour path)
    for (let i = 0; i < TOUR_STOPS.length - 1; i++) {
      const from = latLngToVec3(TOUR_STOPS[i].lat, TOUR_STOPS[i].lng, r);
      const to = latLngToVec3(TOUR_STOPS[i + 1].lat, TOUR_STOPS[i + 1].lng, r);

      // Midpoint arched above the surface
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const distance = from.distanceTo(to);
      const arcHeight = r + distance * 0.35;
      mid.normalize().multiplyScalar(arcHeight);

      // Quadratic bezier curve
      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const points = curve.getPoints(50);
      result.push({ points, key: `${TOUR_STOPS[i].id}-${TOUR_STOPS[i+1].id}` });
    }

    return result;
  }, []);

  return (
    <>
      {arcs.map(({ points, key }) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={key} object={new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: "#4a7abc",
              transparent: true,
              opacity: 0.75,
              linewidth: 2,
            })
          )} />
        );
      })}
    </>
  );
}

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
      {/* Blue country outlines */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.002, 128, 64]} />
        <meshBasicMaterial map={topoMap} color="#2255aa" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Latitude/longitude grid lines */}
      <LatLongGrid />

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

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useMemo(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const aspect = size.width / size.height;
    // Globe diameter = 2.8 (radius 1.4). Target the globe to occupy ~55% of horizontal view.
    // For perspective camera: visible horizontal width = 2 * distance * tan(vFOV/2) * aspect
    // So: distance = globeDiameter / (0.55 * 2 * tan(vFOV/2) * aspect)
    const vFOV = size.width < 640 ? 45 : 30;
    const fovRad = (vFOV * Math.PI) / 180;
    const globeDiameter = 2.8;
    const occupancy = 0.55;
    const distance = globeDiameter / (occupancy * 2 * Math.tan(fovRad / 2) * aspect);

    camera.position.z = distance;
    camera.position.y = size.width < 640 ? 0.2 : 0.5;
    camera.fov = vFOV;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function GlobeInner({ selectedId, onMarkerClick }: { selectedId: string | null; onMarkerClick: (stop: TourStop) => void }) {
  return (
    <>
      <ResponsiveCamera />
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
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 80 || info.velocity.y > 500) onClose();
          }}
          className="absolute bottom-0 left-0 right-0 z-40"
          style={{ minHeight: "160px", touchAction: "none" }}
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
            </div>

            <div style={{ height: "1px", background: "#c8c8c8", marginBottom: "12px" }} />

            <div>
              <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Coordinates</div>
              <div style={{ fontSize: "12px", color: "#555", fontFamily: "var(--font-mono)" }}>{stop.lat.toFixed(4)}°, {stop.lng.toFixed(4)}°</div>
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
  const [spinTarget, setSpinTarget] = useState<TourStop | null>(null);
  const [sheetStop, setSheetStop] = useState<TourStop | null>(null);

  const selectStop = useCallback((stop: TourStop) => {
    setSpinTarget(stop);
    // Delay bottom sheet so user sees the globe spin first
    setTimeout(() => setSheetStop(stop), 800);
  }, []);

  const clearSelection = useCallback(() => {
    setSpinTarget(null);
    setSheetStop(null);
  }, []);

  const handleMarkerClick = useCallback((stop: TourStop) => {
    selectStop(stop);
  }, [selectStop]);

  return (
    <div className="absolute inset-0" style={{ background: "#c8c8c8" }}>
      <Canvas
        camera={{ position: [0, 0.5, 8], fov: 30, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <GlobeInner selectedId={spinTarget?.id ?? null} onMarkerClick={handleMarkerClick} />
      </Canvas>

      {/* Desktop: sidebar list */}
      <div className="absolute top-3 left-3 hidden sm:block" style={{
        maxWidth: "220px",
        maxHeight: "calc(100% - 24px)",
        overflowY: "auto",
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #b8b8b8",
        borderRadius: "6px",
        padding: "10px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#888", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}>
          Destinations
        </p>
        <div className="flex flex-col gap-1">
          {TOUR_STOPS.map((stop) => (
            <button
              key={stop.id}
              onClick={() => selectStop(stop)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                fontSize: "12px",
                color: spinTarget?.id === stop.id ? "#fff" : "#333",
                fontWeight: spinTarget?.id === stop.id ? "bold" : 500,
                padding: "6px 8px",
                background: spinTarget?.id === stop.id ? "#4a7abc" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span>{stop.city}</span>
              <span style={{ color: spinTarget?.id === stop.id ? "rgba(255,255,255,0.6)" : "#aaa", fontSize: "9px" }}>{stop.country.slice(0, 3).toUpperCase()}</span>
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
              onClick={() => selectStop(stop)}
              style={{
                flexShrink: 0,
                fontSize: "11px",
                color: spinTarget?.id === stop.id ? "#fff" : "#555",
                fontWeight: spinTarget?.id === stop.id ? "bold" : 500,
                padding: "6px 12px",
                background: spinTarget?.id === stop.id ? "#4a7abc" : "#e8e8e8",
                border: "1px solid " + (spinTarget?.id === stop.id ? "#3a6a9a" : "#c0c0c0"),
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

      <BottomSheet stop={sheetStop} onClose={clearSelection} />
    </div>
  );
}
