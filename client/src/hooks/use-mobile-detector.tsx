import { useState, useEffect } from 'react';

export function useMobileDetector() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const checkIfMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  return { isMobile };
}