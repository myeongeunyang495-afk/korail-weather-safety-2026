export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const nx = url.searchParams.get("nx");
    const ny = url.searchParams.get("ny");
    const baseDate = url.searchParams.get("baseDate");
    const baseTime = url.searchParams.get("baseTime");

    if (!nx || !ny || !baseDate || !baseTime) {
      return json(
        {
          error: "nx, ny, baseDate, baseTime are required.",
        },
        400
      );
    }

    const serviceKey = process.env.KMA_SERVICE_KEY;
    const apiUrl = process.env.KMA_FORECAST_API_URL;

    if (!serviceKey || !apiUrl) {
      return json(
        {
          error: "KMA forecast environment variables are missing.",
        },
        500
      );
    }

    const upstreamUrl = new URL(apiUrl);
    upstreamUrl.searchParams.set("serviceKey", serviceKey);
    upstreamUrl.searchParams.set("pageNo", "1");
    upstreamUrl.searchParams.set("numOfRows", "1000");
    upstreamUrl.searchParams.set("dataType", "JSON");
    upstreamUrl.searchParams.set("base_date", baseDate);
    upstreamUrl.searchParams.set("base_time", baseTime);
    upstreamUrl.searchParams.set("nx", nx);
    upstreamUrl.searchParams.set("ny", ny);

    const response = await fetch(upstreamUrl);

    if (!response.ok) {
      return json(
        {
          error: "KMA forecast request failed.",
          status: response.status,
        },
        502
      );
    }

    const data = await response.json();

    return json(data, 200);
  } catch (error) {
    return json(
      {
        error: "Unexpected forecast proxy error.",
      },
      500
    );
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}