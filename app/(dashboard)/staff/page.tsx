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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Download,
  FileText,
  Info,
  RotateCcw,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import {
  getForecastStaffing,
  getStaffAvailability,
  getStaffOverrides,
  saveStaffOverrides,
  type DailyStaffRecommendation,
  type StaffDepartment,
  type StaffOverridePayload,
} from "@/lib/staff-recommendation-api";

const TOTAL_ROOMS = 60;

const DEPARTMENT_RATES: Record<StaffDepartment, number> = {
  housekeeping: 150,
  front_desk: 200,
  f_b: 120,
  maintenance: 180,
};

const DEPARTMENT_ORDER: StaffDepartment[] = [
  "housekeeping",
  "front_desk",
  "f_b",
  "maintenance",
];

type DepartmentCounts = Record<StaffDepartment, number>;

interface StaffPlanRow {
  date: string;
  recommended: DepartmentCounts;
  approved: DepartmentCounts;
  persistedApproved: DepartmentCounts;
  reason: string;
  persistedReason: string;
  isSaving?: boolean;
  wasSaved?: boolean;
}

type RangeKey = "7" | "14" | "30" | "custom";

function createLocalDate(dateValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateValue: string): string {
  return createLocalDate(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatCurrency(value: number): string {
  return `ETB ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number): Date {
  const next = new Date(baseDate);
  next.setDate(baseDate.getDate() + days);
  return next;
}

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = createLocalDate(startDate);
  const end = createLocalDate(endDate);
  const milliseconds = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(milliseconds / (1000 * 60 * 60 * 24)) + 1);
}

function toCounts(item: DailyStaffRecommendation): DepartmentCounts {
  return {
    housekeeping: item.housekeeping,
    front_desk: item.front_desk,
    f_b: item.f_b,
    maintenance: item.maintenance,
  };
}

function calculateCost(counts: DepartmentCounts): number {
  return DEPARTMENT_ORDER.reduce(
    (sum, department) =>
      sum + counts[department] * DEPARTMENT_RATES[department],
    0,
  );
}

function isRowDirty(row: StaffPlanRow): boolean {
  return DEPARTMENT_ORDER.some(
    (department) =>
      row.approved[department] !== row.persistedApproved[department],
  );
}

function buildOverridePayloads(row: StaffPlanRow): StaffOverridePayload[] {
  return DEPARTMENT_ORDER.filter(
    (department) => row.approved[department] !== row.recommended[department],
  ).map((department) => ({
    date: row.date,
    department,
    recommended_count: row.recommended[department],
    approved_count: row.approved[department],
    reason: row.reason.trim() || "Manual override",
  }));
}

function exportRowsToCsv(rows: StaffPlanRow[]) {
  const header = [
    "Date",
    "Housekeeping Rec",
    "Housekeeping Approved",
    "Front Desk Rec",
    "Front Desk Approved",
    "F&B Rec",
    "F&B Approved",
    "Maintenance Rec",
    "Maintenance Approved",
    "Recommended Cost",
    "Approved Cost",
    "Difference",
    "Reason",
  ];

  const csvRows = rows.map((row) => {
    const recommendedCost = calculateCost(row.recommended);
    const approvedCost = calculateCost(row.approved);
    return [
      row.date,
      String(row.recommended.housekeeping),
      String(row.approved.housekeeping),
      String(row.recommended.front_desk),
      String(row.approved.front_desk),
      String(row.recommended.f_b),
      String(row.approved.f_b),
      String(row.recommended.maintenance),
      String(row.approved.maintenance),
      String(recommendedCost),
      String(approvedCost),
      String(approvedCost - recommendedCost),
      row.reason,
    ];
  });

  const csvContent = [header, ...csvRows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "staff-recommendations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportRowsToPdf(rows: StaffPlanRow[], periodLabel: string) {
  const printableRows = rows
    .map((row) => {
      const recommendedCost = calculateCost(row.recommended);
      const approvedCost = calculateCost(row.approved);
      const difference = approvedCost - recommendedCost;
      return `<tr>
        <td>${row.date}</td>
        <td>${row.recommended.housekeeping}</td><td>${row.approved.housekeeping}</td>
        <td>${row.recommended.front_desk}</td><td>${row.approved.front_desk}</td>
        <td>${row.recommended.f_b}</td><td>${row.approved.f_b}</td>
        <td>${row.recommended.maintenance}</td><td>${row.approved.maintenance}</td>
        <td>${formatCurrency(recommendedCost)}</td>
        <td>${formatCurrency(approvedCost)}</td>
        <td>${difference >= 0 ? "+" : ""}${formatCurrency(difference)}</td>
      </tr>`;
    })
    .join("");

  const popup = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=1200,height=800",
  );
  if (!popup) {
    return;
  }

  popup.document.write(`<!doctype html>
<html>
<head>
  <title>Staff Recommendations</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { margin: 0 0 4px 0; font-size: 22px; }
    p { margin: 0 0 16px 0; color: #555; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Staff Recommendations</h1>
  <p>${periodLabel}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>HK Rec</th><th>HK Appr</th>
        <th>FD Rec</th><th>FD Appr</th>
        <th>F&B Rec</th><th>F&B Appr</th>
        <th>Maint Rec</th><th>Maint Appr</th>
        <th>Rec Cost</th><th>Appr Cost</th><th>Diff</th>
      </tr>
    </thead>
    <tbody>${printableRows}</tbody>
  </table>
</body>
</html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

export default function StaffPage() {
  const today = React.useMemo(() => formatIsoDate(new Date()), []);
  const [rangeKey, setRangeKey] = React.useState<RangeKey>("14");
  const [customStartDate, setCustomStartDate] = React.useState(today);
  const [customEndDate, setCustomEndDate] = React.useState(
    formatIsoDate(addDays(new Date(), 13)),
  );
  const [adjustDepartment, setAdjustDepartment] =
    React.useState<StaffDepartment>("housekeeping");
  const [adjustDelta, setAdjustDelta] = React.useState(1);
  const [rows, setRows] = React.useState<StaffPlanRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [staffCount, setStaffCount] = React.useState(0);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const horizonDays =
        rangeKey === "custom"
          ? Math.max(daysBetweenInclusive(today, customEndDate), 1)
          : Number(rangeKey);

      const recommendationsRaw = await getForecastStaffing(
        horizonDays,
        TOTAL_ROOMS,
      );
      const recommendations =
        rangeKey === "custom"
          ? recommendationsRaw.filter(
              (item) =>
                item.date >= customStartDate && item.date <= customEndDate,
            )
          : recommendationsRaw;

      if (recommendations.length === 0) {
        setRows([]);
        return;
      }

      const startDate = recommendations[0].date;
      const endDate = recommendations[recommendations.length - 1].date;

      const [overrides, availableStaff] = await Promise.all([
        getStaffOverrides(startDate, endDate),
        getStaffAvailability(),
      ]);

      const overrideMap = new Map(
        overrides.map((item) => [`${item.date}:${item.department}`, item]),
      );

      const nextRows = recommendations.map((item) => {
        const recommended = toCounts(item);
        const approved: DepartmentCounts = {
          housekeeping:
            overrideMap.get(`${item.date}:housekeeping`)?.approved_count ??
            recommended.housekeeping,
          front_desk:
            overrideMap.get(`${item.date}:front_desk`)?.approved_count ??
            recommended.front_desk,
          f_b:
            overrideMap.get(`${item.date}:f_b`)?.approved_count ??
            recommended.f_b,
          maintenance:
            overrideMap.get(`${item.date}:maintenance`)?.approved_count ??
            recommended.maintenance,
        };

        const reason =
          overrideMap.get(`${item.date}:housekeeping`)?.reason ||
          overrideMap.get(`${item.date}:front_desk`)?.reason ||
          overrideMap.get(`${item.date}:f_b`)?.reason ||
          overrideMap.get(`${item.date}:maintenance`)?.reason ||
          "";

        return {
          date: item.date,
          recommended,
          approved,
          persistedApproved: { ...approved },
          reason,
          persistedReason: reason,
          wasSaved: false,
        };
      });

      setRows(nextRows);
      setStaffCount(Array.isArray(availableStaff) ? availableStaff.length : 0);
    } catch {
      toast({
        title: "Unable to load staff recommendations",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [rangeKey, customEndDate, customStartDate, today]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAllChanges();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rows]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateApproved = (
    rowDate: string,
    department: StaffDepartment,
    value: number,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.date === rowDate
          ? {
              ...row,
              approved: {
                ...row.approved,
                [department]: Math.max(0, value),
              },
              wasSaved: false,
            }
          : row,
      ),
    );
  };

  const updateReason = (rowDate: string, reason: string) => {
    setRows((current) =>
      current.map((row) =>
        row.date === rowDate ? { ...row, reason, wasSaved: false } : row,
      ),
    );
  };

  const saveSingleRow = async (rowDate: string) => {
    const target = rows.find((row) => row.date === rowDate);
    if (!target) {
      return;
    }

    const payloads = buildOverridePayloads(target);
    if (payloads.length === 0) {
      toast({
        title: "No override needed",
        description: `No approved changes for ${formatDate(rowDate)}.`,
      });
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.date === rowDate ? { ...row, isSaving: true } : row,
      ),
    );

    try {
      await saveStaffOverrides(payloads);
      setRows((current) =>
        current.map((row) =>
          row.date === rowDate
            ? {
                ...row,
                isSaving: false,
                wasSaved: true,
                persistedApproved: { ...row.approved },
                persistedReason: row.reason,
              }
            : row,
        ),
      );
      toast({
        title: "Overrides saved",
        description: `Saved changes for ${formatDate(rowDate)}.`,
      });
    } catch {
      setRows((current) =>
        current.map((row) =>
          row.date === rowDate ? { ...row, isSaving: false } : row,
        ),
      );
      toast({
        title: "Failed to save overrides",
        description: "Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const saveAllChanges = async () => {
    const dirtyRows = rows.filter((row) => isRowDirty(row));
    if (dirtyRows.length === 0) {
      toast({
        title: "No unsaved changes",
        description: "All rows are already saved.",
      });
      return;
    }

    const payloads = dirtyRows.flatMap(buildOverridePayloads);
    if (payloads.length === 0) {
      toast({
        title: "No override needed",
        description: "Approved values match recommendations.",
      });
      return;
    }

    setIsSavingAll(true);
    try {
      await saveStaffOverrides(payloads);
      setRows((current) =>
        current.map((row) =>
          isRowDirty(row)
            ? {
                ...row,
                wasSaved: true,
                persistedApproved: { ...row.approved },
                persistedReason: row.reason,
              }
            : row,
        ),
      );
      toast({
        title: "All changes saved",
        description: `${payloads.length} override(s) saved successfully.`,
      });
    } catch {
      toast({
        title: "Save all failed",
        description: "Some overrides could not be saved.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const applyBulkAdjustment = () => {
    if (adjustDelta === 0) {
      return;
    }

    setRows((current) =>
      current.map((row) => ({
        ...row,
        approved: {
          ...row.approved,
          [adjustDepartment]: Math.max(
            0,
            row.approved[adjustDepartment] + adjustDelta,
          ),
        },
        wasSaved: false,
      })),
    );

    toast({
      title: "Bulk adjustment applied",
      description: `${adjustDepartment.replace("_", " ")} updated by ${adjustDelta >= 0 ? "+" : ""}${adjustDelta}.`,
    });
  };

  const resetUnsavedChanges = () => {
    setRows((current) =>
      current.map((row) =>
        isRowDirty(row)
          ? {
              ...row,
              approved: { ...row.persistedApproved },
              reason: row.persistedReason,
              wasSaved: false,
            }
          : row,
      ),
    );
  };

  const totals = React.useMemo(() => {
    const recommendedCost = rows.reduce(
      (sum, row) => sum + calculateCost(row.recommended),
      0,
    );
    const approvedCost = rows.reduce(
      (sum, row) => sum + calculateCost(row.approved),
      0,
    );
    return {
      recommendedCost,
      approvedCost,
      difference: approvedCost - recommendedCost,
      dirtyRows: rows.filter((row) => isRowDirty(row)).length,
    };
  }, [rows]);

  const periodLabel = React.useMemo(() => {
    if (rows.length === 0) {
      return "No period loaded";
    }
    return `${formatDate(rows[0].date)} - ${formatDate(rows[rows.length - 1].date)}`;
  }, [rows]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Staff Recommendations"
        breadcrumbs={[{ label: "Staff" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recommended Cost
                </CardTitle>
                <Sparkles className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totals.recommendedCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI recommendation total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Cost
                </CardTitle>
                <Save className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totals.approvedCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual approved plan total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cost Difference
                </CardTitle>
                <Info className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    totals.difference > 0
                      ? "text-destructive"
                      : totals.difference < 0
                        ? "text-primary"
                        : ""
                  }`}
                >
                  {totals.difference >= 0 ? "+" : ""}
                  {formatCurrency(totals.difference)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approved vs recommended
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Availability
                </CardTitle>
                <Badge className="size-4 bg-primary p-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffCount}</div>
                <p className="text-xs text-muted-foreground">
                  Staff records available
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={rangeKey}
                onValueChange={(value) => setRangeKey(value as RangeKey)}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Next 7 days</SelectItem>
                  <SelectItem value="14">Next 14 days</SelectItem>
                  <SelectItem value="30">Next 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              {rangeKey === "custom" ? (
                <>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="w-[170px]"
                  />
                  <Input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="w-[170px]"
                  />
                </>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
              >
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </Button>
              <Badge variant="secondary">{periodLabel}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportRowsToCsv(rows)}
              >
                <Download className="mr-1 size-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportRowsToPdf(rows, periodLabel)}
              >
                <FileText className="mr-1 size-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => void saveAllChanges()}
                disabled={isSavingAll || totals.dirtyRows === 0}
              >
                <Save className="mr-2 size-4" />
                {isSavingAll ? "Saving..." : `Save All (${totals.dirtyRows})`}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Tools</CardTitle>
              <CardDescription>
                Quick adjust one department across all loaded days, or reset
                unsaved edits
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Department</p>
                <Select
                  value={adjustDepartment}
                  onValueChange={(value) =>
                    setAdjustDepartment(value as StaffDepartment)
                  }
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="f_b">F&B</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Delta (staff per day)
                </p>
                <Input
                  type="number"
                  value={adjustDelta}
                  onChange={(event) =>
                    setAdjustDelta(Number(event.target.value || 0))
                  }
                  className="w-[130px]"
                />
              </div>
              <Button variant="outline" onClick={applyBulkAdjustment}>
                Apply to All Rows
              </Button>
              <Button
                variant="outline"
                onClick={resetUnsavedChanges}
                disabled={totals.dirtyRows === 0}
              >
                <RotateCcw className="mr-2 size-4" />
                Reset Unsaved ({totals.dirtyRows})
              </Button>
              <p className="text-xs text-muted-foreground">
                Shortcut: Ctrl+S to save all changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Staff Recommendation Table</CardTitle>
              <CardDescription>
                Recommended and approved staffing by day and department
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1450px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead className="bg-emerald-50/70">
                      Housekeeping (Rec)
                    </TableHead>
                    <TableHead className="bg-emerald-50/70">
                      Housekeeping (Approved)
                    </TableHead>
                    <TableHead className="bg-cyan-50/70">
                      Front Desk (Rec)
                    </TableHead>
                    <TableHead className="bg-cyan-50/70">
                      Front Desk (Approved)
                    </TableHead>
                    <TableHead className="bg-amber-50/70">F&B (Rec)</TableHead>
                    <TableHead className="bg-amber-50/70">
                      F&B (Approved)
                    </TableHead>
                    <TableHead className="bg-sky-50/70">
                      Maintenance (Rec)
                    </TableHead>
                    <TableHead className="bg-sky-50/70">
                      Maintenance (Approved)
                    </TableHead>
                    <TableHead>Recommended Cost</TableHead>
                    <TableHead>Approved Cost</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={14}
                        className="text-center text-muted-foreground"
                      >
                        No recommendations found for this period.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {rows.map((row) => {
                    const recommendedCost = calculateCost(row.recommended);
                    const approvedCost = calculateCost(row.approved);
                    const difference = approvedCost - recommendedCost;
                    const dirty = isRowDirty(row);

                    const departmentIndicator = (
                      department: StaffDepartment,
                    ) => {
                      if (
                        row.approved[department] < row.recommended[department]
                      ) {
                        return (
                          <AlertTriangle className="size-3 text-amber-600" />
                        );
                      }
                      if (
                        row.approved[department] > row.recommended[department]
                      ) {
                        return <Info className="size-3 text-sky-600" />;
                      }
                      return null;
                    };

                    return (
                      <TableRow
                        key={row.date}
                        className={dirty ? "bg-amber-50/40" : ""}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(row.date)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.date}
                          </div>
                        </TableCell>
                        <TableCell className="bg-emerald-50/40 text-center font-medium">
                          {row.recommended.housekeeping}
                        </TableCell>
                        <TableCell className="bg-emerald-50/40">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.approved.housekeeping}
                              onChange={(event) =>
                                updateApproved(
                                  row.date,
                                  "housekeeping",
                                  Number(event.target.value || 0),
                                )
                              }
                              className="h-8 w-20"
                            />
                            {departmentIndicator("housekeeping")}
                          </div>
                        </TableCell>
                        <TableCell className="bg-cyan-50/40 text-center font-medium">
                          {row.recommended.front_desk}
                        </TableCell>
                        <TableCell className="bg-cyan-50/40">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.approved.front_desk}
                              onChange={(event) =>
                                updateApproved(
                                  row.date,
                                  "front_desk",
                                  Number(event.target.value || 0),
                                )
                              }
                              className="h-8 w-20"
                            />
                            {departmentIndicator("front_desk")}
                          </div>
                        </TableCell>
                        <TableCell className="bg-amber-50/40 text-center font-medium">
                          {row.recommended.f_b}
                        </TableCell>
                        <TableCell className="bg-amber-50/40">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.approved.f_b}
                              onChange={(event) =>
                                updateApproved(
                                  row.date,
                                  "f_b",
                                  Number(event.target.value || 0),
                                )
                              }
                              className="h-8 w-20"
                            />
                            {departmentIndicator("f_b")}
                          </div>
                        </TableCell>
                        <TableCell className="bg-sky-50/40 text-center font-medium">
                          {row.recommended.maintenance}
                        </TableCell>
                        <TableCell className="bg-sky-50/40">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.approved.maintenance}
                              onChange={(event) =>
                                updateApproved(
                                  row.date,
                                  "maintenance",
                                  Number(event.target.value || 0),
                                )
                              }
                              className="h-8 w-20"
                            />
                            {departmentIndicator("maintenance")}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(recommendedCost)}</TableCell>
                        <TableCell>{formatCurrency(approvedCost)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              difference > 0
                                ? "text-destructive"
                                : difference < 0
                                  ? "text-primary"
                                  : "text-muted-foreground"
                            }
                          >
                            {difference >= 0 ? "+" : ""}
                            {formatCurrency(difference)}
                          </span>
                        </TableCell>
                        <TableCell className="w-[220px]">
                          <Textarea
                            value={row.reason}
                            onChange={(event) =>
                              updateReason(row.date, event.target.value)
                            }
                            placeholder="Reason for override"
                            className="min-h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={dirty ? "default" : "outline"}
                              disabled={!dirty || row.isSaving}
                              onClick={() => void saveSingleRow(row.date)}
                            >
                              {row.isSaving ? "Saving..." : "Save"}
                            </Button>
                            {dirty ? (
                              <Badge variant="secondary">Unsaved</Badge>
                            ) : null}
                            {!dirty && row.wasSaved ? (
                              <Badge className="bg-primary text-primary-foreground">
                                Saved
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading staffing recommendations...
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Save all applies overrides where approved count differs from
              recommended count.
            </p>
            <Button
              onClick={() => void saveAllChanges()}
              disabled={isSavingAll || totals.dirtyRows === 0}
            >
              <Save className="mr-2 size-4" />
              {isSavingAll
                ? "Saving all changes..."
                : `Save All (${totals.dirtyRows})`}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
