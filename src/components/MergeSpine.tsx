"use client";

import { motion } from "framer-motion";

type Phase = 0 | 1 | 2 | 3 | 4;

const KEEP_LINES = [
  "M20,40 C160,50 260,150 320,200",
  "M20,90 C160,90 260,160 320,200",
  "M20,140 C160,120 270,170 320,200",
  "M20,260 C160,260 270,230 320,200",
  "M20,310 C160,300 260,240 320,200",
  "M20,360 C160,340 260,250 320,200",
];

const DISCARD_LINES = [
  "M20,15 C140,20 240,120 320,200",
  "M20,190 C140,180 250,190 320,200",
  "M20,210 C140,220 250,210 320,200",
  "M20,385 C140,370 250,260 320,200",
];

const CHECKPOINT_X = [370, 415, 460, 505, 550, 590];

export function MergeSpine({ phase }: { phase: Phase }) {
  const showDiscard = phase >= 1 && phase < 2;
  const linesConverged = phase >= 2;

  return (
    <svg
      viewBox="0 0 620 400"
      fill="none"
      className="h-full w-full"
      role="img"
      aria-label="Merging many sources into one path"
    >
      {KEEP_LINES.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--foreground)"
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: linesConverged ? 0 : 1,
          }}
          transition={{
            pathLength: { duration: 0.7, delay: 0.05 * i, ease: "easeOut" },
            opacity: { duration: 0.5, delay: linesConverged ? 0 : 0.05 * i },
          }}
        />
      ))}

      {DISCARD_LINES.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.7}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: showDiscard || phase >= 2 ? 1 : phase >= 1 ? 1 : 0,
            opacity: phase >= 2 ? 0 : phase >= 1 ? 1 : 0,
          }}
          transition={{ duration: 0.5, delay: 0.06 * i, ease: "easeOut" }}
        />
      ))}

      <motion.path
        d="M320,200 L360,200"
        stroke="var(--path)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: phase >= 2 ? 1 : 0, opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      <motion.path
        d="M360,200 L600,200"
        stroke="var(--path)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {CHECKPOINT_X.map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={200}
          r={6}
          fill={i === 0 ? "var(--path)" : "var(--foreground)"}
          stroke="var(--path)"
          strokeWidth={2}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase >= 3 ? 1 : 0,
            opacity: phase >= 3 ? 1 : 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.12 * i,
            type: "spring",
            stiffness: 280,
            damping: 20,
          }}
        />
      ))}

      <motion.circle
        cx={320}
        cy={200}
        r={5}
        fill="var(--path)"
        initial={{ scale: 0 }}
        animate={{ scale: linesConverged ? 1 : 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 18 }}
      />
    </svg>
  );
}
