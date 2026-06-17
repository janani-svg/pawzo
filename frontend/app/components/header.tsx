"use client";

import { Settings } from "lucide-react";

export default function Header() {
  return (
    <header
      style={{
        background: "white",
        padding: "14px 20px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderBottom: "none",
      }}
    >
      <button
        style={{
          position: "absolute",
          left: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "#aaa",
        }}
        aria-label="Settings"
      >
        <Settings size={22} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "26px", lineHeight: 1 }}>🐾</span>
        <span
          style={{
            fontSize: "26px",
            fontWeight: 900,
            color: "#D94F8A",
            letterSpacing: "-0.5px",
          }}
        >
          Pawzo
        </span>
      </div>

      {/* decorative paw prints */}
      <div
        style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          opacity: 0.18,
          pointerEvents: "none",
          fontSize: "14px",
        }}
      >
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>
    </header>
  );
}
