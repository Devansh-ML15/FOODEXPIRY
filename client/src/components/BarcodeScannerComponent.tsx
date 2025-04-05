import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X } from 'lucide-react';

interface BarcodeScannerComponentProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScannerComponent: React.FC<BarcodeScannerComponentProps> = ({
  onBarcodeDetected,
  onClose,
}) => {
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const { ref, torch } = useZxing({
    onDecodeResult(result) {
      setIsScanning(false);
      onBarcodeDetected(result.getText());
    },
    onError(error) {
      console.error('Scanner error:', error);
    },
    paused: !isScanning,
  });

  const toggleTorch = async () => {
    try {
      if (torch) {
        if (torch.isAvailable) {
          await (isTorchOn ? torch.off() : torch.on());
          setIsTorchOn(!isTorchOn);
        }
      }
    } catch (error) {
      console.error('Failed to toggle torch:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 flex flex-col">
        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {/* Top Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/30 hover:bg-black/50"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="text-center text-white font-semibold">
              Scan Barcode
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`text-white bg-black/30 hover:bg-black/50 ${isTorchOn ? 'text-yellow-300' : ''}`}
              onClick={toggleTorch}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>

          {/* Scanner View */}
          <video 
            ref={ref}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/70 rounded-lg flex items-center justify-center">
              {isScanning && (
                <div className="h-1/2 w-4/5 border border-green-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Bottom Instructions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
            <p className="text-white text-sm">
              Position barcode within the frame to scan
            </p>
          </div>
        </div>

        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-white p-4 rounded-md shadow-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p>Processing barcode data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerComponent;