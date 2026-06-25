"use client";

/* PAWZO Dashboard — SCREEN_FLOW §4. Shows the user's real pets in a horizontal
   carousel (with an Add-Pet card), real Calendar/Memories widgets, today's
   schedule derived from meals + events, and an activity-based streak. No demo
   data; everything reads from the store. Solid fills only. */

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppFrame, BottomNav, PawzoLogo, T, IconGear, IconPlus, ChevronRight } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, todayISO, appendActivity } from "../lib/store";

const STREAK_MS  = [2,5,10,30,60,90,120,150,180,210,240,270,300,330,360];
const MEM_MS     = [1,10,20,30,40,50,100];

function DashConfetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#F5A0C0","#F9D040","#A0D8F0","#C0E8A0","#E8A0F5","#F5C060","#80D8C0","#F5A0A0","#B0D8FF"];
    type P = { x:number;y:number;vx:number;vy:number;size:number;color:string;rot:number;rotV:number;shape:"rect"|"circle";w:number;ws:number };
    const pieces: P[] = [];
    let frame = 0, raf: number;
    function spawn() {
      pieces.push({ x:Math.random()*canvas!.width, y:-8, vx:(Math.random()-0.5)*2.5, vy:1.5+Math.random()*2.5, size:3+Math.random()*5, color:COLORS[Math.floor(Math.random()*COLORS.length)], rot:Math.random()*Math.PI*2, rotV:(Math.random()-0.5)*0.14, shape:Math.random()>0.5?"rect":"circle", w:Math.random()*Math.PI*2, ws:0.05+Math.random()*0.05 });
    }
    function draw() {
      ctx.clearRect(0,0,canvas!.width,canvas!.height);
      const rate = frame<80?2:frame<150?3:6;
      if (frame<220 && frame%rate===0) spawn();
      for (let i=pieces.length-1;i>=0;i--) {
        const p=pieces[i]; p.w+=p.ws; p.x+=p.vx+Math.sin(p.w)*0.5; p.y+=p.vy; p.rot+=p.rotV; p.vy+=0.035;
        if (p.y>canvas!.height+10){pieces.splice(i,1);continue;}
        ctx.save(); ctx.globalAlpha=0.9; ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.color;
        if (p.shape==="rect") ctx.fillRect(-p.size/2,-p.size*0.35,p.size,p.size*0.7);
        else { ctx.beginPath(); ctx.arc(0,0,p.size*0.45,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      }
      frame++; raf=requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:999 }} />;
}

