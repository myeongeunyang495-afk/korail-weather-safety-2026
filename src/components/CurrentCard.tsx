import { useState, type CSSProperties } from "react";
import { Thermometer } from "./Thermometer";
import { ShareSheet } from "./ShareSheet";
import { getStageMeta, HAZARD_LABEL } from "../data/stageContent";
import { formatObservedAt, formatTemp } from "../lib/format";
import type { HourlyReading, NationwideAlert } from "../hooks/useReading";
import type { Reading } from "../lib/reading";
import { STAGE_RANK, type HazardKind, type StageLevel } from "../lib/stages";

interface Props {
  reading: Reading | null;
  hourly: HourlyReading[];
  nationwideAlerts: NationwideAlert[];
  loading: boolean;
  error: string | null;
  onGps: () => void;
  onToggleFav: () => void;
  onOpenSafety: () => void;
  onOpenForecast: (hazard: HazardKind) => void;
  isFav: boolean;
}

const DISPLAY_HAZARDS: HazardKind[] = ["heat", "rain", "snow", "cold"];
const SUMMER_HAZARDS: HazardKind[] = ["heat", "rain"];
const WINTER_HAZARDS: HazardKind[] = ["snow", "cold"];

const HAZARD_STAGE_KEY: Record<HazardKind, keyof Pick<HourlyReading, "heatLevel" | "rainLevel" | "snowLevel" | "coldLevel">> = {
  heat: "heatLevel",
  rain: "rainLevel",
  snow: "snowLevel",
  cold: "coldLevel",
};

function maxLevel(levels: StageLevel[]): StageLevel {
  return levels.reduce<StageLevel>((max, level) => (STAGE_RANK[level] > STAGE_RANK[max] ? level : max), "normal");
}

