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

      case 'cozy-pantry':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {variant === 'card' || variant === 'full' ? (
              <>
                <div className="absolute -top-4 -left-4 w-28 h-28 opacity-5">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-500">
                    <path d="M10,10 C10,5 15,0 20,0 L80,0 C85,0 90,5 90,10 L90,90 C90,95 85,100 80,100 L20,100 C15,100 10,95 10,90 Z" fill="currentColor" />
                    <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-5">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                    <circle cx="50" cy="50" r="45" fill="currentColor" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="2" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-15"></div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-15"></div>
              </>
            ) : null}

            {variant === 'header' || variant === 'full' ? (
              <div className="absolute top-1/2 right-5 w-28 h-28 opacity-5 -translate-y-1/2">
                <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                  <rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
                  <rect x="25" y="25" width="50" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8,4" />
                  <rect x="40" y="40" width="20" height="20" rx="2" fill="currentColor" />
                </svg>
              </div>
            ) : null}

            {variant === 'sidebar' || variant === 'full' ? (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-purple-400 via-purple-500 to-transparent opacity-10"></div>
            ) : null}
          </div>
        );

      case 'seasonal-harvest':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {variant === 'card' || variant === 'full' ? (
              <>
                <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-15"></div>
                <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-15"></div>
                
                <div className="absolute -top-6 -left-6 w-36 h-36 opacity-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
                    <path d="M50,10 C70,10 85,30 85,50 C85,75 65,90 50,90 C30,90 15,70 15,50 C15,25 35,10 50,10 Z" 
                      fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M50,20 C65,20 75,35 75,50 C75,65 60,80 50,80 C35,80 25,65 25,50 C25,35 40,20 50,20 Z" 
                      fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,3" />
                    <path d="M50,30 C60,30 65,40 65,50 C65,60 55,70 50,70 C40,70 35,60 35,50 C35,40 45,30 50,30 Z" 
                      fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                
                <div className="absolute -bottom-5 -right-5 w-32 h-32 opacity-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-orange-500">
                    <path d="M25,25 L75,25 L75,75 L25,75 Z" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45, 50, 50)" />
                    <path d="M35,35 L65,35 L65,65 L35,65 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,3" transform="rotate(45, 50, 50)" />
                    <path d="M45,45 L55,45 L55,55 L45,55 Z" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45, 50, 50)" />
                  </svg>
                </div>
              </>
            ) : null}

            {variant === 'header' || variant === 'full' ? (
              <div className="absolute top-1/2 right-5 w-24 h-24 opacity-8 -translate-y-1/2">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
                  <path d="M50,10 A40,40 0 1,0 50,90 A40,40 0 1,0 50,10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M50,30 A20,20 0 1,0 50,70 A20,20 0 1,0 50,30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
              </div>
            ) : null}

            {variant === 'sidebar' || variant === 'full' ? (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-orange-500 to-transparent opacity-10"></div>
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