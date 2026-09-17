"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, RefreshCcw, ScanLine, Sun, Video, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onCapture: (dataUrl: string) => void;
  capturedImage: string | null;
}

/**
 * Live camera verification — the primary product image MUST be
 * captured from the device camera (gallery selection is
 * deliberately not offered). Uses getUserMedia + canvas grab.
 */
export function CameraCapture({ onCapture, capturedImage }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "live" | "denied" | "error">("idle");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setState("starting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("live");
    } catch (e) {
      const err = e as Error;
      if (err.name === "NotAllowedError") {
        setState("denied");
        setError("Camera permission was blocked. Enable it in your browser settings to verify your product.");
      } else {
        setState("error");
        setError("No camera available on this device. Verification requires a live capture.");
      }
    }
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 260);
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 900;
    canvas.height = 900;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 900, 900);
    onCapture(canvas.toDataURL("image/jpeg", 0.86));
    stopStream();
    setState("idle");
  }

  function retake() {
    onCapture("");
    void startCamera();
  }

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
        <Camera className="h-4 w-4" /> Capture product photo
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        Capture a fresh image of your product to verify its current condition. Gallery uploads are
        not accepted for the verification shot — reviewers compare it against your listing details.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/12 bg-black/50" style={{ aspectRatio: "1/1" }}>
        {/* live preview */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("h-full w-full object-cover", state !== "live" && "hidden")}
        />

        {/* captured preview */}
        {capturedImage && state !== "live" && (
           
          <img src={capturedImage} alt="Captured product" className="h-full w-full object-cover" />
        )}

        {/* framing overlay */}
        {state === "live" && (
          <div className="pointer-events-none absolute inset-0">
            {/* corner frame */}
            {[
              "left-4 top-4 border-l-2 border-t-2 rounded-tl-lg",
              "right-4 top-4 border-r-2 border-t-2 rounded-tr-lg",
              "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-lg",
              "right-4 bottom-4 border-r-2 border-b-2 rounded-br-lg",
            ].map((cls) => (
              <span key={cls} className={cn("absolute h-12 w-12 border-cyan-300/90", cls)} />
            ))}
            {/* scan line */}
            <span className="absolute left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" style={{ animation: "scanline 2.6s linear infinite" }} />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-4 text-[11px] font-medium text-white/80">
              <span className="inline-flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-amber-300" /> Even lighting</span>
              <span className="inline-flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5 text-cyan-300" /> Fill the frame</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-violet-300" /> Show condition</span>
            </div>
          </div>
        )}

        {/* idle / error states */}
        {state !== "live" && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10">
              <Video className="h-7 w-7 text-cyan-300" />
            </span>
            <p className="max-w-xs text-sm text-white/60">
              {state === "idle" && "The camera opens right inside your browser. Nothing is uploaded until you submit for review."}
              {state === "starting" && "Requesting camera access…"}
              {state === "denied" && error}
              {state === "error" && error}
            </p>
            {(state === "denied" || state === "error") && (
              <p className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/80">
                <AlertTriangle className="h-3.5 w-3.5" /> Live capture is required to continue
              </p>
            )}
            <button
              onClick={() => void startCamera()}
              disabled={state === "starting"}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:scale-[1.03] disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {state === "starting" ? "Opening camera…" : state === "denied" || state === "error" ? "Try again" : "Open live camera"}
            </button>
          </div>
        )}

        {/* flash */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none absolute inset-0 bg-white"
            />
          )}
        </AnimatePresence>
      </div>

      {/* controls */}
      {state === "live" && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={capture}
            className="pulse-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <Camera className="h-4 w-4" /> Capture
          </button>
        </div>
      )}
      {capturedImage && state !== "live" && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={retake}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white/80 transition-all hover:border-white/30"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Retake
          </button>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Captured — looks good
          </p>
        </div>
      )}
    </div>
  );
}

export function CameraStatusChip({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
      <CheckCircle2 className="h-3.5 w-3.5" /> Verified capture
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
      <XCircle className="h-3.5 w-3.5" /> Capture required
    </span>
  );
}