export default function Dashboard() {
  const router = useRouter();
  const { ready, authed } = useRequireAuth();
  const { state, myPets, currentUser, selectPet, toggleMealLog, streak, streakBroken } = usePawzo();

  const [showConfetti, setShowConfetti] = useState(false);
  const [badgeToast, setBadgeToast]     = useState<string | null>(null);
  const celebFired = useRef(false);

  useEffect(() => {
    // Guard: only fire once per mount (prevents React StrictMode double-invoke
    // from writing localStorage on the first call and finding nothing on second)
    if (!authed || celebFired.current) return;
    celebFired.current = true;

    const currentPets     = myPets();
    const currentStreak   = streakBroken() ? 0 : streak();
    const petIds          = new Set(currentPets.map((p) => p.id));
    const currentMemCount = state.memories.filter((m) => petIds.has(m.petId)).length;

    const prevStreak = parseInt(localStorage.getItem("pawzo_cel_streak") ?? "0", 10);
    const prevMem    = parseInt(localStorage.getItem("pawzo_cel_mem")    ?? "0", 10);
    const prevPets   = parseInt(localStorage.getItem("pawzo_cel_pets")   ?? "0", 10);

    const crossedStreak = STREAK_MS.filter((m) => prevStreak < m && currentStreak >= m);
    const crossedMem    = MEM_MS.filter((m)    => prevMem    < m && currentMemCount >= m);
    const newPetBadge   = currentPets.length >= 1 && prevPets < 1;

    let toastMsg: string | null = null;
    if (newPetBadge)          toastMsg = "First Pet Added — your Pawzo journey begins! 🐾";
    if (crossedMem.length)    toastMsg = `${Math.max(...crossedMem)} Memories Created — your gallery is growing! 📸`;
    if (crossedStreak.length) toastMsg = `${Math.max(...crossedStreak)}-Day Streak — keep it up! 🔥`;

    if (toastMsg) {
      setShowConfetti(true);
      setBadgeToast(toastMsg);
      setTimeout(() => setShowConfetti(false), 6000);
      setTimeout(() => setBadgeToast(null),    5000);
    }

    // Dashboard is the sole writer — profile page only reads these keys
    localStorage.setItem("pawzo_cel_streak", String(currentStreak));
    localStorage.setItem("pawzo_cel_mem",    String(currentMemCount));
    localStorage.setItem("pawzo_cel_pets",   String(currentPets.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // today must be declared before useState so the initializer can use it
  const today = todayISO();
  const MED_DONE_KEY      = `pawzo:med-done-${today}`;
  const SCHEDULE_DONE_KEY = `pawzo:schedule-done-${today}`;

  const [doneItems, setDoneItems] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const date = new Date().toISOString().slice(0, 10);
      const medKeys  = JSON.parse(localStorage.getItem(`pawzo:med-done-${date}`)      ?? "[]") as string[];
      const schedKeys = JSON.parse(localStorage.getItem(`pawzo:schedule-done-${date}`) ?? "[]") as string[];
      return new Set<string>([...medKeys, ...schedKeys]);
    } catch { return new Set(); }
  });

  if (!ready || !authed) return null;

  const pets = myPets();
  const user = currentUser();

  // today's schedule = today's meals (per pet) + today's events
  const todaysMeals = state.meals
    .filter((m) => pets.some((p) => p.id === m.petId))
    .map((m) => {
      const pet = pets.find((p) => p.id === m.petId)!;
      const log = state.mealLogs.find((l) => l.petId === m.petId && l.mealId === m.id && l.date === today);
      return { type: "meal" as const, id: m.id, petId: m.petId, petName: pet.name, mealName: m.name, label: `${m.name} · ${pet.name}`, time: m.time, done: !!log?.done };
    });
  const todaysEvents = state.events.filter((e) => pets.some((p) => p.id === e.petId) && (e.allDay ? e.date <= today : e.date === today));
  const todaysVets = state.health.filter((h) => h.kind === "vet" && h.date === today && pets.some((p) => p.id === h.petId));
  const activeMeds = state.health.filter((h) => h.kind === "medication" && h.active && pets.some((p) => p.id === h.petId));

  const toggleDone = (key: string) =>
    setDoneItems((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      const medKeys   = [...n].filter((k) => k.startsWith("med-"));
      const schedKeys = [...n].filter((k) => !k.startsWith("med-"));
      try {
        localStorage.setItem(MED_DONE_KEY,      JSON.stringify(medKeys));
        localStorage.setItem(SCHEDULE_DONE_KEY, JSON.stringify(schedKeys));
      } catch { /* ignore */ }
      return n;
    });

  async function fireEncouraging(title: string, body: string) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission !== "granted") return;
    try {
      // getRegistration() returns immediately — never hangs like .ready does
      const reg = "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration().catch(() => undefined)
        : undefined;
      if (reg && "showNotification" in reg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (reg as any).showNotification(title, { body, icon: "/favicon.ico" });
      } else {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    } catch { /* ignore */ }
  }

  const MEAL_DONE: Array<(p: string, m: string) => string> = [
    (p, m) => `😋 ${p} is happily munching their ${m}! Full tummy achieved! 🐾`,
    (p, m) => `🍽️ ${p} ate all their ${m}! One happy, well-fed pet!`,
    (p, m) => `🎉 Meal done! ${p} gives you two paws up for the ${m}!`,
    (p, m) => `✨ ${p} is full and content after their ${m}. Great pet parent!`,
    (p, m) => `🐾 ${p}'s ${m} is done! They're wagging and hopping with joy!`,
  ];
  const EVENT_DONE: Array<(p: string, t: string) => string> = [
    (p, t) => `🎉 ${t} for ${p} is all checked off! You're crushing it!`,
    (p, t) => `✅ ${t} done! ${p} is lucky to have such a caring owner!`,
    (p, t) => `⭐ Way to go! ${t} completed for ${p}. Keep up the great work!`,
  ];
  const VET_DONE: Array<(p: string) => string> = [
    (p) => `🩺 Vet visit logged for ${p}! You're on top of their health!`,
    (p) => `💪 Great job! ${p}'s appointment is done. Healthy pet, happy life!`,
    (p) => `🌟 ${p}'s vet checkup is complete. You're an amazing pet parent!`,
  ];
  const MED_DONE_MSG: Array<(p: string, m: string) => string> = [
    (p, m) => `💊 ${p} got their ${m}! You're helping them get better every day!`,
    (p, m) => `🌸 Medicine given! ${p} is one step closer to full health!`,
    (p, m) => `✨ ${p}'s ${m} is done for today. Consistency is the key to recovery!`,
  ];

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  const handleMealToggle = (petId: string, mealId: string, wasDone: boolean, petName: string, mealName: string) => {
    toggleMealLog(petId, mealId, today);
    if (!wasDone) fireEncouraging("🍽️ Feeding logged!", pick(MEAL_DONE)(petName, mealName));
  };

  const handleToggleDone = (key: string, onDone?: () => void) => {
    const wasNotDone = !doneItems.has(key);
    toggleDone(key);
    if (wasNotDone) {
      const now = Date.now();
      if (key.startsWith("event-")) {
        const ev = state.events.find((e) => e.id === key.replace("event-", ""));
        if (ev) {
          const pet = pets.find((p) => p.id === ev.petId);
          appendActivity({ icon: ev.emoji || "✅", title: `${ev.title} completed`, body: `${ev.title}${pet ? ` for ${pet.name}` : ""} was marked as completed.`, timestamp: now, status: "completed" });
        }
      } else if (key.startsWith("vet-")) {
        const vet = todaysVets.find((h) => h.id === key.replace("vet-", ""));
        if (vet) {
          const pet = pets.find((p) => p.id === vet.petId);
          appendActivity({ icon: "🩺", title: "Vet visit completed", body: `${pet?.name ?? "Pet"}'s vet appointment was completed.`, timestamp: now, status: "completed" });
        }
      } else if (key.startsWith("med-")) {
        const med = activeMeds.find((h) => h.id === key.replace("med-", ""));
        if (med) {
          const pet = pets.find((p) => p.id === med.petId);
          appendActivity({ icon: "💊", title: `${med.title} given`, body: `${pet?.name ?? "Pet"}'s ${med.title} was administered.`, timestamp: now, status: "completed" });
        }
      }
      if (onDone) onDone();
    }
  };
  const memCount = state.memories.filter((mm) => pets.some((p) => p.id === mm.petId)).length;
  const upcomingEvents = state.events.filter((e) => pets.some((p) => p.id === e.petId) && e.date >= today && !doneItems.has(`event-${e.id}`)).length;

  const totalScheduleItems = todaysMeals.length + todaysEvents.length + todaysVets.length + activeMeds.length;
  const completedScheduleItems =
    todaysMeals.filter((m) => m.done).length +
    todaysEvents.filter((e) => doneItems.has(`event-${e.id}`)).length +
    todaysVets.filter((h) => doneItems.has(`vet-${h.id}`)).length +
    activeMeds.filter((h) => doneItems.has(`med-${h.id}`)).length;
  const allScheduleDone = totalScheduleItems > 0 && completedScheduleItems === totalScheduleItems;

  return (
    <AppFrame>
      <DashConfetti active={showConfetti} />

      {/* badge toast — slides down from top */}
      {badgeToast && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, zIndex:1000,
          display:"flex", justifyContent:"center",
          animation:"pawzo-toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          <div style={{
            margin:"10px 16px 0",
            background:"linear-gradient(135deg,#FDE8EF,#F5D0E8)",
            borderRadius:18, padding:"13px 20px",
            boxShadow:"0 8px 28px rgba(192,96,160,0.25)",
            display:"flex", alignItems:"center", gap:12,
            border:"1.5px solid #F0C0DC", maxWidth:340, width:"100%",
          }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:"0 2px 8px rgba(192,96,160,0.15)" }}>
              🎉
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#B060A0", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Badge Unlocked!</p>
              <p style={{ fontSize:13, fontWeight:700, color:"#3D1D54", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{badgeToast.replace(/^[^\s]+ /, "")}</p>
            </div>
          </div>
          <style>{`@keyframes pawzo-toast-in{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}

      {/* header — no calendar/memory buttons */}
      <header style={{ position: "relative", background: "transparent", padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Link href="/settings" aria-label="Settings" style={{ position: "absolute", left: 16, color: T.grayLight, display: "flex" }}><IconGear /></Link>
        <PawzoLogo size={25} />
        <Link href="/profile" aria-label="Profile" style={{ position: "absolute", right: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, overflow: "hidden" }}>
            {user?.photo
              ? <img src={user.photo} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (user?.name?.[0] ?? "U").toUpperCase()}
          </div>
        </Link>
      </header>

      <main style={{ padding: "10px 0 0" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: "0 16px 12px" }}>
          Hi, {user?.name?.split(" ")[0] ?? "there"}
        </h1>

        {/* MY PETS carousel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 16px 10px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>My Pets</h2>
          {pets.length > 0 && <span style={{ fontSize: 12, color: T.grayLight, fontWeight: 600 }}>{pets.length} {pets.length === 1 ? "pet" : "pets"}</span>}
        </div>

        {pets.length === 0 ? (
          <div style={{ margin: "0 16px 16px" }}>
            <div style={{ background: "#FFB7C3", borderRadius: 20, padding: "28px 20px", textAlign: "center" }}>
              <div className="pawzo-bob" style={{ fontSize: 52, marginBottom: 10 }}>🐾</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#7A1030" }}>No pets yet!</p>
              <p style={{ fontSize: 13, color: "#9A2040", margin: "4px 0 16px", opacity: 0.85 }}>Add your first furry friend to get started.</p>
              <button onClick={() => router.push("/pet-profile/new")} className="pawzo-press" style={{ background: "#BA324F", color: "#fff", border: "none", borderRadius: 14, padding: "12px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconPlus color="#fff" size={16} /> Add Pet
              </button>
            </div>
          </div>
        ) : (
          <div className="no-scrollbar" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 16px 14px", scrollSnapType: "x mandatory" }}>
            {pets.map((pet) => {
              const cardBg = speciesBg(pet.species);
              return (
                <button key={pet.id} onClick={() => { selectPet(pet.id); router.push("/pet-profile"); }} className="pawzo-press" style={{ flexShrink: 0, width: 150, scrollSnapAlign: "start", background: cardBg, borderRadius: 20, padding: 10, border: "none", cursor: "pointer", boxShadow: T.shadow, textAlign: "center" }}>
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "3px solid rgba(255,255,255,0.7)" }}>
                    {pet.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photo} alt={pet.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1", background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>{speciesEmoji(pet.species)}</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 800, fontSize: 15, color: "#175676" }}>{pet.name}</div>
                  <div style={{ fontSize: 11.5, color: "#4BA3C3", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pet.breed || pet.species}</div>
                </button>
              );
            })}
            <button onClick={() => router.push("/pet-profile/new")} className="pawzo-press" aria-label="Add a new pet" style={{ flexShrink: 0, width: 150, scrollSnapAlign: "start", background: "#D9F2B4", border: "2px dashed #8BBF60", borderRadius: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 196 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#3A6EA5", display: "flex", alignItems: "center", justifyContent: "center" }}><IconPlus color="#fff" size={24} /></div>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#175676" }}>Add Pet</span>
            </button>
          </div>
        )}

        {/* Calendar + Memories widgets */}
        <div style={{ display: "flex", gap: 12, padding: "0 16px 12px" }}>
          <Link href="/calendar" style={{ flex: 1, textDecoration: "none" }}>
            <div className="pawzo-press" style={{ background: "#BCF4F5", borderRadius: 18, padding: "12px 12px 10px", minHeight: 130 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#175676", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                📅 <span>Calendar</span>
                {upcomingEvents > 0 && <span style={{ background: "#175676", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px", marginLeft: "auto" }}>{upcomingEvents}</span>}
              </h3>
              <MiniCalendar eventDates={state.events.filter(e => pets.some(p => p.id === e.petId)).map(e => e.date)} />
            </div>
          </Link>
          <Link href="/memories" style={{ flex: 1, textDecoration: "none" }}>
            <div className="pawzo-press" style={{ background: "#B4EBCA", borderRadius: 18, padding: "12px 12px 10px", minHeight: 130 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1A6B3A", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                ✨ <span>Memories</span>
                {memCount > 0 && <span style={{ background: "#1A6B3A", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px", marginLeft: "auto" }}>{memCount}</span>}
              </h3>
              <MemoryThumbs memories={state.memories.filter(mm => pets.some(p => p.id === mm.petId))} />
            </div>
          </Link>
        </div>

        {/* streak */}
        {pets.length > 0 && (() => {
          const broken = streakBroken();
          const days   = streak();
          const bg     = broken ? "#FEE2E2" : "#D9F2B4";
          const color  = broken ? "#991B1B" : "#3A6B00";
          return (
            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ background: bg, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{broken ? "💔" : days > 0 ? "🔥" : "✨"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color }}>
                    {broken ? "Streak broken!" : `${days}-day streak`}
                  </p>
                  <p style={{ fontSize: 11.5, color, opacity: 0.8 }}>
                    {broken
                      ? "You missed a day. Open the app daily to keep your streak!"
                      : days > 0
                        ? "Keep the momentum going! 💪"
                        : "Open the app every day to build a streak."}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Today's Schedule */}
        <section style={{ background: "#CCE6F4", borderRadius: 20, margin: "0 16px", padding: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#175676", margin: "0 0 14px" }}>📋 Today&apos;s Schedule</h3>
          {todaysMeals.length === 0 && todaysEvents.length === 0 && todaysVets.length === 0 && activeMeds.length === 0 ? (
            <p style={{ fontSize: 13, color: "#4BA3C3", textAlign: "center", padding: "10px 0" }}>
              Nothing scheduled yet. Add meals or events to see them here. 🗓️
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todaysMeals.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: m.done ? "#FDF2F8" : "#FFFFFF", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <button onClick={() => handleMealToggle(m.petId, m.id, m.done, m.petName, m.mealName)} style={{ width: 22, height: 22, border: `2px solid ${m.done ? "#F472B6" : "#4BA3C3"}`, background: m.done ? "#F472B6" : "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }} aria-label="Toggle meal">
                    {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <span style={{ flex: 1, fontSize: 14, color: m.done ? "#4BA3C3" : "#175676", textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
                  <span style={{ fontSize: 11.5, color: "#4BA3C3", fontWeight: 600 }}>{m.time}</span>
                </div>
              ))}
              {todaysEvents.map((e) => {
                const done = doneItems.has(`event-${e.id}`);
                const pet = pets.find((p) => p.id === e.petId);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: done ? "#FDF2F8" : "#FFF7ED", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <button onClick={() => handleToggleDone(`event-${e.id}`, () => fireEncouraging("🎉 Event done!", pick(EVENT_DONE)(pet?.name ?? "your pet", e.title)))} style={{ width: 22, height: 22, border: `2px solid ${done ? "#F472B6" : "#FDBA74"}`, background: done ? "#F472B6" : "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }} aria-label="Toggle event">
                      {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                    </button>
                    <span style={{ fontSize: 18 }}>{e.emoji || "📅"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: done ? "#9CA3AF" : "#B45309", fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{e.title}</span>
                      {pet && <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{pet.name}</p>}
                    </div>
                    <span style={{ fontSize: 11.5, color: "#F59E0B", fontWeight: 600 }}>{e.allDay ? `All day${e.time ? ` · ${e.time}` : ""}` : (e.time || "All day")}</span>
                  </div>
                );
              })}
              {todaysVets.map((h) => {
                const done = doneItems.has(`vet-${h.id}`);
                const pet = pets.find((p) => p.id === h.petId);
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: done ? "#FDF2F8" : "#DBEAFE", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <button onClick={() => handleToggleDone(`vet-${h.id}`, () => fireEncouraging("🩺 Vet visit done!", pick(VET_DONE)(pet?.name ?? "your pet")))} style={{ width: 22, height: 22, border: `2px solid ${done ? "#F472B6" : "#3B82F6"}`, background: done ? "#F472B6" : "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }} aria-label="Toggle vet">
                      {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                    </button>
                    <span style={{ fontSize: 18 }}>🩺</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: done ? "#9CA3AF" : "#1D4ED8", fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{h.title}</span>
                      {pet && <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{pet.name}{h.detail ? ` · ${h.detail}` : ""}</p>}
                    </div>
                  </div>
                );
              })}
              {activeMeds.map((h) => {
                const done = doneItems.has(`med-${h.id}`);
                const pet = pets.find((p) => p.id === h.petId);
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: done ? "#FDF2F8" : "#EDE9FE", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <button onClick={() => handleToggleDone(`med-${h.id}`, () => fireEncouraging("💊 Medication given!", pick(MED_DONE_MSG)(pet?.name ?? "your pet", h.title)))} style={{ width: 22, height: 22, border: `2px solid ${done ? "#F472B6" : "#7C3AED"}`, background: done ? "#F472B6" : "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }} aria-label="Toggle medication">
                      {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                    </button>
                    <span style={{ fontSize: 18 }}>💊</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: done ? "#9CA3AF" : "#7C3AED", fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{h.title}</span>
                      {pet && <p style={{ fontSize: 11, color: "#8B5CF6", margin: 0 }}>{pet.name}{h.detail ? ` · ${h.detail}` : ""}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All-done milestone */}
          {allScheduleDone && (
            <div className="pawzo-rise" style={{ marginTop: 14, background: "linear-gradient(135deg, #FFFBEB 0%, #FCE7F3 100%)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1.5px solid #FBD0E4" }}>
              <span style={{ fontSize: 32 }}>🏆</span>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: "#7C3AED", margin: 0 }}>All done for today!</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>You crushed today&apos;s schedule. Your pets are so lucky! 🐾✨</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </AppFrame>
  );
}

export function speciesEmoji(s: string) {
  const m: Record<string, string> = { Dog: "🐶", Cat: "🐱", Bird: "🦜", Rabbit: "🐰", "Guinea pig": "🐹", Hamster: "🐹", Fish: "🐠", Reptile: "🦎" };
  return m[s] ?? "🐾";
}

/* pastel card background per species — design system pet colors */
export function speciesBg(s: string) {
  const m: Record<string, string> = {
    Dog:        "#FFB7C3",  // Blush Pink
    Cat:        "#BCF4F5",  // Soft Sky
    Bird:       "#D9F2B4",  // Sunshine Yellow
    Rabbit:     "#B4EBCA",  // Minty Fresh
    "Guinea pig": "#D3FAC7", // Grass Green
    Hamster:    "#E7F59E",  // Lemon
    Fish:       "#CCE6F4",  // Cloud Soft
    Reptile:    "#B4EBCA",  // Minty Fresh
  };
  return m[s] ?? "#D9F2B4";
}

/* mini calendar grid — shows current month with today highlighted + event dots */
function MiniCalendar({ eventDates }: { eventDates: string[] }) {
  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth();
  const todayD  = now.getDate();
  const firstDOW = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, "0");
  const eventSet = new Set(
    eventDates
      .filter(d => d.startsWith(`${year}-${monthStr}`))
      .map(d => parseInt(d.slice(8, 10), 10))
  );
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDOW; i++) cells.push(null);
  for (let d = 1; d <= daysInM; d++) cells.push(d);

  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: "#1A5276", opacity: 0.65, margin: "0 0 4px", textAlign: "center" }}>
        {now.toLocaleString("default", { month: "long" })} {year}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px 0", marginBottom: 2 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ fontSize: 7.5, fontWeight: 700, color: "#1A5276", textAlign: "center", opacity: 0.6, paddingBottom: 2 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: "center", position: "relative" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%",
              fontSize: 8, fontWeight: d === todayD ? 800 : 400,
              background: d === todayD ? "#1A5276" : "transparent",
              color: d === todayD ? "#fff" : "#1A5276",
              opacity: d ? 1 : 0,
            }}>{d}</span>
            {d && d !== todayD && eventSet.has(d) && (
              <span style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#BA324F", display: "block" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* memory thumbnails — up to 4 recent photos, or photo-album SVG default */
function MemoryThumbs({ memories }: { memories: Array<{ id: string; photo: string; caption: string; date: string }> }) {
  const recent = [...memories].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  if (recent.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 2 }}>
        {/* Photo album illustration */}
        <svg viewBox="0 0 80 60" style={{ width: 72, height: 54, display: "block", margin: "0 auto 4px" }}>
          {/* Album cover */}
          <rect x="6" y="4" width="68" height="52" rx="6" fill="#FFFFFF" opacity="0.7"/>
          <rect x="2" y="6" width="68" height="52" rx="6" fill="#FFFFFF" opacity="0.85"/>
          {/* Photo frames inside */}
          <rect x="8" y="10" width="26" height="20" rx="3" fill="#BCF4F5"/>
          <rect x="38" y="10" width="26" height="20" rx="3" fill="#FFB7C3"/>
          <rect x="8" y="34" width="26" height="20" rx="3" fill="#D9F2B4"/>
          <rect x="38" y="34" width="26" height="20" rx="3" fill="#D9F2B4" opacity="0.5"/>
          {/* "+" on the empty slot */}
          <text x="51" y="47" fontSize="12" fill="#1A6B3A" textAnchor="middle" fontWeight="700">+</text>
          {/* Tiny mountain in BCF4F5 frame */}
          <path d="M12 27 L20 14 L28 27 Z" fill="#4BA3C3" opacity="0.6"/>
          <circle cx="24" cy="16" r="3" fill="#D9F2B4" opacity="0.8"/>
          {/* Tiny paw in pink frame */}
          <text x="51" y="24" fontSize="12" textAnchor="middle">🐾</text>
          {/* Tiny tree in green frame */}
          <circle cx="21" cy="38" r="6" fill="#2E8B40" opacity="0.5"/>
          <rect x="20" y="44" width="2" height="8" fill="#6B4A00" opacity="0.5"/>
        </svg>
        <p style={{ fontSize: 10.5, color: "#1A6B3A", fontWeight: 700 }}>No memories yet</p>
        <p style={{ fontSize: 9, color: "#1A6B3A", opacity: 0.7 }}>Tap to capture moments! 📷</p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      {recent.map(m => (
        <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "#80C898" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.photo} alt={m.caption || "Memory"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}
