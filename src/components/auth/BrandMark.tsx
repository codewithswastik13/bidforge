import { useId, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { BidforgeMark } from '@/components/shared/BidforgeMark';

/** Retained intro emblem — matches the cinematic video's rabbit motif. */
export function RabbitGlyph({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b0a5ff" />
          <stop offset="0.5" stopColor="#8b7cff" />
          <stop offset="1" stopColor="#5b4bdb" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <rect x="10.1" y="3.2" width="4.8" height="13.2" rx="2.4" transform="rotate(-12 12.5 9.8)" />
        <rect x="17.1" y="3.2" width="4.8" height="13.2" rx="2.4" transform="rotate(12 19.5 9.8)" />
        <circle cx="16" cy="21.3" r="7.7" />
      </g>
      <circle cx="13.3" cy="20.6" r="1.05" fill="#0c0c16" opacity="0.6" />
      <circle cx="18.7" cy="20.6" r="1.05" fill="#0c0c16" opacity="0.6" />
    </svg>
  );
}

interface BrandMarkProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/** BidForge brand mark + wordmark on the auth screens. */
export default function BrandMark({ size = 28, withWordmark = false, className }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex select-none items-center gap-2.5', className)}>
      <span className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <span
          aria-hidden
          className="absolute inset-[-30%] rounded-xl bg-gradient-to-br from-[#8b7cff]/25 to-[#67e8f9]/15 blur-[10px]"
        />
        <BidforgeMark className="relative h-full w-full" />
      </span>
      {withWordmark && (
        <span className="font-display text-[19px] font-semibold leading-none tracking-tight text-white">
          BidForge
        </span>
      )}
    </span>
  );
}
