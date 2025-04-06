import { useState, useEffect } from 'react';

export function useMobileDetector() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasCameraSupport, setHasCameraSupport] = useState(false);

  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Check for camera support
    checkCameraSupport();
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const checkIfMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const checkCameraSupport = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraSupport(false);
        return;
      }
      
      // Try to get camera permission - this will throw if no camera or permission denied
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If we got here, camera is available and permission granted
      setHasCameraSupport(true);
      
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasCameraSupport(false);
    }
  };

  return { isMobile, hasCameraSupport };
}

export default useMobileDetector;