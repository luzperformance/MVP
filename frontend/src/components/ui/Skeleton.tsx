import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animate?: boolean;
}

export function SkeletonLine({ width, height, className = '' }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height: height || '16px' }}
    />
  );
}

const Skeleton = React.memo(function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 3,
  className = '',
  animate = true,
}: SkeletonProps) {
  if (!animate) {
    // Static gray bar
    return (
      <div
        className={`bg-white/[0.04] rounded-lg ${className}`}
        style={{
          width: width || (variant === 'circular' ? '40px' : '100%'),
          height: height || (variant === 'circular' ? '40px' : variant === 'rectangular' ? '96px' : '16px'),
        }}
      />
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`skeleton rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`skeleton rounded-xl ${className}`}
        style={{ width: width || '100%', height: height || '96px' }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`space-y-3 ${className}`}>
        <SkeletonLine width="40%" height="20px" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="80%" />
        <SkeletonLine width="60%" />
      </div>
    );
  }

  // text variant
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
});

export default Skeleton;