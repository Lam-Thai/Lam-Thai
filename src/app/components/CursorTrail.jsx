"use client";

import { useEffect, useRef } from "react";
import {
  FINE_POINTER_QUERY,
  REDUCED_MOTION_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";

const HTML_ACTIVE_CLASS = "custom-cursor-active";

// Elements that draw a meaningful cursor of their own (text caret, the game's
// grab handle). We hide our cursor over them and let the browser take over.
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, canvas, [contenteditable="true"]';

const INTERACTIVE_SELECTOR =
  'a, button, summary, label, [role="button"], [role="link"], .cursor-pointer, .cursor-grab';

// The streak is a chain of points: the head sits on the pointer and each one
// chases the point ahead of it. More points and a lazier follow make a longer
// ribbon that takes longer to reel back in.
const TRAIL_POINTS = 32;
const TRAIL_FOLLOW = 0.25;

// Layers stroked over one another, widest and faintest first, so the streak
// reads as a glow around a hot core instead of a flat orange line.
const TRAIL_LAYERS = [
  { color: "249, 115, 22", width: 15, alpha: 0.16 },
  { color: "251, 146, 60", width: 8, alpha: 0.35 },
  { color: "254, 215, 170", width: 3.2, alpha: 0.85 },
];

// Pointer speed (px per frame) at which the streak reaches full brightness.
const SPEED_AT_FULL_GLOW = 18;

const ARROW_PATH =
  "M7 3.5 L7 24.6 L12.7 19.3 L16.3 27.6 L21.1 25.4 L17.4 17.3 L25 17.1 Z";

/**
 * Cartoon arrow cursor that drags a ribbon of orange light behind it as the
 * pointer moves. Mouse-only: touch and coarse pointers keep the default cursor,
 * and `prefers-reduced-motion` drops the streak but keeps the arrow.
 *
 * The streak is drawn on a canvas and the arrow is positioned straight from a
 * rAF loop, so moving the mouse never re-renders React. The loop parks itself
 * once the streak has been reeled in and is woken by the next pointer event.
 */
export default function CursorTrail() {
  const enabled = useMediaQuery(FINE_POINTER_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const stateRef = useRef({
    x: -100,
    y: -100,
    prevX: -100,
    prevY: -100,
    glow: 0,
    scale: 1,
    alpha: 0,
    visible: false,
    pressed: false,
    mode: "default",
    points: Array.from({ length: TRAIL_POINTS }, () => ({ x: -100, y: -100 })),
    rafId: 0,
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    if (!enabled || !root || !canvas || !tip) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const state = stateRef.current;
    let viewportWidth = 0;
    let viewportHeight = 0;

    function resizeCanvas() {
      // Capped: a 3x buffer costs a lot of fill rate for no visible gain.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;

      canvas.width = Math.floor(viewportWidth * ratio);
      canvas.height = Math.floor(viewportHeight * ratio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      // Resizing the backing store resets the context, so re-apply the scale.
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
    }

    function drawTrail() {
      context.clearRect(0, 0, viewportWidth, viewportHeight);

      const brightness = state.glow * state.alpha;
      if (brightness <= 0.01) return;

      const { points } = state;
      // Additive blending: where the ribbon overlaps itself it burns brighter.
      context.globalCompositeOperation = "lighter";

      TRAIL_LAYERS.forEach((layer) => {
        for (let index = 0; index < points.length - 1; index += 1) {
          // 0 at the tip, 1 at the tail: the ribbon thins out and fades away.
          const distance = index / (points.length - 1);
          const taper = (1 - distance) ** 1.6;

          context.strokeStyle = `rgba(${layer.color}, ${layer.alpha * taper * brightness})`;
          context.lineWidth = layer.width * taper;
          context.beginPath();
          context.moveTo(points[index].x, points[index].y);
          context.lineTo(points[index + 1].x, points[index + 1].y);
          context.stroke();
        }
      });

      context.globalCompositeOperation = "source-over";
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

      const targetGlow = reducedMotion ? 0 : Math.min(speed / SPEED_AT_FULL_GLOW, 1);
      // Lights up fast, dims slowly, so the streak outlives the movement.
      state.glow += (targetGlow - state.glow) * (targetGlow > state.glow ? 0.45 : 0.045);

      const targetScale = state.pressed ? 0.78 : state.mode === "interactive" ? 1.3 : 1;
      state.scale += (targetScale - state.scale) * 0.2;

      const targetAlpha = state.visible && state.mode !== "native" ? 1 : 0;
      state.alpha += (targetAlpha - state.alpha) * 0.25;

      const { points } = state;
      points[0].x = state.x;
      points[0].y = state.y;

      let spread = 0;
      for (let index = 1; index < points.length; index += 1) {
        const point = points[index];
        const ahead = points[index - 1];
        point.x += (ahead.x - point.x) * TRAIL_FOLLOW;
        point.y += (ahead.y - point.y) * TRAIL_FOLLOW;
        spread += Math.abs(ahead.x - point.x) + Math.abs(ahead.y - point.y);
      }

      const settled =
        speed === 0 &&
        spread < 0.5 &&
        state.glow < 0.01 &&
        Math.abs(targetScale - state.scale) < 0.002 &&
        Math.abs(targetAlpha - state.alpha) < 0.002;

      if (settled) {
        state.glow = 0;
        state.scale = targetScale;
        state.alpha = targetAlpha;
      }

      root.style.opacity = String(state.alpha);
      tip.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
      drawTrail();

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
        // Appear where the pointer already is instead of whipping in from 0,0.
        state.prevX = state.x;
        state.prevY = state.y;
        state.points.forEach((point) => {
          point.x = state.x;
          point.y = state.y;
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

    const handleResize = () => {
      resizeCanvas();
      schedule();
    };

    resizeCanvas();
    document.documentElement.classList.add(HTML_ACTIVE_CLASS);
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      document.documentElement.classList.remove(HTML_ACTIVE_CLASS);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("resize", handleResize);

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
      <canvas ref={canvasRef} className="absolute top-0 left-0" />

      <div
        ref={tipRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          willChange: "transform",
          filter: "drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55))",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 32 32"
          fill="none"
          // Lines the arrow's tip up with the transform origin, i.e. the pointer.
          style={{ position: "absolute", left: -8, top: -4 }}
        >
          <path
            d={ARROW_PATH}
            fill="#fbbf24"
            stroke="#0a0a0a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M10.2 8.2 L10.2 18.6"
            stroke="#ffffff"
            strokeOpacity="0.65"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
