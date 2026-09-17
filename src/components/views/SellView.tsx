"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  Send,
  ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { CameraCapture } from "@/components/sell/CameraCapture";
import { useProductsStore } from "@/store/products";
import { useAuthStore } from "@/store/auth";
import { useRouterStore } from "@/store/router";
import { CATEGORIES } from "@/lib/mock-data";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { n: 1, title: "Product information", icon: ClipboardList },
  { n: 2, title: "Base price", icon: BadgeIndianRupee },
  { n: 3, title: "Auction preferences", icon: CalendarClock },
  { n: 4, title: "Live camera verification", icon: Camera },
  { n: 5, title: "Submit for review", icon: Send },
];

const MIN_LEAD_DAYS = 7;

export function SellView() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [basePrice, setBasePrice] = useState("");
  const [auctionDate, setAuctionDate] = useState("");
  const [startOffset, setStartOffset] = useState("10:00");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; title: string } | null>(null);

  const submitProduct = useProductsStore((s) => s.submitProduct);
  const user = useAuthStore((s) => s.user);
  const navigate = useRouterStore((s) => s.navigate);

  /* ---- 7-day rule ---- */
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + MIN_LEAD_DAYS);
    return d.toISOString().slice(0, 10);
  }, []);
  const dateError = useMemo(() => {
    if (!auctionDate) return null;
    const selected = new Date(`${auctionDate}T00:00:00`);
    const min = new Date(`${minDate}T00:00:00`);
    if (selected < min) {
      return "Please select an auction date at least 7 days from today.";
    }
    return null;
  }, [auctionDate, minDate]);

  const price = parseInt(basePrice.replace(/[^\d]/g, ""), 10) || 0;
  const canStep1 = title.trim().length > 3 && description.trim().length > 12 && category;
  const canStep2 = price >= 500;
  const canStep3 = !!auctionDate && !dateError;
  const canStep4 = !!capturedImage;
  const canSubmit = canStep1 && canStep2 && canStep3 && canStep4;

  const requestedStart = useMemo(() => {
    if (!auctionDate) return null;
    const d = new Date(`${auctionDate}T${startOffset}:00`);
    return d.getTime();
  }, [auctionDate, startOffset]);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const sub = await submitProduct({
      sellerId: user?.id ?? "u-you",
      sellerName: user?.name ?? "You",
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      basePrice: price,
      auctionDate: requestedStart ?? Date.now(),
      capturedImage: capturedImage!,
    });
    setSubmitting(false);
    setSubmitted({ id: sub.id, title: sub.title });
    toast.success("Submitted for review", {
      description: "Track the status below — admins approve listings before they go live.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Sell with VYRA</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          List a product
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[oklch(0.62_0.01_260)]">
          Five steps between your product and a live auction room. Every listing is camera-verified
          and human-reviewed before it goes live.
        </p>
      </motion.div>

      {/* stepper */}
      <div className="no-scrollbar mt-9 flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => s.n < step && setStep(s.n)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-all",
                step === s.n
                  ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-200"
                  : step > s.n
                    ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-white/40"
              )}
              disabled={s.n > step}
            >
              {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{s.n}</span>
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-white/10" />}
          </div>
        ))}
      </div>

      {/* submitted confirmation */}
      <AnimatePresence>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mt-10 rounded-[1.75rem] p-10 text-center"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
              <FileCheck2 className="h-7 w-7 text-emerald-300" />
            </span>
            <h2 className="font-display mt-6 text-2xl font-semibold text-white">Pending review</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
              <span className="text-white/85">{submitted.title}</span> has been submitted with its
              live camera verification. Admin reviewers typically respond within 24 hours. Once
              approved, the lot becomes <span className="font-semibold text-cyan-300">READY FOR AUCTION</span> and
              appears on the homepage automatically.
            </p>
            <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
              <span className="text-white/40">Status</span>
              <span className="inline-flex items-center gap-2 font-semibold text-amber-300">
                <Clock3 className="h-3.5 w-3.5" /> Pending Review
              </span>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate("admin")}
                className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-cyan-200 transition-colors hover:bg-cyan-300/20"
              >
                Open admin review
              </button>
              <button
                onClick={() => {
                  setSubmitted(null);
                  setStep(1);
                  setTitle("");
                  setDescription("");
                  setCategory("");
                  setBasePrice("");
                  setAuctionDate("");
                  setCapturedImage(null);
                }}
                className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white/70"
              >
                List another product
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="wizard" layout className="glass mt-8 rounded-[1.75rem] p-6 sm:p-9">
            {/* step 1 */}
            {step === 1 && (
              <StepShell step={1}>
                <Field label="Product title" hint="Brand, model and what makes it collectible">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Limited Edition Chronograph — Titanium"
                    className="vyra-input"
                  />
                </Field>
                <Field label="Description" hint="Condition details, provenance, what's included">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the item's history, condition and included accessories…"
                    className="vyra-input resize-none"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Category">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="vyra-input appearance-none">
                      <option value="" disabled>
                        Select category
                      </option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[oklch(0.16_0.014_285)]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Condition">
                    <select value={condition} onChange={(e) => setCondition(e.target.value)} className="vyra-input appearance-none">
                      {["New — Unopened", "Excellent", "Good", "Vintage — Worn", "Collector Grade"].map((c) => (
                        <option key={c} value={c} className="bg-[oklch(0.16_0.014_285)]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </StepShell>
            )}

            {/* step 2 */}
            {step === 2 && (
              <StepShell step={2}>
                <Field label="Base price (₹)" hint="The auction opens here — competitive base prices attract more bidders">
                  <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 px-4 py-3.5 focus-within:border-cyan-300/50">
                    <span className="font-num text-xl font-semibold text-cyan-300">₹</span>
                    <input
                      inputMode="numeric"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="5,000"
                      className="font-num w-full bg-transparent text-xl font-semibold tabular text-white outline-none placeholder:text-white/20"
                    />
                  </div>
                </Field>
                {price > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: "Platform fee", v: Math.round(price * 0.05), tone: "text-white/75" },
                      { l: "You receive (est.)", v: price - Math.round(price * 0.05), tone: "text-emerald-300" },
                      { l: "Settlement", v: 0, tone: "text-white/50", text: "24h post-close" },
                    ].map((b) => (
                      <div key={b.l} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{b.l}</p>
                        <p className={cn("font-num mt-1 font-semibold", b.tone)}>
                          {b.text ?? formatINR(b.v)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-[12px] leading-relaxed text-white/55">
                  Bidders will compete in increments of ₹500 above your base price. The market decides
                  the final value — start low and let competition work.
                </p>
              </StepShell>
            )}

            {/* step 3 */}
            {step === 3 && (
              <StepShell step={3}>
                <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3.5">
                  <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-amber-200/90">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Products must be submitted at least <span className="font-bold">7 days before the auction</span>.
                      This gives reviewers time to verify and bidders time to prepare funds.
                    </span>
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Auction date">
                    <input
                      type="date"
                      value={auctionDate}
                      min={minDate}
                      onChange={(e) => setAuctionDate(e.target.value)}
                      className="vyra-input [color-scheme:dark]"
                    />
                  </Field>
                  <Field label="Start time (IST)">
                    <select value={startOffset} onChange={(e) => setStartOffset(e.target.value)} className="vyra-input appearance-none">
                      {["10:00", "14:00", "17:00", "20:00"].map((t) => (
                        <option key={t} value={t} className="bg-[oklch(0.16_0.014_285)]">
                          {t} IST
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <AnimatePresence>
                  {dateError && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-xs font-medium text-rose-200"
                      role="alert"
                    >
                      <ShieldQuestion className="h-4 w-4 shrink-0" /> {dateError}
                    </motion.p>
                  )}
                  {auctionDate && !dateError && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3 text-xs font-medium text-emerald-200"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Scheduled for {new Date(`${auctionDate}T${startOffset}`).toLocaleString("en-IN", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </motion.p>
                  )}
                </AnimatePresence>
              </StepShell>
            )}

            {/* step 4 — camera */}
            {step === 4 && <CameraCapture onCapture={(d) => setCapturedImage(d || null)} capturedImage={capturedImage} />}

            {/* step 5 — review */}
            {step === 5 && (
              <StepShell step={5}>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  {capturedImage && (
                     
                    <img src={capturedImage} alt="Captured product" className="h-40 w-40 shrink-0 rounded-2xl border border-white/12 object-cover" />
                  )}
                  <div className="min-w-0 flex-1 space-y-2.5 text-sm">
                    <ReviewRow k="Product" v={title} />
                    <ReviewRow k="Category" v={`${category} · ${condition}`} />
                    <ReviewRow k="Base price" v={formatINR(price)} />
                    <ReviewRow k="Auction date" v={auctionDate ? new Date(`${auctionDate}T${startOffset}`).toLocaleString("en-IN", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "—"} />
                    <ReviewRow k="Verification" v="Live camera capture attached" ok />
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed text-white/45">
                  By submitting you confirm the capture is unedited and the item matches your
                  description. Listings found misrepresenting condition are rejected and may affect
                  seller standing.
                </p>
              </StepShell>
            )}

            {/* nav */}
            <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-6">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 transition-all hover:border-white/30 disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {step < 5 ? (
                <button
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3) || (step === 4 && !canStep4)}
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.03] disabled:opacity-30 disabled:hover:scale-100"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.03] disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="space-y-6"
    >
      <h2 className="font-display text-lg font-semibold text-white">
        <span className="font-num mr-2 text-cyan-300">0{step}</span>
        {STEPS[step - 1].title}
      </h2>
      {children}
    </motion.div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-white/30">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ReviewRow({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <p className="flex items-center justify-between gap-4 border-b border-white/6 pb-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">{k}</span>
      <span className={cn("truncate text-right text-[13px]", ok ? "text-emerald-300" : "text-white/85")}>{v}</span>
    </p>
  );
}
