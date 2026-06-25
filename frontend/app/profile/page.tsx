"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
// Note: confetti + badge toast live on the dashboard page only.
import { AppFrame, BottomNav, TopBar, SectionTitle, T, IconGear, IconPlus } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fileToDataURL } from "../lib/store";

const CAT_EMOJI: Record<string, string> = { Vaccination: "💉", Insurance: "🛡️", Adoption: "🏠", "Medical Report": "🩺", ID: "🪪", Other: "📄" };


/* ── Badge row ── */
type BadgeState = "earned" | "just_earned" | "next" | "locked";
function Badge({ emoji, name, desc, state, hint }: { emoji:string; name:string; desc:string; state:BadgeState; hint?:string }) {
  const styles: Record<BadgeState, { card:React.CSSProperties; wrap:React.CSSProperties; nameColor:string; descColor:string }> = {
    earned:      { card:{ background:"#FFF6EE", border:"1px solid #F0D8C0" },               wrap:{ background:"#FFE8D0" }, nameColor:"#3D1D54", descColor:"#A080B0" },
    just_earned: { card:{ background:"#FDF6FF", border:"1px solid #DCC8F0", boxShadow:"0 0 0 2px #F0C8E8,0 2px 10px rgba(192,96,160,0.16)" }, wrap:{ background:"#EEE0FF" }, nameColor:"#3D1D54", descColor:"#9060B0" },
    next:        { card:{ background:"#F8F8FA", border:"1px solid #E8E4EE", opacity:0.65 }, wrap:{ background:"#EEEAEE" }, nameColor:"#9898A8", descColor:"#BEBAC8" },
    locked:      { card:{ background:"#F8F8FA", border:"1px solid #E8E4EE", opacity:0.35 }, wrap:{ background:"#EEEAEE" }, nameColor:"#AEAAB8", descColor:"#C4C0CC" },
  };
  const s = styles[state];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:13, ...s.card }}>
      <div style={{ width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0, ...s.wrap }}>{emoji}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12.5, fontWeight:700, color:s.nameColor, margin:"0 0 1px" }}>{name}</p>
        <p style={{ fontSize:10, color:s.descColor, margin:0 }}>{hint ?? desc}</p>
      </div>
      {state==="earned"      && <span style={{ fontSize:9, fontWeight:700, color:"#74B08A", background:"#EAF7EF", padding:"2px 8px", borderRadius:20, flexShrink:0 }}>Earned</span>}
      {state==="just_earned" && <span style={{ fontSize:9, fontWeight:700, color:"#C060A0", background:"#FDF0FF", padding:"2px 8px", borderRadius:20, flexShrink:0 }}>Just earned!</span>}
      {state==="next"        && <span style={{ fontSize:9, fontWeight:700, color:"#9060C0", background:"#F5EEFF", padding:"2px 8px", borderRadius:20, flexShrink:0 }}>Next up</span>}
      {state==="locked"      && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8C0D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", color:"#C0A0D0", margin:"0 0 8px" }}>{children}</p>;
}
function Divider() {
  return <div style={{ height:1, background:"#F3EEF8", margin:"12px 0" }} />;
}

const STREAK_BASE = [2, 5, 10];
function getStreakMilestones(currentStreak: number): number[] {
  const ms = [...STREAK_BASE];
  let n = 30;
  // always include up to 2 locked milestones beyond current streak
  while (n <= currentStreak + 60) { ms.push(n); n += 30; }
  return ms;
}
function streakMeta(m: number): { emoji: string; name: string; desc: string } {
  if (m === 2)  return { emoji:"🌱", name:"2-Day Streak",    desc:"The journey begins!" };
  if (m === 5)  return { emoji:"⭐", name:"5-Day Streak",    desc:"Building a habit!" };
  if (m === 10) return { emoji:"💫", name:"10-Day Streak",   desc:"Double digits!" };
  const months = m / 30;
  const emojis = ["🔥","🏅","🏆","👑","💎","🌙","🌟","🚀","🦁","🐉"];
  const emoji = emojis[Math.min(Math.floor((m-30)/30), emojis.length-1)];
  const desc = months === 1 ? "One whole month — incredible!" : months === 2 ? "Two months of dedication!" : months === 3 ? "A whole quarter — legendary!" : `${months} months strong. Unstoppable!`;
  return { emoji, name:`${m}-Day Streak`, desc };
}

