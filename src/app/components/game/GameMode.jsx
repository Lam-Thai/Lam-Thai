"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import { isAllowedPopupHref, MILESTONES } from "@/lib/game-data";

const EMPTY_INPUT = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
};

export default function GameMode() {
  const [popup, setPopup] = useState(null);
  const [showHelp, setShowHelp] = useState(true);
  const inputRef = useRef({ ...EMPTY_INPUT });
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = popup !== null;
  }, [popup]);

  const openPopup = useCallback((payload) => {
    // Defense in depth: only ever embed known same-origin portfolio pages.
    if (!payload || !isAllowedPopupHref(payload.href)) return;
    Object.assign(inputRef.current, EMPTY_INPUT); // stop any held movement
    setPopup({ href: payload.href, title: payload.title ?? "Details" });
  }, []);

  const closePopup = useCallback(() => setPopup(null), []);

  // Escape closes the popup.
  useEffect(() => {
    if (!popup) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [popup, closePopup]);

  const holdKey = (action) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      inputRef.current[action] = true;
    },
    onPointerUp: () => {
      inputRef.current[action] = false;
    },
    onPointerCancel: () => {
      inputRef.current[action] = false;
    },
    onContextMenu: (event) => event.preventDefault(),
  });

  const dpadButton =
    "flex items-center justify-center w-14 h-14 rounded-xl bg-black/50 border border-amber-500/40 text-amber-200 text-xl font-bold select-none touch-none active:bg-amber-500/30 backdrop-blur-sm";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <GameCanvas
        onInteract={openPopup}
        inputRef={inputRef}
        pausedRef={pausedRef}
      />

      {/* Quest banner */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-lg bg-black/55 border border-amber-500/40 backdrop-blur-sm text-center">
        <p className="text-amber-300 font-semibold text-sm md:text-base tracking-wide">
          ⚔️ The Realm of Lam Thai
        </p>
        <p className="text-zinc-300 text-xs md:text-sm">
          {MILESTONES.length} quests await — seek the characters and read their
          signs
        </p>
      </div>

      {/* Controls help card */}
      {showHelp && (
        <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-xl bg-black/60 border border-amber-500/40 backdrop-blur-sm p-4 text-sm text-zinc-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-amber-300 font-bold">How to play</h2>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-zinc-400 hover:text-white leading-none"
              aria-label="Dismiss controls help"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1.5">
            <li>
              <span className="text-amber-300 font-medium">WASD / Arrows</span>{" "}
              — move your knight (Shift to run)
            </li>
            <li>
              <span className="text-amber-300 font-medium">Drag</span> — look
              around · <span className="text-amber-300 font-medium">Scroll</span>{" "}
              — zoom
            </li>
            <li>
              <span className="text-amber-300 font-medium">Click signs</span> —
              open a project&apos;s story
            </li>
            <li>
              <span className="text-amber-300 font-medium">Space</span> —
              Jump
            </li>
            <li>
              <span className="text-amber-300 font-medium">Double Space</span> —
              Double Jump
            </li>
            
          </ul>
        </div>
      )}
      {!showHelp && (
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 font-bold backdrop-blur-sm hover:bg-black/80"
          aria-label="Show controls help"
        >
          ?
        </button>
      )}

      {/* Touch D-pad (touch devices only) */}
      <div className="absolute bottom-6 left-6 z-20 hidden [@media(pointer:coarse)]:grid grid-cols-3 gap-1.5 w-max">
        <div />
        <button type="button" className={dpadButton} aria-label="Move forward" {...holdKey("forward")}>
          ▲
        </button>
        <div />
        <button type="button" className={dpadButton} aria-label="Move left" {...holdKey("left")}>
          ◀
        </button>
        <button type="button" className={dpadButton} aria-label="Move back" {...holdKey("back")}>
          ▼
        </button>
        <button type="button" className={dpadButton} aria-label="Move right" {...holdKey("right")}>
          ▶
        </button>
      </div>

      {/* Popup window with the embedded portfolio page */}
      {popup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={popup.title}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closePopup}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden border-2 border-amber-600/60 bg-zinc-950 shadow-[0_0_60px_rgba(217,164,65,0.25)] flex flex-col">
            <header className="flex items-center justify-between gap-4 px-5 py-3 bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b border-amber-600/40">
              <h2 className="text-amber-300 font-bold text-lg truncate">
                📜 {popup.title}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={popup.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 hover:border-amber-500/60 transition-colors"
                >
                  Open full page
                </a>
                <button
                  type="button"
                  onClick={closePopup}
                  className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-amber-500/60 transition-colors"
                  aria-label="Close popup"
                >
                  ✕
                </button>
              </div>
            </header>
            <iframe
              src={popup.href}
              title={popup.title}
              className="flex-1 w-full bg-black"
              referrerPolicy="same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
