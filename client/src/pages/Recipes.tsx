import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { 
  Clock, 
  RefreshCw, 
  ChefHat,
  AlertCircle,
  Search,
  XCircle,
  ArrowRight
} from "lucide-react";
import { SectionBackground } from "@/components/ui/section-background";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FoodItemWithStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

// Regular recipe type from the database
type Recipe = {
  id: number;
  name: string;
  ingredients: string[];
  preparationTime: number;
  instructions: string;
  imageUrl?: string;
};

// AI-generated recipe suggestion type
type RecipeSuggestion = {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  matchingItems: string[];
  preparationTime: number;
  difficulty: string;
};

// AI-generated detailed recipe type
type DetailedRecipe = {
  title: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    isAvailable: boolean;
  }[];
  instructions: string[];
  preparationTime: number;
  difficulty: string;
  tips: string[];
  nutritionalInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
};

export default function Recipes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [prioritizeExpiring, setPrioritizeExpiring] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [activeTab, setActiveTab] = useState("ai");
  const [detailRecipeOpen, setDetailRecipeOpen] = useState(false);
  
  // Load regular recipes
  const { 
    data: recipes, 
    isLoading: regularRecipesLoading 
  } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    enabled: activeTab === "regular"
  });

  // Load AI recipe suggestions
  const { 
    data: aiSuggestions, 
    isLoading: aiSuggestionsLoading,
    refetch: refetchAiSuggestions
  } = useQuery<{ recipes: RecipeSuggestion[] }>({
    queryKey: ['/api/recipe-suggestions', { expiring: prioritizeExpiring }],
    enabled: activeTab === "ai",
  });

  // Generate detailed recipe mutation
  const detailedRecipeMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await apiRequest("POST", "/api/recipe-details", {
        ingredients,
        dietary: dietaryRestrictions.trim() || undefined
      });
      return res.json();
    },
    onSuccess: () => {
      setDetailRecipeOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error generating recipe",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter regular recipes based on search term
  const filteredRegularRecipes = recipes?.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Filter AI suggestions based on search term
  const filteredAiSuggestions = aiSuggestions?.recipes?.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle refresh AI suggestions
  const handleRefreshSuggestions = () => {
    refetchAiSuggestions();
    toast({
      title: "Refreshing recipe suggestions",
      description: prioritizeExpiring 
        ? "Prioritizing ingredients that expire soon" 
        : "Considering all available ingredients"
    });
  };

  // Handle generating detailed recipe
  const handleGenerateDetailedRecipe = (ingredients: string[]) => {
    setSelectedIngredients(ingredients);
    detailedRecipeMutation.mutate(ingredients);
  };

  return (
    <div className="mb-8">
      <SectionBackground pattern="recipes" className="p-6">
        <GlassLogoBackground opacity={0.06}>
          {/* Header with tabs */}
          <div className="flex flex-col items-start mb-6">
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h1 className="text-2xl font-semibold text-gray-900 pt-2">Recipes</h1>
              <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search recipes or ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/80 pl-8 pr-8"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <Tabs 
              defaultValue="ai" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  <span>AI Suggestions</span>
                </TabsTrigger>
                <TabsTrigger value="regular">
                  <span>Regular Recipes</span>
                </TabsTrigger>
              </TabsList>
              
              {/* AI Recipes Tab Content */}
              <TabsContent value="ai" className="mt-4">
                {activeTab === "ai" && (
                  <div className="flex flex-wrap items-center gap-2 mb-4 bg-white/90 p-2 rounded-md">
                    <div className="flex items-center space-x-2 mr-4">
                      <Switch
                        id="expiry-priority"
                        checked={prioritizeExpiring}
                        onCheckedChange={setPrioritizeExpiring}
                      />
                      <Label htmlFor="expiry-priority">Prioritize expiring ingredients</Label>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-auto"
                      onClick={handleRefreshSuggestions}
                      disabled={aiSuggestionsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${aiSuggestionsLoading ? 'animate-spin' : ''}`} />
                      Refresh suggestions
                    </Button>
                  </div>
                )}
                
                {aiSuggestionsLoading ? (
                  <AiRecipeSkeletons />
                ) : filteredAiSuggestions && filteredAiSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAiSuggestions.map((recipe) => (
                      <Card key={recipe.id} className="overflow-hidden flex flex-col backdrop-blur-sm bg-white/90">
                        <div className="h-48 w-full relative bg-gray-100">
                          <div className="h-full w-full flex items-center justify-center bg-amber-100 text-amber-500">
                            <span className="text-4xl">🍽️</span>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-md flex items-center text-xs font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {recipe.preparationTime} min
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-primary text-white">AI Suggested</Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle>{recipe.title}</CardTitle>
                          <CardDescription>
                            {recipe.difficulty} • {recipe.matchingItems.length} matching ingredients
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {recipe.description}
                          </p>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Matching ingredients:</p>
                            <div className="flex flex-wrap gap-1">
                              {recipe.matchingItems.slice(0, 3).map((item, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                              ))}
                              {recipe.matchingItems.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{recipe.matchingItems.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full"
                            onClick={() => handleGenerateDetailedRecipe(recipe.ingredients)}
                            disabled={detailedRecipeMutation.isPending}
                          >
                            {detailedRecipeMutation.isPending ? 
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : 
                              <ChefHat className="h-4 w-4 mr-2" />
                            }
                            Generate Recipe
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <NoRecipesFound 
                    searchTerm={searchTerm} 
                    clearSearch={() => setSearchTerm("")} 
                    isAi={true}
                  />
                )}
              </TabsContent>
              
              {/* Regular Recipes Tab Content */}
              <TabsContent value="regular" className="mt-4">
                {regularRecipesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="backdrop-blur-sm bg-white/90">
                        <Skeleton className="h-48 w-full rounded-t-lg" />
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-3/4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : filteredRegularRecipes && filteredRegularRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRegularRecipes.map((recipe) => (
                      <Card key={recipe.id} className="overflow-hidden flex flex-col backdrop-blur-sm bg-white/90">
                        <div className="h-48 w-full relative bg-gray-100">
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-amber-100 text-amber-500">
                              <span className="text-4xl">🍽️</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-md flex items-center text-xs font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {recipe.preparationTime} min
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle>{recipe.name}</CardTitle>
                          <CardDescription>
                            {recipe.ingredients.slice(0, 3).join(', ')}
                            {recipe.ingredients.length > 3 && '...'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {recipe.instructions}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">
                            View Recipe
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <NoRecipesFound 
                    searchTerm={searchTerm} 
                    clearSearch={() => setSearchTerm("")} 
                    isAi={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </GlassLogoBackground>
      </SectionBackground>
      
      {/* Detailed Recipe Dialog */}
      <DetailedRecipeDialog
        open={detailRecipeOpen}
        onOpenChange={setDetailRecipeOpen}
        recipe={detailedRecipeMutation.data as DetailedRecipe}
        ingredients={selectedIngredients}
        isLoading={detailedRecipeMutation.isPending}
      />
    </div>
  );
}

// Skeleton for AI recipe suggestions
function AiRecipeSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="backdrop-blur-sm bg-white/90">
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <Skeleton className="h-3 w-1/4 mb-1" />
            <div className="flex gap-1 mt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// No recipes found component
function NoRecipesFound({ 
  searchTerm, 
  clearSearch, 
  isAi 
}: { 
  searchTerm: string; 
  clearSearch: () => void; 
  isAi: boolean;
}) {
  return (
    <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-lg shadow">
      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      {searchTerm ? (
        <>
          <p className="text-gray-800 text-lg font-medium">No recipes found matching your search.</p>
          <p className="text-gray-500 mt-1">Try a different search term or clear the search.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={clearSearch}
          >
            Clear search
          </Button>
        </>
      ) : isAi ? (
        <>
          <p className="text-gray-800 text-lg font-medium">No AI recipe suggestions available</p>
          <p className="text-gray-500 mt-1">Add ingredients to your inventory to get personalized recipe suggestions!</p>
        </>
      ) : (
        <>
          <p className="text-gray-800 text-lg font-medium">No recipes available</p>
          <p className="text-gray-500 mt-1">Recipes will appear here once they're added to the system.</p>
        </>
      )}
    </div>
  );
}

// Detailed Recipe Dialog
function DetailedRecipeDialog({ 
  open, 
  onOpenChange, 
  recipe, 
  ingredients,
  isLoading 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  recipe?: DetailedRecipe;
  ingredients: string[];
  isLoading: boolean;
}) {
  if (isLoading || !recipe) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Generating Your Recipe</DialogTitle>
            <DialogDescription>
              Creating a detailed recipe based on your ingredients...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Our AI chef is preparing your recipe!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{recipe.title}</DialogTitle>
          <DialogDescription>
            {recipe.description}
          </DialogDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recipe.preparationTime} minutes
            </Badge>
            <Badge variant="outline" className="capitalize">{recipe.difficulty}</Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-medium text-gray-900 mb-2">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, i) => (
                  <li key={i} className="flex items-start">
                    <Badge 
                      variant={ingredient.isAvailable ? "default" : "secondary"}
                      className="mt-0.5 mr-2 h-5 w-5 flex items-center justify-center p-0 rounded-full"
                    >
                      {ingredient.isAvailable ? "✓" : "!"}
                    </Badge>
                    <span className={`text-sm ${!ingredient.isAvailable ? 'text-gray-500' : ''}`}>
                      <span className="font-medium">{ingredient.quantity}</span> {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>

              {recipe.nutritionalInfo && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Nutritional Info</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {recipe.nutritionalInfo.calories && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-medium">{recipe.nutritionalInfo.calories}</span>
                      </div>
                    )}
                    {recipe.nutritionalInfo.protein && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium">{recipe.nutritionalInfo.protein}</span>
                      </div>
                    )}
                    {recipe.nutritionalInfo.carbs && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carbs:</span>
                        <span className="font-medium">{recipe.nutritionalInfo.carbs}</span>
                      </div>
                    )}
                    {recipe.nutritionalInfo.fat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-medium">{recipe.nutritionalInfo.fat}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
              <ol className="space-y-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex">
                    <span className="bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mt-0.5 mr-3">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
              
              {recipe.tips && recipe.tips.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Chef's Tips</h3>
                  <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, i) => (
                        <li key={i} className="flex text-sm">
                          <span className="text-amber-600 mr-2">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="flex items-center gap-2">
            <span>Save Recipe</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
