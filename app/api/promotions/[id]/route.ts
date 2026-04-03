import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

async function proxyToUpstream(request: Request, id: string) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    );
  }

  const upstreamResponse = await fetch(`${API_BASE_URL}/promotions/${id}`, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: request.method === "PUT" ? await request.text() : undefined,
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyToUpstream(request, id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyToUpstream(request, id);
}
