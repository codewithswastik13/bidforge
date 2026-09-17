"use client";

import { useId } from "react";

/**
 * BIDFORGE brand mark — an ascending bid staircase launching into a
 * strike arrow. The steps read as successive bids; the arrowhead is
 * the take of the lead. Pure geometry on the platform's cyan→violet
 * gradient system.
 */
export function BidforgeMark({ className }: { className?: string }) {
  const id = useId();
  const grad = `bf-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id={grad}
          x1="4"
          y1="19.5"
          x2="20"
          y2="9.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d="M4 19.5H9.5V14.5H15L20 9.5"
        stroke={`url(#${grad})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9.5H20V14"
        stroke={`url(#${grad})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
