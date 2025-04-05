import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import BarcodeScannerComponent from '@/components/BarcodeScannerComponent';
import { Button } from '@/components/ui/button';
import { ScanLine, ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InsertFoodItem } from '@shared/schema';
import useMobileDetector from '@/hooks/use-mobile-detector';

export default function BarcodeScannerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isMobile, hasCameraSupport } = useMobileDetector();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mutation for looking up barcode info
  const barcodeLookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest('GET', `/api/barcode-lookup?code=${barcode}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Barcode Detected',
        description: `Found: ${data.name || 'Unknown item'}`,
      });
      
      // If product data is found, create a food item
      if (data.name) {
        createFoodItemMutation.mutate({
          name: data.name,
          category: data.category || 'other',
          quantity: 1,
          unit: 'items',
          purchaseDate: new Date().toISOString().split('T')[0],
          expirationDate: calculateDefaultExpirationDate(data.category),
          storageLocation: 'pantry',
          notes: `Barcode: ${scannedBarcode}`,
        });
      } else {
        // If no product data, go to manual entry with barcode pre-filled
        setLocation(`/add-food-item?barcode=${scannedBarcode}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Barcode Lookup Failed',
        description: 'Could not find information for this barcode. Please add manually.',
        variant: 'destructive',
      });
      // Go to manual entry with barcode pre-filled
      setLocation(`/add-food-item?barcode=${scannedBarcode}`);
    },
  });

  // Mutation for creating food item
  const createFoodItemMutation = useMutation({
    mutationFn: async (newItem: InsertFoodItem) => {
      const response = await apiRequest('POST', '/api/food-items', newItem);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      toast({
        title: 'Item Added',
        description: 'Item has been added to your inventory',
      });
      setLocation('/inventory');
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Item',
        description: 'There was an error adding the item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Helper function to calculate a default expiration date based on category
  const calculateDefaultExpirationDate = (category: string): string => {
    const today = new Date();
    let daysToAdd = 7; // Default 1 week for most items
    
    switch (category.toLowerCase()) {
      case 'produce':
        daysToAdd = 7; // 1 week for produce
        break;
      case 'dairy':
        daysToAdd = 14; // 2 weeks for dairy
        break;
      case 'meat':
        daysToAdd = 4; // 4 days for meat
        break;
      case 'frozen':
        daysToAdd = 90; // 3 months for frozen
        break;
      case 'canned':
      case 'dry':
        daysToAdd = 365; // 1 year for canned/dry goods
        break;
      default:
        daysToAdd = 14; // 2 weeks as a safe default
    }
    
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + daysToAdd);
    return expirationDate.toISOString().split('T')[0];
  };

  const handleBarcodeDetected = (barcode: string) => {
    setScannedBarcode(barcode);
    setIsScanning(false);
    
    // Look up the barcode
    barcodeLookupMutation.mutate(barcode);
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setScannedBarcode(null);
  };

  const handleClose = () => {
    setIsScanning(false);
    setLocation('/inventory');
  };

  // Redirect if not on mobile or no camera
  useEffect(() => {
    if (!isMobile || !hasCameraSupport) {
      toast({
        title: 'Barcode scanning not available',
        description: isMobile 
          ? 'Camera access is required for barcode scanning.'
          : 'Barcode scanning is only available on mobile devices.',
        variant: 'destructive',
      });
      setLocation('/inventory');
    }
  }, [isMobile, hasCameraSupport, setLocation, toast]);

  if (!isMobile || !hasCameraSupport) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="h-full min-h-screen bg-gray-50">
      {isScanning ? (
        <BarcodeScannerComponent
          onBarcodeDetected={handleBarcodeDetected}
          onClose={handleClose}
        />
      ) : (
        <div className="container mx-auto px-4 pt-16">
          <div className="mb-6 flex items-center">
            <Button
              variant="ghost"
              className="p-0 mr-2"
              onClick={() => setLocation('/inventory')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Barcode Scanner</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="h-12 w-12 text-primary" />
              </div>
            </div>

            {scannedBarcode ? (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Scanned Barcode:</p>
                <p className="font-medium text-lg">{scannedBarcode}</p>
                
                {barcodeLookupMutation.isPending && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-6">
                Scan barcodes on your food items to quickly add them to your inventory.
              </p>
            )}

            <div className="flex flex-col space-y-4">
              <Button 
                onClick={handleStartScanning}
                className="w-full"
              >
                Start Scanning
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/add-food-item')}
                className="w-full"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}