import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = { params: { type: string } };

export async function GET(request: Request, { params }: RouteParams) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const reportType = params.type;
  const upstream = await fetch(
    `${API_BASE_URL}/export/${reportType}?${searchParams.toString()}`,
    { method: "GET" },
  );

  const blob = await upstream.arrayBuffer();

  return new NextResponse(blob, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ?? "attachment",
    },
  });
}
