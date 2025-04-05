import React from "react";
import { cn } from "@/lib/utils";

interface SectionBackgroundProps {
  children: React.ReactNode;
  pattern: "dashboard" | "inventory" | "recipes" | "insights" | "tips" | "settings";
  className?: string;
}

export function SectionBackground({ children, pattern, className }: SectionBackgroundProps) {
  const patternPath = `/src/assets/patterns/${pattern}-pattern.svg`;
  
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden",
        className
      )}
      style={{
        backgroundImage: `url(${patternPath})`,
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      {/* Semi-transparent overlay to ensure content readability */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80"></div>
      
      {/* Content container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}