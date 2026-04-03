const API_BASE_PATH = "/api";

export interface ResortSettings {
  [key: string]: unknown;
}

export interface StaffingRatio {
  department: string;
  guest_ratio: number;
  min_staff: number;
  max_staff?: number | null;
  is_active?: boolean;
}

export interface NotificationPreference {
  notification_type: string;
  is_enabled: boolean;
  channel: "email" | "in_app";
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

export async function getAdminSettings(): Promise<ResortSettings> {
  const data = await requestJson<{ settings: ResortSettings }>(
    "/admin/settings",
  );
  return data.settings ?? {};
}

export async function updateAdminSettings(
  payload: ResortSettings,
): Promise<void> {
  const result = await requestJson<{ success: boolean }>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (result?.success === false) {
    throw new Error("Failed to update settings");
  }
}

export async function getStaffingRatios(): Promise<StaffingRatio[]> {
  const data = await requestJson<{ ratios: StaffingRatio[] }>(
    "/admin/staffing-ratios",
  );
  return data.ratios ?? [];
}

export async function updateStaffingRatios(
  ratios: StaffingRatio[],
): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    "/admin/staffing-ratios",
    {
      method: "PUT",
      body: JSON.stringify({ ratios }),
    },
  );
  if (result?.success === false) {
    throw new Error("Failed to update staffing ratios");
  }
}

export async function getNotificationPreferences(): Promise<
  NotificationPreference[]
> {
  const data = await requestJson<{ preferences: NotificationPreference[] }>(
    "/admin/notification-preferences",
  );
  return data.preferences ?? [];
}

export async function updateNotificationPreferences(
  preferences: NotificationPreference[],
): Promise<void> {
  const result = await requestJson<{ success: boolean }>(
    "/admin/notification-preferences",
    {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    },
  );
  if (result?.success === false) {
    throw new Error("Failed to update notification preferences");
  }
}

export async function getSystemHealth(): Promise<
  Record<string, { status: string; message: string }>
> {
  return requestJson<Record<string, { status: string; message: string }>>(
    "/health/system",
  );
}

export async function downloadBackup(): Promise<Blob> {
  const response = await fetch(`${API_BASE_PATH}/admin/backup`);
  if (!response.ok) {
    throw new Error(`Backup request failed with status ${response.status}`);
  }
  return response.blob();
}
