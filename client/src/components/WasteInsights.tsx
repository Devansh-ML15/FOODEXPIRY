import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type WasteInsightsData = {
  labels: string[];
  data: number[];
  trend: number;
};

export default function WasteInsights() {
  const { data, isLoading } = useQuery<WasteInsightsData>({
    queryKey: ['/api/waste-insights'],
  });

  const chartData = data ? 
    data.labels.map((month, index) => ({
      month,
      waste: data.data[index]
    })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waste Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis 
                    label={{ 
                      value: 'Waste (kg)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {data && data.trend !== 0 && (
                <p>
                  Your waste has {data.trend < 0 ? 'decreased' : 'increased'} by{' '}
                  <span className={data.trend < 0 ? 'text-primary font-semibold' : 'text-red-500 font-semibold'}>
                    {Math.abs(data.trend)}%
                  </span>{' '}
                  compared to last month. {data.trend < 0 ? 'Great job!' : 'Let\'s work on reducing waste.'}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
