"use client";

/* PAWZO Landing / splash — premium iPhone-"Hello"-style screen.
   "PAWZO" is drawn on like handwriting (stroke traces, then inks in), after
   which two large paw prints step in diagonally — as if a dog walked behind
   the logo. Solid fills only, no gradients. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T, PrimaryButton, IconPaw } from "./components/pawzo-ui";

const SEEN_LANDING_KEY = "pawzo:seenLanding";

export default function Landing() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [walked, setWalked] = useState(false);
  const [showCta, setShowCta] = useState(false);

  // First launch ever: play the splash. Every launch after that: skip straight to the dashboard.
  useEffect(() => {
    if (localStorage.getItem(SEEN_LANDING_KEY)) {
      setShowSplash(false);
      router.replace("/dashboard");
    } else {
      localStorage.setItem(SEEN_LANDING_KEY, "1");
      setShowSplash(true);
    }
  }, [router]);

  useEffect(() => {
    if (!showSplash) return;
    const t1 = setTimeout(() => setWalked(true), 2600);
    const t2 = setTimeout(() => setShowCta(true), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showSplash]);

  if (!showSplash) return null;

  // diagonal trail of paws (the two large ones are the hero pair)
  const paws = [
    { x: 64, y: 232, size: 30, rot: -18, op: 0.16, big: false },
    { x: 104, y: 250, size: 34, rot: -10, op: 0.2, big: false },
    { x: 150, y: 250, size: 78, rot: -12, op: 0.9, big: true },
    { x: 214, y: 232, size: 88, rot: 12, op: 0.9, big: true },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--p-bg)", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: T.maxW,
          minHeight: "100dvh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "0 28px",
        }}
      >
        {/* wordmark + paws */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "relative", width: 320, height: 200 }}>
            {/* paw prints stepping in behind the word */}
            {walked &&
              paws.map((p, i) => (
                <div
                  key={i}
                  className="pawzo-step"
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    transform: `rotate(${p.rot}deg)`,
                    animationDelay: `${i * 160}ms`,
                    ["--paw-op" as string]: p.op,
                  } as React.CSSProperties}
                  aria-hidden
                >
                  <IconPaw color={T.pinkDeep} size={p.size} />
                </div>
              ))}

            {/* handwritten PAWZO */}
            <svg viewBox="0 0 320 150" style={{ width: "100%", height: "auto", position: "absolute", top: 30, left: 0 }} role="img" aria-label="PAWZO">
              <text
                x="160"
                y="100"
                textAnchor="middle"
                className="pawzo-write"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 78, letterSpacing: "-2px" }}
              >
                PAWZO
              </text>
            </svg>
          </div>

          <p
            style={{
              marginTop: 8,
              fontSize: 16,
              color: T.gray,
              textAlign: "center",
              maxWidth: 280,
              lineHeight: 1.5,
              opacity: showCta ? 1 : 0,
              transition: "opacity 600ms ease-out",
            }}
          >
            A warm little home for your pet&apos;s whole life.
          </p>
        </div>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: 48,
            opacity: showCta ? 1 : 0,
            transform: showCta ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 500ms ease-out, transform 500ms ease-out",
            pointerEvents: showCta ? "auto" : "none",
          }}
        >
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <PrimaryButton full style={{ height: 54, fontSize: 16 }}>
              Get started
            </PrimaryButton>
          </Link>
          <Link
            href="/login"
            style={{ textAlign: "center", fontSize: 14.5, fontWeight: 700, color: T.gray, textDecoration: "none", padding: 8 }}
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
