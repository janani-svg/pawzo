"use client";

/* =========================================================================
   PAWZO shared UI kit
   ---------------------------------------------------------------------------
   Single source of truth for the in-app look & feel. Matches the dashboard
   reference image and the existing dashboard / pet-profile screens:
   lavender canvas, "🐾 Pawzo" pink wordmark, pastel rounded cards, soft
   shadows. Palette stays within DESIGN_SYSTEM.md colours where it maps.
   ========================================================================= */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { usePawzo, deriveAlerts, getReadAlertIds } from "../lib/store";

/* ----------------------------------------------------------------- tokens */
export const T = {
  // canvas + surfaces (theme-aware via CSS vars)
  bg: "var(--p-bg)",
  surface: "var(--p-surface)",
  surface2: "var(--p-surface-2)",
  // brand — SOLID fills only, no gradients
  pink: "var(--p-primary)",
  pinkDeep: "var(--p-primary-deep)",
  gradient: "var(--p-primary)", // name kept for compatibility; now a solid fill
  primarySoft: "var(--p-primary-soft)",
  // pastel accents (carry their own readable text colours)
  petPink: "#FFE8F4",
  blue: "#C8E4FF",
  blueText: "#1A5276",
  green: "#C8F0D8",
  greenText: "#1A6B3A",
  cream: "#FEFCE8",
  creamBorder: "#FDE68A",
  creamText: "#92400E",
  lilac: "#EFEAFF",
  orange: "#F4823C",
  // ink (theme-aware)
  ink: "var(--p-ink)",
  gray: "var(--p-gray)",
  grayLight: "var(--p-gray-light)",
  border: "var(--p-border)",
  // status
  success: "#10B981",
  successBg: "#ECFDF5",
  danger: "#D4183D", // sample_code destructive
  dangerBg: "#FEF2F2",
  // structure
  radius: 20,
  shadow: "0 2px 12px rgba(0,0,0,0.07)",
  shadowSoft: "0 2px 16px rgba(0,0,0,0.06)",
  maxW: 430,
} as const;

