const API_BASE_PATH = "/api/promotions";

export type PromotionRoomType = "standard" | "deluxe" | "suite";

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  discountPercent: number;
  roomTypes: PromotionRoomType[];
  isActive: boolean;
}

export interface PromotionPayload {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_percent: number;
  room_types: PromotionRoomType[];
  is_active: boolean;
}

interface PromotionApiItem {
  id: number | string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_percent: number;
  room_types: string[] | null;
  is_active: boolean;
}

interface PromotionListResponse {
  promotions: PromotionApiItem[];
}

interface PromotionMutationResponse {
  success: boolean;
}

function createLocalDate(dateValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeRoomType(roomType: string): PromotionRoomType | null {
  const normalized = roomType.toLowerCase();

  if (
    normalized === "standard" ||
    normalized === "deluxe" ||
    normalized === "suite"
  ) {
    return normalized;
  }

  return null;
}

function mapPromotion(apiItem: PromotionApiItem): Promotion {
  const roomTypes = (apiItem.room_types ?? [])
    .map(normalizeRoomType)
    .filter((roomType): roomType is PromotionRoomType => roomType !== null);

  return {
    id: String(apiItem.id),
    title: apiItem.title,
    description: apiItem.description,
    startDate: createLocalDate(apiItem.start_date),
    endDate: createLocalDate(apiItem.end_date),
    discountPercent: apiItem.discount_percent,
    roomTypes,
    isActive: apiItem.is_active,
  };
}

function toPayload(promotion: Omit<Promotion, "id">): PromotionPayload {
  return {
    title: promotion.title,
    description: promotion.description,
    start_date: formatLocalDate(promotion.startDate),
    end_date: formatLocalDate(promotion.endDate),
    discount_percent: promotion.discountPercent,
    room_types: promotion.roomTypes,
    is_active: promotion.isActive,
  };
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

export async function getPromotions(): Promise<Promotion[]> {
  const data = await requestJson<PromotionListResponse>("");
  return data.promotions.map(mapPromotion);
}

export async function createPromotion(
  promotion: Omit<Promotion, "id">,
): Promise<void> {
  const payload = toPayload(promotion);
  const result = await requestJson<PromotionMutationResponse>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result?.success === false) {
    throw new Error("Failed to create promotion");
  }
}

export async function updatePromotion(
  id: string,
  promotion: Omit<Promotion, "id">,
): Promise<void> {
  const payload = toPayload(promotion);
  const result = await requestJson<PromotionMutationResponse>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (result?.success === false) {
    throw new Error("Failed to update promotion");
  }
}

export async function deletePromotion(id: string): Promise<void> {
  const result = await requestJson<PromotionMutationResponse>(`/${id}`, {
    method: "DELETE",
  });

  if (result?.success === false) {
    throw new Error("Failed to delete promotion");
  }
}
