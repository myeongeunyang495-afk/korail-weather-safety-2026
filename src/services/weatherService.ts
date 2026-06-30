import type { ForecastRow, WeatherWarning } from "../types/weather";
import {
  getColdRisk,
  getHeatRisk,
  getOverallRisk,
  getRainRisk,
  getSnowRisk,
} from "../lib/risk";
import { getRequiredApparentTemperature } from "../lib/apparentTemperature";
import { mockForecastRows, mockWarnings } from "../mocks/weatherMock";

type RawKmaItem = {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
};

function toNumber(value: string | number | undefined | null, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (!value) return fallback;

  const text = String(value).trim();

  if (text.includes("강수없음") || text.includes("적설없음")) {
    return 0;
  }

  if (text.includes("1mm 미만") || text.includes("1cm 미만")) {
    return 0.5;
  }

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;

  const parsed = Number(match[0]);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKmaForecastItems(items: RawKmaItem[]): ForecastRow[] {
  const grouped = new Map<string, Record<string, string>>();

  for (const item of items) {
    const key = `${item.fcstDate}-${item.fcstTime}`;
    const current = grouped.get(key) ?? {};
    current[item.category] = item.fcstValue;
    grouped.set(key, current);
  }

  let previousApparentTemperature: number | null = null;

  return Array.from(grouped.entries())
    .map(([key, values]) => {
      const [, timeRaw] = key.split("-");
      const time = `${timeRaw.slice(0, 2)}:${timeRaw.slice(2, 4)}`;

      const temperature = toNumber(values.TMP ?? values.T1H, 0);
      const humidity = values.REH ? toNumber(values.REH, 0) : null;
      const windSpeed = values.WSD ? toNumber(values.WSD, 0) : null;
      const rainfall = toNumber(values.RN1 ?? values.PCP, 0);
      const snowfall = toNumber(values.SNO, 0);

      const mode =
        temperature >= 28 ? "heat" : temperature <= 5 ? "cold" : "normal";

      const apparentTemperature = getRequiredApparentTemperature({
        mode,
        temperature,
        humidity,
        windSpeed,
        previousValue: previousApparentTemperature,
      });

      previousApparentTemperature = apparentTemperature.value;

      const heatRisk = getHeatRisk(apparentTemperature.value);
      const coldRisk = getColdRisk(apparentTemperature.value);
      const rainRisk = getRainRisk(rainfall);
      const snowRisk = getSnowRisk(snowfall);

      return {
        time,
        temperature,
        humidity,
        windSpeed,
        apparentTemperature: apparentTemperature.value,
        apparentTemperatureSource: apparentTemperature.source,
        rainfall,
        snowfall,
        heatRisk,
        coldRisk,
        rainRisk,
        snowRisk,
        overallRisk: getOverallRisk({
          heatRisk,
          coldRisk,
          rainRisk,
          snowRisk,
        }),
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function fetchForecastRows(params: {
  nx: number;
  ny: number;
  baseDate: string;
  baseTime: string;
}): Promise<ForecastRow[]> {
  try {
    const searchParams = new URLSearchParams({
      nx: String(params.nx),
      ny: String(params.ny),
      baseDate: params.baseDate,
      baseTime: params.baseTime,
    });

    const response = await fetch(`/api/kma-forecast?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error("Forecast request failed.");
    }

    const data = await response.json();
    const items =
      data?.response?.body?.items?.item ??
      data?.body?.items?.item ??
      [];

    if (!Array.isArray(items) || items.length === 0) {
      return mockForecastRows;
    }

    return normalizeKmaForecastItems(items);
  } catch {
    return mockForecastRows;
  }
}

export async function fetchNationalWarnings(): Promise<WeatherWarning[]> {
  try {
    const response = await fetch("/api/kma-warnings");

    if (!response.ok) {
      throw new Error("Warning request failed.");
    }

    const data = await response.json();
    const items =
      data?.response?.body?.items?.item ??
      data?.body?.items?.item ??
      [];

    if (!Array.isArray(items) || items.length === 0) {
      return mockWarnings;
    }

    return items.map((item: any, index: number): WeatherWarning => ({
      id: String(item.id ?? item.tmFc ?? `warning-${index}`),
      regionName: String(item.areaName ?? item.regionName ?? item.regName ?? "전국"),
      warningType: normalizeWarningType(String(item.warnVar ?? item.warningType ?? "기타")),
      level: normalizeWarningLevel(String(item.warnStress ?? item.level ?? "주의보")),
      command: normalizeWarningCommand(String(item.command ?? item.warnCommand ?? "기타")),
      announcedAt: String(item.tmFc ?? item.announcedAt ?? ""),
      effectiveAt: String(item.startTime ?? item.effectiveAt ?? ""),
    }));
  } catch {
    return mockWarnings;
  }
}

function normalizeWarningType(value: string): WeatherWarning["warningType"] {
  const trimmed = value.trim();
  const codeMap: Record<string, WeatherWarning["warningType"]> = {
    "3": "풍랑",
    "4": "강풍",
    "7": "황사",
    "9": "건조",
    "12": "호우",
    "15": "강풍",
    "16": "풍랑",
    "17": "태풍",
    "22": "대설",
    "33": "폭염",
    "44": "한파",
  };

  if (codeMap[trimmed]) return codeMap[trimmed];
  if (value.includes("폭염")) return "폭염";
  if (value.includes("한파")) return "한파";
  if (value.includes("호우")) return "호우";
  if (value.includes("대설") || value.includes("폭설")) return "대설";
  if (value.includes("강풍")) return "강풍";
  if (value.includes("태풍")) return "태풍";
  if (value.includes("풍랑")) return "풍랑";
  if (value.includes("건조")) return "건조";
  if (value.includes("황사")) return "황사";
  return "기타";
}

function normalizeWarningLevel(value: string): WeatherWarning["level"] {
  const trimmed = value.trim();

  if (["2", "경보"].includes(trimmed) || value.includes("경보")) return "경보";
  if (value.includes("예비")) return "예비특보";
  return "주의보";
}

function normalizeWarningCommand(value: string): WeatherWarning["command"] {
  const trimmed = value.trim();

  if (["1", "발표"].includes(trimmed) || value.includes("발표")) return "발표";
  if (["3", "해제"].includes(trimmed) || value.includes("해제")) return "해제";
  if (["5", "연장"].includes(trimmed) || value.includes("연장")) return "연장";
  if (["2", "4", "6", "7", "변경"].includes(trimmed) || value.includes("변경") || value.includes("대치")) return "변경";
  return "기타";
}
