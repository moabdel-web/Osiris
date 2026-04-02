"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Feed images                                                        */
/* ------------------------------------------------------------------ */

const TOTAL_IMAGES = 51;
const REAL_IMAGE_COUNT = 7;

function getImagePath(index: number): string {
  const realIndex = (index % REAL_IMAGE_COUNT) + 1;
  return `/feed/${String(realIndex).padStart(3, "0")}.jpg`;
}

/* ------------------------------------------------------------------ */
/*  Grid Cell — uses plain <img> to avoid Next.js optimization issues  */
/* ------------------------------------------------------------------ */

function GridCell({ index, onClick }: { index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="aspect-square focus:outline-none"
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

/* ------------------------------------------------------------------ */
/*  Lightbox                                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Feed Grid                                                          */
/* ------------------------------------------------------------------ */

export default function FeedGrid({ layout = "grid" }: { layout?: "grid" | "list" }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      {layout === "grid" ? (
        <div className="grid grid-cols-6 gap-[3px] bg-[#c8c8c8]" style={{ margin: "0 10px" }}>
          {Array.from({ length: TOTAL_IMAGES }, (_, i) => (
            <GridCell key={i} index={i} onClick={() => setLightboxIndex(i)} />
          ))}
        </div>
      ) : (
        <div style={{ margin: "0 10px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array.from({ length: TOTAL_IMAGES }, (_, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              style={{
                width: "100%",
                height: "1500px",
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
