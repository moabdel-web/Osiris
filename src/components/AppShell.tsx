"use client";

import { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

const IconHome = () => (
  <svg className="w-6 h-6 sm:w-[30px] sm:h-[30px]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h5v-5h4v5h5v-8h3L12 3z" />
  </svg>
);
const IconStar = () => (
  <svg className="w-6 h-6 sm:w-[30px] sm:h-[30px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.27 6.82 21 8 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);
const IconCamera = () => (
  <svg className="w-7 h-7 sm:w-[32px] sm:h-[32px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="6" width="20" height="14" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 6l1-3h6l1 3" />
  </svg>
);
const IconHeart = () => (
  <svg className="w-6 h-6 sm:w-[30px] sm:h-[30px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconList = () => (
  <svg className="w-6 h-6 sm:w-[30px] sm:h-[30px]" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="4" width="7" height="4" rx="1" /><rect x="14" y="4" width="7" height="4" rx="1" />
    <rect x="3" y="10" width="7" height="4" rx="1" /><rect x="14" y="10" width="7" height="4" rx="1" />
    <rect x="3" y="16" width="7" height="4" rx="1" /><rect x="14" y="16" width="7" height="4" rx="1" />
  </svg>
);
const IconShare = () => (
  <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Top Nav Bar                                                        */
/* ------------------------------------------------------------------ */

function TopNav({ onExplore }: { onExplore?: () => void }) {
  return (
    <div
      className="h-[44px] sm:h-[56px] shrink-0 relative z-50"
      style={{
        background: "linear-gradient(180deg, #8eadc4 0%, #6a92b0 30%, #4d7a9a 70%, #3d6a8a 100%)",
        borderBottom: "1px solid #2d5070",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
      }}
    >
      <button
        onClick={onExplore}
        className="text-[12px] sm:text-[15px]"
        style={{
          fontWeight: 500,
          color: "#fff",
          padding: "5px 14px",
          borderRadius: "5px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.05) 100%)",
          border: "1px solid rgba(0,0,0,0.25)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.15)",
          textShadow: "0 -1px 0 rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      >
        Explore
      </button>

      <h1
        className="text-[14px] sm:text-[18px] font-bold tracking-[0.02em] uppercase text-white absolute left-1/2 -translate-x-1/2"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
      >
        MURD333R.FM
      </h1>

      <a
        href="https://MFM333.COM"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] sm:text-[15px]"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "5px 14px",
          borderRadius: "5px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.05) 100%)",
          border: "1px solid rgba(0,0,0,0.25)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.15)",
          color: "#fff",
        }}
      >
        <IconShare />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom Tab Bar                                                     */
/* ------------------------------------------------------------------ */

function BottomTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "home", icon: <IconHome /> },
    { id: "star", icon: <IconStar /> },
    { id: "camera", icon: <IconCamera /> },
    { id: "heart", icon: <IconHeart /> },
    { id: "grid", icon: <IconList /> },
  ];

  return (
    <div
      className="shrink-0 flex items-center justify-around relative z-50"
      style={{
        height: "49px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "linear-gradient(180deg, #434343 0%, #2a2a2a 30%, #1a1a1a 100%)",
        borderTop: "1px solid #555",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center justify-center flex-1 h-full transition-colors ${
            activeTab === tab.id ? "text-white" : "text-white/50 hover:text-white/70"
          }`}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App Shell                                                          */
/* ------------------------------------------------------------------ */

export default function AppShell({
  children,
  activeTab,
  onTabChange,
  onExplore,
}: {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExplore?: () => void;
}) {
  return (
    <div className="flex flex-col h-screen w-full bg-[#c8c8c8]">
      <TopNav onExplore={onExplore} />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {children}
      </div>
      <BottomTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
