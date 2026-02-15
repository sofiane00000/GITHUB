import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'papillon-auth',
    }
  )
);

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system', // 'light', 'dark', 'system'
      primaryHue: 243,
      secondaryHue: 350,
      accentHue: 199,
      borderRadius: 0.75,
      
      setTheme: (theme) => set({ theme }),
      setPrimaryHue: (hue) => set({ primaryHue: hue }),
      setSecondaryHue: (hue) => set({ secondaryHue: hue }),
      setAccentHue: (hue) => set({ accentHue: hue }),
      setBorderRadius: (radius) => set({ borderRadius: radius }),
      
      resetTheme: () => set({
        theme: 'system',
        primaryHue: 243,
        secondaryHue: 350,
        accentHue: 199,
        borderRadius: 0.75,
      }),
    }),
    {
      name: 'papillon-theme',
    }
  )
);

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  aiChatOpen: false,
  notificationsPanelOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleAIChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),
  setAIChatOpen: (open) => set({ aiChatOpen: open }),
  toggleNotifications: () => set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
  setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
}));
