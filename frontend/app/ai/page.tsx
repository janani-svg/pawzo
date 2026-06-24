"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AppFrame, TopBar, T, IconSpark } from "../components/pawzo-ui";
import { usePawzo, useRequireAuth, type Pet } from "../lib/store";
import { chatApi, type ApiChatMessage } from "../lib/api";

type Msg = { id: string; role: "ai" | "user"; text: string; image?: string };

const PERSONA: Record<string, string> = {
  Dog: "Woof!", Cat: "Meow~", Bird: "Tweet tweet!",
  Rabbit: "*nose twitch*", Fish: "*blub blub*",
  Reptile: "*slow blink*", Hamster: "*squeak*", "Guinea pig": "*wheek!*",
};

function suggestionsFor(pet: Pet | null): string[] {
  if (!pet) return ["What should I feed my pet?", "How often should I groom?", "Is my pet a healthy weight?"];
  const sp = pet.species;
  const base = [`What should ${pet.name} eat?`, `Is ${pet.breed || sp} prone to any health issues?`];
  const bySpecies: Record<string, string[]> = {
    Dog:     ["How much exercise does my dog need?", "Why is my dog barking a lot?"],
    Cat:     ["Why is my cat scratching furniture?", "How often should I clean the litter box?"],
    Bird:    ["What fruits are safe for my bird?", "Why is my bird plucking feathers?"],
    Rabbit:  ["How much hay does my rabbit need?", "Is my rabbit's cage big enough?"],
    Fish:    ["How often should I change the tank water?", "What's the ideal water temperature?"],
    Reptile: ["What basking temperature is best?", "How often should my reptile eat?"],
  };
  return [...base, ...(bySpecies[sp] ?? ["How do I keep my pet happy?"])].slice(0, 4);
}

function toMsg(m: ApiChatMessage): Msg {
  return { id: m.id, role: m.role, text: m.text, image: m.image_data ?? undefined };
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

export default function AIPage() {
  const { ready, authed } = useRequireAuth();
  const { selectedPet } = usePawzo();
  const pet = ready ? selectedPet() : null;

  const [msgs, setMsgs]               = useState<Msg[]>([]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pendingImage, setPendingImage] = useState<{ base64: string; preview: string } | null>(null);
  const endRef   = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  /* Load chat history */
  useEffect(() => {
    if (!ready || !authed) return;
    setLoadingHistory(true);
    chatApi.history(pet?.id)
      .then((history) => {
        if (history.length > 0) {
          setMsgs(history.map(toMsg));
        } else {
          const who = pet ? `${pet.name} the ${pet.species.toLowerCase()}` : "your pet";
          setMsgs([{ id: "welcome", role: "ai", text: `Hi! I'm Pawzo AI 🐾 Ask me anything about ${who}'s care — food, health, behaviour, or send a photo for help!` }]);
        }
      })
      .catch(() => {
        setMsgs([{ id: "welcome", role: "ai", text: "Hi! I'm Pawzo AI 🐾 Ask me anything about your pet's care or send a photo!" }]);
      })
      .finally(() => setLoadingHistory(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pet?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

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

  async function send(text: string) {
    const t = text.trim();
    if ((!t && !pendingImage) || typing) return;

    const img = pendingImage;
    const tempId = `tmp-${Date.now()}`;
    setMsgs((m) => [...m, { id: tempId, role: "user", text: t, image: img?.preview }]);
    setInput("");
    setPendingImage(null);
    setTyping(true);

    try {
      const res = await chatApi.send(t, pet?.id, img?.base64);
      setMsgs((m) => [
        ...m.filter((x) => x.id !== tempId),
        toMsg(res.user_msg),
        toMsg(res.ai_msg),
      ]);
    } catch {
      const persona = pet ? (PERSONA[pet.species] ?? "Hi!") : "Hi!";
      setMsgs((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "ai", text: `${persona} Sorry, I couldn't connect right now. Please try again 🐾` },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const suggestions = suggestionsFor(pet);

  return (
    <AppFrame bg="var(--p-surface-2)">
      <TopBar back="/dashboard" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 12px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.pink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconSpark color="#fff" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: T.ink, margin: 0 }}>Pawzo AI</h1>
          <p style={{ fontSize: 11.5, color: T.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.success, display: "inline-block" }} />
            {pet ? `Helping with ${pet.name}` : "Animal care only"}
          </p>
        </div>
      </div>

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
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: T.maxW, background: "var(--p-nav)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--p-border)", padding: "10px 16px max(12px, env(safe-area-inset-bottom))", zIndex: 100 }}>

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
          {/* Camera / upload button */}
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
            placeholder={pet ? `Ask about ${pet.name} or share a photo…` : "Ask about your pet or share a photo…"}
            style={{ flex: 1, height: 46, padding: "0 16px", borderRadius: 23, border: "1.5px solid var(--p-border)", background: "var(--p-surface-2)", fontSize: 14, outline: "none", color: T.ink }}
          />

          {/* Send button */}
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
      </div>
    </AppFrame>
  );
}
