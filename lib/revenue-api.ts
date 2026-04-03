const API_BASE_PATH = "/api";

const TOTAL_ROOMS = 60;
const SHIFT_HOURS = 8;
const HOURLY_RATES = {
  housekeeping: 16,
  front_desk: 18,
  f_and_b: 17,
  maintenance: 22,
} as const;

type DateRangeKey = "7d" | "30d" | "90d" | "custom";

interface CustomRange {
  startDate: string;
  endDate: string;
}

interface ForecastPredictionItem {
  date: string;
  predicted_rooms: number;
  occupancy_percentage: number;
  staffing?: {
    recommended_staff?: {
      housekeeping?: number;
      front_desk?: number;
      f_and_b?: number;
      maintenance?: number;
    };
    total_labor_cost?: number;
  };
}

interface ForecastApiResponse {
  predictions: ForecastPredictionItem[];
}

interface RevenueDashboardApiResponse {
  daily_data: RevenueDailyData[];
  summary: RevenueSummary;
}

export interface RevenueSummary {
  total_revenue: number;
  average_adr: number;
  average_occupancy: number;
  average_revpar: number;
  labor_cost_percent: number;
  forecast_accuracy_mape: number;
  estimated_savings: number;
}

export interface RevenueDailyData {
  date: string;
  actual_occupancy: number | null;
  predicted_occupancy: number;
  adr: number;
  revpar: number;
  labor_cost: number;
  actual_rooms_sold: number | null;
  predicted_rooms: number;
  room_revenue: number;
  labor_housekeeping?: number;
  labor_front_desk?: number;
  labor_f_b?: number;
  labor_maintenance?: number;
}

export interface RevenueDataset {
  range: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: RevenueSummary;
  dailyData: RevenueDailyData[];
  mape7: number;
  mape30: number;
  within10PctDays: number;
}

interface DailyOccupancyItem {
  date: string;
  rooms_sold?: number | null;
  adr?: number | null;
}

