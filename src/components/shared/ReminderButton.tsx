"use client";

import { useState } from "react";
import { Bell, BellRing, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNotificationsStore } from "@/store/notifications";
import { cn } from "@/lib/utils";
import { formatDHM } from "@/lib/format";
import { useNow } from "@/hooks/use-vyra";

const OPTIONS = [
  { minutes: 5, label: "5 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
];

interface Props {
  auctionId: string;
  auctionTitle: string;
  startsAt: number;
  compact?: boolean;
  className?: string;
}

/**
 * Reminder system: choose an offset, store the reminder, and a
 * demo-mode trigger fires a notification shortly after so the UX
 * is observable. Reminder buttons flip to a confirmed state.
 */
export function ReminderButton({ auctionId, auctionTitle, startsAt, compact, className }: Props) {
  const setReminder = useNotificationsStore((s) => s.setReminder);
  const reminders = useNotificationsStore((s) => s.reminders);
  const cancelReminder = useNotificationsStore((s) => s.cancelReminder);
  const mine = reminders.find((r) => r.auctionId === auctionId);
  const [open, setOpen] = useState(false);
  const now = useNow();

  if (mine) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          cancelReminder(mine.id);
          toast("Reminder cancelled", { description: auctionTitle });
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300 transition-colors hover:bg-emerald-400/15",
          className
        )}
        title="Click to cancel reminder"
      >
        <Check className="h-3.5 w-3.5" />
        Reminder set
        <span className="font-num text-[10px] text-emerald-300/70">
          {formatDHM(Math.max(0, startsAt - now))}
        </span>
      </button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-md transition-all hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200",
            className
          )}
        >
          <Bell className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
          Set reminder
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className="glass-strong w-52 rounded-xl border-white/10 p-1.5"
      >
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.minutes}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setReminder(auctionId, auctionTitle, startsAt, o.minutes);
              toast.success("Reminder set", {
                description: `${auctionTitle} · ${o.label.toLowerCase()}`,
              });
            }}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-xs text-white/80 focus:bg-white/[0.06] focus:text-white"
          >
            <BellRing className="mr-2 h-3.5 w-3.5 text-cyan-300/80" />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact confirmed-state chip (for cards / search results) */
export function ReminderChip({ set }: { set: boolean }) {
  return (
    <AnimatePresence>
      {set && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
        >
          <Check className="h-2.5 w-2.5" /> Reminder
        </motion.span>
      )}
    </AnimatePresence>
  );
}
