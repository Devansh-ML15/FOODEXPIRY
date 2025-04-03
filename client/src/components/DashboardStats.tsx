import { useQuery } from "@tanstack/react-query";
import { Archive, AlertTriangle, Utensils, Leaf } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalItems: number;
  expiringCount: number;
  recipeMatchCount: number;
  wasteSavedKg: number;
};

export default function DashboardStats() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard-stats'],
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        isLoading={isLoading}
        icon={<Archive className="text-primary-dark" />}
        iconBgColor="bg-primary-light"
        label="Total Items"
        value={data?.totalItems || 0}
      />
      
      <StatCard
        isLoading={isLoading}
        icon={<AlertTriangle className="text-red-500" />}
        iconBgColor="bg-red-100"
        label="Expiring Soon"
        value={data?.expiringCount || 0}
      />
      
      <StatCard
        isLoading={isLoading}
        icon={<Utensils className="text-amber-600" />}
        iconBgColor="bg-amber-100"
        label="Recipe Matches"
        value={data?.recipeMatchCount || 0}
      />
      
      <StatCard
        isLoading={isLoading}
        icon={<Leaf className="text-emerald-600" />}
        iconBgColor="bg-emerald-100"
        label="Waste Saved (kg)"
        value={data?.wasteSavedKg || 0}
      />
    </div>
  );
}

type StatCardProps = {
  isLoading: boolean;
  icon: React.ReactNode;
  iconBgColor: string;
  label: string;
  value: number;
};

function StatCard({ isLoading, icon, iconBgColor, label, value }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {isLoading ? <Skeleton className="h-6 w-12" /> : value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
