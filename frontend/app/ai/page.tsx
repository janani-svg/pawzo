"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppFrame, T, IconSpark, AiDisclaimer } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, type Pet } from "../lib/store";
import { chatApi, type ApiChatMessage } from "../lib/api";

const FOOD_KEYWORDS = /\b(feed|food|eat|meal|diet|nutrition|snack|treat|breakfast|lunch|dinner|kibble|wet food|raw|recipe|ingredient|protein|carb|calori)/i;

type Msg = { id: string; role: "ai" | "user"; text: string; image?: string };

const PERSONA: Record<string, string> = {
  Dog: "Woof!", Cat: "Meow~", Bird: "Tweet tweet!",
  Rabbit: "*nose twitch*", Fish: "*blub blub*",
  Reptile: "*slow blink*", Hamster: "*squeak*", "Guinea pig": "*wheek!*",
};

const BY_SPECIES: Record<string, string[]> = {
  Dog:        ["What should I feed my dog?", "How much exercise does my dog need?", "Why is my dog barking a lot?", "Common health issues in dogs?"],
  Cat:        ["What should I feed my cat?", "Why is my cat scratching furniture?", "How often should I clean the litter box?", "Common health issues in cats?"],
  Bird:       ["What fruits are safe for my bird?", "Why is my bird plucking feathers?", "What should I feed my bird?", "How do I keep my bird healthy?"],
  Rabbit:     ["How much hay does my rabbit need?", "What vegetables are safe for rabbits?", "Is my rabbit's cage big enough?", "Common health issues in rabbits?"],
  Fish:       ["How often should I change the tank water?", "What's the ideal water temperature for fish?", "What should I feed my fish?", "Common fish diseases?"],
  Reptile:    ["What basking temperature is best?", "How often should my reptile eat?", "What do reptiles eat?", "Common reptile health issues?"],
  Hamster:    ["What should I feed my hamster?", "How big should a hamster cage be?", "How do I handle my hamster safely?"],
  "Guinea pig": ["What vegetables can guinea pigs eat?", "How much space do guinea pigs need?", "Do guinea pigs need a companion?"],
};

function suggestionsFor(pet: Pet | null, allPets: Pet[]): string[] {
  if (pet) {
    // Pet-specific mode — questions about this pet
    const base = [`What should ${pet.name} eat?`, `Is ${pet.breed || pet.species} prone to any health issues?`];
    return [...base, ...(BY_SPECIES[pet.species] ?? ["How do I keep my pet happy?"])].slice(0, 4);
  }
  // General mode — one question per pet the owner has, using their names
  const questions = [
    (p: Pet) => `What should ${p.name} eat?`,
    (p: Pet) => `Is ${p.name} a healthy weight?`,
    (p: Pet) => `Any health tips for ${p.name}?`,
    (p: Pet) => `How do I keep ${p.name} happy?`,
  ];
  const result = allPets.slice(0, 4).map((p, i) => questions[i % questions.length](p));
  return result.length > 0
    ? result
    : ["What should I feed my pet?", "How do I know if my pet is sick?", "How often should I visit the vet?", "Best diet for a healthy pet?"];
}

function toMsg(m: ApiChatMessage): Msg {
  return { id: m.id, role: m.role as "ai" | "user", text: m.text, image: m.image_data ?? undefined };
}

