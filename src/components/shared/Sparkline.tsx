"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  className?: string;
  strokeWidth?: number;
}

/** Lightweight SVG sparkline — no chart library, GPU friendly. */
export function Sparkline({
  data,
  width = 140,
  height = 36,
  stroke = "var(--vyra-cyan)",
  fill = true,
  className,
  strokeWidth = 1.6,
}: Props) {
  const gid = useId();
  if (data.length < 2) return <svg width={width} height={height} className={className} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map(
    (v, i) => [i * step, height - 2 - ((v - min) / range) * (height - 4)] as const
  );
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gid})`} />
        </>
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={stroke} />
    </svg>
  );
}

export function SectionHeading({
  kicker,
  title,
  sub,
  align = "left",
  className,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
        <span className="inline-block h-px w-6 bg-gradient-to-r from-cyan-300/70 to-transparent" />
        {kicker}
        {align === "center" && <span className="inline-block h-px w-6 bg-gradient-to-l from-cyan-300/70 to-transparent" />}
      </p>
      <h2 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-[oklch(0.97_0.005_106)] sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-[oklch(0.68_0.01_260)]">{sub}</p>}
    </div>
  );
}
