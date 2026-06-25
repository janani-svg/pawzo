"use client";

/* PAWZO Sign Up — creates a real account in the store with strict validation:
   valid email format, and a password with 8+ chars, an uppercase letter, a
   number and a special character. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawzoLogo, PrimaryButton, T, inputStyle } from "../components/pawzo-ui";
import { usePawzo } from "../lib/store";
import { validEmail, strongPassword } from "../login/page";

export default function SignupPage() {
  const router = useRouter();
  const { register } = usePawzo();
  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", pw: "", confirm: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [serverFieldError, setServerFieldError] = useState<{ field: string; msg: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setServerError("");
    setServerFieldError(null);
  };
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const errors = {
    name: form.name.trim() ? "" : "Please enter your name.",
    username: form.username.trim().length >= 3 ? "" : "Username needs at least 3 characters.",
    email: validEmail(form.email) ? "" : "Enter a valid email address.",
    pw: strongPassword(form.pw) ? "" : "8+ chars with an uppercase letter, a number and a symbol.",
    confirm: form.confirm === form.pw && form.confirm ? "" : "Passwords don't match yet.",
  };
  const canSubmit = agree && Object.values(errors).every((e) => !e);

  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, username: true, email: true, pw: true, confirm: true });
    if (!canSubmit) return;
    setLoading(true);
    const r = await register({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), password: form.pw });
    setLoading(false);
    if (!r.ok) {
      const msg = r.error ?? "Could not create account.";
      if (msg.toLowerCase().includes("username")) {
        setServerFieldError({ field: "username", msg: "Username already exists." });
      } else if (msg.toLowerCase().includes("email")) {
        setServerFieldError({ field: "email", msg: "Email already registered." });
      } else {
        setServerError(msg);
      }
      return;
    }
    router.push("/verify");
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", justifyContent: "center" }}>
      <div className="pawzo-paws" style={{ width: "100%", maxWidth: T.maxW, padding: "28px 24px 40px", backgroundColor: "var(--p-bg)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <PawzoLogo size={24} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 4px" }}>Create your account</h1>
        <p style={{ fontSize: 14, color: T.gray, textAlign: "center", margin: "0 0 24px" }}>Join thousands of happy pet parents</p>

        <form onSubmit={submit} noValidate>
          <FieldRow label="Full name" error={touched.name ? errors.name : ""}>
            <input style={inp(touched.name && errors.name)} placeholder="Buddy" value={form.name} onChange={set("name")} onBlur={blur("name")} />
          </FieldRow>
          <FieldRow label="Username" error={touched.username ? errors.username : (serverFieldError?.field === "username" ? serverFieldError.msg : "")}>
            <input style={inp((touched.username && errors.username) || (serverFieldError?.field === "username" ? "err" : ""))} placeholder="buddy_143" value={form.username} onChange={set("username")} onBlur={blur("username")} />
          </FieldRow>
          <FieldRow label="Email" error={touched.email ? errors.email : (serverFieldError?.field === "email" ? serverFieldError.msg : "")}>
            <input style={inp((touched.email && errors.email) || (serverFieldError?.field === "email" ? "err" : ""))} type="email" placeholder="buddy@gmail.com" value={form.email} onChange={set("email")} onBlur={blur("email")} />
          </FieldRow>
          <FieldRow label="Create password" error={touched.pw ? errors.pw : ""}>
            <input style={inp(touched.pw && errors.pw)} type="password" placeholder="At least 8 characters" value={form.pw} onChange={set("pw")} onBlur={blur("pw")} />
          </FieldRow>
          <FieldRow label="Confirm password" error={touched.confirm ? errors.confirm : ""}>
            <input style={inp(touched.confirm && errors.confirm)} type="password" placeholder="Re-enter password" value={form.confirm} onChange={set("confirm")} onBlur={blur("confirm")} />
          </FieldRow>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "8px 2px 18px", cursor: "pointer" }}>
            <span onClick={() => setAgree((a) => !a)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `2px solid ${agree ? T.pink : "#CBB8E0"}`, background: agree ? T.pink : "var(--p-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {agree && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </span>
            <span style={{ fontSize: 13, color: T.gray, lineHeight: 1.45 }}>
              I agree to the{" "}
              <Link href="/terms?ref=signup" style={{ color: T.pink, fontWeight: 700, textDecoration: "none" }}>Terms of Service</Link>
              {" & "}
              <Link href="/privacy?ref=signup" style={{ color: T.pink, fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Link>.
            </span>
          </label>

          {serverError && (
            <div style={{ background: T.dangerBg, color: T.danger, fontSize: 12.5, fontWeight: 600, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: "1px solid #F6C9CF" }}>{serverError}</div>
          )}

          <PrimaryButton full type="submit" disabled={!canSubmit || loading} style={{ height: 52 }}>{loading ? "Creating account…" : "Create account"}</PrimaryButton>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: T.gray, marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: T.pink, fontWeight: 800, textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: T.gray, marginBottom: 6 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", fontSize: 11.5, color: T.danger, marginTop: 5 }}>{error}</span>}
    </div>
  );
}

function inp(hasError?: string | false): React.CSSProperties {
  return { ...inputStyle, borderColor: hasError ? T.danger : "var(--p-border)" };
}
