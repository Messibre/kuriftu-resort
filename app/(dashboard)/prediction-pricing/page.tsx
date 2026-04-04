"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getPredictionPricingDataset,
  savePricingApproval,
  type PredictionPricingRow,
} from "@/lib/prediction-pricing-api";
import { exportReport } from "@/lib/export-api";
import {
  ArrowUpDown,
  CalendarRange,
  Check,
  Download,
  Loader2,
  Percent,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HorizonKey = "7" | "14" | "30";

type EditableRow = PredictionPricingRow & {
  originalApprovedPrice: number | null;
  originalReason: string;
  isSaving: boolean;
};

const TOTAL_ROOMS = 60;

function formatCurrency(value: number): string {
  return `ETB ${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatShortDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isDirty(row: EditableRow): boolean {
  return (
    row.approvedPrice !== row.originalApprovedPrice ||
    row.reason !== row.originalReason
  );
}

function toEditableRows(rows: PredictionPricingRow[]): EditableRow[] {
  return rows.map((item) => ({
    ...item,
    originalApprovedPrice: item.approvedPrice,
    originalReason: item.reason,
    isSaving: false,
  }));
}

export default function PredictionPricingPage() {
  const { toast } = useToast();
  const [horizon, setHorizon] = React.useState<HorizonKey>("30");
  const [basePrice, setBasePrice] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [summary, setSummary] = React.useState({
    avgOccupancy: 0,
    avgSuggestedPrice: 0,
    overrideRate: 0,
    highDemandDays: 0,
    lowDemandDays: 0,
  });
  const [range, setRange] = React.useState({ startDate: "", endDate: "" });
  const [rows, setRows] = React.useState<EditableRow[]>([]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const horizonDays = Number(horizon);
      const data = await getPredictionPricingDataset(horizonDays, TOTAL_ROOMS);

      setBasePrice(data.basePrice);
      setSummary(data.summary);
      setRange({
        startDate: data.startDate,
        endDate: data.endDate,
      });
      setRows(toEditableRows(data.rows));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [horizon]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const dirtyCount = React.useMemo(
    () => rows.filter((item) => isDirty(item)).length,
    [rows],
  );

  const chartData = React.useMemo(
    () =>
      rows.map((item) => ({
        date: formatShortDate(item.date),
        occupancy: Number(item.occupancyPercent.toFixed(1)),
        suggested: Number(item.suggestedPrice.toFixed(2)),
        approved:
          item.approvedPrice != null
            ? Number(item.approvedPrice.toFixed(2))
            : null,
      })),
    [rows],
  );

  const lowDemandCandidates = React.useMemo(
    () => rows.filter((item) => item.demandClass === "low"),
    [rows],
  );

  const handleApprovedChange = (date: string, value: string) => {
    const numeric = value.trim() === "" ? null : Number(value);

    setRows((prev) =>
      prev.map((row) =>
        row.date === date
          ? {
              ...row,
              approvedPrice:
                numeric != null && Number.isFinite(numeric) ? numeric : null,
            }
          : row,
      ),
    );
  };

  const handleReasonChange = (date: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.date === date ? { ...row, reason: value } : row)),
    );
  };

  const applySuggestedToEmpty = () => {
    setRows((prev) =>
      prev.map((row) =>
        row.approvedPrice == null
          ? { ...row, approvedPrice: row.suggestedPrice }
          : row,
      ),
    );
  };

  const resetUnsaved = () => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        approvedPrice: row.originalApprovedPrice,
        reason: row.originalReason,
      })),
    );
  };

  const saveOne = async (target: EditableRow) => {
    if (
      target.approvedPrice == null ||
      !Number.isFinite(target.approvedPrice)
    ) {
      toast({
        title: "Approved price required",
        description: `Set approved price for ${target.date} before saving.`,
        variant: "destructive",
      });
      return;
    }

    setRows((prev) =>
      prev.map((row) =>
        row.date === target.date ? { ...row, isSaving: true } : row,
      ),
    );

    try {
      await savePricingApproval({
        date: target.date,
        approvedPrice: target.approvedPrice,
        suggestedPrice: target.suggestedPrice,
        reason: target.reason,
      });

      setRows((prev) =>
        prev.map((row) =>
          row.date === target.date
            ? {
                ...row,
                isSaving: false,
                originalApprovedPrice: row.approvedPrice,
                originalReason: row.reason,
              }
            : row,
        ),
      );

      toast({
        title: "Override saved",
        description: `Approved price stored for ${target.date}.`,
      });
    } catch {
      setRows((prev) =>
        prev.map((row) =>
          row.date === target.date ? { ...row, isSaving: false } : row,
        ),
      );

      toast({
        title: "Failed to save override",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveAll = async () => {
    const changed = rows.filter((row) => isDirty(row));
    if (changed.length === 0) {
      return;
    }

    setIsSavingAll(true);

    try {
      for (const row of changed) {
        if (row.approvedPrice == null || !Number.isFinite(row.approvedPrice)) {
          continue;
        }

        await savePricingApproval({
          date: row.date,
          approvedPrice: row.approvedPrice,
          suggestedPrice: row.suggestedPrice,
          reason: row.reason,
        });
      }

      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          originalApprovedPrice: row.approvedPrice,
          originalReason: row.reason,
        })),
      );

      toast({
        title: "All overrides saved",
        description: `${changed.length} rows were updated.`,
      });
    } catch {
      toast({
        title: "Save interrupted",
        description: "Some rows may not have been saved. Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const exportCsv = async () => {
    if (!range.startDate || !range.endDate) {
      return;
    }

    await exportReport("forecast", range.startDate, range.endDate, "csv");
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Prediction & Pricing Control"
        breadcrumbs={[{ label: "Prediction & Pricing" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {hasError ? (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">
                Failed to load prediction and pricing controls. Please refresh.
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={horizon}
                onValueChange={(value) => setHorizon(value as HorizonKey)}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Forecast horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Next 7 days</SelectItem>
                  <SelectItem value="14">Next 14 days</SelectItem>
                  <SelectItem value="30">Next 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="gap-1">
                <CalendarRange className="size-3" />
                {range.startDate && range.endDate
                  ? `${range.startDate} to ${range.endDate}`
                  : "No range"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="size-3" />
                Baseline ADR: {formatCurrency(basePrice)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applySuggestedToEmpty}
              >
                <ArrowUpDown className="mr-2 size-4" />
                Fill Empty with Suggested
              </Button>
              <Button variant="outline" size="sm" onClick={resetUnsaved}>
                Reset Unsaved ({dirtyCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void exportCsv()}
              >
                <Download className="mr-2 size-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => void saveAll()}
                disabled={isSavingAll || dirtyCount === 0}
              >
                {isSavingAll ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                Save All ({dirtyCount})
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Avg Occupancy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.avgOccupancy.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Avg Suggested Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.avgSuggestedPrice)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Override Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.overrideRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  High Demand Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {summary.highDemandDays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Low Demand Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.lowDemandDays}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy vs Price Plan</CardTitle>
                <CardDescription>
                  Compare forecast occupancy with suggested and approved prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        yAxisId="occ"
                        orientation="left"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        yAxisId="price"
                        orientation="right"
                        tickFormatter={(value) => `ETB ${value}`}
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="occ"
                        type="monotone"
                        dataKey="occupancy"
                        stroke="hsl(142 76% 36%)"
                        strokeWidth={2}
                        name="Occupancy %"
                      />
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="suggested"
                        stroke="hsl(160 84% 39%)"
                        strokeWidth={2}
                        name="Suggested Price"
                      />
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="approved"
                        stroke="hsl(24 95% 53%)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        name="Approved Price"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Suggestions</CardTitle>
                <CardDescription>
                  Cross-module actions from prediction + pricing signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="font-medium">Promotion candidates</p>
                  <p className="text-muted-foreground">
                    {lowDemandCandidates.length} low-demand days can be linked
                    to campaign offers.
                  </p>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/promotions">Open Promotions</Link>
                  </Button>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium">Staff readiness</p>
                  <p className="text-muted-foreground">
                    Use demand peaks to align staffing before high occupancy
                    days.
                  </p>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/staff">Open Staff Recommendations</Link>
                  </Button>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="font-medium">Revenue tracking</p>
                  <p className="text-muted-foreground">
                    Validate approved prices against ADR and RevPAR trends.
                  </p>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/revenue">Open Revenue</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Interactive Override Table</CardTitle>
              <CardDescription>
                Review daily prediction, suggested price, and admin-approved
                price
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Predicted Rooms</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Demand</TableHead>
                    <TableHead>Suggested Price</TableHead>
                    <TableHead>Approved Price</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 9 }).map((__, cell) => (
                            <TableCell key={cell}>
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : null}

                  {!isLoading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground"
                      >
                        No forecast rows found for this horizon.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {rows.map((row) => {
                    const changed = isDirty(row);

                    return (
                      <TableRow
                        key={row.date}
                        className={changed ? "bg-amber-50/30" : ""}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {formatShortDate(row.date)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.date}
                          </div>
                        </TableCell>
                        <TableCell>{row.predictedRooms}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Percent className="size-3 text-muted-foreground" />
                            {row.occupancyPercent.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.demandClass === "high"
                                ? "destructive"
                                : row.demandClass === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {row.demandClass}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatCurrency(row.suggestedPrice)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={row.approvedPrice ?? ""}
                            onChange={(event) =>
                              handleApprovedChange(row.date, event.target.value)
                            }
                            className="w-[150px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.reason}
                            onChange={(event) =>
                              handleReasonChange(row.date, event.target.value)
                            }
                            placeholder="Why override?"
                            className="w-[220px]"
                          />
                        </TableCell>
                        <TableCell>
                          {changed ? (
                            <Badge variant="secondary">Unsaved</Badge>
                          ) : (
                            <Badge variant="outline">Saved</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!changed || row.isSaving}
                            onClick={() => void saveOne(row)}
                          >
                            {row.isSaving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4" />
                  Pricing uplift potential
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.avgSuggestedPrice - basePrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg suggested uplift versus baseline ADR
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  High-demand readiness
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {summary.highDemandDays} days
                </p>
                <p className="text-xs text-muted-foreground">
                  Align staffing and room prep for projected peaks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4" />
                  Overrides pending
                </div>
                <p className="mt-2 text-2xl font-bold">{dirtyCount}</p>
                <p className="text-xs text-muted-foreground">
                  Unsaved admin decisions in this planning window
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
