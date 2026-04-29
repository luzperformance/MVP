import { create } from 'zustand';

/* ─── Toast ─── */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

/* ─── Confirm ─── */
export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

/* ─── Sheet ─── */
export interface SheetState {
  id: string;
  title?: string;
  content: React.ReactNode;
  snapPoints?: number[];
}

/* ─── Store ─── */
interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarToggle: boolean; // collapsed on desktop
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Confirm
  confirm: ConfirmOptions | null;
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;

  // Sheet
  activeSheet: SheetState | null;
  openSheet: (sheet: Omit<SheetState, 'id'>) => void;
  closeSheet: () => void;

  // Global loading overlay
  loadingOverlay: boolean;
  setLoadingOverlay: (v: boolean) => void;
}

let toastCounter = 0;
let sheetCounter = 0;

export const useUIStore = create<UIState>()((set) => ({
  // Sidebar
  sidebarOpen: false,
  sidebarToggle: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () =>
    set((s) => ({ sidebarToggle: !s.sidebarToggle })),

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),

  // Confirm
  confirm: null,
  showConfirm: (options) => set({ confirm: options }),
  hideConfirm: () => set({ confirm: null }),

  // Sheet
  activeSheet: null,
  openSheet: (sheet) =>
    set({ activeSheet: { ...sheet, id: `sheet-${++sheetCounter}` } }),
  closeSheet: () => set({ activeSheet: null }),

  // Loading
  loadingOverlay: false,
  setLoadingOverlay: (v) => set({ loadingOverlay: v }),
}));
