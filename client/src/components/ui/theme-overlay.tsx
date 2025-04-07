import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';

interface ThemeOverlayProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'sidebar' | 'header' | 'full';
}

export function ThemeOverlay({
  children,
  className,
  variant = 'default'
}: ThemeOverlayProps) {
  const { visualTheme } = useTheme();

  // Helper to generate theme-specific elements
  const renderThemeElements = () => {
    switch (visualTheme) {
      case 'farm-to-table':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {variant === 'card' || variant === 'full' ? (
              <>
                <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 opacity-10 translate-x-1/2 -translate-y-1/4">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
                    <path d="M50,5 C25,5 5,25 5,50 C5,75 25,95 50,95 C75,95 95,75 95,50 C95,25 75,5 50,5 Z M50,90 C28,90 10,72 10,50 C10,28 28,10 50,10 C72,10 90,28 90,50 C90,72 72,90 50,90 Z" fill="currentColor" />
                    <path d="M50,20 C33.5,20 20,33.5 20,50 C20,66.5 33.5,80 50,80 C66.5,80 80,66.5 80,50 C80,33.5 66.5,20 50,20 Z M50,75 C36.2,75 25,63.8 25,50 C25,36.2 36.2,25 50,25 C63.8,25 75,36.2 75,50 C75,63.8 63.8,75 50,75 Z" fill="currentColor" />
                    <path d="M50,35 C42,35 35,42 35,50 C35,58 42,65 50,65 C58,65 65,58 65,50 C65,42 58,35 50,35 Z" fill="currentColor" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 md:w-40 md:h-40 opacity-10 -translate-x-1/3 translate-y-1/3">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800">
                    <path d="M95,50 C95,75 75,95 50,95 C25,95 5,75 5,50 C5,25 25,5 50,5 C75,5 95,25 95,50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M85,50 C85,69.4 69.4,85 50,85 C30.6,85 15,69.4 15,50 C15,30.6 30.6,15 50,15 C69.4,15 85,30.6 85,50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M75,50 C75,63.8 63.8,75 50,75 C36.2,75 25,63.8 25,50 C25,36.2 36.2,25 50,25 C63.8,25 75,36.2 75,50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
              </>
            ) : null}

            {variant === 'header' || variant === 'full' ? (
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 opacity-30"></div>
            ) : null}

            {variant === 'sidebar' || variant === 'full' ? (
              <div className="absolute left-0 top-1/3 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-transparent opacity-30"></div>
            ) : null}
          </div>
        );

      case 'modern-kitchen':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {variant === 'card' || variant === 'full' ? (
              <>
                <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20"></div>
                <div className="absolute bottom-0 right-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20"></div>
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-20"></div>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-20"></div>
              </>
            ) : null}

            {variant === 'header' || variant === 'full' ? (
              <div className="absolute top-1/2 right-4 w-24 h-24 md:w-40 md:h-40 opacity-5 -translate-y-1/2">
                <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600">
                  <rect x="10" y="10" width="80" height="80" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="20" y="20" width="60" height="60" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="30" y="30" width="40" height="40" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            ) : null}

            {variant === 'sidebar' || variant === 'full' ? (
              <div className="absolute left-1/2 top-10 w-[1px] h-40 bg-gradient-to-b from-blue-400 to-transparent opacity-20"></div>
            ) : null}
          </div>
        );

      case 'eco-friendly':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {variant === 'card' || variant === 'full' ? (
              <>
                <div className="absolute top-0 left-0 w-20 h-20 md:w-32 md:h-32 opacity-10 -translate-x-1/4 -translate-y-1/4">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-green-600">
                    <path d="M50,10 C10,10 10,50 10,90 L90,90 C90,50 90,10 50,10 Z" fill="currentColor" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 opacity-10 translate-x-1/4 translate-y-1/4">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-green-700">
                    <path d="M90,50 C90,10 50,10 10,10 L10,90 C50,90 90,90 90,50 Z" fill="currentColor" />
                  </svg>
                </div>
              </>
            ) : null}

            {variant === 'header' || variant === 'full' ? (
              <div className="absolute top-0 right-0 w-40 h-10 opacity-10">
                <svg viewBox="0 0 100 20" className="w-full h-full text-green-600">
                  <path d="M0,20 C30,20 30,0 50,0 C70,0 70,20 100,20 L100,0 L0,0 Z" fill="currentColor" />
                </svg>
              </div>
            ) : null}

            {variant === 'sidebar' || variant === 'full' ? (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-green-300 via-green-500 to-transparent opacity-10"></div>
            ) : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {renderThemeElements()}
      {children}
    </div>
  );
}