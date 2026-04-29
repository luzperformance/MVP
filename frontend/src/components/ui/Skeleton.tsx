import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

interface SkeletonBaseProps {
  className?: string;
  animate?: boolean;
}

interface SkeletonTextProps extends SkeletonBaseProps {
  variant: 'text';
  lines?: number;
  width?: string | number;
  height?: string | number;
}

interface SkeletonCircularProps extends SkeletonBaseProps {
  variant: 'circular';
  width?: string | number;
  height?: string | number;
}

interface SkeletonRectangularProps extends SkeletonBaseProps {
  variant: 'rectangular';
  width?: string | number;
  height?: string | number;
}

interface SkeletonCardProps extends SkeletonBaseProps {
  variant: 'card';
  width?: string | number;
  height?: string | number;
}

type SkeletonProps =
  | SkeletonTextProps
  | SkeletonCircularProps
  | SkeletonRectangularProps
  | SkeletonCardProps;

/* ── Helper: normalize dimension values ── */
function dim(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? `${value}px` : value;
}

/* ── Individual skeleton line (exported for reuse) ── */
interface SkeletonLineProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

const SkeletonLine = React.memo(function SkeletonLine({
  width,
  height = 16,
  className = '',
  animate = true,
}: SkeletonLineProps) {
  return (
    <div
      className={`skeleton${animate ? '' : ' skeleton--static'}${className ? ` ${className}` : ''}`}
      style={{
        width: dim(width, '100%'),
        height: dim(height, '16px'),
      }}
    />
  );
});

/* ── Main Skeleton component ── */
const Skeleton = React.memo(function Skeleton(props: SkeletonProps) {
  const { variant, className = '', animate = true } = props;

  const staticClass = animate ? '' : ' skeleton--static';

  switch (variant) {
    /* ── Text: N lines, last at 60% ── */
    case 'text': {
      const { lines = 3 } = props;
      return (
        <div
          className={`skeleton-text${staticClass}${className ? ` ${className}` : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {Array.from({ length: lines }, (_, i) => (
            <SkeletonLine
              key={i}
              width={i === lines - 1 ? '60%' : '100%'}
              height={16}
              animate={animate}
            />
          ))}
        </div>
      );
    }

    /* ── Circular: round avatar placeholder ── */
    case 'circular': {
      const size = dim(props.width ?? 40, '40px');
      return (
        <div
          className={`skeleton${staticClass}${className ? ` ${className}` : ''}`}
          style={{
            width: size,
            height: dim(props.height, size),
            borderRadius: 'var(--border-radius-full)',
            flexShrink: 0,
          }}
        />
      );
    }

    /* ── Rectangular: generic block ── */
    case 'rectangular': {
      return (
        <div
          className={`skeleton${staticClass}${className ? ` ${className}` : ''}`}
          style={{
            width: dim(props.width, '100%'),
            height: dim(props.height, '96px'),
            borderRadius: 'var(--border-radius)',
          }}
        />
      );
    }

    /* ── Card: header + 2 content lines + footer ── */
    case 'card': {
      return (
        <div
          className={`skeleton-card${staticClass}${className ? ` ${className}` : ''}`}
          style={{
            width: dim(props.width, '100%'),
            borderRadius: 'var(--border-radius)',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Header line */}
          <SkeletonLine width="45%" height={20} animate={animate} />
          {/* Two content lines */}
          <SkeletonLine width="100%" height={16} animate={animate} />
          <SkeletonLine width="80%" height={16} animate={animate} />
          {/* Footer line */}
          <div style={{ marginTop: '8px' }}>
            <SkeletonLine width="30%" height={14} animate={animate} />
          </div>
        </div>
      );
    }

    default:
      return null;
  }
});

export default Skeleton;
export { SkeletonLine };
export type { SkeletonProps, SkeletonVariant, SkeletonLineProps };