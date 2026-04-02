"use client";

/* eslint-disable @next/next/no-img-element */

/* ------------------------------------------------------------------ */
/*  Sub-nav icons                                                      */
/* ------------------------------------------------------------------ */

const IconGridView = ({ active }: { active?: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={active ? "#4a7abc" : "#aaa"}>
    <rect x="3" y="3" width="5" height="5" /><rect x="10" y="3" width="5" height="5" /><rect x="17" y="3" width="5" height="5" />
    <rect x="3" y="10" width="5" height="5" /><rect x="10" y="10" width="5" height="5" /><rect x="17" y="10" width="5" height="5" />
    <rect x="3" y="17" width="5" height="5" /><rect x="10" y="17" width="5" height="5" /><rect x="17" y="17" width="5" height="5" />
  </svg>
);

const IconListView = ({ active }: { active?: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={active ? "#4a7abc" : "#aaa"}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <rect x="3" y="16" width="18" height="4" rx="1" />
  </svg>
);

const IconPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#999">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Profile Header                                                     */
/*                                                                     */
/*  Spatial map (all values in px):                                    */
/*                                                                     */
/*  NAV BAR (44px)                                                     */
/*  ├── 12px gap                                                       */
/*  ┌────────────────────────────────────────┐  ← 10px from edges      */
/*  │ 14px padding                           │                         */
/*  │ ┌──────┐ 12px ┌─────────────────────┐  │                         */
/*  │ │      │ gap  │  51  │ 53.3K │  0   │  │  ← 1px border, #c0c0c0 */
/*  │ │ 90px │      │      │       │      │  │                         */
/*  │ │avatar│      ├──────┴───────┴──────┤  │                         */
/*  │ │      │      │ 8px gap             │  │                         */
/*  │ └──────┘      │     Follow          │  │  ← 1px border, #3d6580 */
/*  │               └─────────────────────┘  │                         */
/*  │ 14px padding                           │                         */
/*  └────────────────────────────────────────┘  ← 1px border, #b8b8b8 */
/*  ├── 12px gap                                                       */
/*  ┌────────────────────────────────────────┐  ← 10px from edges      */
/*  │  Grid  │  List  │  📍 Map >           │  ← 44px height           */
/*  └────────────────────────────────────────┘  ← 1px border, #b8b8b8 */
/*  ├── 6px gap                                                        */
/*  GRID                                                               */
/* ------------------------------------------------------------------ */

export default function ProfileHeader({ onMapClick, feedLayout, onLayoutChange }: { onMapClick: () => void; feedLayout: "grid" | "list"; onLayoutChange: (layout: "grid" | "list") => void }) {
  return (
    <div style={{ background: "#c8c8c8" }}>

      {/* === 12px gap from nav is handled by mt === */}

      {/* === Profile container === */}
      <div
        style={{
          margin: "12px 10px 0 10px",
          background: "linear-gradient(180deg, #f6f6f6 0%, #eaeaea 100%)",
          border: "1px solid #b8b8b8",
          borderRadius: "5px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Avatar | divider | Stats+Follow — full height columns */}
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {/* Avatar column */}
          <div style={{ padding: "12px", display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "calc((100vw - 26px) / 18)",
              height: "calc((100vw - 26px) / 18)",
              minWidth: "40px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #aaa",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          >
            <img src="/avatar.jpg" alt="MURD333R.FM" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          </div>{/* close avatar column */}

          {/* Full-height vertical divider */}
          <div style={{ width: "1px", background: "#c0c0c0" }} />

          {/* Stats + Follow column */}
          <div style={{ flex: 1, minWidth: 0, padding: "12px" }}>
            {/* Stats — bordered, white bg, 3 columns with dividers */}
            <div
              style={{
                display: "flex",
                border: "1px solid #c0c0c0",
                borderRadius: "3px",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#222", lineHeight: 1 }}>51</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>photos</div>
              </div>
              <div style={{ width: "1px", background: "#d0d0d0", alignSelf: "stretch" }} />
              <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#222", lineHeight: 1 }}>53.3K</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>followers</div>
              </div>
              <div style={{ width: "1px", background: "#d0d0d0", alignSelf: "stretch" }} />
              <div style={{ flex: 1, textAlign: "center", padding: "12px 4px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#222", lineHeight: 1 }}>0</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>following</div>
              </div>
            </div>

            {/* Follow button — same width as stats, directly under it */}
            <a
              href="https://instagram.com/bloodyosiris"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "95%",
                margin: "8px auto 0 auto",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#fff",
                padding: "7px 0",
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

      {/* === 12px gap === */}

      {/* === Sub-Nav Toolbar === */}
      <div
        style={{
          margin: "12px 10px 0 10px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)",
          border: "1px solid #b8b8b8",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        {/* Grid icon */}
        <button onClick={() => onLayoutChange("grid")} style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #c8c8c8", background: "none", cursor: "pointer" }}>
          <IconGridView active={feedLayout === "grid"} />
        </button>

        {/* List icon */}
        <button onClick={() => onLayoutChange("list")} style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #c8c8c8", background: feedLayout === "list" ? "rgba(0,0,0,0.05)" : "none", cursor: "pointer" }}>
          <IconListView active={feedLayout === "list"} />
        </button>

        {/* Map link */}
        <button
          onClick={onMapClick}
          style={{ flex: 1.6, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "none", cursor: "pointer", border: "none" }}
        >
          <IconPin />
          <span style={{ fontSize: "15px", fontWeight: 500, color: "#666" }}>Murd333r.fm Map</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ marginLeft: "4px" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* === 6px gap before grid === */}
      <div style={{ height: "6px" }} />
    </div>
  );
}
