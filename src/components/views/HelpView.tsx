"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useRouterStore } from "@/store/router";

const FAQ = [
  {
    q: "How fast are bids processed?",
    a: "Bids are routed through the realtime engine with a median latency of ~12ms. The moment your bid is accepted, every participant in the room sees the new price — no refresh needed. Under heavy load, the engine scales horizontally and queues are drained in order, so fairness is preserved.",
  },
  {
    q: "Why does my bid need to exceed the current highest bid?",
    a: "Auction integrity depends on strict price progression. If the current highest bid is ₹10,000, your bid must be at least ₹10,500 (with ₹500 increments). Lower bids are rejected instantly with a clear reason — nothing is charged or locked on a rejection.",
  },
  {
    q: "What happens when I bid near the end of an auction?",
    a: "If a valid bid lands inside the final 45 seconds, the auction extends by 15 seconds. This gives every participant a fair final window and prevents sniping. Extensions repeat as long as new valid bids arrive.",
  },
  {
    q: "Wallet vs UPI / bank — which should I use?",
    a: "Wallet funds are available immediately and are the fastest path to a winning bid. UPI and bank transfers can take extra processing time. If funds are not available when a bid is submitted, the transaction may fail or the bid may be rejected — so top up before the auction begins.",
  },
  {
    q: "How does product verification work?",
    a: "Every listing requires a fresh photo captured through the live camera during submission. Admin reviewers compare the capture against the listing details and either approve it (the lot becomes READY FOR AUCTION), request changes, or reject it. This keeps the marketplace free of stale stock photos.",
  },
  {
    q: "When do I get my winnings?",
    a: "Winning bids settle through escrow immediately after the hammer falls. Sellers ship after funds clear, and buyers are protected if the item does not match its verified condition. Settlement status is visible in your wallet and profile transaction history.",
  },
];

export function HelpView() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Help center</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Questions, answered
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[oklch(0.62_0.01_260)]">
          Everything about bidding, payments, verification and settlement — in plain language.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="glass mt-9 rounded-[1.5rem] px-6 py-2 sm:px-8">
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/8">
              <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-white/90 hover:text-cyan-200 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-relaxed text-[oklch(0.62_0.01_260)]">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="glass flex items-start gap-4 rounded-2xl p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-white">Live support</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              Chat with the room operations team during live auctions — median response under 2 minutes.
            </p>
          </div>
        </div>
        <div className="glass flex items-start gap-4 rounded-2xl p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-white">Email & escalations</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              support@vyra.example — for settlement, verification and account escalations.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => navigate("home", { scrollTo: "live-system" })}
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-300/90 hover:text-cyan-200"
        >
          <ShieldCheck className="h-4 w-4" /> View live system status
        </button>
      </div>
    </div>
  );
}
