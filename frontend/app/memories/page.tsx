"use client";

/* PAWZO Memory Journal — journal timeline, AI mood detection, mood collections,
   custom folders, search & filter. */

import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, T, IconPlus, inputStyle } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, fileToDataURL } from "../lib/store";

/* ── Mood catalogue ───────────────────────────────────────────────────────── */

export const MOODS = [
  { key: "Happy",        emoji: "😊", label: "Happy Memories",       bg: "#FEF9C3", border: "#FDE047" },
  { key: "Playful",      emoji: "🎾", label: "Playful Moments",      bg: "#DCFCE7", border: "#86EFAC" },
  { key: "Anxious",      emoji: "😟", label: "Anxious Moments",      bg: "#FEF3C7", border: "#FCD34D" },
  { key: "Sick",         emoji: "🤒", label: "Health & Recovery",    bg: "#FFE4E6", border: "#FCA5A5" },
  { key: "Sleepy",       emoji: "😴", label: "Sleepy Times",         bg: "#E0E7FF", border: "#A5B4FC" },
  { key: "Affectionate", emoji: "🥰", label: "Affectionate Moments", bg: "#FBCFE8", border: "#F9A8D4" },
  { key: "Curious",      emoji: "🤔", label: "Curious Adventures",   bg: "#FEF3C7", border: "#FCD34D" },
  { key: "Relaxed",      emoji: "😎", label: "Relaxed Vibes",        bg: "#D1FAE5", border: "#6EE7B7" },
  { key: "Angry",        emoji: "😡", label: "Angry Moments",        bg: "#FEE2E2", border: "#FCA5A5" },
  { key: "Scared",       emoji: "😨", label: "Scared Moments",       bg: "#EFF6FF", border: "#93C5FD" },
  { key: "Hungry",       emoji: "🍽️", label: "Hungry Times",         bg: "#FFFBEB", border: "#FDE68A" },
  { key: "Energetic",    emoji: "🏃", label: "Energetic Moments",    bg: "#F0FDF4", border: "#86EFAC" },
  { key: "Excited",      emoji: "🎉", label: "Excited Moments",      bg: "#FDF4FF", border: "#E879F9" },
];

function moodFor(key: string) { return MOODS.find((m) => m.key === key); }

/* ── Custom folder helpers ────────────────────────────────────────────────── */

type Folder = { id: string; emoji: string; name: string };
const FOLDERS_KEY = "pawzo:memory-folders";

function loadFolders(): Folder[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) ?? "[]"); } catch { return []; }
}
function persistFolders(f: Folder[]) { localStorage.setItem(FOLDERS_KEY, JSON.stringify(f)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function memTags(tags: string) { return tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : []; }
function userTags(tags: string) { return memTags(tags).filter((t) => !t.startsWith("folder:")); }
function folderIds(tags: string) { return memTags(tags).filter((t) => t.startsWith("folder:")).map((t) => t.slice(7)); }

/* ── Video thumbnail helper ───────────────────────────────────────────────── */

function videoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadeddata = () => { video.currentTime = 0.5; };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 360;
      canvas.getContext("2d")?.drawImage(video, 0, 0, 640, 360);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
  });
}

/* ── Checkmark SVG ────────────────────────────────────────────────────────── */

