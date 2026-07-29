"use client";

import { useEffect, useRef } from "react";
import {
  FINE_POINTER_QUERY,
  REDUCED_MOTION_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";

const HTML_ACTIVE_CLASS = "glitch-cursor-active";

// Elements that draw a meaningful cursor of their own (text caret, the game's
// grab handle). We hide our cursor over them and let the browser take over.
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, canvas, [contenteditable="true"]';

const INTERACTIVE_SELECTOR =
  'a, button, summary, label, [role="button"], [role="link"], .cursor-pointer, .cursor-grab';

// Ghost copies that lag behind the tip: the further back, the looser the
// follow, the wider it drifts, and the fainter it gets.
const ECHOES = [
  { color: "#22d3ee", follow: 0.36, scale: 1.06, opacity: 0.75, drift: 10, slice: "inset(0 0 58% 0)" },
  { color: "#fb923c", follow: 0.23, scale: 1.13, opacity: 0.55, drift: 18, slice: "inset(36% 0 24% 0)" },
  { color: "#e879f9", follow: 0.14, scale: 1.22, opacity: 0.4, drift: 28, slice: "inset(64% 0 0 0)" },
];

// Pointer speed (px per frame) at which the glitch reaches full strength.
const SPEED_AT_FULL_GLITCH = 26;

const ARROW_PATH =
  "M7 3.5 L7 24.6 L12.7 19.3 L16.3 27.6 L21.1 25.4 L17.4 17.3 L25 17.1 Z";

const CursorArrow = ({ color, outlined = false }) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 32 32"
    fill="none"
    // Lines the arrow's tip up with the transform origin, i.e. the real pointer.
    style={{ position: "absolute", left: -8, top: -4 }}
  >
    <path
      d={ARROW_PATH}
      fill={color}
      stroke={outlined ? "#0a0a0a" : "none"}
      strokeWidth={outlined ? 2.6 : 0}
      strokeLinejoin="round"
    />
    {outlined && (
      <path
        d="M10.2 8.2 L10.2 18.6"
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    )}
  </svg>
);

/**
 * Cartoon arrow cursor that smears a chromatic glitch trail behind it while the
 * pointer moves. Mouse-only: touch and coarse pointers keep the default cursor,
 * and `prefers-reduced-motion` drops the trail but keeps the arrow.
 *
 * Positions are written straight to the DOM inside a rAF loop, so moving the
 * mouse never re-renders React. The loop parks itself once everything settles
 * and is woken by the next pointer event.
 */
export default function GlitchCursor() {
  const enabled = useMediaQuery(FINE_POINTER_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const rootRef = useRef(null);
  const tipRef = useRef(null);
  const echoRefs = useRef([]);
  const stateRef = useRef({
    x: -100,
    y: -100,
    prevX: -100,
    prevY: -100,
    intensity: 0,
    scale: 1,
    alpha: 0,
    visible: false,
    pressed: false,
    mode: "default",
    echoes: ECHOES.map(() => ({ x: -100, y: -100 })),
    rafId: 0,
  });

  useEffect(() => {
    const root = rootRef.current;
    const tip = tipRef.current;
    if (!enabled || !root || !tip) return;

    const state = stateRef.current;
    const echoNodes = echoRefs.current;

    // Advances the echo positions and writes every layer to the DOM.
    function renderLayers() {
      root.style.opacity = String(state.alpha);
      tip.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;

      ECHOES.forEach((echo, index) => {
        const node = echoNodes[index];
        if (!node) return;

        const position = state.echoes[index];
        position.x += (state.x - position.x) * echo.follow;
        position.y += (state.y - position.y) * echo.follow;

        const drift = state.intensity * echo.drift;
        const offsetX = (Math.random() - 0.5) * drift;
        const offsetY = (Math.random() - 0.5) * drift * 0.4;

        node.style.transform = `translate3d(${position.x + offsetX}px, ${position.y + offsetY}px, 0) scale(${state.scale * echo.scale})`;
        node.style.opacity = String(state.intensity * echo.opacity);
        // Torn-tape slices, but only in bursts, so the glitch keeps flickering.
        node.style.clipPath =
          state.intensity > 0.45 && Math.random() < 0.3 ? echo.slice : "none";
      });
    }

    function schedule() {
      if (state.rafId === 0) {
        state.rafId = requestAnimationFrame(frame);
      }
    }

    function frame() {
      state.rafId = 0;

      const speed = Math.hypot(state.x - state.prevX, state.y - state.prevY);
      state.prevX = state.x;
      state.prevY = state.y;

      const targetIntensity = reducedMotion
        ? 0
        : Math.min(speed / SPEED_AT_FULL_GLITCH, 1);
      // Snaps on quickly, trails off slowly, so the smear outlives the movement.
      const intensityEase = targetIntensity > state.intensity ? 0.5 : 0.12;
      state.intensity += (targetIntensity - state.intensity) * intensityEase;

      const targetScale = state.pressed ? 0.78 : state.mode === "interactive" ? 1.3 : 1;
      state.scale += (targetScale - state.scale) * 0.2;

      const targetAlpha = state.visible && state.mode !== "native" ? 1 : 0;
      state.alpha += (targetAlpha - state.alpha) * 0.25;

      const settled =
        speed === 0 &&
        state.intensity < 0.01 &&
        Math.abs(targetScale - state.scale) < 0.002 &&
        Math.abs(targetAlpha - state.alpha) < 0.002;

      if (settled) {
        state.intensity = 0;
        state.scale = targetScale;
        state.alpha = targetAlpha;
      }

      renderLayers();

      if (!settled) {
        schedule();
      }
    }

    const resolveMode = (target) => {
      if (!(target instanceof Element)) return "default";
      if (target.closest(NATIVE_CURSOR_SELECTOR)) return "native";
      if (target.closest(INTERACTIVE_SELECTOR)) return "interactive";
      return "default";
    };

    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;

      state.x = event.clientX;
      state.y = event.clientY;

      if (!state.visible) {
        // Appear where the pointer already is instead of flying in from 0,0.
        state.prevX = state.x;
        state.prevY = state.y;
        state.echoes.forEach((position) => {
          position.x = state.x;
          position.y = state.y;
        });
        state.visible = true;
      }

      state.mode = resolveMode(event.target);
      schedule();
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "touch") return;
      state.pressed = true;
      schedule();
    };

    const handlePointerUp = () => {
      state.pressed = false;
      schedule();
    };

    const handlePointerLeave = () => {
      state.visible = false;
      state.pressed = false;
      schedule();
    };

    document.documentElement.classList.add(HTML_ACTIVE_CLASS);
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      document.documentElement.classList.remove(HTML_ACTIVE_CLASS);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);

      if (state.rafId !== 0) {
        cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      }
    };
  }, [enabled, reducedMotion]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{ opacity: 0 }}
    >
      {ECHOES.map((echo, index) => (
        <div
          key={echo.color}
          ref={(node) => {
            echoRefs.current[index] = node;
          }}
          className="absolute top-0 left-0 origin-top-left"
          style={{
            opacity: 0,
            mixBlendMode: "screen",
            willChange: "transform, opacity",
          }}
        >
          <CursorArrow color={echo.color} />
        </div>
      ))}

      <div
        ref={tipRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          willChange: "transform",
          filter: "drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55))",
        }}
      >
        <CursorArrow color="#fbbf24" outlined />
      </div>
    </div>
  );
}
