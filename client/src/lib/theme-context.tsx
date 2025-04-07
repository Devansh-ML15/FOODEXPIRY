import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type VisualTheme = 'default' | 'farm-to-table' | 'modern-kitchen' | 'eco-friendly';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  visualTheme: VisualTheme;
  setVisualTheme: (theme: VisualTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
    }
    return 'system';
  });

  const [visualTheme, setVisualTheme] = useState<VisualTheme>(() => {
    // Try to get the visual theme from localStorage
    if (typeof window !== 'undefined') {
      const storedVisualTheme = localStorage.getItem('visualTheme') as VisualTheme;
      if (storedVisualTheme) {
        return storedVisualTheme;
      }
    }
    return 'default';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Function to set theme in localStorage and update state
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Function to set visual theme in localStorage and update state
  const updateVisualTheme = (newVisualTheme: VisualTheme) => {
    setVisualTheme(newVisualTheme);
    localStorage.setItem('visualTheme', newVisualTheme);
  };

  // Effect to handle theme changes and system preference
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove old theme classes
    root.classList.remove('light', 'dark');

    // Determine the actual theme to apply
    let resolvedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }

    // Apply the theme to both root and body
    root.classList.add(resolvedTheme);
    setResolvedTheme(resolvedTheme);

    // Listen for system preference changes if theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
        setResolvedTheme(newResolvedTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Effect to handle visual theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove old visual theme classes
    root.classList.remove('theme-default', 'theme-farm-to-table', 'theme-modern-kitchen', 'theme-eco-friendly');
    
    // Apply the visual theme
    root.classList.add(`theme-${visualTheme}`);
  }, [visualTheme]);
  
  // Combined effect to ensure both theme and visual theme are applied together 
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Apply the class combination
    body.className = `${resolvedTheme} theme-${visualTheme}`;
  }, [resolvedTheme, visualTheme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: updateTheme, 
      resolvedTheme,
      visualTheme,
      setVisualTheme: updateVisualTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export the hook consistently to avoid fast refresh issues
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}