import React, { useState } from 'react';

// ─── Size map ────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 36,
  lg: 48,
  xl: 64,
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

// ─── Status colours ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  online: '#34c759',
  offline: '#8e8e93',
  busy: '#ff3b30',
  away: '#ff9f0a',
};

// ─── Avatar Props ───────────────────────────────────────────────────────────
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  ring?: boolean;
  ringColor?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = React.memo(
  React.forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
    {
      src,
      alt = '',
      fallback,
      size = 'md',
      ring = false,
      ringColor = '#007AFF',
      status,
      className = '',
    },
    ref,
  ) {
    const [imgError, setImgError] = useState(false);
    const px = SIZE_MAP[size];
    const showImage = src && !imgError;

    // Derive initials from fallback or alt
    const initials = fallback
      ? fallback.slice(0, 2).toUpperCase()
      : alt
        ? alt
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : '?';

    // Font size relative to container
    const fontSize = size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : size === 'lg' ? 18 : 24;
    const statusDotSize = size === 'xs' || size === 'sm' ? 6 : 8;

    return (
      <div
        ref={ref}
        className={`relative inline-flex shrink-0 ${className}`}
        style={{
          width: px,
          height: px,
        }}
      >
        {/* Ring */}
        {ring && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${ringColor}`,
              margin: -2,
              width: px + 4,
              height: px + 4,
            }}
          />
        )}

        {/* Content */}
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="h-full w-full rounded-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 font-semibold text-primary"
            style={{ fontSize }}
            aria-label={alt || initials}
          >
            {initials}
          </div>
        )}

        {/* Status dot */}
        {status && (
          <span
            className="absolute bottom-0 right-0 block rounded-full ring-2 ring-white"
            style={{
              width: statusDotSize,
              height: statusDotSize,
              backgroundColor: STATUS_COLORS[status] ?? STATUS_COLORS.offline,
              // Offset so the dot sits on the edge when ring is present
              ...(ring ? { margin: 1 } : {}),
            }}
            aria-label={status}
          />
        )}
      </div>
    );
  }),
);

// ─── AvatarGroup Props ───────────────────────────────────────────────────────
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

// ─── AvatarGroup ─────────────────────────────────────────────────────────────
const AvatarGroup = React.memo(function AvatarGroup({
  children,
  max,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visible = max != null ? childArray.slice(0, max) : childArray;
  const overflow = max != null && childArray.length > max ? childArray.length - max : 0;

  const overflowFontSize =
    size === 'xs' ? 10 : size === 'sm' ? 11 : size === 'md' ? 12 : size === 'lg' ? 14 : 16;

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((child, i) => (
        <div key={i} className={i > 0 ? '-ml-2' : ''} style={{ zIndex: visible.length - i }}>
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-2 relative" style={{ zIndex: 0 }}>
          <div
            className="flex items-center justify-center rounded-full bg-surface-dark-2 text-text-secondary font-medium"
            style={{
              width: SIZE_MAP[size],
              height: SIZE_MAP[size],
              fontSize: overflowFontSize,
            }}
          >
            +{overflow}
          </div>
        </div>
      )}
    </div>
  );
});

export default Avatar;
export { AvatarGroup };
export type { AvatarProps, AvatarGroupProps, AvatarSize };