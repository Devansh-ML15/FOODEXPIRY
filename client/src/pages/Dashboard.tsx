import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";
import DashboardStats from "@/components/DashboardStats";
import ExpirationAlerts from "@/components/ExpirationAlerts";
import { AnimatedIngredientTracker } from "@/components/AnimatedIngredientTracker";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import { ThemeOverlay } from "@/components/ui/theme-overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import WasteInsights from "@/components/WasteInsights";
import ConsumptionInsights from "@/components/ConsumptionInsights";

// Category colors for charts
const CATEGORY_COLORS = {
  produce: "#22c55e", // green
  dairy: "#3b82f6", // blue
  meat: "#ef4444", // red
  bakery: "#f59e0b", // amber
  pantry: "#8b5cf6", // violet
  frozen: "#06b6d4", // cyan
  other: "#94a3b8", // slate
};

type WasteInsightsData = {
  labels: string[];
  data: number[];
  trend: number;
};

export default function Dashboard() {
  const { data: foodItems } = useQuery<any[]>({
    queryKey: ['/api/food-items'],
  });
  
  const { data: wasteData, isLoading: isWasteLoading } = useQuery<WasteInsightsData>({
    queryKey: ['/api/waste-insights'],
  });
  
  // Prepare data for the category distribution chart
  const categoryData = Array.isArray(foodItems) ? getCategoryDistribution(foodItems) : [];

  return (
    <div className="mb-8">
      {/* Header Section with Stats */}
      <ThemeOverlay variant="header">
        <SectionBackground pattern="dashboard" className="p-6 mb-6">
          <GlassLogoBackground>
            <h1 className="page-header">Dashboard</h1>
            <DashboardStats />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
      
      {/* Expiration Alerts Section */}
      <ThemeOverlay variant="card">
        <SectionBackground pattern="dashboard" className="p-6 mb-6">
          <GlassLogoBackground logoOpacity={0.05} className="mb-6">
            <ExpirationAlerts />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
      
      {/* Animated Ingredient Tracker */}
      <ThemeOverlay variant="card">
        <SectionBackground pattern="dashboard" className="p-6 mb-6">
          <GlassLogoBackground logoOpacity={0.05} className="mb-6">
            <AnimatedIngredientTracker 
              foodItems={foodItems || []} 
              isLoading={!foodItems}
              onItemClick={(item) => {
                // Navigate to item detail or show edit dialog
                // Could implement this in the future
                console.log("Item clicked:", item);
              }}
            />
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
      
      {/* Insights Tabs Section */}
      <ThemeOverlay variant="card">
        <SectionBackground pattern="insights" className="p-6">
          <GlassLogoBackground logoOpacity={0.03} className="rounded-xl p-4">
            <h2 className="text-2xl font-bold mb-4">Food Insights</h2>
            
            <Tabs defaultValue="categories" className="mb-6">
              <TabsList className="mb-4 bg-white/80 backdrop-blur-sm">
                <TabsTrigger value="categories">Category Distribution</TabsTrigger>
                <TabsTrigger value="expiration">Expiration Patterns</TabsTrigger>
                <TabsTrigger value="waste">Waste Trends</TabsTrigger>
                <TabsTrigger value="consumption">Consumption</TabsTrigger>
              </TabsList>
              
              {/* Categories Tab Content */}
              <TabsContent value="categories" className="animate-in fade-in-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory by Category</CardTitle>
                      <CardDescription>
                        Distribution of food items in your inventory
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {!foodItems ? (
                          <Skeleton className="h-full w-full" />
                        ) : categoryData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill={CATEGORY_COLORS.produce}
                                dataKey="value"
                              >
                                {categoryData.map((entry, index) => {
                                  // Convert to lowercase for matching with our category keys
                                  const category = entry.name.toLowerCase();
                                  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#94a3b8";
                                  return (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={color} 
                                    />
                                  );
                                })}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">No inventory data available</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Category Legend</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                            <div key={category} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: color }}
                              ></div>
                              <span className="text-xs text-gray-600 capitalize">{category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Locations</CardTitle>
                      <CardDescription>
                        How your food is distributed in different storage areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {!foodItems ? (
                          <Skeleton className="h-full w-full" />
                        ) : Array.isArray(foodItems) && foodItems.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={getStorageDistribution(foodItems)}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                tick={{ fontSize: 13 }}
                              />
                              <Tooltip />
                              <Bar dataKey="value" fill="hsl(var(--primary))" name="Items" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">No inventory data available</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-1">Storage Tips</h4>
                        <p className="text-xs text-gray-600">
                          Store fruit and vegetables separately as many fruits release ethylene gas 
                          which can cause nearby vegetables to ripen and spoil faster.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Expiration Tab Content */}
              <TabsContent value="expiration" className="animate-in fade-in-50">
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expiration Timeline</CardTitle>
                      <CardDescription>
                        When your current inventory items will expire
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {!foodItems ? (
                          <Skeleton className="h-full w-full" />
                        ) : Array.isArray(foodItems) && foodItems.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={getExpirationTimeline(foodItems)}
                              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" name="Items Expiring" fill="#f59e0b" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">No inventory data available</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-100">
                        <h4 className="text-sm font-medium text-amber-800 mb-1">Expiration Planning</h4>
                        <p className="text-xs text-amber-700">
                          Plan your meals around items that are expiring soon. Consider freezing items
                          that you won't be able to use before they expire.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Waste Tab Content */}
              <TabsContent value="waste" className="animate-in fade-in-50">
                <div className="grid grid-cols-1 gap-6">
                  <WasteInsights />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Sustainable Tips</CardTitle>
                        <CardDescription>
                          Practical ways to reduce your food waste
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Plan your meals:</span>{' '}
                              Create a weekly meal plan and shopping list to avoid over-purchasing.
                            </p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Store food properly:</span>{' '}
                              Learn the optimal storage conditions for different foods.
                            </p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Use FIFO method:</span>{' '}
                              First In, First Out - place new items at the back of the fridge/pantry.
                            </p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Understand date labels:</span>{' '}
                              "Best by" doesn't always mean "bad after" - use your senses to check food.
                            </p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Freeze extras:</span>{' '}
                              Freeze leftovers or extra ingredients before they spoil.
                            </p>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Environmental Impact</CardTitle>
                        <CardDescription>
                          The positive impact of your waste reduction
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h3 className="text-sm font-medium text-green-800 mb-1">
                              CO₂ Emissions Saved
                            </h3>
                            <p className="text-2xl font-bold text-green-600 mb-1">
                              {wasteData ? (Math.abs(wasteData.trend) * 0.5).toFixed(1) : '0.0'} kg
                            </p>
                            <p className="text-xs text-green-700">
                              Based on estimated emissions of food production and disposal
                            </p>
                          </div>
                          
                          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <h3 className="text-sm font-medium text-blue-800 mb-1">
                              Water Saved
                            </h3>
                            <p className="text-2xl font-bold text-blue-600 mb-1">
                              {wasteData ? (Math.abs(wasteData.trend) * 10).toFixed(0) : '0'} liters
                            </p>
                            <p className="text-xs text-blue-700">
                              Water that would have been used to produce wasted food
                            </p>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">
                            By reducing food waste, you're helping conserve resources and reduce greenhouse gas emissions.
                            Keep up the good work!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Consumption Tab Content */}
              <TabsContent value="consumption" className="animate-in fade-in-50">
                <ConsumptionInsights />
              </TabsContent>
            </Tabs>
          </GlassLogoBackground>
        </SectionBackground>
      </ThemeOverlay>
    </div>
  );
}

// Utility functions for chart data
function getCategoryDistribution(items: any[]) {
  // Count items by category
  const categoryCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const category = item.category || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Convert to chart data format
  return Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));
}

function getStorageDistribution(items: any[]) {
  // Count items by storage location
  const locationCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const location = item.location || 'Other';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });
  
  // Convert to chart data format and sort by count (descending)
  return Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getExpirationTimeline(items: any[]) {
  // Group items by days until expiration
  const timeframes = [
    { name: 'Expired', range: [-Infinity, 0] },
    { name: 'Today', range: [0, 1] },
    { name: 'This Week', range: [1, 7] },
    { name: '2 Weeks', range: [7, 14] },
    { name: '1 Month', range: [14, 30] },
    { name: 'Later', range: [30, Infinity] }
  ];
  
  const counts = timeframes.map(frame => ({
    name: frame.name,
    value: 0
  }));
  
  items.forEach(item => {
    const daysUntil = item.daysUntilExpiration || 0;
    
    for (let i = 0; i < timeframes.length; i++) {
      const frame = timeframes[i];
      if (daysUntil >= frame.range[0] && daysUntil < frame.range[1]) {
        counts[i].value++;
        break;
      }
    }
  });
  
  return counts;
}
