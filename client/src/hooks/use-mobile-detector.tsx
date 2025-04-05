import { useState, useEffect } from 'react';

export function useMobileDetector() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasCameraSupport, setHasCameraSupport] = useState(false);

  useEffect(() => {
    // Check if device is mobile based on screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Check for camera support
    const checkCameraSupport = async () => {
      try {
        // Check if the browser supports the MediaDevices API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraSupport(false);
          return;
        }
        
        // Try to access the camera to confirm permissions and availability
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Camera is available, stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        setHasCameraSupport(true);
      } catch (error) {
        console.error('Camera access failed:', error);
        setHasCameraSupport(false);
      }
    };

    checkCameraSupport();

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isMobile, hasCameraSupport };
}

export default useMobileDetector;