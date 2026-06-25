"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PawzoLogo, PrimaryButton, T, inputStyle } from "../components/pawzo-ui";
import { authApi } from "../lib/api";
import { strongPassword } from "../login/page";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token") ?? "";

  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Invalid link</h1>
        <p style={{ fontSize: 14, color: T.gray }}>This reset link is missing a token. Please request a new one.</p>
        <Link href="/login" style={{ display: "inline-block", marginTop: 20, color: T.pink, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          ← Back to log in
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!strongPassword(pw)) {
      setError("Password needs 8+ chars, an uppercase letter, a number and a symbol.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.resetPassword(token, pw);
      setSuccess(r.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div style={{ fontSize: 44, textAlign: "center", marginBottom: 8 }}>🔐</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 6px" }}>
        Set new password
      </h1>
      <p style={{ fontSize: 14, color: T.gray, textAlign: "center", margin: "0 0 24px" }}>
        Choose a strong password for your account.
      </p>

      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={fieldLabel}>New password</span>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inputStyle, paddingRight: 64 }}
            type={showPw ? "text" : "password"}
            placeholder="8+ chars, A-Z, 0-9, symbol"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(""); }}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPw(s => !s)} style={showBtn}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <label style={{ display: "block", marginBottom: 18 }}>
        <span style={fieldLabel}>Confirm new password</span>
        <input
          style={{ ...inputStyle, borderColor: confirm && pw !== confirm ? T.danger : "var(--p-border)" }}
          type={showPw ? "text" : "password"}
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
          autoComplete="new-password"
        />
      </label>

      {error && (
        <div style={{ background: T.dangerBg, color: T.danger, fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: "1px solid #F6C9CF" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#ECFDF5", color: "#166534", fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
          {success} Redirecting to login…
        </div>
      )}

      <PrimaryButton full type="submit" disabled={loading || !!success} style={{ height: 52, borderRadius: 26 }}>
        {loading ? "Updating…" : "Update password"}
      </PrimaryButton>

      <p style={{ textAlign: "center", fontSize: 14, color: T.gray, marginTop: 20 }}>
        <Link href="/login" style={{ color: T.pink, fontWeight: 700, textDecoration: "none" }}>
          ← Back to log in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--p-bg)", display: "flex", justifyContent: "center" }}>
      <div className="pawzo-paws" style={{ width: "100%", maxWidth: T.maxW, padding: "28px 24px 40px", backgroundColor: "var(--p-bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <PawzoLogo size={24} />
        </div>
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 12.5, fontWeight: 700, color: T.gray, marginBottom: 6,
};
const showBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", color: T.pink, fontSize: 12, fontWeight: 700, cursor: "pointer",
};