function dateShort(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function levelText(hazard: HazardKind, level: StageLevel, date: Date) {
  if (level === "normal") return `${dateShort(date)} 특보 없음`;
  if (level === "interest") return `${dateShort(date)} 관심 예상`;
  return `${dateShort(date)} ${HAZARD_LABEL[hazard]}${level === "danger" ? "경보" : "주의보"} 예상`;
}

function stageLabel(level: StageLevel) {
  return level === "normal" ? "안전" : level === "interest" ? "관심" : level === "warning" ? "주의보" : "경보";
}

function valueText(hazard: HazardKind, reading: Reading, hourly: HourlyReading[]) {
  if (hazard === "heat") {
    const values = [reading.feelsLikeC, ...hourly.map((h) => h.heatFeelsLikeC)].filter(Number.isFinite);
    return `최고 체감온도 ${formatTemp(Math.max(...values))}`;
  }
  if (hazard === "cold") {
    const values = [reading.feelsLikeC, ...hourly.map((h) => h.coldFeelsLikeC)].filter(Number.isFinite);
    return `최저 체감온도 ${formatTemp(Math.min(...values))}`;
  }
  if (hazard === "rain") {
    const values = [reading.rn1mm, ...hourly.map((h) => h.rn1mm)].filter(Number.isFinite);
    const max = Math.max(...values);
    return `최고 강수량 ${max < 10 ? max.toFixed(1) : Math.round(max)}mm`;
  }
  const values = [reading.primaryHazard === "snow" ? reading.rn1mm : 0, ...hourly.map((h) => h.rn1mm)].filter(Number.isFinite);
  const max = Math.max(...values);
  return `최고 적설량 ${max < 10 ? max.toFixed(1) : Math.round(max)}cm`;
}

function getOperationalSeason(date: Date) {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 11 ? "summer" : "winter";
}

function NationalAlertSummary({ alerts }: { alerts: NationwideAlert[] }) {
  const active = alerts.filter((alert) => alert.regions.length > 0);
  if (active.length === 0) {
    return <div className="nationwide-summary is-empty">전국 특보 발령 예상 지역 없음</div>;
  }

  return (
    <div className="nationwide-summary">
      <b>전국 특보 발령 예상</b>
      <div className="nationwide-summary__items">
        {active.map((alert) => {
          const meta = getStageMeta(alert.hazard, alert.level);
          const preview = alert.regions.slice(0, 2).map((item) => item.sido).join("·");
          return (
            <span key={alert.hazard} style={{ "--stage": meta.color } as CSSProperties}>
              {HAZARD_LABEL[alert.hazard]} {alert.regions.length}곳 · {preview}{alert.regions.length > 2 ? " 외" : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WeatherFocus({ reading, hourly, nationwideAlerts, onOpenSafety, onOpenForecast }: { reading: Reading; hourly: HourlyReading[]; nationwideAlerts: NationwideAlert[]; onOpenSafety: () => void; onOpenForecast: (hazard: HazardKind) => void }) {
  const [showInactive, setShowInactive] = useState(false);
  const season = getOperationalSeason(reading.observedAt);
  const activeHazards = season === "winter" ? WINTER_HAZARDS : SUMMER_HAZARDS;
  const inactiveHazards = DISPLAY_HAZARDS.filter((hazard) => !activeHazards.includes(hazard));
  const visibleHazards = showInactive ? DISPLAY_HAZARDS : activeHazards;
  const seasonText = season === "winter" ? "겨울 미해당" : "여름 미해당";

  const summaryFor = (hazard: HazardKind) => {
    const currentLevel = reading.primaryHazard === hazard ? reading.primaryLevel : "normal";
    const forecastItems = hourly.map((h) => ({ time: h.time, level: h[HAZARD_STAGE_KEY[hazard]] as StageLevel }));
    const level = maxLevel([currentLevel, ...forecastItems.map((item) => item.level)]);
    const date = level !== "normal" ? forecastItems.find((item) => item.level === level)?.time ?? reading.observedAt : reading.observedAt;
    return { level, date };
  };

  return (
    <div className="weather-focus">
      <div className="weather-focus__chips" aria-label="예보 기반 위험 현황">
        {visibleHazards.map((hazard) => {
          const applicable = activeHazards.includes(hazard);
          const { level, date } = applicable ? summaryFor(hazard) : { level: "normal" as StageLevel, date: reading.observedAt };
          const meta = getStageMeta(hazard, level);
          return (
            <button key={hazard} className={`weather-focus__chip level-${level} ${applicable ? "" : "is-muted"}`} style={{ "--stage": applicable ? meta.color : "#94a3b8" } as CSSProperties} onClick={() => onOpenForecast(hazard)}>
              <b>{HAZARD_LABEL[hazard]}</b>
              <span>{applicable ? levelText(hazard, level, date) : seasonText}</span>
              <em>{applicable ? valueText(hazard, reading, hourly) : "필요 시 펼쳐 확인"}</em>
              <small>{applicable ? stageLabel(level) : "미해당"}</small>
            </button>
          );
        })}
      </div>
      {inactiveHazards.length > 0 && (
        <button className="weather-focus__toggle" onClick={() => setShowInactive((value) => !value)}>
          {showInactive ? "미해당 항목 숨기기" : "미해당 항목 보기"}
        </button>
      )}
      <NationalAlertSummary alerts={nationwideAlerts} />
      <button className="weather-focus__guide" onClick={onOpenSafety}>
        위험별 조치사항은 안전가이드에서 보기
      </button>
    </div>
  );
}

export function CurrentCard({ reading, hourly, nationwideAlerts, loading, error, onGps, onToggleFav, onOpenSafety, onOpenForecast, isFav }: Props) {
  const [share, setShare] = useState(false);
  const meta = reading ? getStageMeta(reading.primaryHazard, reading.primaryLevel) : null;

  return (
    <section className="current" style={meta ? ({ "--stage": meta.color } as CSSProperties) : undefined}>
      <button className="btn btn--gps" onClick={onGps} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
        {loading ? "위치·날씨 분석 중…" : "내 위치 실시간 조회"}
      </button>
      <p className="privacy-note">※ 위치 조회만 사용하며 별도 정보는 가져가지 않습니다.</p>

      {error && <p className="current__error">{error}</p>}

      {!reading && !error && (
        <div className="current__skeleton" aria-hidden="true">
          <div className="sk sk--num" />
          <div className="sk sk--row" />
          <div className="sk sk--row" />
        </div>
      )}

      {reading && meta && (
        <>
          <div className="current__hero">
            <Thermometer color={meta.color} feelsLikeC={reading.feelsLikeC} />
            <div className="current__big">
              <div className="current__feel">{formatTemp(reading.feelsLikeC)}</div>
              <div className="current__feel-cap">체감온도</div>
            </div>
          </div>

          <div className="stagechip" data-level={reading.primaryLevel}>
            <span className="stagechip__emoji">{meta.emoji}</span>
            <b>{meta.label}</b>
            <span className="stagechip__th">{meta.thresholdLabel}</span>
          </div>

          <WeatherFocus reading={reading} hourly={hourly} nationwideAlerts={nationwideAlerts} onOpenSafety={onOpenSafety} onOpenForecast={onOpenForecast} />

          <dl className="current__grid">
            <div><dt>기온</dt><dd>{formatTemp(reading.tempC)}</dd></div>
            <div><dt>습도</dt><dd>{Math.round(reading.humidityPct)}%</dd></div>
            <div><dt>바람</dt><dd>{reading.windMs.toFixed(1)}㎧</dd></div>
            <div><dt>강수량</dt><dd>{reading.rn1mm < 10 ? reading.rn1mm.toFixed(1) : Math.round(reading.rn1mm)}mm</dd></div>
            <div className="current__grid-wide"><dt>현재 지역</dt><dd>{reading.location}</dd></div>
            <div className="current__grid-wide"><dt>조회 시각</dt><dd className="current__time">{formatObservedAt(reading.observedAt)}</dd></div>
          </dl>

          <div className="current__actions">
            <button className={`btn btn--ghost ${isFav ? "is-fav" : ""}`} onClick={onToggleFav}>{isFav ? "★ 즐겨찾기됨" : "☆ 현장 즐겨찾기"}</button>
            <button className="btn btn--ghost" onClick={() => setShare(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 6l-4-4-4 4M12 2v13M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              현장 공유
            </button>
          </div>
        </>
      )}

      {share && reading && <ShareSheet reading={reading} onClose={() => setShare(false)} />}
    </section>
  );
}
