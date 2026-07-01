import { REGIONS } from "../data/regions";
import { computeFeelsLike } from "./feelsLike";
import {
  classifyCold,
  classifyHeat,
  classifyRain,
  classifySnow,
  STAGE_RANK,
  type HazardKind,
  type StageLevel,
} from "./stages";
import type { WeatherProvider } from "../providers/types";

export interface NationwideAlertRegion {
  sido: string;
  location: string;
  time: Date;
  level: StageLevel;
  value: number;
}

export interface NationwideAlert {
  hazard: HazardKind;
  level: StageLevel;
  regions: NationwideAlertRegion[];
}

const HAZARDS: HazardKind[] = ["heat", "rain", "snow", "cold"];

function representativeRegions() {
  return Object.entries(REGIONS).flatMap(([sido, sigungu]) => {
    const pick = sigungu[0];
    return pick ? [{ sido, location: `${sido} ${pick.name}`, lat: pick.lat, lon: pick.lon }] : [];
  });
}

function betterPick(hazard: HazardKind, next: NationwideAlertRegion, current: NationwideAlertRegion | null) {
  if (!current) return true;
  const rankDiff = STAGE_RANK[next.level] - STAGE_RANK[current.level];
  if (rankDiff !== 0) return rankDiff > 0;
  if (hazard === "cold") return next.value < current.value;
  return next.value > current.value;
}

export async function buildNationwideAlerts(provider: WeatherProvider): Promise<NationwideAlert[]> {
  const regions = representativeRegions();
  const byHazard: Record<HazardKind, NationwideAlertRegion[]> = {
    heat: [],
    rain: [],
    snow: [],
    cold: [],
  };

  const settled = await Promise.allSettled(
    regions.map(async (region) => {
      const hourly = await provider.getHourly(region.lat, region.lon);
      const picks: Record<HazardKind, NationwideAlertRegion | null> = {
        heat: null,
        rain: null,
        snow: null,
        cold: null,
      };

      for (const point of hourly) {
        const heatValue = computeFeelsLike({ tempC: point.tempC, humidityPct: point.humidityPct, windMs: point.windMs }, "summer");
        const coldValue = computeFeelsLike({ tempC: point.tempC, humidityPct: point.humidityPct, windMs: point.windMs }, "winter");
        const candidates: Record<HazardKind, NationwideAlertRegion> = {
          heat: { sido: region.sido, location: region.location, time: point.time, level: classifyHeat(heatValue), value: heatValue },
          rain: { sido: region.sido, location: region.location, time: point.time, level: classifyRain({ rn1mm: point.rn1mm, pty: point.pty }), value: point.rn1mm },
          snow: { sido: region.sido, location: region.location, time: point.time, level: classifySnow({ snoCm: point.rn1mm, pty: point.pty }), value: point.rn1mm },
          cold: { sido: region.sido, location: region.location, time: point.time, level: classifyCold(coldValue), value: coldValue },
        };

        for (const hazard of HAZARDS) {
          const candidate = candidates[hazard];
          if (betterPick(hazard, candidate, picks[hazard])) picks[hazard] = candidate;
        }
      }

      return picks;
    }),
  );

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const hazard of HAZARDS) {
      const pick = result.value[hazard];
      if (pick && STAGE_RANK[pick.level] >= STAGE_RANK.warning) byHazard[hazard].push(pick);
    }
  }

  return HAZARDS.map((hazard) => {
    const regionsForHazard = byHazard[hazard].sort((a, b) => {
      const rankDiff = STAGE_RANK[b.level] - STAGE_RANK[a.level];
      if (rankDiff !== 0) return rankDiff;
      return hazard === "cold" ? a.value - b.value : b.value - a.value;
    });
    const level = regionsForHazard.reduce<StageLevel>((max, item) => (STAGE_RANK[item.level] > STAGE_RANK[max] ? item.level : max), "normal");
    return { hazard, level, regions: regionsForHazard };
  });
}
