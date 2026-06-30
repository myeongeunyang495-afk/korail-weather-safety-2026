import type { ForecastRow, RiskLevel } from "../types/weather";

export type WorstTimes = {
  heat: string[];
  cold: string[];
  rain: string[];
  snow: string[];
};

export function getHeatRisk(apparentTemperature: number): RiskLevel {
  if (apparentTemperature >= 35) return "위험";
  if (apparentTemperature >= 33) return "경고";
  if (apparentTemperature >= 31) return "주의";
  return "정상";
}

export function getColdRisk(apparentTemperature: number): RiskLevel {
  if (apparentTemperature <= -15) return "위험";
  if (apparentTemperature <= -10) return "경고";
  if (apparentTemperature <= -5) return "주의";
  return "정상";
}

export function getRainRisk(rainfall: number): RiskLevel {
  if (rainfall >= 50) return "위험";
  if (rainfall >= 30) return "경고";
  if (rainfall >= 10) return "주의";
  return "정상";
}

export function getSnowRisk(snowfall: number): RiskLevel {
  if (snowfall >= 10) return "위험";
  if (snowfall >= 5) return "경고";
  if (snowfall > 0) return "주의";
  return "정상";
}

export function getOverallRisk(row: {
  heatRisk: RiskLevel;
  coldRisk: RiskLevel;
  rainRisk: RiskLevel;
  snowRisk: RiskLevel;
}): RiskLevel {
  const values = [row.heatRisk, row.coldRisk, row.rainRisk, row.snowRisk];

  if (values.includes("위험")) return "위험";
  if (values.includes("경고")) return "경고";
  if (values.includes("주의")) return "주의";
  return "정상";
}

export function getWorstTimes(rows: ForecastRow[]): WorstTimes {
  if (rows.length === 0) {
    return {
      heat: [],
      cold: [],
      rain: [],
      snow: [],
    };
  }

  const maxHeat = Math.max(...rows.map((row) => row.apparentTemperature));
  const minCold = Math.min(...rows.map((row) => row.apparentTemperature));
  const maxRain = Math.max(...rows.map((row) => row.rainfall));
  const maxSnow = Math.max(...rows.map((row) => row.snowfall));

  return {
    heat: rows
      .filter((row) => row.apparentTemperature === maxHeat)
      .map((row) => row.time),

    cold: rows
      .filter((row) => row.apparentTemperature === minCold)
      .map((row) => row.time),

    rain:
      maxRain <= 0
        ? []
        : rows.filter((row) => row.rainfall === maxRain).map((row) => row.time),

    snow:
      maxSnow <= 0
        ? []
        : rows.filter((row) => row.snowfall === maxSnow).map((row) => row.time),
  };
}

export function isWorstTime(
  worstTimes: WorstTimes,
  type: keyof WorstTimes,
  time: string
): boolean {
  return worstTimes[type].includes(time);
}