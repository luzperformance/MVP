import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@//stores/uiStore';
import type { SheetState } from '@//stores/uiStore';

/* ─── Bottom Sheet / Drawer — fiel ao V1 ─── */

function SheetInner() {
  const activeSheet = useUIStore((s) => s.activeSheet);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Prevent body scroll when open
  useEffect(() => {
    if (activeSheet) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [activeSheet]);

  // ESC key
  useEffect(() => {
    if (!activeSheet) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeSheet, closeSheet]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;

    // Only allow downward swipe — apply transform for visual feedback
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (sheetRef.current) {
      // Reset transition
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }

    if (deltaY > 60) {
      closeSheet();
    }
  }, [closeSheet]);

  if (!activeSheet) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeSheet}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 glass-panel rounded-t-2xl z-50 animate-slide-up lg:max-w-[420px] lg:left-1/2 lg:-translate-x-1/2"
        role="dialog"
        aria-modal
        aria-label={activeSheet.title}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        {activeSheet.title && (
          <div className="text-center text-base font-semibold text-white mb-4 px-6">
            {activeSheet.title}
          </div>
        )}

        {/* Content — scrollable, max 85vh minus handle + title approx */}
        <div className="overflow-y-auto max-h-[85vh] px-6 pb-8 scrollbar-visible">
          {activeSheet.content}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function Sheet() {
  return <SheetInner />;
}

/* ─── SheetTrigger ─── */

interface SheetTriggerProps {
  sheet: Omit<SheetState, 'id'>;
  children: React.ReactNode;
  className?: string;
}

export function SheetTrigger({ sheet, children, className }: SheetTriggerProps) {
  const openSheet = useUIStore((s) => s.openSheet);

  const handleClick = useCallback(() => {
    openSheet(sheet);
  }, [openSheet, sheet]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}