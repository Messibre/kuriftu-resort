import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = { params: { id: string } };

export async function PUT(_: Request, { params }: RouteParams) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    `${API_BASE_URL}/notifications/${params.id}/read`,
    { method: "PUT" },
  );
  const text = await upstream.text();

  return new NextResponse(text || null, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
