/**
 * 기상청(KMA) 제공자 — 서버리스 프록시(/api/weather)를 통해 실데이터를 받는다.
 * 프록시가 키를 보유/응답하면 실데이터, 아니면 throw → 상위에서 Mock 으로 폴백.
 */
import type { HourlyPoint, WeatherNow, WeatherProvider } from "./types";

const ENDPOINT = "/api/weather";

interface NowResponse {
  temp: number;
  humidity: number;
  wind?: number;
  rn1?: number;
  pty?: number;
  base?: { date: string; time: string };
  grid?: { x: number; y: number };
}

interface HourlyResponse {
  hourly: Array<{
    time: string; // ISO
    temp: number;
    humidity?: number;
    wind?: number;
    pty?: number;
    rn1?: number;
  }>;
}

function parseBaseDate(base?: { date: string; time: string }): Date {
  if (!base) return new Date();
  const y = Number(base.date.slice(0, 4));
  const mo = Number(base.date.slice(4, 6)) - 1;
  const d = Number(base.date.slice(6, 8));
  const h = Number(base.time.slice(0, 2));
  const mi = Number(base.time.slice(2, 4));
  return new Date(y, mo, d, h, mi);
}

export function createKmaProvider(): WeatherProvider {
  return {
    async getNow(lat, lon): Promise<WeatherNow> {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      const res = await fetch(`${ENDPOINT}?${params}`);
      if (!res.ok) throw new Error(`weather proxy ${res.status}`);
      const data: NowResponse = await res.json();
      if (!Number.isFinite(data.temp) || !Number.isFinite(data.humidity)) {
        throw new Error("weather proxy: invalid payload");
      }
      return {
        tempC: data.temp,
        humidityPct: data.humidity,
        windMs: Number.isFinite(data.wind) ? (data.wind as number) : 0,
        rn1mm: Number.isFinite(data.rn1) ? (data.rn1 as number) : 0,
        pty: Number.isFinite(data.pty) ? (data.pty as number) : 0,
        observedAt: parseBaseDate(data.base),
        source: "kma",
        grid: data.grid,
      };
    },

    async getHourly(lat, lon): Promise<HourlyPoint[]> {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        mode: "hourly",
      });
      const res = await fetch(`${ENDPOINT}?${params}`);
      if (!res.ok) throw new Error(`weather proxy hourly ${res.status}`);
      const data: HourlyResponse = await res.json();
      if (!Array.isArray(data.hourly)) throw new Error("weather proxy: no hourly");
      return data.hourly.map((p) => ({
        time: new Date(p.time),
        tempC: p.temp,
        humidityPct: p.humidity ?? 0,
        windMs: p.wind ?? 0,
        pty: p.pty ?? 0,
        rn1mm: p.rn1 ?? 0,
      }));
    },
  };
}
