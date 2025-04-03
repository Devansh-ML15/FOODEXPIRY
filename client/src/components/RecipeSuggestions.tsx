import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type RecipeSuggestion = {
  id: number;
  name: string;
  ingredients: string[];
  preparationTime: number;
  matchingIngredients: string[];
  matchScore: number;
  imageUrl?: string;
};

export default function RecipeSuggestions() {
  const { data: recipeSuggestions, isLoading } = useQuery<RecipeSuggestion[]>({
    queryKey: ['/api/recipe-suggestions'],
  });
  
  // Get top 2 recipe suggestions
  const topSuggestions = recipeSuggestions?.slice(0, 2) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-14 w-14 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : topSuggestions.length > 0 ? (
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {topSuggestions.map((recipe) => (
                <li key={recipe.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-14 w-14 rounded-md overflow-hidden bg-gray-100">
                      {recipe.imageUrl ? (
                        <img
                          className="h-full w-full object-cover"
                          src={recipe.imageUrl}
                          alt={recipe.name}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-amber-100 text-amber-500">
                          <span className="text-lg">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {recipe.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Uses: {recipe.matchingIngredients.slice(0, 2).join(', ')}
                        {recipe.matchingIngredients.length > 2 && '...'} • {recipe.preparationTime} min
                      </p>
                    </div>
                    <div>
                      <Link href={`/recipes/${recipe.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          View Recipe
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-6 text-gray-500">No recipe suggestions available. Add more items to your inventory!</p>
          )}
        </div>
        <div className="mt-6">
          <Link href="/recipes">
            <Button
              variant="outline"
              className="w-full flex justify-center items-center"
            >
              View all recipes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
