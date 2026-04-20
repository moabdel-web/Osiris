"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_IMAGES = 12; // 2 rows on both: mobile 3 cols × 2 rows shows first 6, desktop 6 cols × 2 rows shows all 12
const REAL_IMAGE_COUNT = 21;

function getImagePath(index: number): string {
  const realIndex = (index % REAL_IMAGE_COUNT) + 1;
  return `/feed/${String(realIndex).padStart(3, "0")}.jpg`;
}

/* Grid Cell */
function GridCell({ index, onClick, hidden }: { index: number; onClick: () => void; hidden?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`focus:outline-none ${hidden ? "hidden sm:block" : ""} aspect-[3/5] sm:aspect-[3/4]`}
      style={{
        border: "2px solid #fff",
        background: "#fff",
        padding: "0",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImagePath(index)}
        alt={`Feed ${index + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        loading={index < 9 ? "eager" : "lazy"}
      />
    </button>
  );
}

/* Lightbox */
function Lightbox({ index, onClose }: { index: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.92 }}
        className="w-[92vw] max-w-lg aspect-square relative"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImagePath(index)}
          alt={`Feed ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <p className="text-[11px] text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
            FILE_{String(index + 1).padStart(3, "0")} // CLASSIFIED
          </p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white text-[13px] rounded-[4px]"
          style={{
            background: "linear-gradient(180deg, #3a3a3e 0%, #1a1a1e 100%)",
            border: "1px solid #444",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
          }}
        >
          X
        </button>
      </motion.div>
    </motion.div>
  );
}

/* Feed Grid — 3 cols on mobile, 6 on desktop */
export default function FeedGrid({ layout = "grid" }: { layout?: "grid" | "list" }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      {layout === "grid" ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-[2px] sm:gap-[3px] bg-[#c8c8c8]" style={{ margin: "0 4px" }}>
          {Array.from({ length: TOTAL_IMAGES }, (_, i) => (
            <GridCell key={i} index={i} onClick={() => setLightboxIndex(i)} hidden={i >= 6} />
          ))}
        </div>
      ) : (
        <div style={{ margin: "0 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: TOTAL_IMAGES }, (_, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="h-[60vh] sm:h-[1500px]"
              style={{
                width: "100%",
                border: "2px solid #fff",
                background: "#fff",
                overflow: "hidden",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImagePath(i)}
                alt={`Feed ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading={i < 3 ? "eager" : "lazy"}
              />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
