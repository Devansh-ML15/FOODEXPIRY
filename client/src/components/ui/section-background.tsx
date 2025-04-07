import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedBackground } from './animated-background';

interface SectionBackgroundProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  pattern?: "food" | "waves" | "geometric" | "gradient" | "none" | "inventory" | "meal-planning" | "insights" | "settings" | "dashboard" | "recipes" | "tips";
  className?: string;
}

export function SectionBackground({
  children,
  title,
  description,
  pattern = "gradient",
  className,
}: SectionBackgroundProps) {
  return (
    <AnimatedBackground
      pattern={pattern}
      className={cn("rounded-xl p-6 mb-6 relative overflow-hidden", className)}
    >
      <div className="space-y-4">
        {title && (
          <div className="flex items-center">
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          </div>
        )}
        {description && (
          <div className="text-sm text-muted-foreground">
            {description}
          </div>
        )}
        <div className="pt-2">
          {children}
        </div>
      </div>
    </AnimatedBackground>
  );
}