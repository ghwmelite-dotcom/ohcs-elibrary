import { create } from 'zustand';
import type { Toast, Modal, SidebarState } from '@/types';

interface UIState {
  // Sidebar
  sidebar: SidebarState;

  // Toasts
  toasts: Toast[];

  // Modals
  modals: Modal[];

  // Global loading
  isGlobalLoading: boolean;
  globalLoadingMessage: string;

  // Mobile menu
  isMobileMenuOpen: boolean;

  // Search
  isSearchOpen: boolean;
  searchQuery: string;
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal actions
  openModal: (modal: Omit<Modal, 'isOpen'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Global loading actions
  setGlobalLoading: (isLoading: boolean, message?: string) => void;

  // Mobile menu actions
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;

  // Search actions
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
}

type UIStore = UIState & UIActions;

let toastIdCounter = 0;

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  sidebar: {
    isOpen: true,
    isCollapsed: false,
  },
  toasts: [],
  modals: [],
  isGlobalLoading: false,
  globalLoadingMessage: '',
  isMobileMenuOpen: false,
  isSearchOpen: false,
  searchQuery: '',

  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
    }));
  },

  setSidebarOpen: (isOpen: boolean) => {
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen },
    }));
  },

  setSidebarCollapsed: (isCollapsed: boolean) => {
    set((state) => ({
      sidebar: { ...state.sidebar, isCollapsed },
    }));
  },

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Modal actions
  openModal: (modal: Omit<Modal, 'isOpen'>) => {
    const newModal: Modal = { ...modal, isOpen: true };
    set((state) => ({
      modals: [...state.modals, newModal],
    }));
  },

  closeModal: (id: string) => {
    set((state) => ({
      modals: state.modals.filter((modal) => modal.id !== id),
    }));
  },

  closeAllModals: () => {
    set({ modals: [] });
  },

  // Global loading actions
  setGlobalLoading: (isLoading: boolean, message: string = 'Loading...') => {
    set({ isGlobalLoading: isLoading, globalLoadingMessage: message });
  },

  // Mobile menu actions
  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },

  setMobileMenuOpen: (isOpen: boolean) => {
    set({ isMobileMenuOpen: isOpen });
  },

  // Search actions
  toggleSearch: () => {
    set((state) => ({ isSearchOpen: !state.isSearchOpen }));
  },

  setSearchOpen: (isOpen: boolean) => {
    set({ isSearchOpen: isOpen });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));

// Helper hooks for common toast patterns
export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
}
