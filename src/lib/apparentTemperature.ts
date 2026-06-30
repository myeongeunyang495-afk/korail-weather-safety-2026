import type { ApparentTemperatureSource } from "../types/weather";

export type ApparentTemperatureResult = {
  value: number;
  source: ApparentTemperatureSource;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 여름철 체감온도 계산.
 * 기온과 상대습도를 이용해 습구온도를 근사한 뒤 체감온도를 산출한다.
 */
export function calculateSummerApparentTemperature(
  temperature: number,
  humidity: number
): number {
  const ta = temperature;
  const rh = Math.min(100, Math.max(0, humidity));

  const wetBulbTemperature =
    ta * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(ta + rh) -
    Math.atan(rh - 1.67633) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;

  const apparentTemperature =
    -0.2442 +
    0.55399 * wetBulbTemperature +
    0.45535 * ta -
    0.0022 * Math.pow(wetBulbTemperature, 2) +
    0.00278 * wetBulbTemperature * ta +
    3.0;

  return round1(apparentTemperature);
}

/**
 * 겨울철 체감온도 계산.
 * 입력 풍속은 m/s이며, 산식 계산을 위해 km/h로 변환한다.
 */
export function calculateWinterApparentTemperature(
  temperature: number,
  windSpeedMs: number
): number {
  const ta = temperature;
  const windSpeedKmh = Math.max(windSpeedMs * 3.6, 1);

  const apparentTemperature =
    13.12 +
    0.6215 * ta -
    11.37 * Math.pow(windSpeedKmh, 0.16) +
    0.3965 * Math.pow(windSpeedKmh, 0.16) * ta;

  return round1(apparentTemperature);
}

export function getRequiredApparentTemperature(params: {
  mode: "heat" | "cold" | "normal";
  temperature: number;
  humidity: number | null;
  windSpeed: number | null;
  officialValue?: number | null;
  previousValue?: number | null;
}): ApparentTemperatureResult {
  const {
    mode,
    temperature,
    humidity,
    windSpeed,
    officialValue,
    previousValue,
  } = params;

  if (typeof officialValue === "number" && Number.isFinite(officialValue)) {
    return {
      value: round1(officialValue),
      source: "official",
    };
  }

  if (mode === "heat" && typeof humidity === "number" && Number.isFinite(humidity)) {
    return {
      value: calculateSummerApparentTemperature(temperature, humidity),
      source: "calculated",
    };
  }

  if (mode === "cold" && typeof windSpeed === "number" && Number.isFinite(windSpeed)) {
    return {
      value: calculateWinterApparentTemperature(temperature, windSpeed),
      source: "calculated",
    };
  }

  if (typeof previousValue === "number" && Number.isFinite(previousValue)) {
    return {
      value: round1(previousValue),
      source: "estimated",
    };
  }

  return {
    value: round1(temperature),
    source: "estimated",
  };
}
