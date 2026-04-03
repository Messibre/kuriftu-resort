import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const upstreamResponse = await fetch(
    `${API_BASE_URL}/admin/schedule?${searchParams.toString()}`,
    { method: "GET" },
  );

  const text = await upstreamResponse.text();

  return new NextResponse(text || null, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function PUT(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const upstreamResponse = await fetch(`${API_BASE_URL}/admin/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });

  const text = await upstreamResponse.text();

  return new NextResponse(text || null, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
}
