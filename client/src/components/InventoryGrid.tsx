import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FoodItemWithStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "./ItemCard";
import AddItemDialog from "./AddItemDialog";
import EditItemDialog from "./EditItemDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Link } from "wouter";

type InventoryGridProps = {};

export default function InventoryGrid({}: InventoryGridProps) {
  const { data: foodItems, isLoading } = useQuery<FoodItemWithStatus[]>({
    queryKey: ['/api/food-items'],
  });
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("expiring");
  const [filteredItems, setFilteredItems] = useState<FoodItemWithStatus[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItemWithStatus | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/food-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted from your inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!foodItems) return;

    // Filter out items with quantity 0 (fully consumed)
    let result = foodItems.filter(item => item.quantity > 0);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (category) {
      result = result.filter(item => item.category === category);
    }

    // Apply sorting
    switch (sortBy) {
      case "expiring":
        result.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
        break;
      case "recent":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredItems(result);
  }, [foodItems, search, category, sortBy]);

  const handleEdit = (item: FoodItemWithStatus) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 animate-slide-in-right" style={{animationDuration: '0.7s'}}>
        <div className="flex space-x-3 animate-pop-in" style={{animationDelay: '0.3s'}}>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center bg-primary hover:bg-primary-dark text-white button-animated hover:scale-105 transition-transform shadow-md"
          >
            <Plus className="mr-2 h-5 w-5 animate-jello" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters Component */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 animate-slide-in-left" style={{animationDuration: '0.6s'}}>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 animate-fade-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{animationDelay: '0.4s'}}>
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-all hover:shadow-md focus:shadow-lg"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex sm:flex-none animate-fade-in" style={{animationDelay: '0.3s'}}>
            <select
              id="category-filter"
              className="focus:ring-primary focus:border-primary h-full py-2 pl-3 pr-7 border-gray-300 bg-white text-gray-500 sm:text-sm rounded-md border transition-all hover:shadow-md focus:shadow-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat</option>
              <option value="bakery">Bakery</option>
              <option value="pantry">Pantry</option>
              <option value="frozen">Frozen</option>
              <option value="other">Other</option>
            </select>
            <select
              id="sort-filter"
              className="ml-3 focus:ring-primary focus:border-primary h-full py-2 pl-3 pr-7 border-gray-300 bg-white text-gray-500 sm:text-sm rounded-md border transition-all hover:shadow-md focus:shadow-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="expiring">Expiring Soon</option>
              <option value="recent">Recently Added</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in" style={{animationDelay: '0.5s'}}>
        {isLoading ? (
          // Skeleton loading state with staggered animation
          [...Array(8)].map((_, index) => (
            <div 
              key={index} 
              className="bg-white overflow-hidden shadow rounded-lg animate-pulse" 
              style={{animationDelay: `${0.1 * (index % 4)}s`, animationDuration: '2s'}}
            >
              <div className="px-4 pt-4 flex justify-between items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
              <div className="px-4 py-3">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <div key={item.id} style={{animationDelay: `${0.05 * (index % 8)}s`}}>
              <ItemCard
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <p className="text-gray-500 text-lg animate-fade-in-up" style={{animationDelay: '0.5s'}}>No items found.</p>
            {category || search ? (
              <p className="text-gray-400 mt-2 animate-fade-in" style={{animationDelay: '0.7s'}}>Try adjusting your filters or search terms.</p>
            ) : (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4 bg-primary hover:bg-primary-dark text-white button-animated animate-pulse-subtle"
                style={{animationDelay: '0.9s'}}
              >
                <Plus className="mr-2 h-4 w-4 animate-float" /> Add your first item
              </Button>
            )}
          </div>
        )}
      </div>

      <AddItemDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />

      {selectedItem && (
        <EditItemDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={selectedItem}
        />
      )}
    </>
  );
}
