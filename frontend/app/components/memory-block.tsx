"use client";

import ImageWithFallback from "./ImageWithFallback";

const photos = [
  { src: "/images/159d5a0b91f43c0183931e1f3fa9454285049deb.png", rotate: "-8deg", top: "18px", left: "0px", bg: "#c8b89a" },
  { src: "/images/19205a00a4266a28747e3a07c4ba68bc47cf24b5.png", rotate: "4deg", top: "8px", left: "22px", bg: "#a0b8a0" },
  { src: "/images/1dfbd2f9f129191b82abb6715e12714708379425.png", rotate: "-2deg", top: "0px", left: "44px", bg: "#9ab8c8" },
];

export default function MemoryBlock() {
  return (
    <div
      style={{
        background: "#C8F0D8",
        borderRadius: "18px",
        padding: "14px 12px",
        flex: 1,
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#1A6B3A",
          margin: "0 0 10px",
        }}
      >
        Memories
      </h3>

      <div style={{ position: "relative", height: "90px" }}>
        {photos.map((photo, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: photo.top,
              left: photo.left,
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "2px solid white",
              transform: `rotate(${photo.rotate})`,
              background: photo.bg,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <ImageWithFallback
              src={photo.src}
              alt="Memory"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ))}

        {/* Today badge */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "#1a1a2e",
            color: "white",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "8px",
          }}
        >
          Today
        </div>
      </div>
    </div>
  );
}
