"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
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
} from "recharts"

// Mock data for different time ranges
const dailyOccupancyData = [
  { date: "Mar 26", actual: 72, predicted: 70 },
  { date: "Mar 27", actual: 75, predicted: 73 },
  { date: "Mar 28", actual: 68, predicted: 72 },
  { date: "Mar 29", actual: 80, predicted: 78 },
  { date: "Mar 30", actual: 85, predicted: 82 },
  { date: "Mar 31", actual: 88, predicted: 85 },
  { date: "Apr 1", actual: 92, predicted: 90 },
]

const weeklyOccupancyData = [
  { week: "Week 1", actual: 72, predicted: 70 },
  { week: "Week 2", actual: 78, predicted: 76 },
  { week: "Week 3", actual: 75, predicted: 77 },
  { week: "Week 4", actual: 82, predicted: 80 },
]

const revenueData = [
  { date: "Mar 26", adr: 145, revpar: 104 },
  { date: "Mar 27", adr: 152, revpar: 114 },
  { date: "Mar 28", adr: 148, revpar: 101 },
  { date: "Mar 29", adr: 155, revpar: 124 },
  { date: "Mar 30", adr: 160, revpar: 136 },
  { date: "Mar 31", adr: 165, revpar: 145 },
  { date: "Apr 1", adr: 170, revpar: 156 },
]

const kpiData = [
  {
    title: "Occupancy Rate",
    value: "78%",
    predicted: "76%",
    change: "+2.6%",
    trend: "up",
    icon: Bed,
    description: "Actual vs Predicted",
  },
  {
    title: "ADR (Avg Daily Rate)",
    value: "$156",
    predicted: "$150",
    change: "+4.0%",
    trend: "up",
    icon: DollarSign,
    description: "Actual vs Predicted",
  },
  {
    title: "RevPAR",
    value: "$122",
    predicted: "$114",
    change: "+7.0%",
    trend: "up",
    icon: Target,
    description: "Revenue per room",
  },
  {
    title: "Labor Cost %",
    value: "28%",
    predicted: "30%",
    change: "-2.0%",
    trend: "up",
    icon: Users,
    description: "% of revenue",
  },
  {
    title: "Forecast Accuracy",
    value: "94.2%",
    predicted: "MAPE: 5.8%",
    change: "+1.2%",
    trend: "up",
    icon: Calculator,
    description: "Prediction accuracy",
  },
  {
    title: "Cost Savings",
    value: "$12,400",
    predicted: "This month",
    change: "+18%",
    trend: "up",
    icon: Percent,
    description: "From optimization",
  },
]

const sparklineData = [
  { value: 65 },
  { value: 72 },
  { value: 68 },
  { value: 75 },
  { value: 78 },
  { value: 82 },
  { value: 78 },
]

export default function RevenuePage() {
  const [dateRange, setDateRange] = React.useState("7d")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Revenue & Performance"
        breadcrumbs={[{ label: "Revenue" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
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
              Data source: daily_occupancy, forecast, staff_schedule, approved_pricing
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
                      <TrendingDown className="size-3 text-destructive" />
                    )}
                    <span className={kpi.trend === "up" ? "text-primary" : "text-destructive"}>
                      {kpi.change}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.predicted}</p>
                  {/* Mini sparkline */}
                  <div className="mt-2 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id={`spark-${kpi.title}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
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
            </TabsList>

            <TabsContent value="occupancy" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Occupancy Trend</CardTitle>
                    <CardDescription>Occupancy rate over selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyOccupancyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                    <CardDescription>Actual vs Predicted by week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyOccupancyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                  <CardDescription>Average Daily Rate and Revenue per Available Room</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="adrGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="revparGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 76% 50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142 76% 50%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                  <CardDescription>Comparing predicted vs actual performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyOccupancyData} barGap={0}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                      <div className="text-3xl font-bold text-primary">94.2%</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Overall Forecast Accuracy
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">5.8%</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Mean Absolute Percentage Error
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">+2.4%</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Average Outperformance
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
