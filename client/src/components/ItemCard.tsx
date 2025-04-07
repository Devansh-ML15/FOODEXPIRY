import { FoodItemWithStatus } from "@shared/schema";
import FoodCategoryIcon from "./FoodCategoryIcon";
import StatusBadge from "./StatusBadge";
import { Pencil, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ConsumeItemDialog from "./ConsumeItemDialog";

type ItemCardProps = {
  item: FoodItemWithStatus;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const { name, category, quantity, unit, status, daysUntilExpiration } = item;
  const [isConsumeDialogOpen, setIsConsumeDialogOpen] = useState(false);
  
  // Calculate progress bar percentage based on days until expiration
  let progressPercentage = 100;
  if (status === 'expiring-soon') {
    progressPercentage = Math.min(Math.max((daysUntilExpiration / 7) * 100, 10), 50);
  } else if (status === 'expired') {
    progressPercentage = 5;
  } else if (status === 'fresh') {
    progressPercentage = Math.min(Math.max((daysUntilExpiration / 14) * 100, 60), 90);
  }
  
  const statusColor = getStatusColor(status);
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 pt-4 flex justify-between items-start">
        <div className={`rounded-full bg-${statusColor}-100 p-2`}>
          <FoodCategoryIcon category={category} />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConsumeDialogOpen(true)}
            className="h-8 w-8 text-gray-400 hover:text-green-500"
            title="Mark as consumed"
          >
            <Utensils className="h-4 w-4" />
            <span className="sr-only">Consume</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 hover:text-gray-500"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="h-8 w-8 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-lg font-semibold text-gray-900 truncate">{name}</p>
        <p className="mt-1 text-sm text-gray-500">
          {quantity} {unit} • {capitalizeFirstLetter(category)}
        </p>
        <div className="mt-2 flex items-center">
          <StatusBadge status={status} daysUntilExpiration={daysUntilExpiration} />
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`bg-${statusColor}-500 h-1.5 rounded-full`} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <ConsumeItemDialog 
        open={isConsumeDialogOpen}
        onOpenChange={setIsConsumeDialogOpen}
        item={item}
      />
    </div>
  );
}

function getStatusColor(status: 'expired' | 'expiring-soon' | 'fresh'): string {
  switch (status) {
    case 'expired':
      return 'red';
    case 'expiring-soon':
      return 'yellow';
    case 'fresh':
      return 'green';
    default:
      return 'gray';
  }
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
