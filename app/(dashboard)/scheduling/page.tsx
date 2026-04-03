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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Mail,
  Save,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  generateSchedule,
  getAdminStaffList,
  getApprovedOverrides,
  getExistingSchedule,
  getShiftLabel,
  getShiftOptions,
  getWeekBounds,
  publishWeeklySchedule,
  saveLocalScheduleSnapshot,
  saveShiftChange,
  type ScheduleEntry,
  type ShiftKey,
  type StaffDepartment,
  type StaffMember,
} from "@/lib/scheduling-api";

const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  housekeeping: "Housekeeping",
  front_desk: "Front Desk",
  f_b: "F&B",
  maintenance: "Maintenance",
};

const DEPARTMENT_TINT: Record<StaffDepartment, string> = {
  housekeeping: "bg-sky-50/70",
  front_desk: "bg-emerald-50/70",
  f_b: "bg-amber-50/70",
  maintenance: "bg-violet-50/70",
};

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CellState {
  entry: ScheduleEntry;
  originalShift: ShiftKey;
  currentShift: ShiftKey;
  isDirty: boolean;
}

interface StaffRow {
  staff: StaffMember;
  cells: Record<string, CellState>;
}

function getDefaultWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const date = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function formatLocalDate(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function addDays(dateValue: string, days: number): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function normalizeStaffDepartment(rawDepartment: string): StaffDepartment {
  const value = rawDepartment.toLowerCase().replace(/\s+/g, "_");
  if (value.includes("house")) {
    return "housekeeping";
  }
  if (value.includes("front")) {
    return "front_desk";
  }
  if (
    value === "f_b" ||
    value.includes("restaurant") ||
    value.includes("food")
  ) {
    return "f_b";
  }
  if (value.includes("maint")) {
    return "maintenance";
  }
  return "housekeeping";
}

function createOffEntry(
  weekStart: string,
  staff: StaffMember,
  date: string,
): ScheduleEntry {
  return {
    id: `local-${weekStart}-${staff.id}-${date}`,
    staff_id: staff.id,
    staff_name: staff.name,
    email: staff.email,
    department: normalizeStaffDepartment(staff.department),
    date,
    shift_key: "off",
    shift_start: null,
    shift_end: null,
  };
}

function toRows(
  weekStart: string,
  weekDates: string[],
  staff: StaffMember[],
  schedule: ScheduleEntry[],
): { rows: StaffRow[]; flattened: ScheduleEntry[] } {
  const byCell = new Map(
    schedule.map((entry) => [`${entry.staff_id}:${entry.date}`, entry]),
  );
  const flattened: ScheduleEntry[] = [...schedule];

  const rows = staff.map((member) => {
    const cells: Record<string, CellState> = {};

    for (const date of weekDates) {
      let entry = byCell.get(`${member.id}:${date}`);
      if (!entry) {
        entry = createOffEntry(weekStart, member, date);
        byCell.set(`${member.id}:${date}`, entry);
        flattened.push(entry);
      }

      cells[date] = {
        entry,
        originalShift: entry.shift_key,
        currentShift: entry.shift_key,
        isDirty: false,
      };
    }

    return { staff: member, cells };
  });

  return { rows, flattened };
}

function flattenRows(rows: StaffRow[], weekDates: string[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (const row of rows) {
    for (const date of weekDates) {
      const cell = row.cells[date];
      const shiftOption = getShiftOptions().find(
        (option) => option.key === cell.currentShift,
      );
      entries.push({
        ...cell.entry,
        shift_key: cell.currentShift,
        shift_start: shiftOption?.shift_start ?? null,
        shift_end: shiftOption?.shift_end ?? null,
      });
    }
  }
  return entries;
}

function exportScheduleCsv(rows: StaffRow[], weekDates: string[]) {
  const header = ["Staff", "Department", ...weekDates];
  const body = rows.map((row) => [
    row.staff.name,
    row.staff.department,
    ...weekDates.map((date) =>
      getShiftLabel({ shift_key: row.cells[date].currentShift }),
    ),
  ]);

  const csv = [header, ...body]
    .map((line) =>
      line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "final-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportSchedulePdf(
  rows: StaffRow[],
  weekDates: string[],
  weekLabel: string,
) {
  const tableRows = rows
    .map((row) => {
      const cells = weekDates
        .map(
          (date) =>
            `<td>${getShiftLabel({ shift_key: row.cells[date].currentShift })}</td>`,
        )
        .join("");
      return `<tr><td>${row.staff.name}</td><td>${row.staff.department}</td>${cells}</tr>`;
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

  popup.document.write(`<!doctype html><html><head><title>Final Schedule</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1 { margin: 0 0 4px 0; }
      p { margin: 0 0 16px 0; color: #666; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
    </style></head><body>
    <h1>Final Staff Schedule</h1><p>${weekLabel}</p>
    <table><thead><tr><th>Staff</th><th>Department</th>${weekDates
      .map((date) => `<th>${formatLocalDate(date)}</th>`)
      .join("")}</tr></thead><tbody>${tableRows}</tbody></table>
    </body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

export default function SchedulingPage() {
  const [weekStart, setWeekStart] = React.useState(getDefaultWeekStart());
  const [weekDates, setWeekDates] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<StaffRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [publishResult, setPublishResult] = React.useState<{
    success: boolean;
    emailed: string[];
  } | null>(null);
  const [editingCell, setEditingCell] = React.useState<{
    staffId: string;
    date: string;
  } | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = React.useState(false);

  const selectedCell = React.useMemo(() => {
    if (!editingCell) {
      return null;
    }
    const row = rows.find((item) => item.staff.id === editingCell.staffId);
    if (!row) {
      return null;
    }
    return { row, cell: row.cells[editingCell.date], date: editingCell.date };
  }, [editingCell, rows]);

  const loadWeek = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const bounds = getWeekBounds(weekStart);
      const [staff, overrides, existing] = await Promise.all([
        getAdminStaffList(),
        getApprovedOverrides(bounds.startDate, bounds.endDate),
        getExistingSchedule(weekStart),
      ]);

      const baseSchedule =
        existing.length > 0
          ? existing
          : await generateSchedule(weekStart, staff, overrides);

      const { rows: builtRows, flattened } = toRows(
        weekStart,
        bounds.dates,
        staff,
        baseSchedule,
      );
      saveLocalScheduleSnapshot(weekStart, flattened);

      setRows(builtRows);
      setWeekDates(bounds.dates);
      setPublishResult(null);
    } catch {
      toast({
        title: "Unable to load schedule",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
      setRows([]);
      setWeekDates(getWeekBounds(weekStart).dates);
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  React.useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const unsavedCount = React.useMemo(() => {
    return rows.reduce((sum, row) => {
      return (
        sum +
        weekDates.filter((date) => row.cells[date] && row.cells[date].isDirty)
          .length
      );
    }, 0);
  }, [rows, weekDates]);

  const totalAssignedShifts = React.useMemo(() => {
    return rows.reduce((sum, row) => {
      return (
        sum +
        weekDates.filter((date) => row.cells[date]?.currentShift !== "off")
          .length
      );
    }, 0);
  }, [rows, weekDates]);

  const todayDutyCount = React.useMemo(() => {
    if (weekDates.length === 0) {
      return 0;
    }
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (!weekDates.includes(dateString)) {
      return 0;
    }

    return rows.reduce((sum, row) => {
      return sum + (row.cells[dateString].currentShift === "off" ? 0 : 1);
    }, 0);
  }, [rows, weekDates]);

  const weekLabel = React.useMemo(() => {
    if (weekDates.length < 2) {
      return "Week not loaded";
    }
    return `${formatLocalDate(weekDates[0])} - ${formatLocalDate(weekDates[6])}`;
  }, [weekDates]);

  const applyShiftToCell = (
    staffId: string,
    date: string,
    shiftKey: ShiftKey,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.staff.id !== staffId) {
          return row;
        }

        const target = row.cells[date];
        if (!target) {
          return row;
        }

        return {
          ...row,
          cells: {
            ...row.cells,
            [date]: {
              ...target,
              currentShift: shiftKey,
              isDirty: shiftKey !== target.originalShift,
            },
          },
        };
      }),
    );
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    staffId: string,
    date: string,
  ) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ staffId, date }),
    );
  };

  const handleDrop = (
    event: React.DragEvent<HTMLTableCellElement>,
    targetStaffId: string,
    targetDate: string,
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("application/json");
    if (!payload) {
      return;
    }

    try {
      const { staffId, date } = JSON.parse(payload) as {
        staffId: string;
        date: string;
      };
      const sourceRow = rows.find((row) => row.staff.id === staffId);
      const targetRow = rows.find((row) => row.staff.id === targetStaffId);
      if (!sourceRow || !targetRow) {
        return;
      }

      const sourceShift = sourceRow.cells[date]?.currentShift;
      const targetShift = targetRow.cells[targetDate]?.currentShift;
      if (!sourceShift || !targetShift) {
        return;
      }

      applyShiftToCell(staffId, date, targetShift);
      applyShiftToCell(targetStaffId, targetDate, sourceShift);
    } catch {
      // ignore malformed drag payload
    }
  };

  const saveAllChanges = async () => {
    const dirtyCells: Array<{ entryId: string; shift: ShiftKey }> = [];

    for (const row of rows) {
      for (const date of weekDates) {
        const cell = row.cells[date];
        if (cell.isDirty) {
          dirtyCells.push({ entryId: cell.entry.id, shift: cell.currentShift });
        }
      }
    }

    if (dirtyCells.length === 0) {
      toast({
        title: "No unsaved changes",
        description: "All schedule edits are already saved.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        dirtyCells.map((item) =>
          saveShiftChange(weekStart, item.entryId, item.shift),
        ),
      );

      setRows((current) =>
        current.map((row) => {
          const nextCells: StaffRow["cells"] = { ...row.cells };
          for (const date of weekDates) {
            const cell = nextCells[date];
            nextCells[date] = {
              ...cell,
              originalShift: cell.currentShift,
              isDirty: false,
            };
          }
          return { ...row, cells: nextCells };
        }),
      );

      saveLocalScheduleSnapshot(weekStart, flattenRows(rows, weekDates));
      toast({
        title: "Schedule saved",
        description: `${dirtyCells.length} shift change(s) saved.`,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save all shift updates.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      const bounds = getWeekBounds(weekStart);
      const [staff, overrides] = await Promise.all([
        getAdminStaffList(),
        getApprovedOverrides(bounds.startDate, bounds.endDate),
      ]);
      const generated = await generateSchedule(weekStart, staff, overrides);
      const { rows: generatedRows, flattened } = toRows(
        weekStart,
        bounds.dates,
        staff,
        generated,
      );
      saveLocalScheduleSnapshot(weekStart, flattened);
      setRows(generatedRows);
      setWeekDates(bounds.dates);
      toast({
        title: "Schedule regenerated",
        description: "Assignments were regenerated from approved counts.",
      });
    } catch {
      toast({
        title: "Generation failed",
        description: "Could not regenerate schedule.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishWeeklySchedule(weekStart);
      setPublishResult({ success: result.success, emailed: result.emailed });
      setIsPublishDialogOpen(false);

      if (result.usedFallback) {
        toast({
          title: "Schedule published",
          description:
            "Email feature coming soon. Local publish mode was used.",
        });
      } else {
        toast({
          title: "Schedule published",
          description: `Emails sent to ${result.emailed.length} staff member(s).`,
        });
      }
    } catch {
      toast({
        title: "Publish failed",
        description: "Unable to publish this schedule right now.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveSelectedCellChange = async () => {
    if (!selectedCell) {
      return;
    }

    const entryId = selectedCell.cell.entry.id;
    const shift = selectedCell.cell.currentShift;

    try {
      await saveShiftChange(weekStart, entryId, shift);

      setRows((current) => {
        const nextRows = current.map((row) => {
          if (row.staff.id !== selectedCell.row.staff.id) {
            return row;
          }

          const target = row.cells[selectedCell.date];
          return {
            ...row,
            cells: {
              ...row.cells,
              [selectedCell.date]: {
                ...target,
                originalShift: target.currentShift,
                isDirty: false,
              },
            },
          };
        });

        saveLocalScheduleSnapshot(weekStart, flattenRows(nextRows, weekDates));
        return nextRows;
      });

      setEditingCell(null);
      toast({
        title: "Shift saved",
        description: "The selected shift has been saved.",
      });
    } catch {
      toast({
        title: "Could not save shift",
        description: "Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Final Scheduling"
        breadcrumbs={[{ label: "Scheduling" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Week Range
                </CardTitle>
                <CalendarDays className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weekLabel}</div>
                <p className="text-xs text-muted-foreground">
                  Selected scheduling week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned Shifts
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssignedShifts}</div>
                <p className="text-xs text-muted-foreground">
                  Total non-off assignments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  On Duty Today
                </CardTitle>
                <CheckCircle2 className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {todayDutyCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Staff scheduled for today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unsaved Changes
                </CardTitle>
                <TriangleAlert className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {unsavedCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save before publishing
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart((value) => addDays(value, -7))}
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart((value) => addDays(value, 7))}
              >
                Next Week
                <ChevronRight className="ml-1 size-4" />
              </Button>
              <Badge variant="secondary">{weekLabel}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportScheduleCsv(rows, weekDates)}
              >
                <Download className="mr-2 size-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSchedulePdf(rows, weekDates, weekLabel)}
              >
                <Download className="mr-2 size-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => void regenerateSchedule()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Regenerate
              </Button>
              <Button
                onClick={() => void saveAllChanges()}
                disabled={isSaving || unsavedCount === 0}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save Changes
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsPublishDialogOpen(true)}
                disabled={unsavedCount > 0}
              >
                <Send className="mr-2 size-4" />
                Publish
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule Grid</CardTitle>
              <CardDescription>
                Drag and drop cells to swap shifts, or click a cell to edit
                shift options.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[260px]">Staff</TableHead>
                    {weekDates.map((date, index) => (
                      <TableHead key={date} className="text-center">
                        <div>{WEEKDAY_SHORT[index]}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatLocalDate(date)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const department = normalizeStaffDepartment(
                      row.staff.department,
                    );
                    const tint = DEPARTMENT_TINT[department] ?? "bg-muted/20";

                    return (
                      <TableRow key={row.staff.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {row.staff.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`w-fit ${tint}`}
                            >
                              {DEPARTMENT_LABELS[department] ??
                                row.staff.department}
                            </Badge>
                          </div>
                        </TableCell>
                        {weekDates.map((date) => {
                          const cell = row.cells[date];
                          return (
                            <TableCell
                              key={date}
                              className="p-2"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) =>
                                handleDrop(event, row.staff.id, date)
                              }
                            >
                              <button
                                type="button"
                                draggable
                                onDragStart={(event) =>
                                  handleDragStart(event, row.staff.id, date)
                                }
                                onClick={() =>
                                  setEditingCell({
                                    staffId: row.staff.id,
                                    date,
                                  })
                                }
                                className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                                  cell.isDirty
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-border hover:bg-muted/40"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {getShiftLabel({
                                      shift_key: cell.currentShift,
                                    })}
                                  </span>
                                  {cell.isDirty ? (
                                    <span className="size-2 rounded-full bg-amber-500" />
                                  ) : null}
                                </div>
                              </button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No staff data available for this week.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>

              {isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading weekly schedule...
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
              <CardDescription>
                Department colors and shift types
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-50 text-sky-800">Housekeeping</Badge>
              <Badge className="bg-emerald-50 text-emerald-800">
                Front Desk
              </Badge>
              <Badge className="bg-amber-50 text-amber-800">F&amp;B</Badge>
              <Badge className="bg-violet-50 text-violet-800">
                Maintenance
              </Badge>
              <Badge variant="outline">08:00-16:00 Morning</Badge>
              <Badge variant="outline">14:00-22:00 Evening</Badge>
              <Badge variant="outline">22:00-06:00 Night</Badge>
              <Badge variant="outline">Off</Badge>
              <Badge className="bg-amber-100 text-amber-800">
                Unsaved cell
              </Badge>
            </CardContent>
          </Card>

          {publishResult?.success ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="size-4" />
                  Publish Result
                </CardTitle>
                <CardDescription>
                  Schedule published successfully. Emails sent to{" "}
                  {publishResult.emailed.length} staff member(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {publishResult.emailed.slice(0, 20).map((email) => (
                    <Badge key={email} variant="outline">
                      {email}
                    </Badge>
                  ))}
                  {publishResult.emailed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Email feature coming soon.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>

      <Dialog open={!!selectedCell} onOpenChange={() => setEditingCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              {selectedCell
                ? `${selectedCell.row.staff.name} on ${formatLocalDate(selectedCell.date)}`
                : "Select a shift"}
            </DialogDescription>
          </DialogHeader>
          {selectedCell ? (
            <Select
              value={selectedCell.cell.currentShift}
              onValueChange={(value) =>
                applyShiftToCell(
                  selectedCell.row.staff.id,
                  selectedCell.date,
                  value as ShiftKey,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {getShiftOptions().map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCell(null)}>
              Close
            </Button>
            <Button
              onClick={() => void saveSelectedCellChange()}
              disabled={!selectedCell?.cell.isDirty}
            >
              Save Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Weekly Schedule</DialogTitle>
            <DialogDescription>
              Publish this week and email staff members with their shifts.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
            Week: {weekLabel}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handlePublish()}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Confirm Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
