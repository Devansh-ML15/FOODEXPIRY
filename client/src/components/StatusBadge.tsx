import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: 'expired' | 'expiring-soon' | 'fresh';
  daysUntilExpiration: number;
};

export default function StatusBadge({ status, daysUntilExpiration }: StatusBadgeProps) {
  const { icon: Icon, text, classes } = getStatusInfo(status, daysUntilExpiration);
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      classes
    )}>
      <Icon className="mr-1 text-xs h-3 w-3" />
      {text}
    </span>
  );
}

function getStatusInfo(status: 'expired' | 'expiring-soon' | 'fresh', daysUntilExpiration: number) {
  switch (status) {
    case 'expired':
      return {
        icon: AlertCircle,
        text: 'Expired',
        classes: 'bg-red-100 text-red-800'
      };
    case 'expiring-soon':
      return {
        icon: Clock,
        text: daysUntilExpiration === 0 
          ? 'Expires today' 
          : daysUntilExpiration === 1 
            ? 'Expires tomorrow' 
            : `Expires in ${daysUntilExpiration} days`,
        classes: 'bg-yellow-100 text-yellow-800'
      };
    case 'fresh':
      return {
        icon: CheckCircle,
        text: `Fresh for ${daysUntilExpiration} days`,
        classes: 'bg-green-100 text-green-800'
      };
    default:
      return {
        icon: Clock,
        text: 'Unknown status',
        classes: 'bg-gray-100 text-gray-800'
      };
  }
}