const Tick = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtMemDate(date: string, long = false) {
  const d = new Date(date + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: long ? "long" : "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}

export default function MemoriesPage() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, myPets, add, remove, update } = usePawzo();

  const [tab, setTab]               = useState<"journal" | "moods" | "folders">("journal");
  const [filterPet, setFilterPet]   = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [folders, setFolders]         = useState<Folder[]>(loadFolders);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen]   = useState(false);
  const [newFolderName, setNewFolderName]   = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");

  const pets = ready ? myPets() : [];

  // useMemo must be before any early return (Rules of Hooks)
  const { allMems, filtered } = useMemo(() => {
    const all = state.memories
      .filter((m) => pets.some((p) => p.id === m.petId))
      .sort((a, b) => b.date.localeCompare(a.date) || b.timeTaken.localeCompare(a.timeTaken));
    let ms = all;
    if (filterPet)    ms = ms.filter((m) => m.petId === filterPet);
    if (filterMood)   ms = ms.filter((m) => m.mood === filterMood);
    if (filterFolder) ms = ms.filter((m) => folderIds(m.tags).includes(filterFolder!));
    if (search) {
      const q = search.toLowerCase();
      ms = ms.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        m.caption.toLowerCase().includes(q) ||
        m.tags.toLowerCase().includes(q)
      );
    }
    return { allMems: all, filtered: ms };
  }, [state.memories, state.pets, filterPet, filterMood, filterFolder, search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !authed) return null;

  // group journal by date
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((m) => { (groups[m.date] ??= []).push(m); });
  const groupDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const moodCounts: Record<string, number> = {};
  allMems.forEach((m) => { if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1; });

  const folderCounts: Record<string, number> = {};
  folders.forEach((f) => { folderCounts[f.id] = allMems.filter((m) => folderIds(m.tags).includes(f.id)).length; });

  const selectedMem = selectedId ? allMems.find((m) => m.id === selectedId) ?? null : null;
  const selectedPet = selectedMem ? pets.find((p) => p.id === selectedMem.petId) ?? null : null;

  function saveFolder() {
    if (!newFolderName.trim()) return;
    const next = [...folders, { id: uid(), emoji: newFolderEmoji, name: newFolderName.trim() }];
    setFolders(next); persistFolders(next);
    setNewFolderName(""); setNewFolderEmoji("📁"); setNewFolderOpen(false);
  }

  function deleteFolder(id: string) {
    const next = folders.filter((f) => f.id !== id);
    setFolders(next); persistFolders(next);
    if (activeFolderId === id) setActiveFolderId(null);
    allMems
      .filter((m) => folderIds(m.tags).includes(id))
      .forEach((m) => update("memories", m.id, { tags: memTags(m.tags).filter((t) => t !== `folder:${id}`).join(",") }));
  }

  function toggleFolder(mem: typeof allMems[0], fid: string) {
    const cur = memTags(mem.tags);
    const tag = `folder:${fid}`;
    const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
    update("memories", mem.id, { tags: next.join(",") });
  }

  function clearFilters() { setFilterMood(null); setFilterFolder(null); setFilterPet(null); setSearch(""); }

  function startLongPress(id: string) {
    longPressTimer.current = setTimeout(() => setLongPressId(id), 600);
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  return (
    <AppFrame>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--p-bg)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} aria-label="Back" className="pawzo-press" style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0 }}>Memories ✨</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSearchOpen((o) => !o)} aria-label="Search" className="pawzo-press" style={iconBtn}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={T.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button onClick={() => setAddOpen(true)} aria-label="Add memory" className="pawzo-press" style={{ ...iconBtn, background: T.pink }}>
            <IconPlus color="#fff" size={18} />
          </button>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      {searchOpen && (
        <div style={{ padding: "0 16px 10px" }}>
          <input autoFocus style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} placeholder="Search by title, notes, tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", margin: "0 16px 14px", background: "var(--p-surface-2)", borderRadius: 14, padding: 3 }}>
        {(["journal", "moods", "folders"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t !== "journal") { setFilterMood(null); setFilterFolder(null); } setActiveFolderId(null); }} className="pawzo-press" style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "none", fontWeight: 700, fontSize: 12.5, cursor: "pointer", background: tab === t ? T.pink : "transparent", color: tab === t ? "#fff" : T.grayLight }}>
            {t === "journal" ? "📖 Journal" : t === "moods" ? "🎭 Moods" : "📁 Folders"}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 16px 80px" }}>

        {/* ═══════════ JOURNAL TAB ═══════════════════════════════════ */}
        {tab === "journal" && (
          <>
            {/* Pet chips */}
            {pets.length > 1 && (
              <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
                {[{ id: null, name: "All" }, ...pets].map((p) => (
                  <button key={p.id ?? "all"} onClick={() => setFilterPet(p.id)} className="pawzo-press" style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${filterPet === p.id ? T.pink : "transparent"}`, background: filterPet === p.id ? T.primarySoft : "var(--p-surface)", fontWeight: 700, fontSize: 12, color: filterPet === p.id ? T.pinkDeep : T.gray, cursor: "pointer" }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active filter badges */}
            {(filterMood || filterFolder) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: T.grayLight, fontWeight: 600 }}>Filtering:</span>
                {filterMood && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, background: T.primarySoft, border: `1px solid ${T.pink}`, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: T.pinkDeep }}>
                    {moodFor(filterMood)?.emoji} {filterMood}
                    <button onClick={() => setFilterMood(null)} style={{ border: "none", background: "transparent", color: T.pinkDeep, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 13 }}>✕</button>
                  </span>
                )}
                {filterFolder && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, background: T.primarySoft, border: `1px solid ${T.pink}`, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: T.pinkDeep }}>
                    {folders.find((f) => f.id === filterFolder)?.emoji} {folders.find((f) => f.id === filterFolder)?.name}
                    <button onClick={() => setFilterFolder(null)} style={{ border: "none", background: "transparent", color: T.pinkDeep, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 13 }}>✕</button>
                  </span>
                )}
              </div>
            )}

            {pets.length === 0 ? (
              <EmptyCard icon="🐾" title="No pets yet" sub="Add a pet to start your memory journal." />
            ) : filtered.length === 0 ? (
              <EmptyCard icon="📷" title="No memories yet" sub={search ? "Nothing matches your search." : "Tap ➕ to capture your first special moment!"} action={() => setAddOpen(true)} actionLabel="Add Memory" />
            ) : (
              groupDates.map((d) => (
                <div key={d} style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.grayLight, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>
                    {d === todayISO() ? "Today" : new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {groups[d].map((m) => {
                      const pet  = pets.find((p) => p.id === m.petId);
                      const mood = moodFor(m.mood);
                      const tags = userTags(m.tags);
                      return (
                        <div key={m.id}
                          onClick={() => setSelectedId(m.id)}
                          onTouchStart={() => startLongPress(m.id)}
                          onTouchEnd={cancelLongPress}
                          onTouchMove={cancelLongPress}
                          onMouseDown={() => startLongPress(m.id)}
                          onMouseUp={cancelLongPress}
                          onMouseLeave={cancelLongPress}
                          style={{ background: "var(--p-surface)", borderRadius: 20, overflow: "hidden", boxShadow: T.shadowSoft, cursor: "pointer", userSelect: "none" }}>
                          {m.photo && (
                            <div style={{ position: "relative" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.photo} alt={m.title || "Memory"} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                              {m.mediaType === "video" && (
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{ padding: "12px 14px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              {mood && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: mood.bg, border: `1px solid ${mood.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11.5, fontWeight: 700, color: "#374151" }}>
                                  {mood.emoji} {mood.key}
                                </span>
                              )}
                              {pet && <span style={{ fontSize: 11.5, color: T.gray, fontWeight: 600 }}>· {pet.name}</span>}
                              <span style={{ fontSize: 11, color: T.grayLight, marginLeft: "auto" }}>{fmtMemDate(m.date)}</span>
                            </div>
                            {m.title && <p style={{ fontSize: 15, fontWeight: 800, color: T.ink, margin: "0 0 4px" }}>{m.title}</p>}
                            {m.caption && <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.55, margin: "0 0 8px" }}>&ldquo;{m.caption}&rdquo;</p>}
                            {tags.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {tags.map((t) => (
                                  <span key={t} style={{ fontSize: 11, color: T.pinkDeep, background: T.primarySoft, borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>#{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ═══════════ MOODS TAB ═══════════════════════════════════════ */}
        {tab === "moods" && (
          <>
            <p style={{ fontSize: 13, color: T.gray, marginBottom: 14 }}>
              {allMems.length === 0 ? "Add memories to start building mood collections." : "Tap a mood to browse those memories."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {MOODS.map((m) => {
                const count = moodCounts[m.key] ?? 0;
                return (
                  <button key={m.key} onClick={() => { if (count > 0) { setFilterMood(m.key); setTab("journal"); } }} className="pawzo-press" style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 18, padding: "18px 12px", cursor: count > 0 ? "pointer" : "default", textAlign: "center", opacity: count === 0 ? 0.5 : 1 }}>
                    <div style={{ fontSize: 30, marginBottom: 5 }}>{m.emoji}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#374151" }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{count} {count === 1 ? "memory" : "memories"}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ═══════════ FOLDERS TAB ═════════════════════════════════════ */}
        {tab === "folders" && (
          <>
            {activeFolderId ? (
              /* ── Folder detail ──────────────────────────────────── */
              <>
                <button onClick={() => setActiveFolderId(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: T.gray, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 16, padding: 0 }}>
                  ← Back
                </button>
                {(() => {
                  const folder = folders.find((f) => f.id === activeFolderId)!;
                  const fMems  = allMems.filter((m) => folderIds(m.tags).includes(activeFolderId));
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0, flex: 1 }}>{folder.emoji} {folder.name}</h2>
                        <button onClick={() => setAddOpen(true)} className="pawzo-press" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "none", background: T.pink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          <IconPlus color="#fff" size={13} /> Add
                        </button>
                      </div>
                      {fMems.length === 0 ? (
                        <EmptyCard icon="📂" title="Empty folder" sub="Tap Add to capture your first memory in this folder." />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {fMems.map((m) => {
                            const pet  = pets.find((p) => p.id === m.petId);
                            const mood = moodFor(m.mood);
                            return (
                              <div key={m.id} onClick={() => setSelectedId(m.id)} style={{ display: "flex", gap: 0, background: "var(--p-surface)", borderRadius: 16, overflow: "hidden", boxShadow: T.shadowSoft, cursor: "pointer" }}>
                                {m.photo && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.photo} alt="" style={{ width: 80, height: 80, objectFit: "cover", flexShrink: 0 }} />
                                )}
                                <div style={{ flex: 1, padding: "10px 12px" }}>
                                  {m.title && <p style={{ fontSize: 13, fontWeight: 800, color: T.ink, margin: "0 0 2px" }}>{m.title}</p>}
                                  <p style={{ fontSize: 11, color: T.grayLight, margin: "0 0 4px" }}>
                                    {pet?.name} · {new Date(m.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </p>
                                  {mood && <span style={{ fontSize: 12, fontWeight: 700 }}>{mood.emoji} {mood.key}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              /* ── Folder list ───────────────────────────────────── */
              <>
                <button onClick={() => setNewFolderOpen(true)} className="pawzo-press" style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: T.primarySoft, borderRadius: 14, border: `1.5px dashed ${T.pink}`, cursor: "pointer", marginBottom: 14, fontWeight: 800, fontSize: 14, color: T.pinkDeep }}>
                  <IconPlus color={T.pinkDeep} size={16} /> New Folder
                </button>

                {newFolderOpen && (
                  <div style={{ background: "var(--p-surface)", borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: T.shadowSoft }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: "0 0 12px" }}>New Folder</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 20, padding: "6px 4px" }} value={newFolderEmoji} onChange={(e) => setNewFolderEmoji(e.target.value)} maxLength={2} />
                      <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. First Birthday" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveFolder()} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setNewFolderOpen(false); setNewFolderName(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid var(--p-border)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: T.gray }}>Cancel</button>
                      <button onClick={saveFolder} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: T.pink, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff" }}>Create</button>
                    </div>
                  </div>
                )}

                {folders.length === 0 ? (
                  <EmptyCard icon="📁" title="No folders yet" sub="Create folders to organise memories — Vet Visits, Beach Trips, First Birthday, and more." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {folders.map((f) => {
                      const cnt = folderCounts[f.id] ?? 0;
                      return (
                        <div key={f.id} onClick={() => setActiveFolderId(f.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--p-surface)", borderRadius: 14, padding: "13px 16px", boxShadow: T.shadowSoft, cursor: "pointer" }}>
                          <span style={{ fontSize: 26 }}>{f.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>{f.name}</p>
                            <p style={{ fontSize: 11, color: T.grayLight, margin: 0 }}>{cnt} {cnt === 1 ? "memory" : "memories"}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} style={{ padding: "5px 10px", borderRadius: 10, border: "none", background: "#FEE2E2", cursor: "pointer", color: "#B91C1C", fontSize: 12, fontWeight: 700 }}>Delete</button>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.grayLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Long-press delete confirmation ──────────────────────────── */}
      {longPressId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: "var(--p-surface)", borderRadius: 22, padding: 24, width: "100%", maxWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 10 }}>🗑️</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 8px" }}>Delete this memory?</p>
            <p style={{ fontSize: 13, color: T.gray, textAlign: "center", margin: "0 0 20px" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setLongPressId(null)} className="pawzo-press" style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 13.5, fontWeight: 700, color: T.gray, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { remove("memories", longPressId); setLongPressId(null); }} className="pawzo-press" style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: T.danger, fontSize: 13.5, fontWeight: 800, color: "#fff", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Memory Sheet ─────────────────────────────────────────── */}
      {addOpen && (
        <AddSheet
          pets={pets}
          defaultPetId={pets[0]?.id ?? ""}
          onClose={() => setAddOpen(false)}
          onSave={(data) => {
          const tags = activeFolderId
            ? [data.tags, `folder:${activeFolderId}`].filter(Boolean).join(",")
            : data.tags;
          add("memories", { ...data, tags });
          setAddOpen(false);
        }}
        />
      )}

      {/* ── Memory Detail Sheet ──────────────────────────────────────── */}
      {selectedMem && selectedPet && (
        <DetailSheet
          mem={selectedMem}
          pet={selectedPet}
          folders={folders}
          onClose={() => setSelectedId(null)}
          onDelete={() => { remove("memories", selectedMem.id); setSelectedId(null); }}
          onToggleFolder={(fid) => toggleFolder(selectedMem, fid)}
        />
      )}

    </AppFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ADD MEMORY SHEET                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AddSheet({ pets, defaultPetId, onClose, onSave }: {
  pets: { id: string; name: string; species: string }[];
  defaultPetId: string;
  onClose: () => void;
  onSave: (d: { petId: string; photo: string; caption: string; date: string; title: string; mood: string; tags: string; mediaType: string; timeTaken: string }) => void;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState<"pick" | "details">("pick");
  const [photo, setPhoto]         = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [title, setTitle]         = useState("");
  const [caption, setCaption]     = useState("");
  const [mood, setMood]           = useState("");
  const [tags, setTags]           = useState("");
  const [petId, setPetId]         = useState(defaultPetId);
  const [date, setDate]           = useState(todayISO());
  const [timeTaken, setTimeTaken] = useState(() => new Date().toTimeString().slice(0, 5));
  const [moodOpen, setMoodOpen] = useState(false);

  async function handleFile(file: File, type: "photo" | "video") {
    const dataUrl = type === "video" ? await videoThumbnail(file) : await fileToDataURL(file, 1200);
    setPhoto(dataUrl); setMediaType(type); setStep("details");
  }

  function doSave() {
    if (!petId) return;
    const cleanTags = tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).join(",");
    onSave({ petId, photo, caption, date, title, mood, tags: cleanTags, mediaType, timeTaken });
  }

  const selectedMood = moodFor(mood);

  return (
    <Overlay onClose={onClose}>
      {step === "pick" ? (
        <>
          <SheetHandle />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 22px" }}>Add Memory ✨</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            <button onClick={() => camRef.current?.click()} className="pawzo-press" style={pickBtn}>
              <span style={{ fontSize: 28 }}>📷</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.pinkDeep }}>Camera</span>
            </button>
            <button onClick={() => galRef.current?.click()} className="pawzo-press" style={pickBtn}>
              <span style={{ fontSize: 28 }}>🖼️</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.pinkDeep }}>Gallery</span>
            </button>
            <button onClick={() => vidRef.current?.click()} className="pawzo-press" style={pickBtn}>
              <span style={{ fontSize: 28 }}>🎬</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.pinkDeep }}>Video</span>
            </button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "photo"); e.target.value = ""; }} />
          <input ref={galRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "photo"); e.target.value = ""; }} />
          <input ref={vidRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "video"); e.target.value = ""; }} />
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
        </>
      ) : (
        <>
          <SheetHandle />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: T.ink, margin: "0 0 14px" }}>Memory Details</h2>

          {/* Preview */}
          {photo && (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 14, aspectRatio: "16/9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {mediaType === "video" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
              )}
              <button onClick={() => { setStep("pick"); setPhoto(""); setMood(""); }} style={{ position: "absolute", top: 8, right: 8, padding: "4px 10px", borderRadius: 10, border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>Change</button>
            </div>
          )}

          {/* Mood */}
          <label style={{ fontSize: 12, fontWeight: 700, color: T.gray, display: "block", marginBottom: 5 }}>Mood</label>
          <button onClick={() => setMoodOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--p-surface-2)", borderRadius: 12, border: "1.5px solid var(--p-border)", cursor: "pointer", marginBottom: moodOpen ? 6 : 10 }}>
            <span style={{ fontSize: 20 }}>{selectedMood?.emoji ?? "🤔"}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.ink, textAlign: "left" }}>{mood || "Select mood"}</span>
            <span style={{ color: T.grayLight, fontSize: 12 }}>▾</span>
          </button>
          {moodOpen && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: 10, background: "var(--p-surface-2)", borderRadius: 14, marginBottom: 10 }}>
              {MOODS.map((m) => (
                <button key={m.key} onClick={() => { setMood(m.key); setMoodOpen(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "7px 3px", borderRadius: 10, border: `2px solid ${mood === m.key ? T.pink : "transparent"}`, background: mood === m.key ? T.primarySoft : "transparent", cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <span style={{ fontSize: 8.5, color: T.gray, fontWeight: 600 }}>{m.key}</span>
                </button>
              ))}
            </div>
          )}

          <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 76, resize: "none", marginBottom: 10 } as React.CSSProperties} placeholder={`"${pets.find((p) => p.id === petId)?.name ?? "Pet"} had an amazing day…"`} value={caption} onChange={(e) => setCaption(e.target.value)} />

          {pets.length > 1 && (
            <select style={{ ...inputStyle, marginBottom: 10 }} value={petId} onChange={(e) => setPetId(e.target.value)}>
              {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Tags: play, beach, nap" value={tags} onChange={(e) => setTags(e.target.value)} />

          <div style={{ marginBottom: 20 }}>
            <input style={{ ...inputStyle, width: "100%" }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setStep("pick"); setPhoto(""); setMood(""); }} style={ghostBtn}>Back</button>
            <button onClick={doSave} disabled={!petId} style={{ flex: 2, padding: "13px 0", borderRadius: 14, border: "none", background: petId ? T.pink : T.grayLight, fontWeight: 800, fontSize: 14, cursor: petId ? "pointer" : "not-allowed", color: "#fff" }}>
              Save Memory ✨
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MEMORY DETAIL SHEET                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DetailSheet({ mem, pet, folders, onClose, onDelete, onToggleFolder }: {
  mem: ReturnType<typeof usePawzo>["state"]["memories"][0];
  pet: { id: string; name: string };
  folders: Folder[];
  onClose: () => void;
  onDelete: () => void;
  onToggleFolder: (folderId: string) => void;
}) {
  const mood     = moodFor(mem.mood);
  const tags     = userTags(mem.tags);
  const inFolders = folderIds(mem.tags);

  return (
    <Overlay onClose={onClose} noPad>
      {mem.photo && (
        <div style={{ position: "relative", aspectRatio: "16/9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mem.photo} alt={mem.title || "Memory"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {mem.mediaType === "video" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
          )}
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>✕</button>
        </div>
      )}
      <div style={{ padding: "16px 20px 32px" }}>
        {/* meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {mood && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: mood.bg, border: `1px solid ${mood.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#374151" }}>
              {mood.emoji} {mood.key}
            </span>
          )}
          <span style={{ fontSize: 12, color: T.gray, fontWeight: 600 }}>{pet.name}</span>
          <span style={{ fontSize: 11.5, color: T.grayLight, marginLeft: "auto" }}>
            {fmtMemDate(mem.date, true)}
          </span>
        </div>

        {mem.title && <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 6px" }}>{mem.title}</h2>}
        {mem.caption && <p style={{ fontSize: 14, color: T.gray, lineHeight: 1.6, margin: "0 0 12px" }}>&ldquo;{mem.caption}&rdquo;</p>}

        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {tags.map((t) => (
              <span key={t} style={{ fontSize: 12, color: T.pinkDeep, background: T.primarySoft, borderRadius: 10, padding: "3px 10px", fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Folder membership */}
        {folders.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.grayLight, marginBottom: 8 }}>FOLDERS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {folders.map((f) => {
                const inF = inFolders.includes(f.id);
                return (
                  <button key={f.id} onClick={() => onToggleFolder(f.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 20, border: `1.5px solid ${inF ? T.pink : "var(--p-border)"}`, background: inF ? T.primarySoft : "transparent", fontWeight: 700, fontSize: 12, color: inF ? T.pinkDeep : T.gray, cursor: "pointer" }}>
                    {inF && <span style={{ width: 16, height: 16, borderRadius: 5, background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Tick /></span>}
                    {f.emoji} {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: T.grayLight, textAlign: "center", margin: "8px 0 0", fontStyle: "italic" }}>Hold a memory card to delete it</p>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SHARED PRIMITIVES                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Overlay({ children, onClose, noPad }: { children: React.ReactNode; onClose: () => void; noPad?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />
      <div style={{ position: "relative", background: "var(--p-surface)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", padding: noPad ? 0 : "4px 20px 32px" }}>
        {children}
      </div>
    </div>
  );
}

function SheetHandle() {
  return <div style={{ width: 40, height: 4, background: "var(--p-border)", borderRadius: 2, margin: "10px auto 16px" }} />;
}

function EmptyCard({ icon, title, sub, action, actionLabel }: { icon: string; title: string; sub: string; action?: () => void; actionLabel?: string }) {
  return (
    <div style={{ background: "var(--p-surface)", borderRadius: 18, padding: "28px 20px", textAlign: "center", boxShadow: T.shadowSoft }}>
      <div className="pawzo-bob" style={{ fontSize: 44, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13, color: T.gray, marginBottom: action ? 16 : 0 }}>{sub}</p>
      {action && <button onClick={action} className="pawzo-press" style={{ background: T.pink, color: "#fff", border: "none", borderRadius: 14, padding: "12px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{actionLabel}</button>}
    </div>
  );
}

const iconBtn:  React.CSSProperties = { width: 38, height: 38, borderRadius: 12, border: "none", background: "var(--p-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: T.shadowSoft };
const ghostBtn: React.CSSProperties = { flex: 1, padding: "13px 0", borderRadius: 14, border: "1.5px solid var(--p-border)", background: "transparent", fontWeight: 700, fontSize: 14, cursor: "pointer", color: T.gray };
const pickBtn:  React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 8px", borderRadius: 16, border: `1.5px dashed ${T.pink}`, background: T.primarySoft, cursor: "pointer" };
