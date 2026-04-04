const API_BASE_PATH = "/api";
const CACHE_TTL_MS = 10 * 60 * 1000; // Increased to 10 minutes

const LOCAL_OVERRIDE_STORAGE_KEY = "staff-overrides-v1";

export type StaffDepartment =
  | "housekeeping"
  | "front_desk"
  | "f_b"
  | "maintenance";

export interface DailyStaffRecommendation {
  date: string;
  housekeeping: number;
  front_desk: number;
  f_b: number;
  maintenance: number;
  total_staff_cost: number;
}

export interface StaffOverridePayload {
  date: string;
  department: StaffDepartment;
  recommended_count: number;
  approved_count: number;
  reason: string;
}

export interface StaffOverrideItem extends StaffOverridePayload {
  id: string;
}

interface ForecastStaffingApiItem {
  date: string;
  housekeeping_staff?: number;
  front_desk_staff?: number;
  f_b_staff?: number;
  maintenance_staff?: number;
  total_staff_cost?: number;
}

interface ForecastApiResponse {
  staffing?: ForecastStaffingApiItem[];
}

interface StaffOverrideApiResponse {
  overrides: StaffOverridePayload[];
}

interface MutationResponse {
  success: boolean;
}

type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const staffingCache = new Map<string, CacheEntry<DailyStaffRecommendation[]>>();

function makeOverrideId(date: string, department: StaffDepartment): string {
  return `${date}:${department}`;
}

function readLocalOverrides(): StaffOverrideItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_OVERRIDE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StaffOverridePayload[];
    return parsed.map((item) => ({
      ...item,
      id: makeOverrideId(item.date, item.department),
    }));
  } catch {
    return [];
  }
}

function writeLocalOverrides(overrides: StaffOverridePayload[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LOCAL_OVERRIDE_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}

function upsertLocalOverride(payload: StaffOverridePayload): void {
  const existing = readLocalOverrides().map((item) => ({
    date: item.date,
    department: item.department,
    recommended_count: item.recommended_count,
    approved_count: item.approved_count,
    reason: item.reason,
  }));

  const index = existing.findIndex(
    (item) =>
      item.date === payload.date && item.department === payload.department,
  );

  if (index >= 0) {
    existing[index] = payload;
  } else {
    existing.push(payload);
  }

  writeLocalOverrides(existing);
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

export async function getForecastStaffing(
  horizonDays: number,
  totalRooms: number,
): Promise<DailyStaffRecommendation[]> {
  const cacheKey = `${horizonDays}:${totalRooms}`;
  const now = Date.now();
  const cached = staffingCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const request = (async () => {
    const data = await requestJson<ForecastApiResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify({
        horizon_days: horizonDays,
        include_staffing: true,
        total_rooms: totalRooms,
      }),
    });

    return (data.staffing ?? []).map((item) => ({
      date: item.date,
      housekeeping: Number(item.housekeeping_staff ?? 0),
      front_desk: Number(item.front_desk_staff ?? 0),
      f_b: Number(item.f_b_staff ?? 0),
      maintenance: Number(item.maintenance_staff ?? 0),
      total_staff_cost: Number(item.total_staff_cost ?? 0),
    }));
  })();

  staffingCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    value: request,
  });

  return request;
}

export async function getStaffOverrides(
  startDate: string,
  endDate: string,
): Promise<StaffOverrideItem[]> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  try {
    const data = await requestJson<StaffOverrideApiResponse>(
      `/staff-override?${params.toString()}`,
    );

    return (data.overrides ?? []).map((item) => ({
      ...item,
      id: makeOverrideId(item.date, item.department),
    }));
  } catch {
    return readLocalOverrides().filter(
      (item) => item.date >= startDate && item.date <= endDate,
    );
  }
}

export async function saveStaffOverride(
  payload: StaffOverridePayload,
): Promise<void> {
  try {
    const result = await requestJson<MutationResponse>("/staff-override", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (result?.success === false) {
      throw new Error("Failed to save staff override");
    }
  } catch {
    upsertLocalOverride(payload);
  }
}

export async function saveStaffOverrides(
  payloads: StaffOverridePayload[],
): Promise<void> {
  await Promise.all(payloads.map((payload) => saveStaffOverride(payload)));
}

export async function getStaffAvailability(): Promise<unknown[]> {
  try {
    const data = await requestJson<{ staff: unknown[] }>("/admin/staff");
    return data.staff ?? [];
  } catch {
    return [];
  }
}
