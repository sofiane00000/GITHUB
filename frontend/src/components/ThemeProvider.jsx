import { useEffect } from 'react';
import { useThemeStore } from '../store/useStore';

export function ThemeProvider({ children }) {
  const { theme, primaryHue, secondaryHue, accentHue, borderRadius } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = theme === 'system' ? systemTheme : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme);
    
    // Apply custom colors
    root.style.setProperty('--primary-hue', primaryHue);
    root.style.setProperty('--secondary-hue', secondaryHue);
    root.style.setProperty('--accent-hue', accentHue);
    root.style.setProperty('--radius', `${borderRadius}rem`);
    
    // Update CSS variables for primary color
    root.style.setProperty('--primary', `${primaryHue} 75% 59%`);
    root.style.setProperty('--secondary', `${secondaryHue} 89% 60%`);
    root.style.setProperty('--accent', `${accentHue} 89% 48%`);
    root.style.setProperty('--ring', `${primaryHue} 75% 59%`);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === 'system') {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, primaryHue, secondaryHue, accentHue, borderRadius]);

  return children;
}
