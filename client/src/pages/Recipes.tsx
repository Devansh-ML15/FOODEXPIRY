import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Clock } from "lucide-react";
import { SectionBackground } from "@/components/ui/section-background";

type Recipe = {
  id: number;
  name: string;
  ingredients: string[];
  preparationTime: number;
  instructions: string;
  imageUrl?: string;
};

export default function Recipes() {
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
  });

  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredRecipes = recipes?.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="mb-8">
      <SectionBackground pattern="recipes" className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
          <div className="mt-4 sm:mt-0 w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search recipes or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/80"
            />
          </div>
        </div>

        {isLoading ? (
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
        ) : filteredRecipes && filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
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
                  <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                    View Recipe
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-lg shadow">
            <p className="text-gray-500 text-lg">No recipes found matching your search.</p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </SectionBackground>
    </div>
  );
}
