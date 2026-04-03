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
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getActivePromotions,
  getForecastData,
  getUpcomingEventsAndHolidays,
  type DashboardEvent,
  type DashboardPromotion,
  type ForecastPoint,
  type ForecastResponse,
  type StaffingPoint,
} from "@/lib/dashboard-api";

type ForecastChartPoint = {
  date: string;
  occupancy: number;
  lowerBound: number;
  range: number;
};

type DashboardAlert = {
  id: string;
  message: string;
  level: "high" | "medium";
};

function formatShortDate(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function buildChartData(forecasts: ForecastPoint[]): ForecastChartPoint[] {
  return forecasts.map((item) => {
    const range = Math.max(item.upper_bound - item.lower_bound, 0);

    return {
      date: formatShortDate(item.date),
      occupancy: Number(item.occupancy_percent.toFixed(1)),
      lowerBound: Number(item.lower_bound.toFixed(1)),
      range: Number(range.toFixed(1)),
    };
  });
}

function buildAlerts(
  forecasts: ForecastPoint[],
  staffing: StaffingPoint[],
): DashboardAlert[] {
  const upcomingForecasts = forecasts.slice(0, 7);
  const alerts: DashboardAlert[] = [];

  for (const item of upcomingForecasts) {
    if (item.occupancy_percent > 90) {
      alerts.push({
        id: `high-${item.date}`,
        level: "high",
        message: `High demand alert: Staffing may be insufficient on ${item.date}.`,
      });
    }

    if (item.occupancy_percent < 20) {
      alerts.push({
        id: `low-${item.date}`,
        level: "medium",
        message: `Low demand alert: Consider running a promotion for ${item.date}.`,
      });
    }
  }

  const staffingByDate = new Map(staffing.map((item) => [item.date, item]));

  for (const item of upcomingForecasts) {
    const staffingItem = staffingByDate.get(item.date);
    if (!staffingItem) {
      continue;
    }

    if (
      staffingItem.housekeeping_staff < 2 ||
      staffingItem.front_desk_staff < 2 ||
      staffingItem.f_b_staff < 2
    ) {
      alerts.push({
        id: `staff-${item.date}`,
        level: "high",
        message: `Staffing alert: Minimum staffing threshold is not met on ${item.date}.`,
      });
    }
  }

  return alerts.slice(0, 6);
}

export default function DashboardPage() {
  const [forecastData, setForecastData] =
    React.useState<ForecastResponse | null>(null);
  const [events, setEvents] = React.useState<DashboardEvent[]>([]);
  const [promotions, setPromotions] = React.useState<DashboardPromotion[]>([]);
  const [alerts, setAlerts] = React.useState<DashboardAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const [forecastResponse, upcomingItems, activePromos] =
          await Promise.all([
            getForecastData(),
            getUpcomingEventsAndHolidays(),
            getActivePromotions(),
          ]);

        if (!isMounted) {
          return;
        }

        setForecastData(forecastResponse);
        setEvents(upcomingItems);
        setPromotions(activePromos);
        setAlerts(
          buildAlerts(forecastResponse.forecasts, forecastResponse.staffing),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartData = React.useMemo(
    () => (forecastData ? buildChartData(forecastData.forecasts) : []),
    [forecastData],
  );

  const forecastPeriodLabel = React.useMemo(() => {
    if (!forecastData || forecastData.forecasts.length === 0) {
      return "No forecast period";
    }

    const first = forecastData.forecasts[0].date;
    const last = forecastData.forecasts[forecastData.forecasts.length - 1].date;

    return `${first} to ${last}`;
  }, [forecastData]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Dashboard" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {hasError ? (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">
                Failed to load dashboard data. Please refresh the page.
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Occupancy
                </CardTitle>
                <TrendingUp className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {forecastData
                    ? `${forecastData.summary.avg_occupancy.toFixed(1)}%`
                    : "--"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days forecast
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Demand Days
                </CardTitle>
                <AlertTriangle className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {forecastData
                    ? `${forecastData.summary.high_demand_days} days`
                    : "--"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Occupancy pressure points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Peak Occupancy
                </CardTitle>
                <CalendarDays className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {forecastData
                    ? `${forecastData.summary.peak_occupancy.toFixed(1)}%`
                    : "--"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {forecastData
                    ? `on ${forecastData.summary.peak_date}`
                    : "No data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Forecast Period
                </CardTitle>
                <Clock3 className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {forecastPeriodLabel}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  30-day horizon
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>
                  Predicted occupancy with confidence band
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
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
                        formatter={(value: number, key: string) => {
                          if (key === "occupancy")
                            return [`${value}%`, "Predicted"];
                          if (key === "range")
                            return [`${value}%`, "Confidence width"];
                          return [`${value}%`, key];
                        }}
                      />
                      <Area
                        dataKey="lowerBound"
                        stackId="confidence"
                        stroke="transparent"
                        fill="transparent"
                      />
                      <Area
                        dataKey="range"
                        stackId="confidence"
                        stroke="transparent"
                        fill="hsl(142 76% 36% / 0.18)"
                        name="Confidence band"
                      />
                      <Line
                        dataKey="occupancy"
                        stroke="hsl(142 76% 36%)"
                        strokeWidth={2}
                        dot={false}
                        name="Predicted occupancy"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Alerts</CardTitle>
                <CardDescription>
                  Occupancy and staffing alerts for next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] flex-col gap-3 overflow-auto pr-2">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading alerts...
                    </p>
                  ) : alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No critical alerts detected.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-lg border border-border bg-muted/40 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <AlertTriangle
                            className={
                              alert.level === "high"
                                ? "size-4 text-destructive"
                                : "size-4 text-amber-600"
                            }
                          />
                          <Badge
                            variant="outline"
                            className={
                              alert.level === "high"
                                ? "border-destructive/40 text-destructive"
                                : "border-amber-600/40 text-amber-600"
                            }
                          >
                            {alert.level === "high" ? "High" : "Medium"}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events & Holidays</CardTitle>
                <CardDescription>
                  Next scheduled items for planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading events...
                    </p>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming events found.
                    </p>
                  ) : (
                    events.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-medium">{item.title}</p>
                          <Badge variant="secondary">{item.kind}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.date}
                        </p>
                        {item.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="size-4 text-primary" />
                  Active Promotions
                </CardTitle>
                <CardDescription>
                  Current offers visible to guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading promotions...
                    </p>
                  ) : promotions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No active promotions.
                    </p>
                  ) : (
                    promotions.map((promotion) => (
                      <div
                        key={promotion.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-medium">{promotion.title}</p>
                          <Badge className="bg-primary text-primary-foreground">
                            {promotion.discountPercent}% off
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {promotion.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {promotion.startDate} to {promotion.endDate}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
