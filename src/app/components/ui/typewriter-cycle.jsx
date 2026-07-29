"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/use-media-query";

/**
 * Types a word out one character at a time, holds it, backspaces it, then moves
 * on to the next word and loops forever.
 *
 * Respects `prefers-reduced-motion`: the words still cycle so no content is
 * hidden, but they swap instantly instead of animating.
 */
export const TypewriterCycle = ({
  words,
  className,
  textClassName,
  cursorClassName,
  typingSpeed = 90,
  deletingSpeed = 45,
  holdDuration = 1800,
  pauseBetweenWords = 500,
  startDelay = 400,
}) => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasStartedRef = useRef(false);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const wordCount = words.length;
  const word = wordCount > 0 ? words[wordIndex % wordCount] : "";

  useEffect(() => {
    if (!word) return;

    let timeoutId;

    if (!isDeleting) {
      if (text === word) {
        timeoutId = window.setTimeout(() => setIsDeleting(true), holdDuration);
      } else {
        const delay = hasStartedRef.current ? typingSpeed : startDelay;
        timeoutId = window.setTimeout(() => {
          hasStartedRef.current = true;
          setText(reducedMotion ? word : word.slice(0, text.length + 1));
        }, delay);
      }
    } else if (text === "") {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((index) => (index + 1) % wordCount);
      }, pauseBetweenWords);
    } else {
      timeoutId = window.setTimeout(() => {
        setText(reducedMotion ? "" : word.slice(0, text.length - 1));
      }, deletingSpeed);
    }

    return () => clearTimeout(timeoutId);
  }, [
    text,
    word,
    wordCount,
    isDeleting,
    reducedMotion,
    typingSpeed,
    deletingSpeed,
    holdDuration,
    pauseBetweenWords,
    startDelay,
  ]);

  return (
    <div className={cn("font-bold", className)}>
      {/* Screen readers get every word at once instead of a mutating string. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="inline-flex items-center">
        <span className={cn("leading-snug tracking-wide", textClassName)}>
          {text}
        </span>
        <motion.span
          aria-hidden="true"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }
          }
          className={cn(
            "ml-1 inline-block w-[3px] h-[0.85em] translate-y-[0.08em] rounded-sm bg-orange-400",
            cursorClassName
          )}
        />
      </span>
    </div>
  );
};
