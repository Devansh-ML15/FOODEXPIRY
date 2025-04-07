import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface ConsumptionInsightsData {
  labels: string[];
  countData: number[];
  valueData: number[];
  trend: number;
}

export default function ConsumptionInsights() {
  const { data, isLoading } = useQuery<ConsumptionInsightsData>({
    queryKey: ['/api/consumption-insights'],
  });

  const formatChartData = () => {
    if (!data) return [];
    
    return data.labels.map((month, index) => ({
      month,
      count: data.countData[index] || 0,
      value: data.valueData[index] || 0,
    }));
  };

  const chartData = formatChartData();
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Food Consumption Patterns</CardTitle>
            <CardDescription>Items consumed over time</CardDescription>
          </div>
          {data && (
            <Badge variant={data.trend > 0 ? "default" : "outline"} className="ml-auto">
              {data.trend > 0 ? (
                <ArrowUpIcon className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              )}
              {Math.abs(data.trend)}% from last month
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-80 w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="Items Consumed"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    name="Estimated Value"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <p>No consumption data available</p>
                <p className="text-sm mt-2">Start consuming items to see insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Consumption Breakdown</CardTitle>
          <CardDescription>Items consumed per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-80 w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Items Consumed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <p>No consumption data available</p>
                <p className="text-sm mt-2">Start consuming items to see insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}