import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { FOOD_CATEGORIES } from "@shared/schema";

type InventoryFiltersProps = {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
};

export default function InventoryFilters({
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: InventoryFiltersProps) {
  const [search, setSearch] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearchChange(value);
  };

  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
  };

  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex sm:flex-none space-x-3">
          <Select onValueChange={handleCategoryChange} defaultValue="">
            <SelectTrigger className="w-[180px] text-gray-500">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {FOOD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleSortChange} defaultValue="expiring">
            <SelectTrigger className="w-[180px] text-gray-500">
              <SelectValue placeholder="Expiring Soon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
