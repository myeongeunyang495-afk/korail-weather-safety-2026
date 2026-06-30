export type RiskLevel = "정상" | "주의" | "경고" | "위험";

export type ApparentTemperatureSource =
  | "official"
  | "calculated"
  | "estimated"
  | "mock";

export type ForecastRow = {
  time: string;

  temperature: number;
  humidity: number | null;
  windSpeed: number | null;

  apparentTemperature: number;
  apparentTemperatureSource: ApparentTemperatureSource;

  rainfall: number;
  snowfall: number;

  heatRisk: RiskLevel;
  coldRisk: RiskLevel;
  rainRisk: RiskLevel;
  snowRisk: RiskLevel;
  overallRisk: RiskLevel;
};

export type WeatherWarningLevel = "주의보" | "경보" | "예비특보";

export type WeatherWarningType =
  | "폭염"
  | "한파"
  | "호우"
  | "대설"
  | "강풍"
  | "태풍"
  | "풍랑"
  | "건조"
  | "황사"
  | "기타";

export type WeatherWarning = {
  id: string;
  regionName: string;
  warningType: WeatherWarningType;
  level: WeatherWarningLevel;
  command: "발표" | "해제" | "변경" | "연장" | "기타";
  announcedAt: string;
  effectiveAt?: string;
};