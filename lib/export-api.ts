const API_BASE_PATH = "/api/export";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReport(
  reportType: "forecast" | "staffing" | "feedback" | "promotions",
  startDate: string,
  endDate: string,
  format: "csv" | "pdf",
): Promise<void> {
  const response = await fetch(
    `${API_BASE_PATH}/${reportType}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&format=${format}`,
  );

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  downloadBlob(blob, `${reportType}-${startDate}-to-${endDate}.${format}`);
}
