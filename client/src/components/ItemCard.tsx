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
  
  // Determine which animation to use based on status
  const animationClass = 
    status === 'expired' ? 'animate-pulse' : 
    status === 'expiring-soon' ? 'animate-pop-in' : 
    'animate-fade-in';
  
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-md hover:-translate-y-1 ${animationClass} card-hover`}>
      <div className="px-4 pt-4 flex justify-between items-start">
        <div className={`rounded-full bg-${statusColor}-100 p-2 animate-pop-in`} style={{animationDelay: '0.1s'}}>
          <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <FoodCategoryIcon category={category} />
          </div>
        </div>
        <div className="flex space-x-2 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConsumeDialogOpen(true)}
            className="h-8 w-8 text-gray-400 hover:text-green-500 hover:scale-110 transition-transform"
            title="Mark as consumed"
          >
            <Utensils className="h-4 w-4 animate-jello" />
            <span className="sr-only">Consume</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:scale-110 transition-transform"
          >
            <Pencil className="h-4 w-4 hover:animate-spin" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:scale-110 transition-transform"
          >
            <Trash2 className="h-4 w-4 hover:animate-bounce" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      <div className="px-4 py-3 animate-fade-in" style={{animationDelay: '0.4s'}}>
        <p className="text-lg font-semibold text-gray-900 truncate card-header">{name}</p>
        <p className="mt-1 text-sm text-gray-500 animate-fade-in" style={{animationDelay: '0.5s'}}>
          {quantity} {unit} • {capitalizeFirstLetter(category)}
        </p>
        <div className="mt-2 flex items-center animate-pop-in" style={{animationDelay: '0.6s'}}>
          <StatusBadge status={status} daysUntilExpiration={daysUntilExpiration} />
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
          <div 
            className={`bg-${statusColor}-500 h-1.5 rounded-full transition-all duration-1000 ease-out`} 
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
