import { NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL

export async function GET(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 },
    )
  }

  const requestUrl = new URL(request.url)
  const query = requestUrl.search || ""

  const upstreamResponse = await fetch(`${API_BASE_URL}/ethiopian_holidays${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  const text = await upstreamResponse.text()

  return new NextResponse(text || null, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("Content-Type") ?? "application/json",
    },
  })
}