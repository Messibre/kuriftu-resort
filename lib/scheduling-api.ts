import {
  getForecastStaffing,
  type StaffDepartment,
} from "@/lib/staff-recommendation-api";

export type { StaffDepartment };

const API_BASE_PATH = "/api";
const SCHEDULE_STORAGE_PREFIX = "final-schedule-v1";
const TOTAL_ROOMS = 60;

const SHIFT_LIBRARY = [
  {
    key: "morning",
    label: "08:00-16:00",
    shift_start: "08:00",
    shift_end: "16:00",
  },
  {
    key: "evening",
    label: "14:00-22:00",
    shift_start: "14:00",
    shift_end: "22:00",
  },
  {
    key: "night",
    label: "22:00-06:00",
    shift_start: "22:00",
    shift_end: "06:00",
  },
  { key: "off", label: "Off", shift_start: null, shift_end: null },
] as const;

export type ShiftKey = (typeof SHIFT_LIBRARY)[number]["key"];

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  is_active: boolean;
}

export interface ScheduleEntry {
  id: string;
  staff_id: string;
  staff_name: string;
  email: string;
  department: StaffDepartment;
  date: string;
  shift_key: ShiftKey;
  shift_start: string | null;
  shift_end: string | null;
}

export interface PublishResult {
  success: boolean;
  emailed: string[];
  usedFallback: boolean;
}

interface StaffApiResponse {
  staff: unknown[];
}

interface OverrideApiItem {
  date: string;
  department: StaffDepartment;
  recommended_count: number;
  approved_count: number;
  reason: string;
}

interface OverridesApiResponse {
  overrides: OverrideApiItem[];
}

interface ScheduleApiResponse {
  schedule: ScheduleEntry[];
}

interface GenerateApiResponse {
  schedule: ScheduleEntry[];
}

interface MutationResponse {
  success: boolean;
}

interface PublishApiResponse {
  success: boolean;
  emailed?: string[];
}

function getStorageKey(weekStart: string): string {
  return `${SCHEDULE_STORAGE_PREFIX}:${weekStart}`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

function getWeekDates(weekStart: string): string[] {
  const base = createLocalDate(weekStart);
  return Array.from({ length: 7 }, (_, index) =>
    formatDate(addDays(base, index)),
  );
}

function normalizeDepartment(rawValue: string): StaffDepartment | null {
  const value = rawValue.toLowerCase().replace(/\s+/g, "_");

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

  return null;
}

function isActiveStaff(input: Record<string, unknown>): boolean {
  if (typeof input.is_active === "boolean") {
    return input.is_active;
  }
  if (typeof input.status === "string") {
    return input.status.toLowerCase() === "active";
  }
  return true;
}

function normalizeStaff(raw: unknown[]): StaffMember[] {
  return raw
    .map((item, index) => {
      const obj = (item ?? {}) as Record<string, unknown>;
      const id = String(obj.id ?? obj.staff_id ?? index + 1);
      const firstName =
        typeof obj.first_name === "string" ? obj.first_name : "";
      const lastName = typeof obj.last_name === "string" ? obj.last_name : "";
      const fallbackName = `${firstName} ${lastName}`.trim();
      const name =
        typeof obj.name === "string" && obj.name.trim().length > 0
          ? obj.name
          : fallbackName || `Staff ${id}`;
      const email =
        typeof obj.email === "string" && obj.email.trim().length > 0
          ? obj.email
          : `${name.toLowerCase().replace(/\s+/g, ".")}@resort.local`;
      const department =
        typeof obj.department === "string" && obj.department.trim().length > 0
          ? obj.department
          : "Unknown";

      return {
        id,
        name,
        email,
        department,
        is_active: isActiveStaff(obj),
      };
    })
    .filter((item) => item.is_active);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function readLocalSchedule(weekStart: string): ScheduleEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getStorageKey(weekStart));
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ScheduleEntry[];
  } catch {
    return [];
  }
}

function writeLocalSchedule(weekStart: string, entries: ScheduleEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(weekStart),
    JSON.stringify(entries),
  );
}

export function saveLocalScheduleSnapshot(
  weekStart: string,
  entries: ScheduleEntry[],
): void {
  writeLocalSchedule(weekStart, entries);
}

function shiftByDay(dayIndex: number): (typeof SHIFT_LIBRARY)[number] {
  return SHIFT_LIBRARY[dayIndex % 3];
}

function applyOverridesToRecommended(
  recommended: Awaited<ReturnType<typeof getForecastStaffing>>,
  overrides: OverrideApiItem[],
) {
  const overrideMap = new Map(
    overrides.map((item) => [`${item.date}:${item.department}`, item]),
  );

  return recommended.map((item) => ({
    date: item.date,
    counts: {
      housekeeping:
        overrideMap.get(`${item.date}:housekeeping`)?.approved_count ??
        item.housekeeping,
      front_desk:
        overrideMap.get(`${item.date}:front_desk`)?.approved_count ??
        item.front_desk,
      f_b: overrideMap.get(`${item.date}:f_b`)?.approved_count ?? item.f_b,
      maintenance:
        overrideMap.get(`${item.date}:maintenance`)?.approved_count ??
        item.maintenance,
    },
  }));
}

