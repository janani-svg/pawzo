"use client";

import { useRef, useState } from "react";
import { T } from "./pawzo-ui";

type CropBox = { x: number; y: number; w: number; h: number };
type Corner  = "tl" | "tr" | "bl" | "br";
type DragT   = "move" | Corner | null;

const CURSOR: Record<Corner, string> = { tl: "nw-resize", tr: "ne-resize", bl: "sw-resize", br: "se-resize" };

export function CropStep({
  photo,
  onCrop,
  onBack,
}: {
  photo: string;
  onCrop: (cropped: string) => void;
  onBack: () => void;
}) {
  const [box, setBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [ar, setAr]   = useState<"free" | "1:1" | "4:3" | "16:9">("free");
  const imgRef       = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<{ type: DragT; startX: number; startY: number; startBox: CropBox } | null>(null);

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  function withAr(b: CropBox, ratio: string): CropBox {
    if (ratio === "free") return b;
    const rs: Record<string, number> = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9 };
    const r = rs[ratio];
    if (!r) return b;
    return { ...b, h: clamp(b.w / r, 10, 100 - b.y) };
  }

  function onDown(e: React.PointerEvent, type: DragT) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { type, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  }

  function onMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const sb = drag.startBox;
    let nb = { ...sb };
    switch (drag.type) {
      case "move":
        nb.x = clamp(sb.x + dx, 0, 100 - sb.w);
        nb.y = clamp(sb.y + dy, 0, 100 - sb.h);
        break;
      case "tl":
        nb.x = clamp(sb.x + dx, 0, sb.x + sb.w - 10);
        nb.y = clamp(sb.y + dy, 0, sb.y + sb.h - 10);
        nb.w = sb.w - (nb.x - sb.x);
        nb.h = sb.h - (nb.y - sb.y);
        break;
      case "tr":
        nb.y = clamp(sb.y + dy, 0, sb.y + sb.h - 10);
        nb.w = clamp(sb.w + dx, 10, 100 - sb.x);
        nb.h = sb.h - (nb.y - sb.y);
        break;
      case "bl":
        nb.x = clamp(sb.x + dx, 0, sb.x + sb.w - 10);
        nb.w = sb.w - (nb.x - sb.x);
        nb.h = clamp(sb.h + dy, 10, 100 - sb.y);
        break;
      case "br":
        nb.w = clamp(sb.w + dx, 10, 100 - sb.x);
        nb.h = clamp(sb.h + dy, 10, 100 - sb.y);
        break;
    }
    if (ar !== "free") nb = withAr(nb, ar);
    setBox(nb);
  }

  function doCrop() {
    const img = imgRef.current;
    if (!img) return;
    const pw = (box.w / 100) * img.naturalWidth;
    const ph = (box.h / 100) * img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width  = pw;
    canvas.height = ph;
    canvas.getContext("2d")!.drawImage(
      img,
      (box.x / 100) * img.naturalWidth,
      (box.y / 100) * img.naturalHeight,
      pw, ph, 0, 0, pw, ph,
    );
    onCrop(canvas.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.93)", display: "flex", flexDirection: "column" }}>
      {/* toolbar */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ← Back
        </button>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Crop Photo ✂️</span>
        <button onClick={doCrop} style={{ background: T.pink, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          Use
        </button>
      </div>

      {/* aspect-ratio presets */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "0 16px 14px", flexShrink: 0 }}>
        {(["free", "1:1", "4:3", "16:9"] as const).map((p) => (
          <button key={p}
            onClick={() => { setAr(p); setBox((b) => withAr(b, p)); }}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${ar === p ? T.pink : "rgba(255,255,255,0.3)"}`, background: ar === p ? T.pink : "transparent", fontWeight: 700, fontSize: 12, color: "#fff", cursor: "pointer" }}>
            {p === "free" ? "Free" : p}
          </button>
        ))}
      </div>

      {/* image + interactive crop box */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", minHeight: 0 }}>
        <div
          ref={containerRef}
          style={{ position: "relative", width: "100%", maxWidth: 500, userSelect: "none", touchAction: "none" }}
          onPointerMove={onMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={photo} alt="" style={{ display: "block", width: "100%", height: "auto" }} draggable={false} />

          {/* dark overlay — 4 areas surrounding crop box */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${box.y}%`, background: "rgba(0,0,0,0.58)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${100 - box.y - box.h}%`, background: "rgba(0,0,0,0.58)" }} />
            <div style={{ position: "absolute", top: `${box.y}%`, height: `${box.h}%`, left: 0, width: `${box.x}%`, background: "rgba(0,0,0,0.58)" }} />
            <div style={{ position: "absolute", top: `${box.y}%`, height: `${box.h}%`, right: 0, width: `${100 - box.x - box.w}%`, background: "rgba(0,0,0,0.58)" }} />
          </div>

          {/* crop box — draggable to move */}
          <div
            onPointerDown={(e) => onDown(e, "move")}
            style={{ position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, border: "2px solid rgba(255,255,255,0.9)", cursor: "move", touchAction: "none", boxSizing: "border-box" }}>

            {/* rule-of-thirds grid */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[33.3, 66.6].map((pct) => (
                <div key={`v${pct}`} style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.28)" }} />
              ))}
              {[33.3, 66.6].map((pct) => (
                <div key={`h${pct}`} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.28)" }} />
              ))}
            </div>

            {/* corner handles */}
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <div key={c}
                onPointerDown={(e) => onDown(e, c)}
                style={{
                  position: "absolute", width: 20, height: 20,
                  background: "#fff", borderRadius: 5, touchAction: "none",
                  cursor: CURSOR[c],
                  top:    c[0] === "t" ? -6 : undefined,
                  bottom: c[0] === "b" ? -6 : undefined,
                  left:   c[1] === "l" ? -6 : undefined,
                  right:  c[1] === "r" ? -6 : undefined,
                }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
