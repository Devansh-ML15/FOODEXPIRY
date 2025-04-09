import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedLink: React.FC<AnimatedLinkProps> = ({ href, children, className = '' }) => {
  const [, setLocation] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Start the animation
    setIsTransitioning(true);
    
    // Add a page transition overlay to the body
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);
    
    // After animation completes, navigate to the target page
    setTimeout(() => {
      setLocation(href);
      setTimeout(() => {
        // Clean up overlay
        document.body.removeChild(overlay);
      }, 500); // Cleanup after completing the fade-in animation on the new page
    }, 500); // Wait for the overlay to cover the screen
  };
  
  return (
    <a 
      href={href}
      className={`${className} ${isTransitioning ? 'pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

// Add the required CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  .page-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 129, 74, 0.3);
    backdrop-filter: blur(10px);
    z-index: 9999;
    animation: fadeIn 0.5s forwards;
  }
`;
document.head.appendChild(style);