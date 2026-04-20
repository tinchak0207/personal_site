import { create } from 'zustand';

interface AppState {
  isBooting: boolean;
  isZoomMode: boolean;
  focusedNode: string | null;
  completeBoot: () => void;
  enterZoomMode: (nodeId: string) => void;
  exitZoomMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  isBooting: true,
  isZoomMode: false,
  focusedNode: null,
  completeBoot: () => set({ isBooting: false }),
  enterZoomMode: (nodeId: string) => set({ isZoomMode: true, focusedNode: nodeId }),
  exitZoomMode: () => set({ isZoomMode: false, focusedNode: null }),
}));
