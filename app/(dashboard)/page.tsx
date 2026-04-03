"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Bed,
  DollarSign,
  Users,
  Star,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ActivityLogWidget } from "@/components/activity-log"

const occupancyData = [
  { day: "Mon", actual: 72, predicted: 70 },
  { day: "Tue", actual: 68, predicted: 72 },
  { day: "Wed", actual: 75, predicted: 73 },
  { day: "Thu", actual: 80, predicted: 78 },
  { day: "Fri", actual: 88, predicted: 85 },
  { day: "Sat", actual: 92, predicted: 90 },
  { day: "Sun", actual: 85, predicted: 88 },
]

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
]

const kpiCards = [
  {
    title: "Occupancy Rate",
    value: "78%",
    change: "+5.2%",
    trend: "up",
    icon: Bed,
    description: "vs. last week",
  },
  {
    title: "RevPAR",
    value: "$142",
    change: "+12.3%",
    trend: "up",
    icon: DollarSign,
    description: "vs. last month",
  },
  {
    title: "Total Guests",
    value: "1,284",
    change: "+8.1%",
    trend: "up",
    icon: Users,
    description: "this month",
  },
  {
    title: "Avg. Rating",
    value: "4.7",
    change: "-0.1",
    trend: "down",
    icon: Star,
    description: "from 156 reviews",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Dashboard" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="size-3 text-primary" />
                    ) : (
                      <TrendingDown className="size-3 text-destructive" />
                    )}
                    <span
                      className={
                        kpi.trend === "up" ? "text-primary" : "text-destructive"
                      }
                    >
                      {kpi.change}
                    </span>
                    <span className="text-muted-foreground">{kpi.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Occupancy Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Occupancy: Actual vs Predicted</CardTitle>
                <CardDescription>
                  Daily comparison for the current week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
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

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(142 76% 36%)"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickAction
                    title="Create Promotion"
                    description="Launch a new special offer"
                    href="/promotions"
                  />
                  <QuickAction
                    title="View Feedback"
                    description="Check guest reviews"
                    href="/feedback"
                  />
                  <QuickAction
                    title="Revenue Report"
                    description="Detailed analytics"
                    href="/revenue"
                  />
                  <QuickAction
                    title="Staff Schedule"
                    description="Manage staffing"
                    href="/scheduling"
                  />
                </div>
              </CardContent>
            </Card>

            <ActivityLogWidget />
          </div>
        </div>
      </main>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-primary hover:bg-primary/5"
    >
      <span className="font-medium group-hover:text-primary">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </a>
  )
}
