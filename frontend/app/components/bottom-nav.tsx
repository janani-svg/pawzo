"use client";

import { useState } from "react";
import { Home, Bell, User, Sparkles } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "ai", label: "Ask AI", icon: Sparkles },
  { id: "alerts", label: "Alerts", icon: Bell, badge: 3 },
  { id: "profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const [active, setActive] = useState("home");

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        background: "white",
        borderTop: "1px solid #f0e8f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "10px 0 max(12px, env(safe-area-inset-bottom))",
        zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 16px",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: isActive ? "#FFE8F3" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <Icon
                  size={22}
                  color={isActive ? "#D94F8A" : "#aaa"}
                  fill={isActive && item.id === "home" ? "#D94F8A" : "none"}
                />
              </div>

              {item.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "8px",
                    background: "#FF3B30",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    border: "1.5px solid white",
                  }}
                >
                  {item.badge}
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "11px",
                color: isActive ? "#D94F8A" : "#aaa",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
