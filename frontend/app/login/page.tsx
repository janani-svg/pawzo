"use client";

/* PAWZO Login — pet mosaic hero (grid-template-areas, slow zoom animation),
   real auth against stored accounts, fully functional forgot-password flow. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawzoLogo, PrimaryButton, T, inputStyle } from "../components/pawzo-ui";
import { usePawzo } from "../lib/store";

/* ---------------------------------------------------------------- pet mosaic */
const PETS = [
  { id: "dog",    src: "/pets/dog.svg",    bg: "#FFDDC8", area: "dog",    delay: "0s" },
  { id: "cat",    src: "/pets/cat.svg",    bg: "#BCF4F5", area: "cat",    delay: "0.6s" },
  { id: "parrot", src: "/pets/parrot.svg", bg: "#B4EBCA", area: "parrot", delay: "1.1s" },
  { id: "rabbit", src: "/pets/rabbit.svg", bg: "#FFE8F4", area: "rabbit", delay: "0.4s" },
  { id: "fish",   src: "/pets/fish.svg",   bg: "#0A3A58", area: "fish",   delay: "1.5s" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, resetPassword } = usePawzo();

  const [id, setId]           = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [mode, setMode]       = useState<"login" | "forgot">("login");

  const [fEmail,   setFEmail]   = useState("");
  const [fPw,      setFPw]      = useState("");
  const [fConfirm, setFConfirm] = useState("");
  const [fMsg,     setFMsg]     = useState("");
  const [fErr,     setFErr]     = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!id.trim() || !pw) { setError("Please enter your details to continue."); return; }
    const r = login(id.trim(), pw);
    if (!r.ok) { setError(r.error ?? "Could not log in."); return; }
    router.push("/dashboard");
  }

  function doReset(e: React.FormEvent) {
    e.preventDefault();
    setFErr(""); setFMsg("");
    if (!validEmail(fEmail)) { setFErr("Enter a valid email address."); return; }
    if (!strongPassword(fPw)) { setFErr("Password needs 8+ chars, an uppercase letter, a number and a symbol."); return; }
    if (fPw !== fConfirm) { setFErr("Passwords don't match yet."); return; }
    const r = resetPassword(fEmail.trim(), fPw);
    if (!r.ok) { setFErr(r.error ?? "Could not reset."); return; }
    setFMsg("Password updated! You can log in now. 🎉");
    setTimeout(() => { setMode("login"); setId(fEmail.trim()); setPw(""); }, 1400);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#FFFFFF", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: T.maxW, display: "flex", flexDirection: "column" }}>

        {/* ─── pet mosaic ─────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateAreas: `"dog cat" "dog parrot" "rabbit fish"`,
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "repeat(3, 88px)",
          gap: 5,
          padding: "10px 10px 0",
          borderRadius: "0 0 28px 28px",
          overflow: "hidden",
        }}>
          {PETS.map((p) => (
            <div
              key={p.id}
              className="pawzo-zoom"
              style={{
                gridArea: p.area,
                background: p.bg,
                borderRadius: 18,
                overflow: "hidden",
                animationDelay: p.delay,
                animationDuration: "5s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.id}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>

        {/* ─── form area ──────────────────────────────────── */}
        <div style={{ padding: "26px 24px 40px", flex: 1 }}>
          {/* logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <PawzoLogo size={24} />
          </div>

          {mode === "login" ? (
            <>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 3px" }}>
                Log in to your account
              </h1>
              <p style={{ fontSize: 13, color: T.gray, textAlign: "center", margin: "0 0 24px" }}>
                Welcome back, pet parent! 🐾
              </p>

              <form onSubmit={submit}>
                <label style={{ display: "block", marginBottom: 13 }}>
                  <span style={fieldLabel}>Email or username</span>
                  <div style={{ position: "relative" }}>
                    <span style={iconStyle}>✉️</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: 40 }}
                      type="text"
                      placeholder="you@pawzo.com"
                      value={id}
                      onChange={(e) => { setId(e.target.value); setError(""); }}
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label style={{ display: "block", marginBottom: 6 }}>
                  <span style={fieldLabel}>Password</span>
                  <div style={{ position: "relative" }}>
                    <span style={iconStyle}>🔒</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: 40, paddingRight: 64 }}
                      type={showPw ? "text" : "password"}
                      placeholder="Your password"
                      value={pw}
                      onChange={(e) => { setPw(e.target.value); setError(""); }}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPw((s) => !s)} style={showBtn}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <div style={{ textAlign: "right", marginBottom: 18 }}>
                  <button type="button" onClick={() => { setMode("forgot"); setError(""); }} style={linkBtn}>
                    Forgot password?
                  </button>
                </div>

                {error && <ErrorBox>{error}</ErrorBox>}

                <PrimaryButton full type="submit" style={{ height: 52, fontSize: 16, borderRadius: 26 }}>
                  Login 🐾
                </PrimaryButton>
              </form>

              <p style={{ textAlign: "center", fontSize: 14, color: T.gray, marginTop: 20 }}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={{ color: T.pink, fontWeight: 800, textDecoration: "none" }}>
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 4px" }}>
                Reset password 🔑
              </h1>
              <p style={{ fontSize: 13.5, color: T.gray, textAlign: "center", margin: "0 0 22px" }}>
                Enter your email and choose a new password
              </p>

              <form onSubmit={doReset}>
                <label style={{ display: "block", marginBottom: 13 }}>
                  <span style={fieldLabel}>Email</span>
                  <input style={inputStyle} type="email" placeholder="you@pawzo.com" value={fEmail} onChange={(e) => { setFEmail(e.target.value); setFErr(""); }} />
                </label>
                <label style={{ display: "block", marginBottom: 13 }}>
                  <span style={fieldLabel}>New password</span>
                  <input style={inputStyle} type="password" placeholder="8+ chars, A-Z, 0-9, symbol" value={fPw} onChange={(e) => { setFPw(e.target.value); setFErr(""); }} />
                </label>
                <label style={{ display: "block", marginBottom: 16 }}>
                  <span style={fieldLabel}>Confirm new password</span>
                  <input style={inputStyle} type="password" placeholder="Re-enter password" value={fConfirm} onChange={(e) => { setFConfirm(e.target.value); setFErr(""); }} />
                </label>

                {fErr && <ErrorBox>{fErr}</ErrorBox>}
                {fMsg && (
                  <div style={{ background: "#ECFDF5", color: "#166534", fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
                    {fMsg}
                  </div>
                )}

                <PrimaryButton full type="submit" style={{ height: 52, borderRadius: 26 }}>
                  Update password
                </PrimaryButton>
              </form>

              <p style={{ textAlign: "center", fontSize: 14, color: T.gray, marginTop: 20 }}>
                <button type="button" onClick={() => setMode("login")} style={linkBtn}>
                  ← Back to log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pawzo-rise"
      style={{ background: T.dangerBg, color: T.danger, fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: "1px solid #F6C9CF" }}
    >
      {children}
    </div>
  );
}

export function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
export function strongPassword(p: string) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
}

/* ---------------------------------------------------------------- styles */
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 12.5, fontWeight: 700, color: T.gray, marginBottom: 6,
};
const iconStyle: React.CSSProperties = {
  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
  fontSize: 16, lineHeight: 1, pointerEvents: "none",
};
const showBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", color: T.pink, fontSize: 12, fontWeight: 700, cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  background: "none", border: "none", color: T.pink, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0,
};
