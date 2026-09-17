"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatINR, formatNum } from "@/lib/format";

interface Props {
  value: number;
  currency?: boolean;
  className?: string;
  duration?: number;
}

/**
 * Smoothly animates between numeric values — prices never jump.
 * Uses a single framer-motion animation per change; cheap to render.
 */
export function AnimatedNumber({ value, currency = true, className, duration = 0.6 }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = value;
      return;
    }
    const from = prev.current;
    prev.current = value;
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={`font-num tabular ${className ?? ""}`}>
      {currency ? formatINR(display) : formatNum(display)}
    </span>
  );
}
