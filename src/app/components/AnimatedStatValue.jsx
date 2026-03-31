"use client";

import { useEffect, useState } from "react";

export default function AnimatedStatValue({
  target,
  duration = 1400,
  delay = 0,
  suffix = "",
  className = "",
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let rafId;
    let timeoutId;
    const startAnimation = () => {
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = Math.round(target * eased);

        setCount(nextValue);

        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [target, duration, delay]);

  return (
    <span className={className}>
      {count}
      {suffix}
    </span>
  );
}
