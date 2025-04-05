import React from 'react';
import logoPath from '@assets/your-logo.png';

interface GlassLogoBackgroundProps {
  children: React.ReactNode;
  className?: string;
  opacity?: number;
}

export function GlassLogoBackground({
  children,
  className = '',
  opacity = 0.075, // Default subtle opacity
}: GlassLogoBackgroundProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Fixed position logo background with glass effect */}
      <div 
        className="absolute inset-0 overflow-hidden rounded-lg z-0"
        style={{
          backgroundImage: `url(${logoPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: opacity,
          filter: 'blur(1px)',
        }}
        aria-hidden="true"
      />
      
      {/* Glass effect overlay */}
      <div 
        className="absolute inset-0 bg-background/30 backdrop-blur-sm z-0 rounded-lg"
        aria-hidden="true"
      />
      
      {/* Content on top */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}