import { useQuery } from "@tanstack/react-query";
import { Info, RefreshCw, Calendar, Trash, FolderPlus, Leaf } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBackground } from "@/components/ui/section-background";

type Tip = {
  id: number;
  title: string;
  content: string;
};

export default function Tips() {
  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/sustainability-tips'],
  });

  const categories = [
    { id: "storage", label: "Storage", icon: <FolderPlus className="h-4 w-4 mr-1" /> },
    { id: "planning", label: "Meal Planning", icon: <Calendar className="h-4 w-4 mr-1" /> },
    { id: "reduce", label: "Reduce Waste", icon: <Trash className="h-4 w-4 mr-1" /> },
    { id: "reuse", label: "Reuse & Recycle", icon: <RefreshCw className="h-4 w-4 mr-1" /> },
    { id: "general", label: "General", icon: <Info className="h-4 w-4 mr-1" /> }
  ];

  return (
    <div className="mb-8">
      <SectionBackground pattern="tips" className="p-6">
        <div className="flex items-center mb-6">
          <img src={logoImage} alt="Food Expiry Logo" className="h-8 w-8 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900">Sustainability Tips</h1>
        </div>

      <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="rounded-full bg-green-100 p-3 h-16 w-16 flex items-center justify-center">
                <img src={logoImage} alt="Food Expiry Logo" className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reduce Food Waste, Save the Planet</h2>
              <p className="text-gray-600">
                One-third of all food produced globally is wasted, contributing to 8% of greenhouse gas emissions. 
                By reducing your food waste, you're helping conserve resources and making a real environmental impact.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tips</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="hidden sm:flex">
              {category.icon}
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : tips && tips.length > 0 ? (
              tips.map(tip => (
                <TipCard key={tip.id} tip={tip} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No tips available at the moment.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isLoading && tips && tips
                .filter((_, index) => index % categories.length === categories.findIndex(c => c.id === category.id))
                .map(tip => (
                  <TipCard key={tip.id} tip={tip} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Did You Know?</CardTitle>
          <CardDescription>Facts about food waste and sustainability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-1">Food Waste Impact</h3>
              <p className="text-sm text-amber-700">
                If food waste were a country, it would be the third-largest emitter of greenhouse gases after the US and China.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-1">Water Conservation</h3>
              <p className="text-sm text-blue-700">
                Reducing your food waste by just 25% could save approximately 720 gallons of water per person annually.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-1">Economic Savings</h3>
              <p className="text-sm text-green-700">
                The average family of four wastes about $1,500 worth of food annually. Tracking expiration dates can reduce this significantly.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            Source: Food and Agriculture Organization of the United Nations (FAO)
          </p>
        </CardFooter>
      </Card>
      </SectionBackground>
    </div>
  );
}

function TipCard({ tip }: { tip: Tip }) {
  // Randomly assign a category badge for demo purposes
  const categories = [
    { label: "Storage", color: "bg-blue-100 text-blue-800" },
    { label: "Planning", color: "bg-purple-100 text-purple-800" },
    { label: "Reduce", color: "bg-green-100 text-green-800" },
    { label: "Reuse", color: "bg-amber-100 text-amber-800" },
    { label: "General", color: "bg-gray-100 text-gray-800" }
  ];
  
  const randomCategory = categories[tip.id % categories.length];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{tip.title}</CardTitle>
          <Badge 
            variant="outline" 
            className={`${randomCategory.color} border-0`}
          >
            {randomCategory.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{tip.content}</p>
      </CardContent>
    </Card>
  );
}
