"use client";

/* PAWZO Email Verification — confirms the user's email either by entering a
   6-digit code we email them, or by clicking the link in the same email
   (?token=...), which verifies instantly without needing to be signed in. */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PawzoLogo, PrimaryButton, T } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth } from "../lib/store";
import { authApi } from "../lib/api";

const CODE_LEN = 6;
const RESEND_COOLDOWN = 30; // seconds

function VerifyByLink({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [error, setError] = useState("");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    authApi.verifyEmailLink(token)
      .then(() => {
        setStatus("ok");
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError((e as Error).message ?? "Could not verify this link.");
      });
  }, [token, router]);

  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{status === "error" ? "🔗" : "📬"}</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 8 }}>
        {status === "pending" ? "Verifying your email…" : status === "ok" ? "Email verified!" : "Invalid link"}
      </h1>
      <p style={{ fontSize: 14, color: T.gray }}>
        {status === "pending" && "One moment please."}
        {status === "ok" && "Taking you to your dashboard…"}
        {status === "error" && (error || "This verification link is invalid or expired. Please request a new one.")}
      </p>
      {status !== "pending" && (
        <Link href={status === "ok" ? "/dashboard" : "/login"} style={{ display: "inline-block", marginTop: 20, color: T.pink, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          {status === "ok" ? "Go to dashboard →" : "← Back to log in"}
        </Link>
      )}
    </div>
  );
}

function VerifyByCode() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, sendVerification, verifyEmail } = usePawzo();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const sentOnce = useRef(false);

  const code = digits.join("");

  /* If already verified, skip to the dashboard. */
  useEffect(() => {
    if (ready && authed && state.emailVerified) {
      router.replace("/dashboard");
    }
  }, [ready, authed, state.emailVerified, router]);

  /* Send a code automatically the first time the page is ready. */
  useEffect(() => {
    if (!ready || !authed || state.emailVerified || sentOnce.current) return;
    sentOnce.current = true;
    void doSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authed, state.emailVerified]);

  /* Resend cooldown ticker. */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function doSend() {
    setError("");
    setInfo("");
    setSending(true);
    const r = await sendVerification();
    setSending(false);
    if (!r.ok) { setError(r.error ?? "Could not send a code. Please try again."); return; }
    setInfo(r.message ?? "We sent you a fresh code and link.");
    setCooldown(RESEND_COOLDOWN);
  }

  function setDigit(i: number, val: string) {
    const clean = val.replace(/\D/g, "");
    setError("");
    if (clean.length > 1) {
      const next = [...digits];
      for (let k = 0; k < clean.length && i + k < CODE_LEN; k++) next[i + k] = clean[k];
      setDigits(next);
      const last = Math.min(i + clean.length, CODE_LEN - 1);
      inputs.current[last]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length !== CODE_LEN) { setError("Enter the 6-digit code from your email."); return; }
    setVerifying(true);
    const r = await verifyEmail(code);
    setVerifying(false);
    if (!r.ok) {
      setError(r.error ?? "Verification failed.");
      setDigits(Array(CODE_LEN).fill(""));
      inputs.current[0]?.focus();
      return;
    }
    router.push("/dashboard");
  }

  if (!ready) return null;

  return (
    <>
      <div style={{ fontSize: 44, textAlign: "center", marginBottom: 6 }}>📬</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 6px" }}>Verify your email</h1>
      <p style={{ fontSize: 14, color: T.gray, textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
        Enter the 6-digit code we sent to{" "}
        <span style={{ color: T.ink, fontWeight: 700 }}>{state.currentUserEmail || "your email"}</span>, or click the link in that same email.
      </p>

      <form onSubmit={submit} noValidate>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 18 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LEN}
              aria-label={`Digit ${i + 1}`}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                textAlign: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--p-ink)",
                borderRadius: 14,
                border: `1.5px solid ${error ? T.danger : d ? T.pink : "var(--p-border)"}`,
                background: "var(--p-surface-2)",
                outline: "none",
              }}
            />
          ))}
        </div>

        {error && (
          <div className="pawzo-rise" style={{ background: T.dangerBg, color: T.danger, fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: "1px solid #F6C9CF" }}>{error}</div>
        )}
        {info && !error && (
          <div style={{ background: "#ECFDF5", color: "#166534", fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>{info}</div>
        )}

        <PrimaryButton full type="submit" disabled={verifying || code.length !== CODE_LEN} style={{ height: 52, borderRadius: 26 }}>
          {verifying ? "Verifying…" : "Verify email"}
        </PrimaryButton>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: T.gray, marginTop: 20 }}>
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={doSend}
          disabled={sending || cooldown > 0}
          style={{ background: "none", border: "none", color: cooldown > 0 || sending ? T.grayLight : T.pink, fontWeight: 800, fontSize: 14, cursor: cooldown > 0 || sending ? "not-allowed" : "pointer", padding: 0 }}
        >
          {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </p>
      <p style={{ textAlign: "center", fontSize: 13, color: T.grayLight, marginTop: 10 }}>
        <Link href="/dashboard" style={{ color: T.grayLight, textDecoration: "none" }}>Skip for now →</Link>
      </p>
    </>
  );
}

function VerifyBody() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  return token ? <VerifyByLink token={token} /> : <VerifyByCode />;
}

export default function VerifyPage() {
  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", justifyContent: "center" }}>
      <div className="pawzo-paws" style={{ width: "100%", maxWidth: T.maxW, padding: "28px 24px 40px", backgroundColor: "var(--p-bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <PawzoLogo size={24} />
        </div>
        <Suspense fallback={null}>
          <VerifyBody />
        </Suspense>
      </div>
    </div>
  );
}
