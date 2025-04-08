import { useQuery } from "@tanstack/react-query";
import { Archive, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import logoImage from "@/assets/logo.png";

type DashboardStats = {
  totalItems: number;
  expiringCount: number;
  wasteSavedKg: number;
};

export default function DashboardStats() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard-stats'],
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <StatCard
        isLoading={isLoading}
        icon={<Archive className="text-primary-dark animate-jello" />}
        iconBgColor="bg-primary-light"
        label="Total Items"
        value={data?.totalItems || 0}
        delay={0}
        animationType="animate-slide-in-left"
      />
      
      <StatCard
        isLoading={isLoading}
        icon={<AlertTriangle className="text-red-500 animate-pulse" />}
        iconBgColor="bg-red-100"
        label="Expiring Soon"
        value={data?.expiringCount || 0}
        delay={150}
        animationType="animate-flip-in"
      />
      
      <StatCard
        isLoading={isLoading}
        icon={<img src={logoImage} alt="Food Expiry Logo" className="h-6 w-6 animate-float" />}
        iconBgColor="bg-emerald-100"
        label="Waste Saved (kg)"
        value={data?.wasteSavedKg || 0}
        delay={300}
        animationType="animate-slide-in-right"
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
  delay?: number;
  animationType?: string;
};

function StatCard({ isLoading, icon, iconBgColor, label, value, delay = 0, animationType = "animate-fade-in-up" }: StatCardProps) {
  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:shadow-lg hover:scale-105 ${animationType}`}
      style={{ 
        animationDelay: `${delay}ms`
      }}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3 transition-all duration-300 hover:shadow-inner`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate animate-fade-in" style={{ animationDelay: `${delay + 200}ms` }}>{label}</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {isLoading ? <Skeleton className="h-6 w-12" /> : (
                  <span className="value-counter">{value}</span>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer"></div>
    </div>
  );
}
