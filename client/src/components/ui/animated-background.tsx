import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';
import dashboardPatternSvg from '@/assets/patterns/dashboard-pattern.svg';
import inventoryPatternSvg from '@/assets/patterns/inventory-pattern.svg';
import recipesPatternSvg from '@/assets/patterns/recipes-pattern.svg';
import mealPlanningPatternSvg from '@/assets/patterns/meal-planning-pattern.svg';
import insightsPatternSvg from '@/assets/patterns/insights-pattern.svg';
import tipsPatternSvg from '@/assets/patterns/tips-pattern.svg';
import settingsPatternSvg from '@/assets/patterns/settings-pattern.svg';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  pattern?: "food" | "waves" | "geometric" | "gradient" | "none" | "inventory" | "meal-planning" | "insights" | "settings" | "dashboard" | "recipes" | "tips";
  parallax?: boolean;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  primaryColor?: string;
  secondaryColor?: string;
}

export function AnimatedBackground({
  children,
  pattern = "gradient",
  parallax = true,
  className = "",
  intensity = 'medium',
  primaryColor,
  secondaryColor,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === 'light';
  
  // Set up parallax effect
  useEffect(() => {
    if (!parallax) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      // Calculate movement based on mouse position (slower movement for subtle effect)
      const moveX = (x - width / 2) / width * 10;
      const moveY = (y - height / 2) / height * 10;
      
      // Apply movement to background position
      const bgElements = containerRef.current.querySelectorAll('.parallax-bg');
      bgElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [parallax]);
  
  // Define opacity based on intensity
  const getOpacity = () => {
    const baseOpacity = isLightTheme ? 0.7 : 0.8;
    switch (intensity) {
      case 'light': return baseOpacity * 0.5;
      case 'strong': return baseOpacity * 1.4;
      default: return baseOpacity; // medium
    }
  };
  
  // Get gradient based on theme and customization
  const getGradientStyle = () => {
    const defaultPrimary = isLightTheme ? 'rgba(13, 106, 48, 0.15)' : 'rgba(13, 106, 48, 0.2)';
    const defaultSecondary = isLightTheme ? 'rgba(37, 162, 68, 0.08)' : 'rgba(37, 162, 68, 0.15)';
    
    const primary = primaryColor || defaultPrimary;
    const secondary = secondaryColor || defaultSecondary;
    
    return {
      backgroundImage: `
        radial-gradient(circle at 30% 20%, ${primary} 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, ${secondary} 0%, transparent 50%)
      `,
      animation: 'gradientShift 15s ease infinite'
    };
  };
  
  // Check if pattern is a special page pattern
  const isPagePattern = ["inventory", "dashboard", "recipes", "meal-planning", "insights", "settings", "tips"].includes(pattern);
  
  // The effective pattern to use for basic patterns
  const effectivePattern = isPagePattern ? null : pattern;
  
  // Pattern class for basic CSS background patterns
  const patternClass = pattern === 'none' ? '' : `bg-pattern-${pattern}`;
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        patternClass,
        className
      )}
    >
      {/* Base animated gradient background */}
      {(effectivePattern === 'gradient') && (
        <div 
          className="absolute inset-0 parallax-bg transition-all"
          style={getGradientStyle()}
        />
      )}
      
      {/* Dashboard pattern */}
      {pattern === "dashboard" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${dashboardPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Inventory pattern */}
      {pattern === "inventory" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${inventoryPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Recipes pattern */}
      {pattern === "recipes" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${recipesPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Meal Planning pattern */}
      {pattern === "meal-planning" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${mealPlanningPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Insights pattern */}
      {pattern === "insights" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${insightsPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Tips pattern */}
      {pattern === "tips" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${tipsPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Settings pattern */}
      {pattern === "settings" && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg transition-all"
            style={{ 
              backgroundImage: `url(${settingsPatternSvg})`,
              backgroundSize: '800px 800px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              opacity: isLightTheme ? 0.25 : 0.3,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Animated food pattern */}
      {effectivePattern === 'food' && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 parallax-bg opacity-30 bg-pattern-food transition-all"
            style={{ 
              backgroundSize: '400px 400px',
              animation: 'patternFloat 20s linear infinite',
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background" />
        </div>
      )}
      
      {/* Animated waves */}
      {effectivePattern === 'waves' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
              <defs>
                <path id="gentle-wave" 
                  d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
              </defs>
              <g className="parallax-bg">
                <use 
                  xlinkHref="#gentle-wave" 
                  x="48" 
                  y="0" 
                  fill={`rgba(13, 106, 48, ${getOpacity() * 0.4})`} 
                />
                <use 
                  xlinkHref="#gentle-wave" 
                  x="48" 
                  y="3" 
                  fill={`rgba(37, 162, 68, ${getOpacity() * 0.3})`} 
                />
                <use 
                  xlinkHref="#gentle-wave" 
                  x="48" 
                  y="5" 
                  fill={`rgba(13, 106, 48, ${getOpacity() * 0.2})`} 
                />
                <use 
                  xlinkHref="#gentle-wave" 
                  x="48" 
                  y="7" 
                  fill={`rgba(37, 162, 68, ${getOpacity() * 0.1})`} 
                />
              </g>
            </svg>
          </div>
        </div>
      )}
      
      {/* Animated geometric patterns */}
      {effectivePattern === 'geometric' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 parallax-bg opacity-20 bg-grid-pattern" />
          <div className="absolute h-full w-full">
            <div className="absolute geometric-shape shape-circle-1 parallax-bg" />
            <div className="absolute geometric-shape shape-circle-2 parallax-bg" />
            <div className="absolute geometric-shape shape-square parallax-bg" />
            <div className="absolute geometric-shape shape-triangle parallax-bg" />
          </div>
        </div>
      )}
      
      {/* Semi-transparent overlay for readability with blur effect */}
      <div className="absolute inset-0 backdrop-blur-sm bg-background/40 transition-colors" />
      
      {/* Content container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}