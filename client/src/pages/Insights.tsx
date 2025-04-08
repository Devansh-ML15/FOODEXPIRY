import { useQuery } from "@tanstack/react-query";
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
  Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import WasteInsights from "@/components/WasteInsights";
import ConsumptionInsights from "@/components/ConsumptionInsights";

type WasteInsightsData = {
  labels: string[];
  data: number[];
  trend: number;
};

// Mock data for category distribution (in a real app, this would come from an API)
const CATEGORY_COLORS = {
  produce: "#22c55e", // green
  dairy: "#3b82f6", // blue
  meat: "#ef4444", // red
  bakery: "#f59e0b", // amber
  pantry: "#8b5cf6", // violet
  frozen: "#06b6d4", // cyan
  other: "#94a3b8", // slate
};

export default function Insights() {
  const { data: wasteData, isLoading: isWasteLoading } = useQuery<WasteInsightsData>({
    queryKey: ['/api/waste-insights'],
  });
  
  const { data: foodItems } = useQuery<any[]>({
    queryKey: ['/api/food-items'],
  });
  
  // Prepare data for the category distribution chart
  const categoryData = Array.isArray(foodItems) ? getCategoryDistribution(foodItems) : [];
  
  return (
    <div className="mb-8">
      <SectionBackground pattern="insights" className="p-6">
        <GlassLogoBackground className="rounded-xl p-4">
        <h1 className="page-header">Insights</h1>
        
        <Tabs defaultValue="categories" className="mb-6">
          <TabsList className="mb-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="categories">Category Distribution</TabsTrigger>
            <TabsTrigger value="expiration">Expiration Patterns</TabsTrigger>
            <TabsTrigger value="waste">Waste Trends</TabsTrigger>
            <TabsTrigger value="consumption">Consumption</TabsTrigger>
          </TabsList>
          
        <TabsContent value="waste">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Food Waste Over Time</CardTitle>
                <CardDescription>
                  Track your food waste patterns and see your improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isWasteLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : wasteData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={wasteData.labels.map((month, i) => ({
                          month,
                          waste: wasteData.data[i]
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis 
                          label={{ 
                            value: 'Waste (kg)', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }} 
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="waste" fill="hsl(var(--primary))" name="Waste (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No waste data available</p>
                    </div>
                  )}
                </div>
                
                {wasteData && wasteData.trend !== 0 && (
                  <div className="mt-4 bg-primary bg-opacity-10 p-3 rounded-md">
                    <p className="text-sm">
                      Your food waste has {wasteData.trend < 0 ? 'decreased' : 'increased'} by{' '}
                      <span className={wasteData.trend < 0 ? 'text-primary font-semibold' : 'text-red-500 font-semibold'}>
                        {Math.abs(wasteData.trend)}%
                      </span>{' '}
                      compared to last month.
                      {wasteData.trend < 0 
                        ? ' Great job on reducing waste!' 
                        : ' Try using the expiring items in recipes to reduce waste.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
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
        
        <TabsContent value="categories">
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
        
        <TabsContent value="expiration">
          <div className="grid grid-cols-1 gap-6">
            <WasteInsights />
            
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
                      <p className="text-gray-500">No expiration data available</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Expiration Reminder</h4>
                  <p className="text-xs text-amber-700">
                    Set up notifications in your profile to receive alerts when items are about to expire. 
                    This can help you use items before they go bad and reduce food waste.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="consumption">
          <ConsumptionInsights />
        </TabsContent>
      </Tabs>
      </GlassLogoBackground>
      </SectionBackground>
    </div>
  );
}

// Helper function to get category distribution data
function getCategoryDistribution(items: any[]) {
  const categoryCounts: Record<string, number> = {};
  
  items.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });
  
  return Object.entries(categoryCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));
}

// Helper function to get storage location distribution
function getStorageDistribution(items: any[]) {
  const storageCounts: Record<string, number> = {};
  
  items.forEach(item => {
    storageCounts[item.storageLocation] = (storageCounts[item.storageLocation] || 0) + 1;
  });
  
  return Object.entries(storageCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })).sort((a, b) => b.value - a.value);
}

// Helper function to get expiration timeline
function getExpirationTimeline(items: any[]) {
  const timeline: Record<string, number> = {
    "Expired": 0,
    "Today": 0,
    "This Week": 0,
    "Next Week": 0,
    "Later": 0
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const twoWeeksOut = new Date(today);
  twoWeeksOut.setDate(today.getDate() + 14);
  
  items.forEach(item => {
    const expirationDate = new Date(item.expirationDate);
    expirationDate.setHours(0, 0, 0, 0);
    
    if (expirationDate < today) {
      timeline["Expired"]++;
    } else if (expirationDate.getTime() === today.getTime()) {
      timeline["Today"]++;
    } else if (expirationDate < nextWeek) {
      timeline["This Week"]++;
    } else if (expirationDate < twoWeeksOut) {
      timeline["Next Week"]++;
    } else {
      timeline["Later"]++;
    }
  });
  
  return Object.entries(timeline).map(([name, value]) => ({ name, value }));
}
