import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, AlertTriangle, Frown, Smile, X, RotateCcw } from "lucide-react";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Food category icons
import { 
  FaAppleAlt, 
  FaCarrot, 
  FaEgg, 
  FaCheese, 
  FaBreadSlice, 
  FaFish,
  FaDrumstickBite,
  FaIceCream,
  FaWineBottle,
  FaBlender
} from 'react-icons/fa';
import { GiMilkCarton, GiSlicedBread, GiRiceCooker, GiCannedFish } from 'react-icons/gi';
import { LuSalad } from 'react-icons/lu';

// Type definition for food items
interface FoodItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  createdAt: string;
  storage: string;
  daysUntilExpiration?: number;
  status?: 'expired' | 'expiring-soon' | 'fresh';
}

// Category to icon mapping
const CATEGORY_ICONS: Record<string, JSX.Element> = {
  produce: <FaCarrot className="text-green-500" size={24} />,
  fruits: <FaAppleAlt className="text-red-500" size={24} />,
  dairy: <GiMilkCarton className="text-blue-500" size={24} />,
  meat: <FaDrumstickBite className="text-red-600" size={24} />,
  fish: <FaFish className="text-blue-400" size={24} />,
  bakery: <GiSlicedBread className="text-yellow-600" size={24} />,
  grains: <GiRiceCooker className="text-yellow-500" size={24} />,
  pantry: <GiCannedFish className="text-purple-500" size={24} />,
  frozen: <FaIceCream className="text-cyan-500" size={24} />,
  beverages: <FaWineBottle className="text-indigo-500" size={24} />,
  condiments: <FaBlender className="text-pink-500" size={24} />,
  snacks: <FaBreadSlice className="text-amber-500" size={24} />,
  prepared: <LuSalad className="text-emerald-500" size={24} />,
  other: <FaCheese className="text-gray-500" size={24} />,
};

// Status to color mapping
const STATUS_COLORS = {
  expired: "bg-red-100 text-red-800 border-red-200",
  'expiring-soon': "bg-amber-100 text-amber-800 border-amber-200",
  fresh: "bg-green-100 text-green-800 border-green-200",
};

// Status to icon mapping
const STATUS_ICONS = {
  expired: <Frown className="text-red-500" size={16} />,
  'expiring-soon': <Clock className="text-amber-500" size={16} />,
  fresh: <Check className="text-green-500" size={16} />,
};

// Get days until expiration and status
function getItemStatus(expirationDate: string): { daysUntilExpiration: number; status: 'expired' | 'expiring-soon' | 'fresh' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Calculate difference in days
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: 'expired' | 'expiring-soon' | 'fresh';
  
  if (diffDays < 0) {
    status = 'expired';
  } else if (diffDays <= 3) {
    status = 'expiring-soon';
  } else {
    status = 'fresh';
  }
  
  return { 
    daysUntilExpiration: diffDays,
    status
  };
}

// Storage icons
const STORAGE_ICONS: Record<string, JSX.Element> = {
  refrigerator: <FaCarrot className="text-blue-500" size={18} />,
  freezer: <FaIceCream className="text-cyan-500" size={18} />,
  pantry: <GiCannedFish className="text-amber-600" size={18} />,
  countertop: <FaBreadSlice className="text-yellow-600" size={18} />,
  spice_rack: <FaWineBottle className="text-red-500" size={18} />,
  fruit_bowl: <FaAppleAlt className="text-red-500" size={18} />,
  other: <FaBlender className="text-gray-500" size={18} />,
};

interface AnimatedIngredientTrackerProps {
  foodItems: FoodItem[];
  isLoading?: boolean;
  onItemClick?: (item: FoodItem) => void;
}