const MEM_MILESTONES = [1,10,20,30,40,50,100];
const MEM_META: Record<number,{ emoji:string; name:string; desc:string }> = {
  1:   { emoji:"📷", name:"First Snap",    desc:"Captured your first memory" },
  10:  { emoji:"🌸", name:"10 Memories",   desc:"Your gallery is growing!" },
  20:  { emoji:"🎞️", name:"20 Memories",  desc:"Almost a photo album!" },
  30:  { emoji:"🎨", name:"30 Memories",   desc:"A beautiful collection!" },
  40:  { emoji:"🌺", name:"40 Memories",   desc:"Memories for days!" },
  50:  { emoji:"🎬", name:"50 Memories",   desc:"Half a century of moments!" },
  100: { emoji:"🌟", name:"100 Memories",  desc:"The ultimate memory keeper" },
};

function badgeState(value: number, milestone: number, prevMilestone: number, justEarnedMilestone: number | null): BadgeState {
  if (value >= milestone) return milestone === justEarnedMilestone ? "just_earned" : "earned";
  if (value >= prevMilestone) return "next";
  return "locked";
}

export default function ProfilePage() {
  const { ready, authed } = useRequireAuth();
  const { state, currentUser, myPets, streak, streakBroken, updateUserPhoto, addDocument, removeDocument, renameDocument } = usePawzo();
  const [docUploading, setDocUploading] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [docDeleteId, setDocDeleteId] = useState<string | null>(null);
  const [docDeleteConfirm, setDocDeleteConfirm] = useState(false);
  const [docRenameId, setDocRenameId] = useState<string | null>(null);
  const [docRenameName, setDocRenameName] = useState("");
  const [justEarnedStreak, setJustEarnedStreak] = useState<number | null>(null);
  const [justEarnedMem, setJustEarnedMem] = useState<number | null>(null);
  const [justEarnedPet, setJustEarnedPet] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync localStorage on mount so the dashboard can detect newly-earned badges.
  // Also set just_earned glow state for badges earned since last profile visit.
  useEffect(() => {
    if (!authed) return;
    const currentPets     = myPets();
    const currentStreak   = streakBroken() ? 0 : streak();
    const pIds            = new Set(currentPets.map((p) => p.id));
    const currentMemCount = state.memories.filter((m) => pIds.has(m.petId)).length;

    // Profile only READS — dashboard is the sole writer of these keys
    const prevStreak = parseInt(localStorage.getItem("pawzo_cel_streak") ?? "0", 10);
    const prevMem    = parseInt(localStorage.getItem("pawzo_cel_mem")    ?? "0", 10);
    const prevPets   = parseInt(localStorage.getItem("pawzo_cel_pets")   ?? "0", 10);

    const crossedStreak = getStreakMilestones(currentStreak).filter(m => prevStreak < m && currentStreak >= m);
    const crossedMem    = MEM_MILESTONES.filter(m => prevMem < m && currentMemCount >= m);
    if (crossedStreak.length) setJustEarnedStreak(Math.max(...crossedStreak));
    if (crossedMem.length)    setJustEarnedMem(Math.max(...crossedMem));
    if (currentPets.length >= 1 && prevPets < 1) setJustEarnedPet(true);
    // no localStorage writes here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!ready || !authed) return null;

  const user = currentUser();
  const photoUrl = user?.photo ?? "";
  const pets = myPets();
  const petIds = new Set(pets.map((p) => p.id));
  const memCount = state.memories.filter((m) => petIds.has(m.petId)).length;
  const currentStreak = streakBroken() ? 0 : streak();
  const initial = (user?.name?.[0] ?? "U").toUpperCase();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateUserPhoto(reader.result as string); };
    reader.readAsDataURL(file);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const isImage = file.type.startsWith("image/");
      let fileData: string;
      if (isImage) {
        fileData = await fileToDataURL(file, 1200);
      } else {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const name = file.name.replace(/\.[^.]+$/, "");
      await addDocument({ name, category: "Other", fileData, mimeType: file.type, uploadedAt: todayISO() });
    } finally {
      setDocUploading(false);
      if (docFileRef.current) docFileRef.current.value = "";
    }
  }

  const filteredDocs = state.documents.filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase()));

  // ── Streak milestones ──
  const STREAK_MILESTONES = getStreakMilestones(currentStreak); // full list for the badge column
  const doneStreakCount = STREAK_MILESTONES.filter(m => currentStreak >= m).length;

  // next unreached milestone (drives the "X / Y days to next" label)
  let nextStreakIdx = STREAK_MILESTONES.findIndex(m => currentStreak < m);
  if (nextStreakIdx === -1) nextStreakIdx = STREAK_MILESTONES.length - 1;
  const nextStreakMs = STREAK_MILESTONES[nextStreakIdx];

  // Progress bar = a sliding window of milestones around current progress, so the
  // fill keeps moving and the window scrolls forward as the streak passes 60, 120…
  const BAR_WINDOW = 6;
  let winStart = Math.max(0, nextStreakIdx - 2);
  const winEnd  = Math.min(STREAK_MILESTONES.length, winStart + BAR_WINDOW);
  winStart = Math.max(0, winEnd - BAR_WINDOW);
  const barMs    = STREAK_MILESTONES.slice(winStart, winEnd);
  const barN     = barMs.length;
  const barLow   = winStart > 0 ? STREAK_MILESTONES[winStart - 1] : 0; // implicit left edge
  const barBounds = [barLow, ...barMs]; // value boundaries, evenly spaced across the bar
  const sClamped = Math.min(Math.max(currentStreak, barLow), barMs[barN - 1]);
  // fill: walk segments by day-value, but place the result on the even index scale
  let barSeg = 0;
  while (barSeg < barN && sClamped >= barBounds[barSeg + 1]) barSeg++;
  const streakBarPct = barSeg >= barN
    ? 100
    : ((barSeg + (sClamped - barBounds[barSeg]) / (barBounds[barSeg + 1] - barBounds[barSeg])) / barN) * 100;

  // mem progress bar
  const memMilestoneIdx = MEM_MILESTONES.findIndex(m => memCount < m);
  const prevMemMs = memMilestoneIdx > 0 ? MEM_MILESTONES[memMilestoneIdx-1] : 0;
  const nextMemMs = memMilestoneIdx >= 0 ? MEM_MILESTONES[memMilestoneIdx] : MEM_MILESTONES[MEM_MILESTONES.length-1];
  const memBarPct = memMilestoneIdx < 0 ? 100 : Math.min(100, ((memCount - prevMemMs) / (nextMemMs - prevMemMs)) * 100);

  const totalEarned = doneStreakCount + (pets.length >= 1 ? 1 : 0) + (pets.length >= 3 ? 1 : 0) + MEM_MILESTONES.filter(m => memCount >= m).length;

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

        {/* ── Profile card ── */}
        <div style={{ background:"linear-gradient(135deg,#FDE8EF 0%,#F9D8E6 100%)", borderRadius:22, padding:"18px 16px", display:"flex", alignItems:"center", gap:15, boxShadow:"0 4px 16px rgba(209,112,150,0.13)" }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:76, height:76, borderRadius:"50%", background:"#E8A0BD", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:30, fontWeight:700, overflow:"hidden", border:"2.5px solid rgba(255,255,255,0.8)" }}>
              {photoUrl ? <img src={photoUrl} alt="profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : initial}
            </div>
            <button onClick={() => fileRef.current?.click()} aria-label="Change profile photo" style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:"#fff", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 5px rgba(0,0,0,0.13)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C060A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoChange} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:17, fontWeight:700, color:"#7A3050", margin:"0 0 3px" }}>{user?.name ?? "—"}</p>
            <p style={{ fontSize:12, color:"#B07090", margin:"0 0 2px", fontWeight:500 }}>@{user?.username ?? "—"}</p>
            <p style={{ fontSize:11, color:"#C090A8", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email ?? ""}</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display:"flex", gap:9, margin:"11px 0" }}>
          {[
            { label:"Pets",       value:String(pets.length),  bg:"#FFF9F0", shadow:"rgba(180,120,40,0.09)",  numColor:"#C08030", lblColor:"#D0A060" },
            { label:"Memories",   value:String(memCount),      bg:"#FFF2F5", shadow:"rgba(200,80,120,0.09)", numColor:"#C05A80", lblColor:"#D080A0" },
            { label:"Day Streak", value:streakBroken() ? "💔" : currentStreak === 0 ? "0" : `🔥 ${currentStreak}`, bg:"#FFF4EE", shadow:"rgba(200,100,40,0.09)", numColor:"#C06030", lblColor:"#D08060" },
          ].map(s => (
            <div key={s.label} style={{ flex:1, borderRadius:16, padding:"13px 6px 11px", textAlign:"center", background:s.bg, boxShadow:`0 2px 8px ${s.shadow}` }}>
              <p style={{ fontSize:22, fontWeight:700, color:s.numColor, lineHeight:1, margin:"0 0 4px" }}>{s.value}</p>
              <p style={{ fontSize:10, fontWeight:600, color:s.lblColor, textTransform:"uppercase", letterSpacing:"0.4px", margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Document Vault ── */}
        <SectionTitle>Document Vault</SectionTitle>
        <input ref={docFileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.odt,.rtf" style={{ display:"none" }} onChange={handleDocUpload} />

        <div style={{ background:"var(--p-surface)", borderRadius:20, boxShadow:"0 3px 14px rgba(0,0,0,0.07)", overflow:"hidden", marginBottom:4 }}>
          <div style={{ padding:"14px 16px 12px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid #F3E8F0" }}>
            <div style={{ width:42, height:42, borderRadius:13, background:"#FCEAF3", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C060A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:15, fontWeight:700, color:"#3D1D54", margin:"0 0 2px" }}>Document Vault</p>
              <p style={{ fontSize:11, color:"#B090C0", margin:0 }}>Vaccination · Insurance · Adoption &amp; more</p>
            </div>
          </div>

          <div style={{ padding:"13px 16px" }}>
            <button onClick={() => docFileRef.current?.click()} disabled={docUploading} className="pawzo-press" style={{ width:"100%", padding:"12px 0", borderRadius:13, border:"1.5px dashed #D9B8EC", background:"#FDF7FF", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#B060A0", fontWeight:600, fontSize:13 }}>
              <IconPlus color="#B060A0" size={15} />
              {docUploading ? "Uploading…" : "Upload Document"}
            </button>
          </div>

          {state.documents.length > 0 && (
            <div style={{ padding:"0 16px 10px" }}>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.grayLight} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input placeholder="Search documents…" value={docSearch} onChange={e => setDocSearch(e.target.value)} style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px 8px 30px", borderRadius:10, border:"1.5px solid var(--p-border)", background:"var(--p-surface-2)", fontSize:12.5, color:T.ink, outline:"none" }} />
              </div>
            </div>
          )}

          {state.documents.length === 0 && (
            <div style={{ padding:"6px 20px 20px", textAlign:"center" }}>
              <div style={{ width:46, height:46, borderRadius:14, background:"#FDF2F6", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <p style={{ fontSize:13, fontWeight:700, color:"#5A3070", margin:"0 0 5px" }}>No documents yet</p>
              <p style={{ fontSize:11, color:"#B090C0", lineHeight:1.55, margin:0 }}>Keep vaccination certs, insurance &amp;<br />adoption papers safe here.</p>
            </div>
          )}

          {state.documents.length > 0 && filteredDocs.length === 0 && (
            <p style={{ fontSize:12, color:T.grayLight, textAlign:"center", padding:"18px 16px", margin:0 }}>No documents match &ldquo;{docSearch}&rdquo;.</p>
          )}

          {filteredDocs.length > 0 && (
            <div style={{ maxHeight:168, overflowY:"auto" }}>
              {filteredDocs.map((doc, idx) => (
                <div key={doc.id} style={{ padding:"11px 14px", borderBottom: idx < filteredDocs.length-1 ? "1px solid var(--p-border)" : "none" }}>
                  {docRenameId === doc.id ? (
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <input autoFocus value={docRenameName} onChange={e => setDocRenameName(e.target.value)} onKeyDown={e => { if (e.key==="Enter") { renameDocument(doc.id, docRenameName.trim()||doc.name); setDocRenameId(null); } if (e.key==="Escape") setDocRenameId(null); }} style={{ flex:1, fontSize:13, fontWeight:700, color:T.ink, border:"1.5px solid #D9B8EC", borderRadius:8, padding:"5px 8px", background:"var(--p-surface-2)", outline:"none" }} />
                      <button onClick={() => { renameDocument(doc.id, docRenameName.trim()||doc.name); setDocRenameId(null); }} style={{ padding:"5px 10px", borderRadius:8, border:"none", background:T.pink, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Save</button>
                      <button onClick={() => setDocRenameId(null)} style={{ padding:"5px 8px", borderRadius:8, border:"1.5px solid var(--p-border)", background:"var(--p-surface-2)", fontSize:12, fontWeight:700, color:T.gray, cursor:"pointer" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:T.primarySoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{CAT_EMOJI[doc.category] ?? "📄"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:T.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", margin:0 }}>{doc.name}</p>
                        <p style={{ fontSize:10.5, color:T.grayLight, margin:"1px 0 0" }}>{doc.category} · {doc.uploadedAt}</p>
                      </div>
                      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                        <button onClick={() => { setDocRenameId(doc.id); setDocRenameName(doc.name); }} className="pawzo-press" title="Rename" style={{ width:28, height:28, borderRadius:8, border:"1.5px solid var(--p-border)", background:"var(--p-surface-2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.gray} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <a href={doc.fileData} download={doc.name} className="pawzo-press" title="Download" style={{ width:28, height:28, borderRadius:8, background:"#EFF6FF", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </a>
                        <button onClick={() => setDocDeleteId(doc.id)} className="pawzo-press" title="Delete" style={{ width:28, height:28, borderRadius:8, border:"none", background:T.dangerBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* doc delete modal */}
        {docDeleteId && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px" }}>
            <div style={{ background:"var(--p-surface)", borderRadius:22, padding:24, width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize:36, textAlign:"center", marginBottom:10 }}>🗑️</div>
              {!docDeleteConfirm ? (
                <>
                  <p style={{ fontSize:15, fontWeight:800, color:T.ink, textAlign:"center", margin:"0 0 8px" }}>Delete this document?</p>
                  <p style={{ fontSize:13, color:T.gray, textAlign:"center", margin:"0 0 20px" }}>&ldquo;{state.documents.find(d=>d.id===docDeleteId)?.name}&rdquo; will be permanently removed.</p>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => setDocDeleteId(null)} className="pawzo-press" style={{ flex:1, padding:"12px 0", borderRadius:14, border:"1.5px solid var(--p-border)", background:"var(--p-surface-2)", fontSize:13.5, fontWeight:700, color:T.gray, cursor:"pointer" }}>Cancel</button>
                    <button onClick={() => setDocDeleteConfirm(true)} className="pawzo-press" style={{ flex:1, padding:"12px 0", borderRadius:14, border:"none", background:T.danger, fontSize:13.5, fontWeight:800, color:"#fff", cursor:"pointer" }}>Yes, delete</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize:15, fontWeight:800, color:T.ink, textAlign:"center", margin:"0 0 8px" }}>Are you absolutely sure?</p>
                  <p style={{ fontSize:13, color:T.gray, textAlign:"center", margin:"0 0 20px" }}>This action cannot be undone.</p>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => { setDocDeleteId(null); setDocDeleteConfirm(false); }} className="pawzo-press" style={{ flex:1, padding:"12px 0", borderRadius:14, border:"1.5px solid var(--p-border)", background:"var(--p-surface-2)", fontSize:13.5, fontWeight:700, color:T.gray, cursor:"pointer" }}>Cancel</button>
                    <button onClick={() => { removeDocument(docDeleteId); setDocDeleteId(null); setDocDeleteConfirm(false); }} className="pawzo-press" style={{ flex:1, padding:"12px 0", borderRadius:14, border:"none", background:T.danger, fontSize:13.5, fontWeight:800, color:"#fff", cursor:"pointer" }}>Delete forever</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Achievements ── */}
        <SectionTitle>Achievements &amp; Milestones</SectionTitle>
        <div style={{ background:"var(--p-surface)", borderRadius:20, boxShadow:"0 3px 14px rgba(0,0,0,0.07)", padding:16, marginBottom:4 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <p style={{ fontSize:15, fontWeight:700, color:"#3D1D54", margin:0 }}>Your badges</p>
            <span style={{ fontSize:11, fontWeight:600, color:"#B090C0", background:"#F5EEF8", padding:"3px 10px", borderRadius:20 }}>{totalEarned} earned</span>
          </div>

          {/* streak section */}
          <SubLabel>🔥 Streak</SubLabel>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
              <span style={{ fontSize:10, fontWeight:600, color:"#9B7CA8" }}>Streak journey</span>
              <span style={{ fontSize:9.5, color:"#C0A0C8" }}>
                {currentStreak >= nextStreakMs ? `${currentStreak} days — top streak!` : `${currentStreak} / ${nextStreakMs} days to next`}
              </span>
            </div>
            <div style={{ position:"relative", height:5, background:"#F0E8F5", borderRadius:3, margin:"8px 0 4px" }}>
              <div style={{ position:"absolute", left:0, top:0, height:5, borderRadius:3, width:`${streakBarPct}%`, background:"linear-gradient(90deg,#E8A0C0,#C060A0)", transition:"width 0.4s ease" }} />
              {barMs.map((m, i) => {
                const pct = ((i + 1) / barN) * 100;
                const done = currentStreak >= m;
                return <div key={m} style={{ position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background: done ? "#C060A0" : "#E0D0EA", border:"2px solid #fff", boxShadow: done ? "0 0 0 3px rgba(192,96,160,0.2)" : "none" }} />;
              })}
            </div>
            <div style={{ position:"relative", height:11 }}>
              {barMs.map((m, i) => {
                const pct = ((i + 1) / barN) * 100;
                const done = currentStreak >= m;
                return <span key={m} style={{ position:"absolute", left:`${pct}%`, transform:"translateX(-50%)", fontSize:8.5, fontWeight: done ? 700 : 600, color: done ? "#C060A0" : "#C0A8D0", whiteSpace:"nowrap" }}>{m}d</span>;
              })}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {STREAK_MILESTONES.map((m, i) => {
              const prev = i > 0 ? STREAK_MILESTONES[i-1] : 0;
              const st = badgeState(currentStreak, m, prev, justEarnedStreak);
              const meta = streakMeta(m);
              const hint = st === "next" ? `${m - currentStreak} more days to unlock` : undefined;
              return <Badge key={m} emoji={meta.emoji} name={meta.name} desc={meta.desc} state={st} hint={hint} />;
            })}
          </div>

          <Divider />

          {/* pets section */}
          <SubLabel>🐾 Pets</SubLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            <Badge emoji="🏆" name="First Pet Added" desc="You started your Pawzo journey!" state={pets.length >= 1 ? (justEarnedPet ? "just_earned" : "earned") : "next"} />
            <Badge emoji="🐶" name="Pet Family" desc="Added 3 pets" state={pets.length >= 3 ? "earned" : pets.length >= 1 ? "next" : "locked"} hint={pets.length < 3 ? `${3 - pets.length} more pets to unlock` : undefined} />
          </div>

          <Divider />

          {/* memories section */}
          <SubLabel>📸 Memories</SubLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:2 }}>
            {MEM_MILESTONES.map((m, i) => {
              const prev = i > 0 ? MEM_MILESTONES[i-1] : 0;
              const st = badgeState(memCount, m, prev, justEarnedMem);
              const meta = MEM_META[m];
              const hint = st === "next" ? `${m - memCount} more memories to unlock` : undefined;
              return <Badge key={m} emoji={meta.emoji} name={meta.name} desc={meta.desc} state={st} hint={hint} />;
            })}
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:T.grayLight, margin:"14px 0 6px" }}>Pawzo v1.0</p>
      </div>

      <BottomNav />
    </AppFrame>
  );
}
