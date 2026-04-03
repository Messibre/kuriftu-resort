const API_BASE_PATH = "/api";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  related_url?: string | null;
  is_read: boolean;
  created_at: string;
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

export async function getNotifications(
  limit = 50,
): Promise<NotificationItem[]> {
  const data = await requestJson<{ notifications: NotificationItem[] }>(
    `/notifications?limit=${limit}`,
  );
  return data.notifications ?? [];
}

export async function markNotificationRead(
  notificationId: number,
): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    `/notifications/${notificationId}/read`,
    { method: "PUT" },
  );
  if (result?.success === false) {
    throw new Error("Failed to mark notification read");
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    "/notifications/read-all",
    {
      method: "PUT",
    },
  );
  if (result?.success === false) {
    throw new Error("Failed to mark all notifications read");
  }
}

export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    `/notifications/${notificationId}`,
    {
      method: "DELETE",
    },
  );
  if (result?.success === false) {
    throw new Error("Failed to delete notification");
  }
}

export async function clearAllReadNotifications(): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    "/notifications/clear-all",
    {
      method: "DELETE",
    },
  );
  if (result?.success === false) {
    throw new Error("Failed to clear read notifications");
  }
}
