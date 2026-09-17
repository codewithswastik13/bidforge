"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, Cpu, Database, Gauge, Radio, Server, XCircle } from "lucide-react";
import { SectionHeading, Sparkline } from "@/components/shared/Sparkline";
import { useMetricsStore } from "@/store/metrics";
import { formatNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 05 — LIVE SYSTEM: real-time platform observability rendered as
 * animated sparklines. Data arrives via METRICS_TICK events, the
 * same channel a real observability feed would use.
 */
export function LiveSystem() {
  const metrics = useMetricsStore((s) => s.metrics);

  return (
    <section className="relative py-24 lg:py-28" aria-label="Live system status">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            kicker="Under the hood"
            title={
              <>
                A live system, <span className="text-gradient">visible in real time</span>
              </>
            }
            sub="The bidding engine is built for heavy concurrency. These are the same signals our operations team watches."
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="ping-ring text-emerald-400 absolute inset-0 rounded-full opacity-60" />
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
              Live system
            </span>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* requests / sec */}
          <MetricCard
            label="Requests / sec"
            value={formatNum(metrics.requestsPerSec)}
            delta="+4.2%"
            icon={Activity}
            spark={metrics.history.rps}
            stroke="var(--vyra-cyan)"
            delay={0}
          />
          {/* active connections */}
          <MetricCard
            label="Active connections"
            value={formatNum(metrics.activeConnections)}
            delta="+2.1%"
            icon={Radio}
            spark={metrics.history.latency.map((l) => 1400 - l * 8)}
            stroke="var(--vyra-violet)"
            delay={0.08}
          />
          {/* latency */}
          <MetricCard
            label="Bid processing latency"
            value={`${metrics.avgLatencyMs.toFixed(1)}ms`}
            delta="p99 · 38ms"
            icon={Gauge}
            spark={metrics.history.latency}
            stroke="var(--vyra-amber)"
            delay={0.16}
          />
          {/* bids / sec */}
          <MetricCard
            label="Bids / sec"
            value={metrics.bidsPerSec.toFixed(0)}
            delta="peak 11"
            icon={Cpu}
            spark={metrics.history.bps}
            stroke="var(--vyra-green)"
            delay={0.24}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusTile icon={CheckCircle2} tone="emerald" label="Accepted bids" value={formatNum(metrics.acceptedBids)} />
          <StatusTile icon={XCircle} tone="red" label="Rejected bids" value={formatNum(metrics.rejectedBids)} />
          <StatusTile icon={Server} tone="cyan" label="WebSocket status" value="Operational" sub={`${metrics.activeConnections} sockets`} />
          <StatusTile icon={Database} tone="violet" label="Queue · Database" value="Operational" sub={`queue depth ${metrics.queueDepth}`} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  spark,
  stroke,
  delay,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  spark: number[];
  stroke: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className="group rounded-2xl border border-white/8 bg-white/[0.025] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/16"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</p>
        <Icon className="h-4 w-4 text-white/25 transition-colors group-hover:text-cyan-300/70" />
      </div>
      <p className="font-num mt-2.5 text-[1.65rem] font-semibold tabular text-white/95">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="font-num text-[11px] text-white/40">{delta}</span>
        <Sparkline data={spark} width={120} height={34} stroke={stroke} />
      </div>
    </motion.div>
  );
}

const TONES = {
  emerald: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.06]",
  red: "text-rose-300 border-rose-400/20 bg-rose-400/[0.05]",
  cyan: "text-cyan-300 border-cyan-300/20 bg-cyan-300/[0.06]",
  violet: "text-violet-300 border-violet-400/20 bg-violet-400/[0.06]",
} as const;

function StatusTile({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 backdrop-blur-xl">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", TONES[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
        <p className="font-num truncate text-sm font-semibold text-white/90">{value}</p>
        {sub && <p className="font-num text-[10px] text-white/35">{sub}</p>}
      </div>
      <span className="live-dot ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
    </div>
  );
}