interface PricingApprovalItem {
  date: string;
  approved_price?: number | null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveRange(range: DateRangeKey, customRange?: CustomRange) {
  if (range === "custom" && customRange) {
    const start = customRange.startDate;
    const end = customRange.endDate;

    if (start <= end) {
      const startDateObject = new Date(start);
      const endDateObject = new Date(end);
      const days = Math.max(
        1,
        Math.round(
          (endDateObject.getTime() - startDateObject.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      );

      return {
        startDate: start,
        endDate: end,
        days,
      };
    }
  }

  const end = new Date();
  const start = new Date(end);

  if (range === "7d") {
    start.setDate(end.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(end.getDate() - 29);
  } else {
    start.setDate(end.getDate() - 89);
  }

  const startDate = formatDate(start);
  const endDate = formatDate(end);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  return { startDate, endDate, days };
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

function computeAccuracy(dailyData: RevenueDailyData[]) {
  const withActual = dailyData.filter(
    (item) => item.actual_rooms_sold !== null && item.actual_rooms_sold > 0,
  );

  const mapeAllValues = withActual.map((item) => {
    const actual = item.actual_rooms_sold as number;
    return Math.abs(actual - item.predicted_rooms) / actual;
  });

  const mapeAll =
    mapeAllValues.length > 0
      ? (mapeAllValues.reduce((sum, value) => sum + value, 0) /
          mapeAllValues.length) *
        100
      : 0;

  const last7 = dailyData
    .slice(-7)
    .filter(
      (item) => item.actual_rooms_sold !== null && item.actual_rooms_sold > 0,
    );
  const last30 = dailyData
    .slice(-30)
    .filter(
      (item) => item.actual_rooms_sold !== null && item.actual_rooms_sold > 0,
    );

  const computeMape = (items: RevenueDailyData[]) => {
    if (items.length === 0) {
      return 0;
    }

    const ratioSum = items.reduce((sum, item) => {
      const actual = item.actual_rooms_sold as number;
      return sum + Math.abs(actual - item.predicted_rooms) / actual;
    }, 0);

    return (ratioSum / items.length) * 100;
  };

  const within10 =
    withActual.length > 0
      ? (withActual.filter((item) => {
          const actual = item.actual_rooms_sold as number;
          return Math.abs(actual - item.predicted_rooms) / actual <= 0.1;
        }).length /
          withActual.length) *
        100
      : 0;

  return {
    mapeAll,
    mape7: computeMape(last7),
    mape30: computeMape(last30),
    within10PctDays: within10,
  };
}

function withDepartmentLaborCosts(
  baseDailyData: RevenueDailyData[],
  forecastData: ForecastApiResponse,
): RevenueDailyData[] {
  const forecastByDate = new Map(
    (forecastData.predictions ?? []).map((item) => [item.date, item]),
  );

  return baseDailyData.map((item) => {
    const forecast = forecastByDate.get(item.date);
    const staff = forecast?.staffing?.recommended_staff;

    const housekeeping =
      (staff?.housekeeping ?? 0) * HOURLY_RATES.housekeeping * SHIFT_HOURS;
    const frontDesk =
      (staff?.front_desk ?? 0) * HOURLY_RATES.front_desk * SHIFT_HOURS;
    const fAndB = (staff?.f_and_b ?? 0) * HOURLY_RATES.f_and_b * SHIFT_HOURS;
    const maintenance =
      (staff?.maintenance ?? 0) * HOURLY_RATES.maintenance * SHIFT_HOURS;

    return {
      ...item,
      labor_housekeeping: Number(housekeeping.toFixed(2)),
      labor_front_desk: Number(frontDesk.toFixed(2)),
      labor_f_b: Number(fAndB.toFixed(2)),
      labor_maintenance: Number(maintenance.toFixed(2)),
    };
  });
}

async function fallbackComputeRevenue(range: ReturnType<typeof resolveRange>) {
  const { startDate, endDate, days } = range;

  const [occupancyRows, pricingRows, forecastData] = await Promise.all([
    requestJson<DailyOccupancyItem[]>(
      `/daily_occupancy?start_date=${startDate}&end_date=${endDate}`,
    ),
    requestJson<PricingApprovalItem[]>(
      `/pricing/approvals?start_date=${startDate}&end_date=${endDate}`,
    ).catch(() => []),
    requestJson<ForecastApiResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify({
        horizon_days: days,
        include_staffing: true,
        total_rooms: TOTAL_ROOMS,
      }),
    }),
  ]);

  const occupancyByDate = new Map(
    occupancyRows.map((item) => [item.date, item]),
  );
  const pricingByDate = new Map(
    pricingRows
      .filter((item) => item.approved_price != null)
      .map((item) => [item.date, Number(item.approved_price)]),
  );

  const baseDailyData: RevenueDailyData[] = (
    forecastData.predictions ?? []
  ).map((item) => {
    const occ = occupancyByDate.get(item.date);
    const actualRooms = occ?.rooms_sold != null ? Number(occ.rooms_sold) : null;
    const actualOcc =
      actualRooms != null ? (actualRooms / TOTAL_ROOMS) * 100 : null;

    const adr =
      occ?.adr != null ? Number(occ.adr) : (pricingByDate.get(item.date) ?? 0);

    const revpar =
      adr > 0 ? adr * ((actualOcc ?? item.occupancy_percentage) / 100) : 0;

    const laborCost = Number(item.staffing?.total_labor_cost ?? 0);
    const revenueRooms = actualRooms ?? Number(item.predicted_rooms);
    const roomRevenue = revenueRooms * adr;

    return {
      date: item.date,
      actual_occupancy: actualOcc != null ? Number(actualOcc.toFixed(2)) : null,
      predicted_occupancy: Number(item.occupancy_percentage),
      adr: Number(adr.toFixed(2)),
      revpar: Number(revpar.toFixed(2)),
      labor_cost: Number(laborCost.toFixed(2)),
      actual_rooms_sold: actualRooms,
      predicted_rooms: Number(item.predicted_rooms),
      room_revenue: Number(roomRevenue.toFixed(2)),
    };
  });

  const dailyData = withDepartmentLaborCosts(baseDailyData, forecastData);

  const totalRevenue = dailyData.reduce(
    (sum, item) => sum + item.room_revenue,
    0,
  );
  const totalRoomsSold = dailyData.reduce(
    (sum, item) => sum + (item.actual_rooms_sold ?? 0),
    0,
  );
  const averageAdr = totalRoomsSold > 0 ? totalRevenue / totalRoomsSold : 0;
  const averageOcc =
    dailyData.length > 0
      ? dailyData.reduce(
          (sum, item) =>
            sum + (item.actual_occupancy ?? item.predicted_occupancy),
          0,
        ) / dailyData.length
      : 0;
  const averageRevpar =
    dailyData.length > 0
      ? dailyData.reduce((sum, item) => sum + item.revpar, 0) / dailyData.length
      : 0;
  const totalLabor = dailyData.reduce((sum, item) => sum + item.labor_cost, 0);
  const laborPct = totalRevenue > 0 ? (totalLabor / totalRevenue) * 100 : 0;
  const accuracy = computeAccuracy(dailyData);
  const estimatedSavings = totalLabor * 0.2;

  return {
    summary: {
      total_revenue: Number(totalRevenue.toFixed(2)),
      average_adr: Number(averageAdr.toFixed(2)),
      average_occupancy: Number(averageOcc.toFixed(2)),
      average_revpar: Number(averageRevpar.toFixed(2)),
      labor_cost_percent: Number(laborPct.toFixed(2)),
      forecast_accuracy_mape: Number(accuracy.mapeAll.toFixed(2)),
      estimated_savings: Number(estimatedSavings.toFixed(2)),
    },
    dailyData,
    accuracy,
  };
}

export async function getRevenueDataset(
  rangeKey: DateRangeKey,
  customRange?: CustomRange,
): Promise<RevenueDataset> {
  const range = resolveRange(rangeKey, customRange);

  try {
    const dashboard = await requestJson<RevenueDashboardApiResponse>(
      `/revenue/dashboard?start_date=${range.startDate}&end_date=${range.endDate}`,
    );

    const forecastData = await requestJson<ForecastApiResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify({
        horizon_days: range.days,
        include_staffing: true,
        total_rooms: TOTAL_ROOMS,
      }),
    });

    const dailyData = withDepartmentLaborCosts(
      dashboard.daily_data ?? [],
      forecastData,
    );

    const accuracy = computeAccuracy(dailyData);

    return {
      range,
      summary: dashboard.summary,
      dailyData,
      mape7: Number(accuracy.mape7.toFixed(2)),
      mape30: Number(accuracy.mape30.toFixed(2)),
      within10PctDays: Number(accuracy.within10PctDays.toFixed(2)),
    };
  } catch {
    const computed = await fallbackComputeRevenue(range);

    return {
      range,
      summary: computed.summary,
      dailyData: computed.dailyData,
      mape7: Number(computed.accuracy.mape7.toFixed(2)),
      mape30: Number(computed.accuracy.mape30.toFixed(2)),
      within10PctDays: Number(computed.accuracy.within10PctDays.toFixed(2)),
    };
  }
}
