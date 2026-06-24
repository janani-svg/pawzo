"use client";

/* PAWZO Profile — real user data from the store. Shows actual name, stats
   (pet count, memory count, streak). No hardcoded demo values. Logout wired
   to store.logout(). */

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, TopBar, SectionTitle, T, IconGear, ChevronRight, IconPlus } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fileToDataURL } from "../lib/store";

const SECTIONS = [
  { label: "Calendar & events", href: "/calendar" },
  { label: "Memory gallery", href: "/memories" },
  { label: "Emergency", href: "/emergency" },
  { label: "Settings", href: "/settings" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, currentUser, myPets, streak, streakBroken, logout, requestDeletion, updateUserPhoto, addDocument, removeDocument } = usePawzo();
  const [docUploading, setDocUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!ready || !authed) return null;

  const user = currentUser();
  const photoUrl = user?.photo ?? "";
  const pets = myPets();
  const petIds = new Set(pets.map((p) => p.id));
  const memCount = state.memories.filter((m) => petIds.has(m.petId)).length;
  const initial = (user?.name?.[0] ?? "U").toUpperCase();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateUserPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function doLogout() {
    logout();
    router.push("/login");
  }

  const DOC_CATEGORIES = ["Vaccination", "Insurance", "Adoption", "Medical Report", "ID", "Other"];
  const CAT_EMOJI: Record<string, string> = { Vaccination: "💉", Insurance: "🛡️", Adoption: "🏠", "Medical Report": "🩺", ID: "🪪", Other: "📄" };

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const fileData = await fileToDataURL(file, 1200);
      const name = file.name.replace(/\.[^.]+$/, "");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const cat = ext === "pdf" ? "Medical Report" : "Other";
      await addDocument({ name, category: cat, fileData, mimeType: file.type, uploadedAt: todayISO() });
    } finally {
      setDocUploading(false);
      if (docFileRef.current) docFileRef.current.value = "";
    }
  }

  return (
    <AppFrame>
      <TopBar
        title="Profile"
        back="/dashboard"
        right={
          <Link href="/settings" aria-label="Settings" style={{ color: T.grayLight, display: "flex" }}>
            <IconGear />
          </Link>
        }
      />

      <div style={{ padding: "4px 16px 0" }}>
        {/* header card — solid fill only, no gradient */}
        <div style={{ background: T.petPink, borderRadius: 22, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          {/* avatar with camera badge on bottom-right */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 70, height: 70, borderRadius: "50%", background: T.pink,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 28, fontWeight: 800, overflow: "hidden",
            }}>
              {photoUrl
                ? <img src={photoUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initial}
            </div>
            {/* camera badge */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              style={{
                position: "absolute", bottom: 0, right: 0,
                background: "none", border: "none",
                cursor: "pointer", padding: 0, fontSize: 16, lineHeight: 1,
              }}
            >
              📷
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: T.pinkDeep }}>{user?.name ?? "—"}</p>
            <p style={{ fontSize: 12.5, color: T.gray }}>@{user?.username ?? "—"}</p>
            <p style={{ fontSize: 11.5, color: T.gray, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? ""}</p>
          </div>
        </div>

        {/* real stats */}
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          {[
            { label: "Pets", value: String(pets.length) },
            { label: "Memories", value: String(memCount) },
            { label: "Day streak", value: streakBroken() ? "💔" : streak() === 0 ? "0" : `🔥 ${streak()}` },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "var(--p-surface)", borderRadius: 16, padding: "14px 8px", textAlign: "center", boxShadow: T.shadowSoft }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: T.pinkDeep }}>{s.value}</p>
              <p style={{ fontSize: 11, color: T.grayLight, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Document Vault */}
        <SectionTitle>Document Vault</SectionTitle>
        <input ref={docFileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleDocUpload} />
        <button
          onClick={() => docFileRef.current?.click()}
          disabled={docUploading}
          className="pawzo-press"
          style={{ width: "100%", height: 50, borderRadius: 14, border: "1.5px dashed #D9B8EC", background: "var(--p-surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.pink, marginBottom: 10, fontWeight: 700, fontSize: 13.5 }}
        >
          <IconPlus color={T.pink} size={16} /> {docUploading ? "Uploading…" : "Upload document"}
        </button>
        {state.documents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
            {state.documents.map((doc) => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 14, padding: "11px 14px", boxShadow: T.shadowSoft }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: T.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {CAT_EMOJI[doc.category] ?? "📄"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{doc.name}</p>
                  <p style={{ fontSize: 11, color: T.grayLight, margin: "2px 0 0" }}>{doc.category} · {doc.uploadedAt}</p>
                </div>
                <a href={doc.fileData} download={doc.name} style={{ width: 30, height: 30, borderRadius: 9, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }} title="Download">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
                <button onClick={() => removeDocument(doc.id)} aria-label="Delete" className="pawzo-press" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: T.dangerBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {state.documents.length === 0 && (
          <p style={{ fontSize: 12, color: T.grayLight, textAlign: "center", margin: "0 0 10px" }}>No documents yet — upload vaccination certs, insurance, adoption papers &amp; more.</p>
        )}

        {/* navigation links */}
        <SectionTitle>More</SectionTitle>
        <div style={{ background: "var(--p-surface)", borderRadius: 18, boxShadow: T.shadowSoft, overflow: "hidden" }}>
          {SECTIONS.map((s, i) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div
                className="pawzo-press"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  borderBottom: i === SECTIONS.length - 1 ? "none" : "1px solid var(--p-border)",
                  cursor: "pointer",
                }}
              >
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>{s.label}</span>
                <ChevronRight color={T.grayLight} />
              </div>
            </Link>
          ))}
        </div>

        <button
          className="pawzo-press"
          onClick={doLogout}
          style={{ marginTop: 14, width: "100%", textAlign: "center", padding: "14px", borderRadius: 16, background: "var(--p-surface)", color: T.danger, fontWeight: 800, fontSize: 14, boxShadow: T.shadowSoft, cursor: "pointer", border: "none" }}
        >
          Log out
        </button>

        <button
          className="pawzo-press"
          onClick={() => setConfirmDelete(true)}
          style={{ marginTop: 10, width: "100%", textAlign: "center", padding: "13px", borderRadius: 16, background: "transparent", color: T.grayLight, fontWeight: 600, fontSize: 13, cursor: "pointer", border: `1.5px solid var(--p-border)` }}
        >
          Delete account
        </button>

        <p style={{ textAlign: "center", fontSize: 11, color: T.grayLight, margin: "14px 0 6px" }}>Pawzo v1.0</p>

        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
            <div style={{ background: "var(--p-surface)", borderRadius: 22, padding: 24, width: "100%", maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize: 36, textAlign: "center", marginBottom: 10 }}>⚠️</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 8px" }}>Delete your account?</p>
              <p style={{ fontSize: 13, color: T.gray, textAlign: "center", lineHeight: 1.55, margin: "0 0 6px" }}>
                You will be logged out immediately and <b>cannot log in for 7 days</b>.
              </p>
              <p style={{ fontSize: 13, color: T.gray, textAlign: "center", lineHeight: 1.55, margin: "0 0 20px" }}>
                All your data will be <b>permanently deleted after 30 days</b>. You can cancel within the first 7 days from the login screen.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmDelete(false)} className="pawzo-press" style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 13.5, fontWeight: 700, color: T.gray, cursor: "pointer" }}>Cancel</button>
                <button
                  disabled={deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    try { await requestDeletion(); } catch { /* ignore */ }
                    logout();
                    router.replace("/login");
                  }}
                  className="pawzo-press"
                  style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: T.danger, fontSize: 13.5, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: deleteLoading ? 0.6 : 1 }}
                >
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </AppFrame>
  );
}
