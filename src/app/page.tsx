"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import ProfileHeader from "@/components/ProfileHeader";
import FeedGrid from "@/components/FeedGrid";
import SystemModal from "@/components/SystemModal";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), { ssr: false });

type ViewMode = "feed" | "map";

export default function Home() {
  const [view, setView] = useState<ViewMode>("feed");
  const [activeTab, setActiveTab] = useState("home");
  const [modalOpen, setModalOpen] = useState(false);
  const [feedLayout, setFeedLayout] = useState<"grid" | "list">("grid");

  const handleMapClick = useCallback(() => {
    setView("map");
    setActiveTab("star");
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === "star") {
      setView("map");
    } else if (tab === "home" || tab === "grid") {
      setView("feed");
    }
    if (tab === "heart") {
      setModalOpen(true);
    }
  }, []);

  const handleLockedTerritory = useCallback(() => {
    setModalOpen(true);
  }, []);

  return (
    <>
      <AppShell activeTab={activeTab} onTabChange={handleTabChange} onExplore={() => { setView("feed"); setActiveTab("home"); }}>
        <AnimatePresence mode="wait" initial={false}>
          {view === "feed" ? (
            <motion.div
              key="feed"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 overflow-y-auto bg-[#c8c8c8]"
            >
              <ProfileHeader onMapClick={handleMapClick} feedLayout={feedLayout} onLayoutChange={setFeedLayout} />
              <FeedGrid layout={feedLayout} />
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <GlobeScene onLockedTerritory={handleLockedTerritory} />
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>

      <SystemModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