/* ----------------------------------------------------------------- logo */
/* Kept EXACTLY as the dashboard reference: paw emoji + bold pink "Pawzo". */
export function PawzoLogo({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: size, lineHeight: 1 }}>🐾</span>
      <span
        style={{
          fontSize: size,
          fontWeight: 900,
          color: T.pinkDeep,
          letterSpacing: "-0.5px",
        }}
      >
        Pawzo
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- frame */
/* Centered mobile frame used by every in-app screen. */
export function AppFrame({
  children,
  bg = T.bg,
  pad = true,
}: {
  children: React.ReactNode;
  bg?: string;
  pad?: boolean;
}) {
  return (
    <div style={{ minHeight: "100dvh", background: bg, display: "flex", justifyContent: "center" }}>
      <div
        className="pawzo-paws"
        style={{
          width: "100%",
          maxWidth: T.maxW,
          minHeight: "100dvh",
          backgroundColor: bg,
          position: "relative",
          paddingBottom: pad ? 96 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- top bar */
export function TopBar({
  title,
  back,
  right,
  centerLogo,
}: {
  title?: string;
  back?: string;
  right?: React.ReactNode;
  centerLogo?: boolean;
}) {
  const router = useRouter();
  return (
    <header
      style={{
        background: "transparent",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {back && (
          <button
            onClick={() => router.push(back)}
            aria-label="Go back"
            style={iconBtn}
          >
            <ChevronLeft />
          </button>
        )}
        {centerLogo ? (
          <PawzoLogo size={22} />
        ) : (
          title && (
            <h1
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: T.ink,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h1>
          )
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
    </header>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "none",
  background: "var(--p-surface)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

/* ----------------------------------------------------------------- card */
export function Card({
  children,
  bg = T.surface,
  border,
  style,
  onClick,
}: {
  children: React.ReactNode;
  bg?: string;
  border?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        borderRadius: T.radius,
        padding: 16,
        boxShadow: T.shadowSoft,
        border: border ? `1.5px solid ${border}` : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */
export function PrimaryButton({
  children,
  onClick,
  full,
  type = "button",
  style,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="pawzo-press"
      style={{
        width: full ? "100%" : undefined,
        height: 50,
        padding: "0 28px",
        borderRadius: 16,
        border: "none",
        background: disabled ? "#E5D6F0" : T.gradient,
        color: "#fff",
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: 0.2,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 6px 18px rgba(217,79,138,0.32)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  full,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="pawzo-press"
      style={{
        width: full ? "100%" : undefined,
        height: 50,
        padding: "0 24px",
        borderRadius: 16,
        border: "1.5px solid rgba(0,0,0,0.10)",
        background: "rgba(255,255,255,0.7)",
        color: T.ink,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- field */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 700,
          color: T.gray,
          marginBottom: 6,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ display: "block", fontSize: 11, color: T.grayLight, marginTop: 5 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  borderRadius: 14,
  border: "1.5px solid var(--p-border)",
  background: "var(--p-surface-2)",
  fontSize: 14.5,
  color: "var(--p-ink)",
  outline: "none",
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "auto",
  minHeight: 80,
  padding: "12px 14px",
  resize: "vertical",
  fontFamily: "inherit",
};

/* ----------------------------------------------------------------- section title */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "4px 2px 10px",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>{children}</h2>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------- bottom nav */
const NAV = [
  { href: "/dashboard",     label: "Home",    icon: IconHome,     tint: "#FFE0EC", ink: "#C53D74" },
  { href: "/ai",            label: "Ask AI",  icon: IconSpark,    tint: "#DCEBFF", ink: "#1C6EA4" },
  { href: "/notifications", label: "Alerts",  icon: IconPawAlert, tint: "#FFEBC7", ink: "#9A6B12" },
  { href: "/profile",       label: "Profile", icon: IconUser,     tint: "#DBF3E3", ink: "#1F7A47" },
] as const;

export function BottomNav() {
  const path = usePathname();
  const { state } = usePawzo();
  // Re-read localStorage on every navigation (path change) so badge clears
  // immediately after the user visits the notifications page.
  const unreadCount = useMemo(() => {
    const alerts = deriveAlerts(state);
    const readIds = getReadAlertIds();
    return alerts.filter((a) => !readIds.has(a.id)).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, state]);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: T.maxW,
        background: "var(--p-nav)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--p-border)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 8px max(14px, env(safe-area-inset-bottom))",
        zIndex: 100,
        boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
      }}
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = path === item.href || (item.href === "/dashboard" && path === "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              position: "relative",
              padding: "2px 12px",
              minWidth: 64,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                className="pawzo-press"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: item.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "box-shadow 200ms, transform 150ms",
                  boxShadow: active
                    ? `0 0 0 2.5px ${item.ink}, 0 5px 13px ${item.ink}40`
                    : "inset 0 0 0 1px rgba(0,0,0,0.04)",
                }}
              >
                <Icon color={item.ink} />
              </div>
              {item.href === "/notifications" && unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    minWidth: 16,
                    height: 16,
                    padding: "0 3px",
                    borderRadius: 8,
                    background: "#FF3B30",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid var(--p-nav)",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: active ? 800 : 600,
                color: active ? item.ink : T.grayLight,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ----------------------------------------------------------------- icons */
type IcoProps = { color?: string; size?: number; fill?: string };

export function IconHome({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21v-9h6v9" />
    </svg>
  );
}
export function IconSpark({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c.6 3.7 1.8 4.9 5.5 5.5C13.8 9.1 12.6 10.3 12 14c-.6-3.7-1.8-4.9-5.5-5.5C10.2 7.9 11.4 6.7 12 3Z" />
      <path d="M18 14c.3 1.8.9 2.4 2.7 2.7-1.8.3-2.4.9-2.7 2.7-.3-1.8-.9-2.4-2.7-2.7C17.1 16.4 17.7 15.8 18 14Z" />
    </svg>
  );
}
export function IconBell({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
export function IconUser({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
export function ChevronLeft({ color = "#374151", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
export function ChevronRight({ color = "currentColor", size = 18 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
export function IconGear({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
export function IconPhone({ color = "currentColor", size = 18 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
export function IconPlus({ color = "currentColor", size = 18 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
/* Paw-shaped alert icon for the bottom nav (replaces the bell). */
export function IconPawAlert({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <ellipse cx="6.2" cy="10.5" rx="1.9" ry="2.4" />
      <ellipse cx="10" cy="6.6" rx="1.9" ry="2.4" />
      <ellipse cx="14" cy="6.6" rx="1.9" ry="2.4" />
      <ellipse cx="17.8" cy="10.5" rx="1.9" ry="2.4" />
      <path d="M12 11.4c-2.7 0-4.9 2.1-4.9 4.6 0 1.8 1.5 2.8 3.1 2.8.8 0 1.2-.3 1.8-.3s1 .3 1.8.3c1.6 0 3.1-1 3.1-2.8 0-2.5-2.2-4.6-4.9-4.6Z" />
    </svg>
  );
}

export function IconPaw({ color = "currentColor", size = 22 }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M12 11c-2.6 0-4.7 2-4.7 4.4 0 1.7 1.4 2.6 3 2.6.7 0 1.1-.3 1.7-.3s1 .3 1.7.3c1.6 0 3-.9 3-2.6C16.7 13 14.6 11 12 11Z" />
    </svg>
  );
}

/* ----------------------------------------------------------------- pill */
export function Pill({
  children,
  bg = T.successBg,
  color = T.success,
  border,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  border?: string;
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
        border: border ? `1px solid ${border}` : undefined,
        borderRadius: 20,
        padding: "3px 10px",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}
