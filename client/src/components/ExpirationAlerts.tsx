import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { FoodItemWithStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import FoodCategoryIcon from "./FoodCategoryIcon";
import { useToast } from "@/hooks/use-toast";

export default function ExpirationAlerts() {
  const { data: foodItems, isLoading } = useQuery<FoodItemWithStatus[]>({
    queryKey: ['/api/food-items'],
  });
  
  const { toast } = useToast();

  // Filter items expiring soon (within 3 days) or already expired
  const expiringItems = foodItems?.filter(
    item => item.status === 'expired' || item.status === 'expiring-soon'
  ).sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration).slice(0, 3) || [];
  
  const handleUseItem = (item: FoodItemWithStatus) => {
    toast({
      title: `Using ${item.name}`,
      description: "Suggesting recipes for this item...",
    });
  };

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Expiring Soon</h3>
        <div className="flow-root">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : expiringItems.length > 0 ? (
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {expiringItems.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-lg bg-${getColorByStatus(item.status)}-100 flex items-center justify-center text-${getColorByStatus(item.status)}-600`}>
                      <FoodCategoryIcon category={item.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        <ExpirationText item={item} /> • Added {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleUseItem(item)}
                        className="inline-flex items-center text-white bg-primary hover:bg-primary-dark"
                      >
                        Use It
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-6 text-gray-500">No items expiring soon!</p>
          )}
        </div>
        <div className="mt-6">
          <Link href="/inventory">
            <Button
              variant="outline"
              className="w-full flex justify-center items-center"
            >
              View all expiring items
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExpirationText({ item }: { item: FoodItemWithStatus }) {
  let text: string;
  let className: string;

  if (item.status === 'expired') {
    text = 'Expired';
    className = 'text-red-500 font-medium';
  } else if (item.daysUntilExpiration === 0) {
    text = 'Expires today';
    className = 'text-red-500 font-medium';
  } else if (item.daysUntilExpiration === 1) {
    text = 'Expires tomorrow';
    className = 'text-red-500 font-medium';
  } else {
    text = `Expires in ${item.daysUntilExpiration} days`;
    className = 'text-yellow-600 font-medium';
  }

  return <span className={className}>{text}</span>;
}

function getColorByStatus(status: 'expired' | 'expiring-soon' | 'fresh'): string {
  switch (status) {
    case 'expired':
      return 'red';
    case 'expiring-soon':
      return 'amber';
    case 'fresh':
      return 'green';
    default:
      return 'gray';
  }
}
