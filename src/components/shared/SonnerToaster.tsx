"use client";

import { Toaster as Sonner } from "sonner";

export function SonnerToaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={20}
      toastOptions={{
        classNames: {
          toast:
            "!bg-[oklch(0.18_0.014_285/0.92)] !border !border-white/10 !text-[oklch(0.97_0.005_106)] !backdrop-blur-xl !rounded-xl !shadow-2xl !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-[oklch(0.68_0.01_260)] !text-xs",
          actionButton: "!bg-cyan-400/20 !text-cyan-300",
          cancelButton: "!bg-white/5 !text-white/60",
          success: "[&_svg]:!text-emerald-400",
          error: "[&_svg]:!text-red-400",
          warning: "[&_svg]:!text-amber-400",
          info: "[&_svg]:!text-cyan-300",
        },
      }}
    />
  );
}