export default function AnimatedIngredientTracker({ 
  foodItems, 
  isLoading = false,
  onItemClick
}: AnimatedIngredientTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [animateItems, setAnimateItems] = useState(false);
  
  // Process food items with expiration info
  const processedItems = foodItems.map(item => {
    const { daysUntilExpiration, status } = getItemStatus(item.expirationDate);
    return {
      ...item,
      daysUntilExpiration,
      status
    };
  });
  
  // Get unique categories and counts
  const categories = Array.from(new Set(processedItems.map(item => item.category)));
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = processedItems.filter(item => item.category === category).length;
    return acc;
  }, {} as Record<string, number>);
  
  // Get unique storage locations and counts
  const storageLocations = Array.from(new Set(processedItems.map(item => item.storage)));
  const storageCounts = storageLocations.reduce((acc, storage) => {
    acc[storage] = processedItems.filter(item => item.storage === storage).length;
    return acc;
  }, {} as Record<string, number>);
  
  // Filter items based on selected category and storage
  const filteredItems = processedItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesStorage = !selectedStorage || item.storage === selectedStorage;
    return matchesCategory && matchesStorage;
  });
  
  // Status counts for the filtered items
  const statusCounts = {
    expired: filteredItems.filter(item => item.status === 'expired').length,
    'expiring-soon': filteredItems.filter(item => item.status === 'expiring-soon').length,
    fresh: filteredItems.filter(item => item.status === 'fresh').length,
  };
  
  // Trigger animation whenever filtered items change
  useEffect(() => {
    setAnimateItems(false);
    const timer = setTimeout(() => setAnimateItems(true), 100);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedStorage]);
  
  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Loading ingredients...</CardTitle>
          <CardDescription>Please wait while we fetch your food inventory</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FaCarrot className="text-primary" size={40} />
          </motion.div>
        </CardContent>
      </Card>
    );
  }
  
  if (!foodItems.length) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>No ingredients found</CardTitle>
          <CardDescription>Your food inventory is empty</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-8">
          <FaBlender className="text-gray-400 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Add some food items to see them here</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Ingredient Tracker</CardTitle>
            <CardDescription>Interactive view of your food inventory</CardDescription>
          </div>
          {(selectedCategory || selectedStorage) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedStorage(null);
              }}
            >
              <RotateCcw size={14} className="mr-1" /> Reset Filters
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div 
              key={status}
              className={`rounded-lg border p-2 ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {STATUS_ICONS[status as keyof typeof STATUS_ICONS]}
                  <span className="text-xs font-medium capitalize">{status.replace('-', ' ')}</span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Category and Storage Filters */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => setSelectedCategory(prev => prev === category ? null : category)}
                >
                  {CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.other}
                  <span className="capitalize">{category}</span>
                  <span className="ml-1 text-xs">({categoryCounts[category]})</span>
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Storage Locations</h3>
            <div className="flex flex-wrap gap-2">
              {storageLocations.map(storage => (
                <Badge
                  key={storage}
                  variant={selectedStorage === storage ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => setSelectedStorage(prev => prev === storage ? null : storage)}
                >
                  {STORAGE_ICONS[storage.toLowerCase()] || STORAGE_ICONS.other}
                  <span className="capitalize">{storage.replace('_', ' ')}</span>
                  <span className="ml-1 text-xs">({storageCounts[storage]})</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Animated Item Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {animateItems && filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
                }}
                className="cursor-pointer"
                onClick={() => onItemClick && onItemClick(item)}
              >
                <div className={`
                  border rounded-xl overflow-hidden bg-white
                  ${item.status === 'expired' ? 'border-red-200' : 
                    item.status === 'expiring-soon' ? 'border-amber-200' : 'border-green-200'}
                `}>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {CATEGORY_ICONS[item.category.toLowerCase()] || CATEGORY_ICONS.other}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`
                          text-xs border
                          ${item.status === 'expired' ? 'bg-red-50 text-red-800 border-red-200' : 
                            item.status === 'expiring-soon' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                            'bg-green-50 text-green-800 border-green-200'}
                        `}
                      >
                        <div className="flex items-center space-x-1">
                          {STATUS_ICONS[item.status || 'fresh']}
                          <span>
                            {item.status === 'expired' 
                              ? `${Math.abs(item.daysUntilExpiration || 0)}d ago` 
                              : item.status === 'expiring-soon'
                                ? `${item.daysUntilExpiration}d left`
                                : 'Fresh'}
                          </span>
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mb-2">
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-1">Qty:</span>
                        <span className="font-medium">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center">
                        {STORAGE_ICONS[item.storage.toLowerCase()] || STORAGE_ICONS.other}
                        <span className="ml-1 text-gray-600 capitalize">{item.storage.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    {/* Expiration Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Freshness</span>
                        <span className="font-medium">
                          {item.status === 'expired' 
                            ? 'Expired' 
                            : item.status === 'expiring-soon'
                              ? 'Use soon'
                              : 'Fresh'}
                        </span>
                      </div>
                      
                      <div 
                        className={`h-2 w-full rounded-full ${
                          item.status === 'expired' 
                            ? 'bg-red-100' 
                            : item.status === 'expiring-soon'
                              ? 'bg-amber-100'
                              : 'bg-green-100'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'expired' 
                              ? 'bg-red-500' 
                              : item.status === 'expiring-soon'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${item.status === 'expired' 
                              ? 0 
                              : item.status === 'expiring-soon'
                                ? 25 + (item.daysUntilExpiration || 0) * 25 / 3
                                : 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Empty state for filtered items */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle size={40} className="text-amber-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium">No matches found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCategory(null);
                setSelectedStorage(null);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 text-xs text-gray-500">
        <div className="flex justify-between w-full items-center">
          <span>Total Items: {filteredItems.length}</span>
          <div className="flex space-x-1">
            <span>{statusCounts.expired} expired</span>
            <span>•</span>
            <span>{statusCounts["expiring-soon"]} expiring soon</span>
            <span>•</span>
            <span>{statusCounts.fresh} fresh</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

