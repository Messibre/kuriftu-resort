"use client";

import * as React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Bed,
  DollarSign,
  Users,
  Target,
  Calculator,
  Percent,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { getRevenueDataset, type RevenueDailyData } from "@/lib/revenue-api";

function formatCurrency(value: number): string {
  return `ETB ${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatShortDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function buildWeeklyOccupancy(data: RevenueDailyData[]) {
  const weeks: { week: string; actual: number; predicted: number }[] = [];

  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    const actualValues = chunk
      .map((item) => item.actual_occupancy)
      .filter((value): value is number => value !== null);

    const predictedValues = chunk.map((item) => item.predicted_occupancy);

    const actualAvg =
      actualValues.length > 0
        ? actualValues.reduce((sum, value) => sum + value, 0) /
          actualValues.length
        : 0;
    const predictedAvg =
      predictedValues.length > 0
        ? predictedValues.reduce((sum, value) => sum + value, 0) /
          predictedValues.length
        : 0;

    weeks.push({
      week: `Week ${weeks.length + 1}`,
      actual: Number(actualAvg.toFixed(2)),
      predicted: Number(predictedAvg.toFixed(2)),
    });
  }

  return weeks;
}

export default function RevenuePage() {
  const [dateRange, setDateRange] = React.useState("30d");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [dataset, setDataset] = React.useState<Awaited<
    ReturnType<typeof getRevenueDataset>
  > | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const data = await getRevenueDataset(
        (dateRange === "7d" || dateRange === "30d" || dateRange === "90d"
          ? dateRange
          : "90d") as "7d" | "30d" | "90d",
      );
      setDataset(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData();
  };

  const dailyOccupancyData = React.useMemo(() => {
    return (dataset?.dailyData ?? []).map((item) => ({
      date: formatShortDate(item.date),
      actual: item.actual_occupancy,
      predicted: item.predicted_occupancy,
    }));
  }, [dataset]);

  const weeklyOccupancyData = React.useMemo(() => {
    return buildWeeklyOccupancy(dataset?.dailyData ?? []);
  }, [dataset]);

  const revenueData = React.useMemo(() => {
    return (dataset?.dailyData ?? []).map((item) => ({
      date: formatShortDate(item.date),
      adr: item.adr,
      revpar: item.revpar,
    }));
  }, [dataset]);

  const laborCostData = React.useMemo(() => {
    return (dataset?.dailyData ?? []).map((item) => ({
      date: formatShortDate(item.date),
      housekeeping: item.labor_housekeeping ?? 0,
      frontDesk: item.labor_front_desk ?? 0,
      fAndB: item.labor_f_b ?? 0,
      maintenance: item.labor_maintenance ?? 0,
    }));
  }, [dataset]);

  const sparklineData = React.useMemo(() => {
    const source = dataset?.dailyData ?? [];
    if (source.length === 0) {
      return [{ value: 0 }];
    }
    return source.map((item) => ({
      value: item.actual_occupancy ?? item.predicted_occupancy,
    }));
  }, [dataset]);

  const kpiData = React.useMemo(() => {
    const summary = dataset?.summary;
    if (!summary) {
      return [
        {
          title: "Total Revenue",
          value: "--",
          predicted: "Last selected period",
          change: "--",
          trend: "up" as const,
          icon: DollarSign,
        },
      ];
    }

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(summary.total_revenue),
        predicted: "Last selected period",
        change: formatPercent(summary.average_occupancy),
        trend: "up" as const,
        icon: DollarSign,
      },
      {
        title: "Average ADR",
        value: formatCurrency(summary.average_adr),
        predicted: "Average daily rate",
        change: formatCurrency(summary.average_revpar),
        trend: "up" as const,
        icon: Target,
      },
      {
        title: "Average Occupancy",
        value: formatPercent(summary.average_occupancy),
        predicted: "Actual and forecast blend",
        change: formatPercent(summary.average_occupancy),
        trend: "up" as const,
        icon: Bed,
      },
      {
        title: "RevPAR",
        value: formatCurrency(summary.average_revpar),
        predicted: "Revenue per available room",
        change: formatCurrency(summary.average_revpar),
        trend: "up" as const,
        icon: TrendingUp,
      },
      {
        title: "Labor Cost %",
        value: formatPercent(summary.labor_cost_percent),
        predicted: "% of total revenue",
        change: formatPercent(summary.labor_cost_percent),
        trend: "up" as const,
        icon: Users,
      },
      {
        title: "Forecast Accuracy (MAPE)",
        value: formatPercent(summary.forecast_accuracy_mape),
        predicted: "Lower is better",
        change: formatPercent(dataset?.mape7 ?? 0),
        trend: "down" as const,
        icon: Calculator,
      },
    ];
  }, [dataset]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Revenue & Performance"
        breadcrumbs={[{ label: "Revenue" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {hasError ? (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">
                Failed to load revenue data. Please refresh the page.
              </CardContent>
            </Card>
          ) : null}

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw
                  className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Data source: revenue dashboard, daily occupancy, forecast, pricing
              approvals
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {kpiData.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="size-3 text-primary" />
                    ) : (
                      <TrendingDown className="size-3 text-amber-600" />
                    )}
                    <span
                      className={
                        kpi.trend === "up" ? "text-primary" : "text-amber-600"
                      }
                    >
                      {kpi.change}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {kpi.predicted}
                  </p>
                  {/* Mini sparkline */}
                  <div className="mt-2 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient
                            id={`spark-${kpi.title}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(142 76% 36%)"
                          strokeWidth={1.5}
                          fill={`url(#spark-${kpi.title})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <Tabs defaultValue="occupancy" className="space-y-4">
            <TabsList>
              <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Metrics</TabsTrigger>
              <TabsTrigger value="comparison">Actual vs Predicted</TabsTrigger>
              <TabsTrigger value="labor">Labor Cost</TabsTrigger>
            </TabsList>

            <TabsContent value="occupancy" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Occupancy Trend</CardTitle>
                    <CardDescription>
                      Occupancy rate over selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyOccupancyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            className="fill-muted-foreground"
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            className="fill-muted-foreground"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value}%`, ""]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="hsl(142 76% 36%)"
                            strokeWidth={2}
                            dot={{ fill: "hsl(142 76% 36%)" }}
                            name="Actual"
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="hsl(142 76% 36% / 0.4)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: "hsl(142 76% 36% / 0.4)" }}
                            name="Predicted"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Comparison</CardTitle>
                    <CardDescription>
                      Actual vs Predicted by week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyOccupancyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12 }}
                            className="fill-muted-foreground"
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            className="fill-muted-foreground"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="actual"
                            fill="hsl(142 76% 36%)"
                            radius={[4, 4, 0, 0]}
                            name="Actual"
                          />
                          <Bar
                            dataKey="predicted"
                            fill="hsl(142 76% 36% / 0.3)"
                            radius={[4, 4, 0, 0]}
                            name="Predicted"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ADR & RevPAR Trends</CardTitle>
                  <CardDescription>
                    Average Daily Rate and Revenue per Available Room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient
                            id="adrGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="revparGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(142 76% 50%)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(142 76% 50%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value}`, ""]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="adr"
                          stroke="hsl(142 76% 36%)"
                          strokeWidth={2}
                          fill="url(#adrGradient)"
                          name="ADR"
                        />
                        <Area
                          type="monotone"
                          dataKey="revpar"
                          stroke="hsl(142 76% 50%)"
                          strokeWidth={2}
                          fill="url(#revparGradient)"
                          name="RevPAR"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Accuracy Analysis</CardTitle>
                  <CardDescription>
                    Comparing predicted vs actual performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyOccupancyData} barGap={0}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="actual"
                          fill="hsl(142 76% 36%)"
                          radius={[4, 4, 0, 0]}
                          name="Actual"
                        />
                        <Bar
                          dataKey="predicted"
                          fill="hsl(142 76% 36% / 0.3)"
                          radius={[4, 4, 0, 0]}
                          name="Predicted"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy Summary */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {formatPercent(dataset?.mape7 ?? 0)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        MAPE (Last 7 days)
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatPercent(dataset?.mape30 ?? 0)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        MAPE (Last 30 days)
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {formatPercent(dataset?.within10PctDays ?? 0)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Days within 10% error
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estimated Cost Savings</CardTitle>
                  <CardDescription>
                    AI staffing vs fixed staffing model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(dataset?.summary.estimated_savings ?? 0)}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estimated savings this period
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Labor Cost by Department</CardTitle>
                  <CardDescription>
                    Stacked labor cost by housekeeping, front desk, F&B, and
                    maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={laborCostData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="fill-muted-foreground"
                          tickFormatter={(value) => `ETB ${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [
                            `ETB ${value.toLocaleString()}`,
                            "",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="housekeeping"
                          stackId="labor"
                          fill="hsl(142 76% 36%)"
                          name="Housekeeping"
                        />
                        <Bar
                          dataKey="frontDesk"
                          stackId="labor"
                          fill="hsl(160 84% 39%)"
                          name="Front Desk"
                        />
                        <Bar
                          dataKey="fAndB"
                          stackId="labor"
                          fill="hsl(172 66% 50%)"
                          name="F&B"
                        />
                        <Bar
                          dataKey="maintenance"
                          stackId="labor"
                          fill="hsl(184 75% 39%)"
                          name="Maintenance"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading revenue data...
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
