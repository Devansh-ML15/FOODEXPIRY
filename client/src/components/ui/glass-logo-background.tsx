import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedBackground } from './animated-background';
import logoPath from '@assets/your-logo.png';

interface GlassLogoBackgroundProps {
  children: React.ReactNode;
  className?: string;
  logoOpacity?: number;
  pattern?: "food" | "waves" | "geometric" | "gradient" | "none" | "inventory" | "meal-planning" | "insights" | "settings" | "dashboard" | "recipes" | "tips";
  showLogo?: boolean;
}

export function GlassLogoBackground({
  children,
  className,
  logoOpacity = 0.08,
  pattern = "gradient",
  showLogo = true,
}: GlassLogoBackgroundProps) {
  return (
    <AnimatedBackground
      pattern={pattern}
      className={cn("relative rounded-xl overflow-hidden", className)}
    >
      {showLogo && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: logoOpacity }}
        >
          <div className="relative w-full h-full max-w-[300px] max-h-[300px]">
            <img 
              src={logoPath} 
              alt="Logo Background" 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-full h-full object-contain"
              style={{ filter: 'grayscale(0.5) blur(1px)' }}
            />
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </AnimatedBackground>
  );
}