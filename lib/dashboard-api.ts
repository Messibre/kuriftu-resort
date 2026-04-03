const API_BASE_PATH = "/api"

export interface ForecastPoint {
  date: string
  predicted_rooms: number
  lower_bound: number
  upper_bound: number
  demand_class: string
  occupancy_percent: number
}

export interface StaffingPoint {
  date: string
  housekeeping_staff: number
  front_desk_staff: number
  f_b_staff: number
  maintenance_staff: number
  total_staff_cost: number
}

export interface ForecastSummary {
  avg_occupancy: number
  high_demand_days: number
  medium_demand_days: number
  low_demand_days: number
  peak_occupancy: number
  peak_date: string
}

export interface ForecastResponse {
  forecasts: ForecastPoint[]
  staffing: StaffingPoint[]
  summary: ForecastSummary
}

export interface DashboardEvent {
  id: string
  title: string
  date: string
  description?: string
  kind: "event" | "holiday"
}

export interface DashboardPromotion {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  discountPercent: number
  isActive: boolean
}

interface PromotionApiItem {
  id: number | string
  title: string
  description: string
  start_date: string
  end_date: string
  discount_percent: number
  is_active: boolean
}

function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const text = await response.text()
    if (!text) {
      return undefined as T
    }

    return JSON.parse(text) as T
  })
}

export function getForecastData(): Promise<ForecastResponse> {
  return requestJson<ForecastResponse>("/forecast", {
    method: "POST",
    body: JSON.stringify({
      horizon_days: 30,
      include_staffing: true,
      total_rooms: 60,
    }),
  })
}

type UnknownRecord = Record<string, unknown>

function parseItemDate(item: UnknownRecord): string {
  const value = item.date ?? item.event_date ?? item.holiday_date
  return typeof value === "string" ? value : ""
}

function parseItemTitle(item: UnknownRecord, fallback: string): string {
  const value = item.title ?? item.name ?? item.holiday_name ?? item.event_name
  return typeof value === "string" && value.trim() ? value : fallback
}

export async function getUpcomingEventsAndHolidays(): Promise<DashboardEvent[]> {
  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDateObj = new Date(today)
  endDateObj.setDate(endDateObj.getDate() + 60)
  const endDate = endDateObj.toISOString().slice(0, 10)

  const [eventsRaw, holidaysRaw] = await Promise.all([
    requestJson<unknown[]>(`/events?start_date=${startDate}&end_date=${endDate}`).catch(() => []),
    requestJson<unknown[]>(`/ethiopian_holidays?year=${today.getFullYear()}`).catch(() => []),
  ])

  const events: DashboardEvent[] = (eventsRaw as UnknownRecord[])
    .map((item, index) => {
      const date = parseItemDate(item)
      return {
        id: String(item.id ?? `event-${index}`),
        title: parseItemTitle(item, "Upcoming event"),
        date,
        description: typeof item.description === "string" ? item.description : undefined,
        kind: "event" as const,
      }
    })
    .filter((item) => item.date)

  const holidays: DashboardEvent[] = (holidaysRaw as UnknownRecord[])
    .map((item, index) => {
      const date = parseItemDate(item)
      return {
        id: String(item.id ?? `holiday-${index}`),
        title: parseItemTitle(item, "Holiday"),
        date,
        description: typeof item.description === "string" ? item.description : undefined,
        kind: "holiday" as const,
      }
    })
    .filter((item) => item.date)

  return [...events, ...holidays]
    .filter((item) => item.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
}

export async function getActivePromotions(): Promise<DashboardPromotion[]> {
  const response = await requestJson<{ promotions: PromotionApiItem[] }>("/admin/promotions").catch(
    () => requestJson<{ promotions: PromotionApiItem[] }>("/promotions"),
  )

  return response.promotions
    .filter((item) => item.is_active)
    .map((item) => ({
      id: String(item.id),
      title: item.title,
      description: item.description,
      startDate: item.start_date,
      endDate: item.end_date,
      discountPercent: item.discount_percent,
      isActive: item.is_active,
    }))
    .slice(0, 3)
}