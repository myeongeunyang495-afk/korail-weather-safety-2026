/**
 * 메인 조회 상태 훅.
 * GPS/지역선택 좌표로 기상 실황+예보를 받아 종합 판정(Reading)과 시간대별 위험을 계산한다.
 * 표시 모드(ViewMode: 자동/폭염/호우/한파)는 조회 함수에 전달한다.
 * 요청 경합(빠른 연속 조회) 시 최신 요청만 반영한다.
 */
import { useCallback, useRef, useState } from "react";
import { createWeatherProvider } from "../providers";
import { computeReading, type Reading, type ViewMode } from "../lib/reading";
import { computeFeelsLike } from "../lib/feelsLike";
import {
  classifyCold,
  classifyHeat,
  classifyRain,
  classifySnow,
  type StageLevel,
} from "../lib/stages";
import { getBestPosition, reverseGeocode } from "../lib/geolocation";

export type { ViewMode } from "../lib/reading";

export interface HourlyReading {
  time: Date;
  tempC: number;
  feelsLikeC: number;
  /** 현재 표시 모델의 기온(체감온도) 기준 단계 */
  level: StageLevel;
  /** 폭염 체감온도 */
  heatFeelsLikeC: number;
  /** 폭염 체감온도 기준 단계 */
  heatLevel: StageLevel;
  /** 한파 체감온도 */
  coldFeelsLikeC: number;
  /** 한파 체감온도 기준 단계 */
  coldLevel: StageLevel;
  /** 1시간 예상 강수량 mm (적설은 cm 근사로 재사용) */
  rn1mm: number;
  /** 강수량 기준 호우 단계 */
  rainLevel: StageLevel;
  /** 적설 기준 폭설 단계 */
  snowLevel: StageLevel;
}

interface LastQuery {
  lat: number;
  lon: number;
  label: string;
}

/** GPS 실패 시 기본 위치 (서울특별시 중구) */
const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.978, label: "서울특별시 중구 (기본 위치)" };

export function useReading() {
  const providerRef = useRef(createWeatherProvider());
  const [reading, setReading] = useState<Reading | null>(null);
  const [hourly, setHourly] = useState<HourlyReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const last = useRef<LastQuery | null>(null);

  const queryByCoords = useCallback(
    async (lat: number, lon: number, label: string, mode: ViewMode = "auto") => {
      const id = ++reqId.current;
      last.current = { lat, lon, label };
      setLoading(true);
      setError(null);
      try {
        const provider = providerRef.current;
        const now = await provider.getNow(lat, lon);
        if (id !== reqId.current) return;
        const r = computeReading(now, label, mode);
        setReading(r);
        setHourly([]);
        // 시간대별 예보는 비차단으로 채운다 (기온 기반 체감온도 추이)
        provider
          .getHourly(lat, lon)
          .then((points) => {
            if (id !== reqId.current) return;
            const mapped = points.map<HourlyReading>((p) => {
              const feels = computeFeelsLike(
                { tempC: p.tempC, humidityPct: p.humidityPct, windMs: p.windMs },
                r.model,
              );
              const heatFeels = computeFeelsLike(
                { tempC: p.tempC, humidityPct: p.humidityPct, windMs: p.windMs },
                "summer",
              );
              const coldFeels = computeFeelsLike(
                { tempC: p.tempC, humidityPct: p.humidityPct, windMs: p.windMs },
                "winter",
              );
              const heatLevel = classifyHeat(heatFeels);
              const coldLevel = classifyCold(coldFeels);
              const level = r.model === "winter" ? coldLevel : heatLevel;
              const rainLevel = classifyRain({ rn1mm: p.rn1mm, pty: p.pty });
              const snowLevel = classifySnow({ snoCm: p.rn1mm, pty: p.pty });
              return {
                time: p.time,
                tempC: p.tempC,
                feelsLikeC: feels,
                level,
                heatFeelsLikeC: heatFeels,
                heatLevel,
                coldFeelsLikeC: coldFeels,
                coldLevel,
                rn1mm: p.rn1mm,
                rainLevel,
                snowLevel,
              };
            });
            setHourly(mapped);
          })
          .catch(() => {
            /* 예보 실패는 무시 */
          });
      } catch {
        if (id === reqId.current) setError("날씨 조회에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [],
  );

  const queryByGps = useCallback(
    async (mode: ViewMode = "auto") => {
      setLoading(true);
      setError(null);
      try {
        const { lat, lon } = await getBestPosition();
        const label = await reverseGeocode(lat, lon).catch(() => "현재 위치");
        await queryByCoords(lat, lon, label, mode);
      } catch {
        // GPS 거부/실패 시에도 화면이 비지 않도록 기본 위치(서울)로 폴백
        await queryByCoords(
          DEFAULT_LOCATION.lat,
          DEFAULT_LOCATION.lon,
          DEFAULT_LOCATION.label,
          mode,
        );
      }
    },
    [queryByCoords],
  );

  const refresh = useCallback(
    (mode: ViewMode = "auto") => {
      if (last.current) {
        const { lat, lon, label } = last.current;
        return queryByCoords(lat, lon, label, mode);
      }
      return queryByGps(mode);
    },
    [queryByCoords, queryByGps],
  );

  return { reading, hourly, loading, error, queryByCoords, queryByGps, refresh };
}


