export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return json(
        {
          error: "query is required.",
        },
        400
      );
    }

    const kakaoKey = process.env.KAKAO_REST_API_KEY || process.env.KAKAO_REST_KEY;

    if (!kakaoKey) {
      return json(
        {
          error: "KAKAO_REST_API_KEY or KAKAO_REST_KEY is missing.",
        },
        500
      );
    }

    const kakaoUrl = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    kakaoUrl.searchParams.set("query", query);

    const response = await fetch(kakaoUrl, {
      headers: {
        Authorization: `KakaoAK ${kakaoKey}`,
      },
    });

    if (!response.ok) {
      return json(
        {
          error: "Kakao geocode request failed.",
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
        error: "Unexpected Kakao proxy error.",
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