/* Compress + resize image to max 1024px, returns base64 JPEG string */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const b64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
      resolve(b64);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function AIContent() {
  const params = useSearchParams();
  const petId  = params.get("pet");

  const { ready, authed } = useRequireAuth();
  const { state, add } = usePawzo();

  // pet-specific mode when ?pet=<id> in URL; general mode when no param
  const pet: Pet | null = ready && petId
    ? (state.pets.find((p) => p.id === petId) ?? null)
    : null;

  const router = useRouter();
  const [msgs, setMsgs]               = useState<Msg[]>([]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pendingImage, setPendingImage] = useState<{ base64: string; preview: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMealForm, setShowMealForm]   = useState(false);
  const [mealName, setMealName]           = useState("");
  const [mealTime, setMealTime]           = useState("");
  const [mealSaved, setMealSaved]         = useState(false);
  const lastUserMsgRef = useRef("");
  const endRef  = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Load chat history — jump to bottom instantly once loaded */
  useEffect(() => {
    if (!ready || !authed) return;
    setLoadingHistory(true);
    chatApi.history(pet?.id)
      .then((history) => {
        if (history.length > 0) {
          setMsgs(history.map(toMsg));
        } else {
          const welcome = pet
            ? `Hi! I'm Pawzo AI 🐾 Ask me anything about ${pet.name}'s care — food, health, behaviour, or send a photo for help!`
            : "Hi! I'm Pawzo AI 🐾 Ask me anything about any pet — food, health, behaviour, or share a photo!";
          setMsgs([{ id: "welcome", role: "ai", text: welcome }]);
        }
      })
      .catch(() => {
        setMsgs([{ id: "welcome", role: "ai", text: "Hi! I'm Pawzo AI 🐾 Ask me anything about pets or send a photo!" }]);
      })
      .finally(() => {
        setLoadingHistory(false);
        requestAnimationFrame(() => {
          endRef.current?.scrollIntoView({ behavior: "instant" });
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authed, petId]);

  /* Pick image from file input — must be before any early return */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const base64 = await compressImage(file);
      const preview = `data:image/jpeg;base64,${base64}`;
      setPendingImage({ base64, preview });
    } catch {
      // ignore
    }
  }, []);

  if (!ready || !authed) return null;

  function scrollToBottom() {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "instant" }));
  }

  function saveMeal() {
    if (!mealName.trim() || !pet) return;
    add("meals", { petId: pet.id, name: mealName.trim(), time: mealTime, food: "", kcal: 0 });
    setMealSaved(true);
    setShowMealForm(false);
    setTimeout(() => setMealSaved(false), 3000);
  }

  async function send(text: string) {
    const t = text.trim();
    if ((!t && !pendingImage) || typing) return;

    // Track if this is a food-related question so we can show the meal form after
    if (FOOD_KEYWORDS.test(t)) lastUserMsgRef.current = t;
    else lastUserMsgRef.current = "";
    setShowMealForm(false);

    const img = pendingImage;
    const tempId = `tmp-${Date.now()}`;
    setMsgs((m) => [...m, { id: tempId, role: "user", text: t, image: img?.preview }]);
    setInput("");
    setPendingImage(null);
    setTyping(true);
    scrollToBottom();

    try {
      const res = await chatApi.send(t, pet?.id, img?.base64);
      setMsgs((m) => [
        ...m.filter((x) => x.id !== tempId),
        toMsg(res.user_msg),
        toMsg(res.ai_msg),
      ]);
      // Show meal form after food-related AI response (only in pet mode)
      if (pet && lastUserMsgRef.current) {
        setMealName("");
        setMealTime("");
        setShowMealForm(true);
      }
      scrollToBottom();
    } catch {
      const persona = pet ? (PERSONA[pet.species] ?? "Hi!") : "Hi!";
      setMsgs((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "ai", text: `${persona} Sorry, I couldn't connect right now. Please try again 🐾` },
      ]);
      scrollToBottom();
    } finally {
      setTyping(false);
    }
  }

  const suggestions = suggestionsFor(pet, state.pets);
  const placeholder = pet ? `Ask about ${pet.name}…` : "Ask about any pet…";
  const statusLabel = pet ? `Helping with ${pet.name}` : "General pet care";

  return (
    <AppFrame bg="var(--p-surface-2)">
      {/* Sticky header — single row: back + icon + title + delete */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--p-surface-2)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.push(pet ? "/pet-profile" : "/dashboard")} aria-label="Back" className="pawzo-press" style={{ width: 38, height: 38, borderRadius: 12, border: "none", background: "var(--p-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: T.pink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconSpark color="#fff" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: T.ink, margin: 0 }}>Pawzo AI</h1>
          <p style={{ fontSize: 11, color: T.success, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success, display: "inline-block" }} />
            {statusLabel}
          </p>
        </div>
        <button onClick={() => setConfirmDelete(true)} className="pawzo-press" title="Delete chat history" style={{ width: 38, height: 38, borderRadius: 12, border: "1.5px solid var(--p-border)", background: "var(--p-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--p-surface)", borderRadius: 20, padding: 24, maxWidth: 320, width: "100%", boxShadow: T.shadowSoft }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Delete chat history?</p>
            <p style={{ fontSize: 13.5, color: T.gray, marginBottom: 20 }}>This will permanently delete all messages in this chat. This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 14, fontWeight: 700, color: T.ink, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={async () => {
                  setConfirmDelete(false);
                  await chatApi.deleteHistory(pet?.id);
                  const welcome = pet
                    ? `Hi! I'm Pawzo AI 🐾 Ask me anything about ${pet.name}'s care — food, health, behaviour, or send a photo for help!`
                    : "Hi! I'm Pawzo AI 🐾 Ask me anything about any pet — food, health, behaviour, or share a photo!";
                  setMsgs([{ id: "welcome", role: "ai", text: welcome }]);
                }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: T.danger, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: T.gray, fontSize: 13 }}>Loading chat history…</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="pawzo-pop" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "ai" && <span style={{ fontSize: 20, marginRight: 6, alignSelf: "flex-end" }}>🐾</span>}
              <div style={{
                maxWidth: "78%", borderRadius: 18,
                borderBottomRightRadius: m.role === "user" ? 6 : 18,
                borderBottomLeftRadius: m.role === "ai" ? 6 : 18,
                background: m.role === "user" ? T.pink : "var(--p-surface)",
                boxShadow: T.shadowSoft, overflow: "hidden",
              }}>
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image.startsWith("data:") ? m.image : `data:image/jpeg;base64,${m.image}`}
                    alt="shared"
                    style={{ width: "100%", maxWidth: 240, display: "block", borderRadius: m.text ? "0" : "inherit" }}
                  />
                )}
                {m.text && (
                  <div style={{ padding: "11px 14px", color: m.role === "user" ? "#fff" : T.ink, fontSize: 14, lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {typing && (
          <div className="pawzo-pop" style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 20 }}>🐾</span>
            <div style={{ background: "var(--p-surface)", borderRadius: 18, borderBottomLeftRadius: 6, padding: "13px 16px", boxShadow: T.shadowSoft, display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.pink, animation: `pawzo-dot 1.2s ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Meal saved toast */}
      {mealSaved && (
        <div className="pawzo-rise" style={{ margin: "0 16px 8px", background: "#ECFDF5", border: "1.5px solid #6EE7B7", borderRadius: 14, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", margin: 0 }}>Meal added to {pet?.name}&apos;s schedule!</p>
        </div>
      )}

      {/* Quick-add meal form — shown after food-related AI responses */}
      {showMealForm && pet && (
        <div className="pawzo-rise" style={{ margin: "0 16px 8px", background: "var(--p-surface)", border: `1.5px solid ${T.pink}`, borderRadius: 16, padding: "14px 14px 12px", boxShadow: T.shadowSoft }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
            <p style={{ fontSize: 13, fontWeight: 800, color: T.ink, margin: 0 }}>Add this to {pet.name}&apos;s meal schedule?</p>
            <button onClick={() => setShowMealForm(false)} style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: 8, border: "none", background: "var(--p-surface-2)", cursor: "pointer", fontSize: 13, color: T.gray, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <input
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Meal name (e.g. Chicken & Rice)"
            style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 11, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 13, color: T.ink, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: 11, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 13, color: T.ink, outline: "none" }}
            />
            <button
              onClick={saveMeal}
              disabled={!mealName.trim()}
              style={{ padding: "0 18px", height: 40, borderRadius: 11, border: "none", background: mealName.trim() ? T.pink : "var(--p-surface-2)", color: mealName.trim() ? "#fff" : T.grayLight, fontSize: 13, fontWeight: 800, cursor: mealName.trim() ? "pointer" : "default" }}
            >
              Save meal
            </button>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 8px" }}>
        {suggestions.map((sg) => (
          <button key={sg} onClick={() => send(sg)} className="pawzo-press" style={{ flexShrink: 0, background: "var(--p-surface)", border: "1.5px solid var(--p-border)", borderRadius: 20, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: T.pinkDeep, cursor: "pointer", whiteSpace: "nowrap" }}>
            {sg}
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      {/* Input bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: T.maxW, background: "var(--p-bg)", borderTop: "1px solid var(--p-border)", padding: "10px 16px max(12px, env(safe-area-inset-bottom))", zIndex: 100 }}>

        {/* Image preview above input */}
        {pendingImage && (
          <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImage.preview} alt="preview" style={{ height: 72, width: 72, objectFit: "cover", borderRadius: 12, display: "block", border: `2px solid ${T.pink}` }} />
            <button
              onClick={() => setPendingImage(null)}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#333", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="pawzo-press"
            aria-label="Upload image"
            disabled={typing}
            style={{ width: 46, height: 46, borderRadius: "50%", border: `1.5px solid var(--p-border)`, background: "var(--p-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: typing ? 0.5 : 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.pinkDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={placeholder}
            style={{ flex: 1, height: 46, padding: "0 16px", borderRadius: 23, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 14, outline: "none", color: T.ink }}
          />

          <button
            onClick={() => send(input)}
            className="pawzo-press"
            aria-label="Send"
            disabled={typing && !pendingImage}
            style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: T.pink, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: typing ? 0.6 : 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
        <AiDisclaimer />
      </div>
    </AppFrame>
  );
}

export default function AIPage() {
  return (
    <Suspense>
      <AIContent />
    </Suspense>
  );
}
