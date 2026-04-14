"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemModal({ isOpen, onClose }: SystemModalProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setTimeout(() => {
      setState("sent");
      setEmail("");
      setTimeout(() => {
        setState("idle");
        onClose();
      }, 2000);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          {/* iOS 6 light system alert */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            style={{
              width: "min(300px, 90vw)",
              borderRadius: "12px",
              overflow: "hidden",
              background: "linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 20px 12px", textAlign: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#222", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
                SECURITY_OVERRIDE_REQUIRED
              </h3>
              <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                Enter credentials to unlock global itinerary.
              </p>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "0 20px 16px" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL_ADDRESS..."
                  required
                  disabled={state !== "idle"}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#222",
                    background: "#fff",
                    border: "1px solid #b8b8b8",
                    borderRadius: "6px",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.05em",
                  }}
                />

                {/* Status text */}
                <p style={{ textAlign: "center", marginTop: "8px", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {state === "idle" && (
                    <span style={{ color: "#999" }}>AES-256_ENCRYPTED</span>
                  )}
                  {state === "sending" && (
                    <span style={{ color: "#4a7abc" }}>TRANSMITTING...</span>
                  )}
                  {state === "sent" && (
                    <span style={{ color: "#4a9a4a" }}>✓ ACCESS_GRANTED</span>
                  )}
                </p>
              </div>

              {/* Button row — split like iOS alert */}
              <div style={{ display: "flex", borderTop: "1px solid #c0c0c0" }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={state !== "idle"}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#4a7abc",
                    background: "none",
                    border: "none",
                    borderRight: "1px solid #c0c0c0",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state !== "idle"}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: "15px",
                    fontWeight: "bold",
                    color: "#4a7abc",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: state !== "idle" ? 0.5 : 1,
                  }}
                >
                  {state === "idle" ? "Unlock" : state === "sending" ? "..." : "Done"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
