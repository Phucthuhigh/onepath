"use client";

import { motion, useReducedMotion } from "framer-motion";

const SCATTERED = [
  "M40,0 C60,60 120,120 176,200",
  "M90,0 C100,70 140,130 184,204",
  "M140,10 C150,80 170,140 192,208",
  "M240,10 C220,80 210,140 200,208",
  "M300,0 C270,70 220,130 208,204",
  "M350,0 C310,60 240,120 216,200",
];

const DOTS_Y = [268, 336, 404, 472, 540];

export function HeroSpine() {
  const reduced = useReducedMotion();

  return (
    <svg
      viewBox="0 0 400 600"
      fill="none"
      className="h-full w-full"
      role="img"
      aria-label="Many sources converging into a single path"
    >
      {SCATTERED.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--foreground)"
          strokeOpacity={0.35}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.15 * i, ease: "easeOut" }}
        />
      ))}

      <motion.path
        d="M200,208 C202,240 200,260 200,268 L200,560"
        stroke="var(--path)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1, ease: "easeOut" }}
      />

      {DOTS_Y.map((y, i) => {
        const isLast = i === DOTS_Y.length - 1;
        return (
          <g key={y}>
            {isLast && !reduced && (
              <motion.circle
                cx={200}
                cy={y}
                r={5}
                fill="none"
                stroke="var(--path)"
                strokeWidth={1.5}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 2.4 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 1.8 }}
                style={{ transformOrigin: `${200}px ${y}px` }}
              />
            )}
            <motion.circle
              cx={200}
              cy={y}
              r={isLast ? 6 : 4.5}
              fill={isLast ? "var(--path)" : "var(--foreground)"}
              stroke={isLast ? "none" : "var(--path)"}
              strokeWidth={isLast ? 0 : 2}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