function generateScheduleFromInputs(
  weekStart: string,
  staff: StaffMember[],
  approvedByDate: Array<{
    date: string;
    counts: Record<StaffDepartment, number>;
  }>,
): ScheduleEntry[] {
  const activeByDepartment: Record<StaffDepartment, StaffMember[]> = {
    housekeeping: [],
    front_desk: [],
    f_b: [],
    maintenance: [],
  };

  for (const member of staff) {
    const normalizedDepartment = normalizeDepartment(member.department);
    if (!normalizedDepartment) {
      continue;
    }
    activeByDepartment[normalizedDepartment].push(member);
  }

  const rotation: Record<StaffDepartment, number> = {
    housekeeping: 0,
    front_desk: 0,
    f_b: 0,
    maintenance: 0,
  };

  const entries: ScheduleEntry[] = [];

  for (const [dayIndex, day] of approvedByDate.entries()) {
    for (const department of Object.keys(day.counts) as StaffDepartment[]) {
      const needed = Math.max(0, Number(day.counts[department] ?? 0));
      const candidates = activeByDepartment[department];
      if (candidates.length === 0 || needed === 0) {
        continue;
      }

      const usedIds = new Set<string>();
      let tries = 0;

      while (usedIds.size < needed && tries < candidates.length * 3) {
        const pointer = rotation[department] % candidates.length;
        const candidate = candidates[pointer];
        rotation[department] += 1;
        tries += 1;

        if (usedIds.has(candidate.id)) {
          continue;
        }

        usedIds.add(candidate.id);
        const shift = shiftByDay(dayIndex);
        entries.push({
          id: `local-${weekStart}-${day.date}-${department}-${candidate.id}`,
          staff_id: candidate.id,
          staff_name: candidate.name,
          email: candidate.email,
          department,
          date: day.date,
          shift_key: shift.key,
          shift_start: shift.shift_start,
          shift_end: shift.shift_end,
        });
      }
    }
  }

  return entries;
}

export function getShiftLabel(entry: Pick<ScheduleEntry, "shift_key">): string {
  return (
    SHIFT_LIBRARY.find((item) => item.key === entry.shift_key)?.label ?? "Off"
  );
}

export function getShiftOptions() {
  return SHIFT_LIBRARY;
}

export function getWeekBounds(weekStart: string) {
  const weekDates = getWeekDates(weekStart);
  return {
    startDate: weekDates[0],
    endDate: weekDates[6],
    dates: weekDates,
  };
}

export async function getAdminStaffList(): Promise<StaffMember[]> {
  const data = await requestJson<StaffApiResponse>("/admin/staff");
  return normalizeStaff(data.staff ?? []);
}

export async function getApprovedOverrides(
  startDate: string,
  endDate: string,
): Promise<OverrideApiItem[]> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  try {
    const data = await requestJson<OverridesApiResponse>(
      `/staff-override?${params.toString()}`,
    );
    return data.overrides ?? [];
  } catch {
    return [];
  }
}

export async function getExistingSchedule(
  weekStart: string,
): Promise<ScheduleEntry[]> {
  const bounds = getWeekBounds(weekStart);
  const params = new URLSearchParams({
    start_date: bounds.startDate,
    end_date: bounds.endDate,
  });

  try {
    const data = await requestJson<ScheduleApiResponse>(
      `/admin/schedule?${params.toString()}`,
    );
    if (Array.isArray(data.schedule) && data.schedule.length > 0) {
      return data.schedule;
    }
  } catch {
    // fallback below
  }

  return readLocalSchedule(weekStart);
}

export async function generateSchedule(
  weekStart: string,
  staff: StaffMember[],
  overrides: OverrideApiItem[],
): Promise<ScheduleEntry[]> {
  try {
    const data = await requestJson<GenerateApiResponse>(
      "/admin/schedule/generate",
      {
        method: "POST",
        body: JSON.stringify({ week_start: weekStart }),
      },
    );
    if (Array.isArray(data.schedule) && data.schedule.length > 0) {
      writeLocalSchedule(weekStart, data.schedule);
      return data.schedule;
    }
  } catch {
    // fallback below
  }

  const recommended = await getForecastStaffing(7, TOTAL_ROOMS);
  const approvedByDate = applyOverridesToRecommended(recommended, overrides);
  const generated = generateScheduleFromInputs(
    weekStart,
    staff,
    approvedByDate,
  );
  writeLocalSchedule(weekStart, generated);
  return generated;
}

export async function saveShiftChange(
  weekStart: string,
  entryId: string,
  shiftKey: ShiftKey,
): Promise<void> {
  const shift =
    SHIFT_LIBRARY.find((item) => item.key === shiftKey) ?? SHIFT_LIBRARY[3];

  try {
    const result = await requestJson<MutationResponse>("/admin/schedule", {
      method: "PUT",
      body: JSON.stringify({
        schedule_id: entryId,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
      }),
    });

    if (result?.success === false) {
      throw new Error("Failed to save shift");
    }
  } catch {
    const current = readLocalSchedule(weekStart);
    const next = current.map((item) =>
      item.id === entryId
        ? {
            ...item,
            shift_key: shift.key,
            shift_start: shift.shift_start,
            shift_end: shift.shift_end,
          }
        : item,
    );
    writeLocalSchedule(weekStart, next);
  }
}

export async function publishWeeklySchedule(
  weekStart: string,
): Promise<PublishResult> {
  try {
    const result = await requestJson<PublishApiResponse>(
      "/admin/schedule/publish",
      {
        method: "POST",
        body: JSON.stringify({ week_start: weekStart }),
      },
    );

    return {
      success: !!result?.success,
      emailed: result.emailed ?? [],
      usedFallback: false,
    };
  } catch {
    const local = readLocalSchedule(weekStart);
    const uniqueEmails = Array.from(new Set(local.map((item) => item.email)));
    return {
      success: true,
      emailed: uniqueEmails,
      usedFallback: true,
    };
  }
}
