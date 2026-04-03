import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

async function proxyToUpstream(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const upstreamResponse = await fetch(`${API_BASE_URL}/promotions`, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
    },
    body:
      request.method === "GET" || request.method === "DELETE"
        ? undefined
        : await request.text(),
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

export async function GET(request: Request) {
  return proxyToUpstream(request);
}

export async function POST(request: Request) {
  return proxyToUpstream(request);
}
