export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const serviceKey = process.env.KMA_SERVICE_KEY;
    const apiUrl = process.env.KMA_WARNING_API_URL;

    if (!serviceKey || !apiUrl) {
      return json(
        {
          error: "KMA warning environment variables are missing.",
        },
        500
      );
    }

    const upstreamUrl = new URL(apiUrl);
    upstreamUrl.searchParams.set("serviceKey", serviceKey);
    upstreamUrl.searchParams.set("pageNo", url.searchParams.get("pageNo") ?? "1");
    upstreamUrl.searchParams.set("numOfRows", url.searchParams.get("numOfRows") ?? "500");
    upstreamUrl.searchParams.set("dataType", "JSON");

    const response = await fetch(upstreamUrl);

    if (!response.ok) {
      return json(
        {
          error: "KMA warning request failed.",
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
        error: "Unexpected warning proxy error.",
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