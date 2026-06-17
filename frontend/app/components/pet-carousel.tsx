"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";

const pets = [
  {
    id: "1",
    name: "Buddy",
    image: "/images/00e5ee6cc8ad8c83f97c96263361193d0a8437d1.png",
    fallbackBg: "#a8d8a8",
  },
  {
    id: "2",
    name: "Whiskers",
    image: "/images/0551af8e556018093778733bc04f2a237fd397e6.png",
    fallbackBg: "#d0d0e0",
  },
];

export default function PetSection() {
  const [activePet, setActivePet] = useState("1");

  return (
    <section style={{ padding: "20px 16px 12px" }}>
      {/* 2-column pet grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {pets.map((pet) => (
          <div
            key={pet.id}
            onClick={() => setActivePet(pet.id)}
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              border: `3px solid ${activePet === pet.id ? "#FFB6C1" : "#C8A8E9"}`,
              cursor: "pointer",
              background: pet.fallbackBg,
              boxShadow:
                activePet === pet.id
                  ? "0 4px 16px rgba(217,79,138,0.2)"
                  : "none",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }}
          >
            <div style={{ aspectRatio: "1", position: "relative" }}>
              <ImageWithFallback
                src={pet.image}
                alt={pet.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div
              style={{
                padding: "8px",
                textAlign: "center",
                background: "white",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: activePet === pet.id ? "#D94F8A" : "#555",
                }}
              >
                {pet.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Pet button */}
      <button
        style={{
          width: "100%",
          padding: "13px",
          background: "#FFFCE8",
          border: "2px dashed #D4B800",
          borderRadius: "14px",
          color: "#8B7A00",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <Plus size={16} />
        Add Pet
      </button>
    </section>
  );
}
