/**
 * 기상청 실황/예보 프록시 (서버리스).
 *
 * - GET /api/weather?lat&lon            → 초단기실황(현재 기온·습도·풍속·강수)
 * - GET /api/weather?lat&lon&mode=hourly → 초단기예보(향후 ~6시간 시간대별)
 *
 * 기상청 서비스키는 환경변수 KMA_SERVICE_KEY 로만 주입한다(코드/깃 커밋 금지).
 * 키가 없으면 503 을 반환 → 클라이언트가 Mock provider 로 자동 폴백한다.
 */

const NCST = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const FCST = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60",
};

export async function handler(event) {
  const key = process.env.KMA_SERVICE_KEY;
  const lat = Number(event.queryStringParameters?.lat);
  const lon = Number(event.queryStringParameters?.lon);
  const mode = event.queryStringParameters?.mode;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return resp(400, { error: "lat/lon required" });
  }
  if (!key) {
    // 키 미설정 → 클라이언트 Mock 폴백 유도
    return resp(503, { error: "KMA_SERVICE_KEY not configured" });
  }

  const grid = latLonToGrid(lat, lon);

  try {
    if (mode === "hourly") {
      const hourly = await fetchHourly(key, grid);
      return resp(200, { hourly, grid });
    }
    const now = await fetchNow(key, grid);
    return resp(200, { ...now, grid });
  } catch (err) {
    return resp(502, { error: String(err && err.message ? err.message : err) });
  }
}

async function fetchNow(key, grid) {
  const candidates = baseCandidates(new Date(), 6, "ncst");
  let lastErr;
  for (const base of candidates) {
    try {
      const items = await callKma(NCST, key, grid, base, 60);
      let temp = null, humidity = null, wind = null, rn1 = 0, pty = 0;
      for (const it of items) {
        const v = Number(it.obsrValue);
        if (it.category === "T1H") temp = v;
        else if (it.category === "REH") humidity = v;
        else if (it.category === "WSD") wind = v;
        else if (it.category === "RN1") rn1 = Number.isFinite(v) ? v : 0;
        else if (it.category === "PTY") pty = Number.isFinite(v) ? v : 0;
      }
      if (Number.isFinite(temp) && Number.isFinite(humidity)) {
        return { temp, humidity, wind: wind ?? 0, rn1, pty, base };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("기상청 실황 자료 없음");
}

async function fetchHourly(key, grid) {
  const candidates = baseCandidates(new Date(), 4, "fcst");
  let lastErr;
  for (const base of candidates) {
    try {
      const items = await callKma(FCST, key, grid, base, 200);
      // fcstTime 별로 묶기
      const byTime = new Map();
      for (const it of items) {
        const t = `${it.fcstDate}${it.fcstTime}`;
        const cur = byTime.get(t) || {};
        const v = Number(it.fcstValue);
        if (it.category === "T1H") cur.temp = v;
        else if (it.category === "REH") cur.humidity = v;
        else if (it.category === "WSD") cur.wind = v;
        else if (it.category === "PTY") cur.pty = v;
        else if (it.category === "RN1") cur.rn1 = parseRn1(it.fcstValue);
        byTime.set(t, cur);
      }
      const hourly = [...byTime.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([t, c]) => ({
          time: isoFromKma(t),
          temp: c.temp,
          humidity: c.humidity,
          wind: c.wind,
          pty: c.pty,
          rn1: c.rn1 ?? 0,
        }))
        .filter((p) => Number.isFinite(p.temp));
      if (hourly.length) return hourly;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("기상청 예보 자료 없음");
}

async function callKma(endpoint, key, grid, base, rows) {
  const params = new URLSearchParams({
    serviceKey: key,
    pageNo: "1",
    numOfRows: String(rows),
    dataType: "JSON",
    base_date: base.date,
    base_time: base.time,
    nx: String(grid.x),
    ny: String(grid.y),
  });
  const res = await fetch(`${endpoint}?${params}`);
  if (!res.ok) throw new Error(`KMA ${res.status}`);
  const data = await res.json();
  const code = data?.response?.header?.resultCode;
  const items = data?.response?.body?.items?.item;
  if (code !== "00" || !Array.isArray(items)) {
    throw new Error(data?.response?.header?.resultMsg || `KMA code ${code}`);
  }
  return items;
}

function resp(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function isoFromKma(t) {
  // t = YYYYMMDDHHmm
  const y = +t.slice(0, 4), mo = +t.slice(4, 6) - 1, d = +t.slice(6, 8);
  const h = +t.slice(8, 10), mi = +t.slice(10, 12);
  return new Date(y, mo, d, h, mi).toISOString();
}

/** 발표시각 후보. ncst: 정시(HH00), fcst: 30분(HH30). */
function baseCandidates(now, hoursBack, kind) {
  const base = new Date(now);
  const minuteCut = 45;
  if (base.getMinutes() < minuteCut) base.setHours(base.getHours() - 1);
  const mm = kind === "fcst" ? "30" : "00";
  return Array.from({ length: hoursBack + 1 }, (_, i) => {
    const c = new Date(base);
    c.setHours(base.getHours() - i);
    return {
      date: `${c.getFullYear()}${p2(c.getMonth() + 1)}${p2(c.getDate())}`,
      time: `${p2(c.getHours())}${mm}`,
    };
  });
}

function p2(n) {
  return String(n).padStart(2, "0");
}

/** 초단기예보 RN1(강수량)은 "강수없음" 또는 "1.0mm" 같은 문자열 → mm 숫자로 */
function parseRn1(v) {
  if (v == null) return 0;
  const s = String(v);
  if (s.includes("강수없음") || s === "-" || s.trim() === "") return 0;
  const m = s.match(/[\d.]+/);
  return m ? Number(m[0]) : 0;
}

/** 위경도 → 기상청 격자 (DFS) */
function latLonToGrid(lat, lon) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0;
  const OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136, DEGRAD = Math.PI / 180;
  const re = RE / GRID, slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD, olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  return {
    x: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    y: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}
