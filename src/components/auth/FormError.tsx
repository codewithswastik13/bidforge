import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/** Form-level error banner that expands/collapses smoothly. */
export default function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="form-error"
          role="alert"
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: 'auto', opacity: 1, marginTop: 0 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="mb-3.5 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[13px] leading-snug text-rose-200/90">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.8} />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
