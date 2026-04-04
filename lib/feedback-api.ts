export type FeedbackSentiment = "positive" | "neutral" | "negative";
export type FeedbackSource = "email" | "survey" | "admin";

const API_BASE_PATH = "/api/feedback";

export interface FeedbackItem {
  id: string;
  date: Date;
  guestName: string;
  rating: number;
  comment: string;
  sentiment: FeedbackSentiment;
  source: string;
}

interface FeedbackApiItem {
  id: number | string;
  date: string;
  guest_name?: string | null;
  rating: number;
  comment: string;
  sentiment: FeedbackSentiment;
  source?: string | null;
}

interface FeedbackListResponse {
  feedback: FeedbackApiItem[];
}

type FeedbackListLike = FeedbackListResponse | FeedbackApiItem[];

interface FeedbackMutationResponse {
  success: boolean;
}

export interface GetFeedbackFilters {
  sentiment?: FeedbackSentiment;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateFeedbackInput {
  date: Date;
  guestName?: string;
  rating: number;
  comment: string;
  sentiment: FeedbackSentiment;
  source: FeedbackSource;
}

function createLocalDate(dateValue: string): Date {
  const isoSlice = String(dateValue).slice(0, 10);
  const [year, month, day] = isoSlice.split("-").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    const fallback = new Date(dateValue);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapFeedback(item: FeedbackApiItem): FeedbackItem {
  return {
    id: String(item.id),
    date: createLocalDate(item.date),
    guestName: item.guest_name?.trim() ? item.guest_name : "Anonymous",
    rating: item.rating,
    comment: item.comment,
    sentiment: item.sentiment,
    source: item.source ?? "admin",
  };
}

function normalizeFeedbackList(data: FeedbackListLike): FeedbackApiItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.feedback)) {
    return data.feedback;
  }

  return [];
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

export async function getFeedback(
  filters: GetFeedbackFilters = {},
): Promise<FeedbackItem[]> {
  const params = new URLSearchParams();

  if (filters.sentiment) {
    params.set("sentiment", filters.sentiment);
  }

  if (filters.startDate) {
    params.set("start_date", formatLocalDate(filters.startDate));
  }

  if (filters.endDate) {
    params.set("end_date", formatLocalDate(filters.endDate));
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await requestJson<FeedbackListLike>(query);
  const feedbackList = normalizeFeedbackList(data);

  return feedbackList
    .map(mapFeedback)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<void> {
  const payload = {
    date: formatLocalDate(input.date),
    guest_name: input.guestName?.trim() || "Anonymous",
    rating: input.rating,
    comment: input.comment,
    sentiment: input.sentiment,
    source: input.source,
  };

  const result = await requestJson<FeedbackMutationResponse>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result?.success === false) {
    throw new Error("Failed to create feedback");
  }
}
