import { create } from 'zustand';
import { UIState } from '../../shared/types';

interface UIStore extends UIState {
  setActivePanel: (panel: UIState['activePanel']) => void;
  setTheme: (theme: UIState['theme']) => void;
  setLayout: (layout: UIState['layout']) => void;
  toggleSidebar: () => void;
  toggleStatusBar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: 'tasks',
  theme: 'dark',
  layout: 'default',
  showSidebar: true,
  showStatusBar: true,
  
  setActivePanel: (panel) => set({ activePanel: panel }),
  setTheme: (theme) => set({ theme }),
  setLayout: (layout) => set({ layout }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleStatusBar: () => set((state) => ({ showStatusBar: !state.showStatusBar })),
}));