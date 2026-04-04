const API_BASE_PATH = "/api";
const LOCAL_OVERRIDE_STORAGE_KEY = "pricing-overrides-v1";

const DEFAULT_BASE_PRICE = 2400;

interface ForecastPrediction {
  date: string;
  predicted_rooms: number;
  occupancy_percentage: number;
  demand_class: string;
}

interface ForecastApiResponse {
  predictions?: ForecastPrediction[];
}

interface PricingApprovalItem {
  date: string;
  approved_price?: number | null;
  reason?: string | null;
}

interface DailyOccupancyItem {
  date: string;
  adr?: number | null;
}

export interface PredictionPricingRow {
  date: string;
  predictedRooms: number;
  occupancyPercent: number;
  demandClass: string;
  suggestedPrice: number;
  approvedPrice: number | null;
  reason: string;
}

export interface PredictionPricingDataset {
  startDate: string;
  endDate: string;
  horizonDays: number;
  basePrice: number;
  summary: {
    avgOccupancy: number;
    avgSuggestedPrice: number;
    overrideRate: number;
    highDemandDays: number;
    lowDemandDays: number;
  };
  rows: PredictionPricingRow[];
}

export interface SavePricingApprovalPayload {
  date: string;
  approvedPrice: number;
  suggestedPrice?: number;
  reason?: string;
}

interface LocalPricingOverride {
  date: string;
  approved_price: number;
  reason?: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

function normalizeApprovals(raw: unknown): PricingApprovalItem[] {
  if (Array.isArray(raw)) {
    return raw as PricingApprovalItem[];
  }

  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { approvals?: unknown[] }).approvals)
  ) {
    return (raw as { approvals: PricingApprovalItem[] }).approvals;
  }

  return [];
}

function readLocalOverrides(): LocalPricingOverride[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_OVERRIDE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as LocalPricingOverride[];
  } catch {
    return [];
  }
}

function writeLocalOverrides(rows: LocalPricingOverride[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_OVERRIDE_STORAGE_KEY, JSON.stringify(rows));
}

function upsertLocalOverride(payload: LocalPricingOverride): void {
  const rows = readLocalOverrides();
  const index = rows.findIndex((item) => item.date === payload.date);

  if (index >= 0) {
    rows[index] = payload;
  } else {
    rows.push(payload);
  }

  writeLocalOverrides(rows);
}

function deriveBasePrice(
  occupancyRows: DailyOccupancyItem[],
  approvalRows: PricingApprovalItem[],
): number {
  const adrValues = occupancyRows
    .map((item) => Number(item.adr ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (adrValues.length > 0) {
    const avg =
      adrValues.reduce((sum, item) => sum + item, 0) / adrValues.length;
    return Number(avg.toFixed(2));
  }

  const approvedValues = approvalRows
    .map((item) => Number(item.approved_price ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (approvedValues.length > 0) {
    const avg =
      approvedValues.reduce((sum, item) => sum + item, 0) /
      approvedValues.length;
    return Number(avg.toFixed(2));
  }

  return DEFAULT_BASE_PRICE;
}

function priceMultiplierBySignal(
  occupancyPercent: number,
  demandClass: string,
): number {
  const demand = demandClass.toLowerCase();

  if (occupancyPercent >= 90 || demand === "high") {
    return 1.25;
  }
  if (occupancyPercent >= 80) {
    return 1.15;
  }
  if (occupancyPercent >= 65) {
    return 1.05;
  }
  if (occupancyPercent >= 50) {
    return 1;
  }
  if (occupancyPercent >= 35) {
    return 0.93;
  }

  return 0.85;
}

function buildSuggestedPrice(
  basePrice: number,
  occupancyPercent: number,
  demandClass: string,
): number {
  const multiplier = priceMultiplierBySignal(occupancyPercent, demandClass);
  const clamped = Math.max(0.8, Math.min(1.4, multiplier));
  return Number((basePrice * clamped).toFixed(2));
}

export async function getPredictionPricingDataset(
  horizonDays: number,
  totalRooms: number,
): Promise<PredictionPricingDataset> {
  const today = new Date();
  const startDate = formatDate(today);
  const endDate = formatDate(addDays(today, Math.max(horizonDays - 1, 0)));

  const historicalStart = formatDate(addDays(today, -30));

  const [forecastRaw, approvalsRaw, occupancyRaw] = await Promise.all([
    requestJson<ForecastApiResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify({
        horizon_days: horizonDays,
        include_staffing: true,
        total_rooms: totalRooms,
      }),
    }),
    requestJson<unknown>(
      `/pricing/approvals?start_date=${startDate}&end_date=${endDate}`,
    ).catch(() => []),
    requestJson<DailyOccupancyItem[]>(
      `/daily_occupancy?start_date=${historicalStart}&end_date=${startDate}`,
    ).catch(() => []),
  ]);

  const approvalRows = normalizeApprovals(approvalsRaw);
  const localOverrides = readLocalOverrides().filter(
    (item) => item.date >= startDate && item.date <= endDate,
  );

  const approvalByDate = new Map(
    approvalRows.map((item) => [
      item.date,
      {
        approvedPrice:
          item.approved_price != null ? Number(item.approved_price) : null,
        reason: item.reason ?? "",
      },
    ]),
  );

  for (const local of localOverrides) {
    approvalByDate.set(local.date, {
      approvedPrice: Number(local.approved_price),
      reason: local.reason ?? "",
    });
  }

  const basePrice = deriveBasePrice(occupancyRaw, approvalRows);

  const rows = (forecastRaw.predictions ?? []).map((item) => {
    const approved = approvalByDate.get(item.date);
    const suggestedPrice = buildSuggestedPrice(
      basePrice,
      Number(item.occupancy_percentage ?? 0),
      item.demand_class ?? "medium",
    );

    return {
      date: item.date,
      predictedRooms: Number(item.predicted_rooms ?? 0),
      occupancyPercent: Number(item.occupancy_percentage ?? 0),
      demandClass: item.demand_class ?? "medium",
      suggestedPrice,
      approvedPrice: approved?.approvedPrice ?? null,
      reason: approved?.reason ?? "",
    } satisfies PredictionPricingRow;
  });

  const avgOccupancy =
    rows.length > 0
      ? rows.reduce((sum, item) => sum + item.occupancyPercent, 0) / rows.length
      : 0;

  const avgSuggestedPrice =
    rows.length > 0
      ? rows.reduce((sum, item) => sum + item.suggestedPrice, 0) / rows.length
      : 0;

  const overrides = rows.filter((item) => item.approvedPrice != null).length;

  return {
    startDate,
    endDate,
    horizonDays,
    basePrice,
    summary: {
      avgOccupancy: Number(avgOccupancy.toFixed(2)),
      avgSuggestedPrice: Number(avgSuggestedPrice.toFixed(2)),
      overrideRate:
        rows.length > 0
          ? Number(((overrides / rows.length) * 100).toFixed(2))
          : 0,
      highDemandDays: rows.filter((item) => item.demandClass === "high").length,
      lowDemandDays: rows.filter((item) => item.demandClass === "low").length,
    },
    rows,
  };
}

export async function savePricingApproval(
  payload: SavePricingApprovalPayload,
): Promise<void> {
  const body = {
    date: payload.date,
    approved_price: payload.approvedPrice,
    predicted_price: payload.suggestedPrice,
    reason: payload.reason ?? "",
  };

  try {
    await requestJson<{ success?: boolean }>("/pricing/approvals", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    upsertLocalOverride({
      date: payload.date,
      approved_price: payload.approvedPrice,
      reason: payload.reason,
    });
  }
}
