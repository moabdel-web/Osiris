"use client";

/* eslint-disable @next/next/no-img-element */

const IconGridView = ({ active }: { active?: boolean }) => (
  <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill={active ? "#4a7abc" : "#aaa"}>
    <rect x="3" y="3" width="5" height="5" /><rect x="10" y="3" width="5" height="5" /><rect x="17" y="3" width="5" height="5" />
    <rect x="3" y="10" width="5" height="5" /><rect x="10" y="10" width="5" height="5" /><rect x="17" y="10" width="5" height="5" />
    <rect x="3" y="17" width="5" height="5" /><rect x="10" y="17" width="5" height="5" /><rect x="17" y="17" width="5" height="5" />
  </svg>
);

const IconListView = ({ active }: { active?: boolean }) => (
  <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill={active ? "#4a7abc" : "#aaa"}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <rect x="3" y="16" width="18" height="4" rx="1" />
  </svg>
);

const IconPin = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="#999">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
  </svg>
);

export default function ProfileHeader({ onMapClick, feedLayout, onLayoutChange }: { onMapClick: () => void; feedLayout: "grid" | "list"; onLayoutChange: (layout: "grid" | "list") => void }) {
  return (
    <div style={{ background: "#c8c8c8" }}>

      {/* === Profile container === */}
      <div
        style={{
          margin: "6px 4px 0 4px",
          background: "linear-gradient(180deg, #f6f6f6 0%, #eaeaea 100%)",
          border: "1px solid #b8b8b8",
          borderRadius: "5px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {/* Avatar column */}
          <div style={{ padding: "10px", display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "clamp(80px, 15vw, 120px)",
                height: "clamp(80px, 15vw, 120px)",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #aaa",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            >
              <img src="/avatar.jpg" alt="MURD333R.FM" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: "1px", background: "#c0c0c0" }} />

          {/* Stats + Follow column */}
          <div style={{ flex: 1, minWidth: 0, padding: "10px" }}>
            <div
              style={{
                display: "flex",
                border: "1px solid #c0c0c0",
                borderRadius: "3px",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, textAlign: "center", padding: "8px 2px" }}>
                <div className="text-[16px] sm:text-[20px]" style={{ fontWeight: "bold", color: "#222", lineHeight: 1 }}>628</div>
                <div className="text-[9px] sm:text-[11px]" style={{ color: "#888", marginTop: "3px" }}>posts</div>
              </div>
              <div style={{ width: "1px", background: "#d0d0d0", alignSelf: "stretch" }} />
              <div style={{ flex: 1, textAlign: "center", padding: "8px 2px" }}>
                <div className="text-[16px] sm:text-[20px]" style={{ fontWeight: "bold", color: "#222", lineHeight: 1 }}>609K</div>
                <div className="text-[9px] sm:text-[11px]" style={{ color: "#888", marginTop: "3px" }}>followers</div>
              </div>
              <div style={{ width: "1px", background: "#d0d0d0", alignSelf: "stretch" }} />
              <div style={{ flex: 1, textAlign: "center", padding: "8px 2px" }}>
                <div className="text-[16px] sm:text-[20px]" style={{ fontWeight: "bold", color: "#222", lineHeight: 1 }}>136</div>
                <div className="text-[9px] sm:text-[11px]" style={{ color: "#888", marginTop: "3px" }}>following</div>
              </div>
            </div>

            <a
              href="https://instagram.com/bloodyosiris"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] sm:text-[14px]"
              style={{
                display: "block",
                width: "95%",
                margin: "8px auto 0 auto",
                textAlign: "center",
                fontWeight: "bold",
                color: "#fff",
                padding: "6px 0",
                background: "linear-gradient(180deg, #8eadc4 0%, #6a92b0 40%, #4d7a9a 100%)",
                border: "1px solid #3d6580",
                borderRadius: "6px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.2)",
                textShadow: "0 -1px 0 rgba(0,0,0,0.25)",
                textDecoration: "none",
              }}
            >
              Follow
            </a>
          </div>
        </div>
      </div>

      {/* === Sub-Nav Toolbar === */}
      <div
        className="h-[38px] sm:h-[44px]"
        style={{
          margin: "6px 4px 0 4px",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)",
          border: "1px solid #b8b8b8",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <button onClick={() => onLayoutChange("grid")} style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #c8c8c8", background: "none", cursor: "pointer" }}>
          <IconGridView active={feedLayout === "grid"} />
        </button>
        <button onClick={() => onLayoutChange("list")} style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #c8c8c8", background: feedLayout === "list" ? "rgba(0,0,0,0.05)" : "none", cursor: "pointer" }}>
          <IconListView active={feedLayout === "list"} />
        </button>
        <button
          onClick={onMapClick}
          style={{ flex: 1.6, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", background: "none", cursor: "pointer", border: "none" }}
        >
          <IconPin />
          <span className="text-[11px] sm:text-[15px]" style={{ fontWeight: 500, color: "#666" }}>
            <span className="hidden sm:inline">Murd333r.fm </span>Map
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={{ height: "4px" }} />
    </div>
  );
}
