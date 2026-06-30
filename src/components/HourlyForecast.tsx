import { useMemo } from "react";
import type { HourlyReading } from "../hooks/useReading";
import type { Reading } from "../lib/reading";
import { STAGE_RANK, type StageLevel } from "../lib/stages";

interface Props {
  hourly: HourlyReading[];
  reading: Reading | null;
  loading: boolean;
}

const STAGE_VAR: Record<StageLevel, string> = {
  normal: "var(--stage-normal)",
  interest: "var(--stage-interest)",
  warning: "var(--stage-warning)",
  danger: "var(--stage-danger)",
};

const W = 40; // 시간 1칸 너비

interface RiskWindow {
  from: number;
  to: number;
  level: StageLevel;
}

function windowsOf(items: { hour: number; level: StageLevel }[]): RiskWindow[] {
  const out: RiskWindow[] = [];
  let cur: RiskWindow | null = null;
  for (const it of items) {
    if (it.level !== "normal") {
      if (cur && STAGE_RANK[it.level] === STAGE_RANK[cur.level]) cur.to = it.hour;
      else {
        if (cur) out.push(cur);
        cur = { from: it.hour, to: it.hour, level: it.level };
      }
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function tempAdvice(level: StageLevel): string {
  return level === "danger"
    ? "옥외 고강도 작업 중지 권고"
    : level === "warning"
      ? "고강도 작업 조정·휴식 확대"
      : "수분·휴식 등 예방 강화";
}

function rainAdvice(level: StageLevel): string {
  return level === "danger"
    ? "옥외작업 중지·안전지대 대피 권고"
    : level === "warning"
      ? "저지대·고소작업 조정, 배수 점검·비상대기"
      : "우천 보호구 착용·미끄럼·감전 주의";
}

function snowAdvice(level: StageLevel): string {
  return level === "danger"
    ? "옥외작업 중지·제설 비상 투입 권고"
    : level === "warning"
      ? "제설·미끄럼 방지, 고소·중장비 작업 조정"
      : "방한·미끄럼 방지 보호구·결빙 주의";
}

function renderTempBars(hourly: HourlyReading[]) {
  const temps = hourly.map((h) => h.feelsLikeC);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(6, max - min);
  const H = 150;
  const padTop = 26;
  const barW = 22;
  return hourly.map((h, i) => {
    const ratio = (h.feelsLikeC - min) / span;
    const barH = padTop + ratio * H;
    const x = i * W + (W - barW) / 2;
    const y = 190 - barH;
    return (
      <g key={i}>
        <rect
          x={x}
          y={y}
          width={barW}
          height={barH}
          rx="6"
          fill={STAGE_VAR[h.level]}
          opacity={h.level === "normal" ? 0.45 : 1}
        />
        <text x={i * W + W / 2} y={y - 6} className="forecast__val">
          {Math.round(h.feelsLikeC)}°
        </text>
        <text x={i * W + W / 2} y={185} className="forecast__hr">
          {h.time.getHours()}시
        </text>
      </g>
    );
  });
}

function renderPrecipBars(hourly: HourlyReading[], isSnow: boolean) {
  const max = Math.max(isSnow ? 3 : 10, ...hourly.map((h) => h.rn1mm));
  const H = 150;
  const barW = 22;
  return hourly.map((h, i) => {
    const level = isSnow ? h.snowLevel : h.rainLevel;
    const ratio = h.rn1mm / max;
    const barH = 6 + ratio * H;
    const x = i * W + (W - barW) / 2;
    const y = 190 - barH;
    const dry = h.rn1mm < 0.1;
    return (
      <g key={i}>
        <rect
          x={x}
          y={y}
          width={barW}
          height={barH}
          rx="6"
          fill={dry ? "var(--line-strong)" : STAGE_VAR[level]}
          opacity={dry ? 0.6 : 1}
        />
        <text x={i * W + W / 2} y={y - 6} className="forecast__val">
          {dry ? "0" : h.rn1mm < 10 ? h.rn1mm.toFixed(1) : Math.round(h.rn1mm)}
        </text>
        <text x={i * W + W / 2} y={185} className="forecast__hr">
          {h.time.getHours()}시
        </text>
      </g>
    );
  });
}

export function HourlyForecast({ hourly, reading, loading }: Props) {
  const hazard = reading?.primaryHazard;
  const isSnow = hazard === "snow";
  const isRain = hazard === "rain";
  const isPrecip = isRain || isSnow;

  const levelOf = (h: HourlyReading): StageLevel =>
    isSnow ? h.snowLevel : isRain ? h.rainLevel : h.level;

  const windows = useMemo(
    () => windowsOf(hourly.map((h) => ({ hour: h.time.getHours(), level: levelOf(h) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hourly, isSnow, isRain],
  );

  if (loading && hourly.length === 0) {
    return <section className="card pad">예보를 불러오는 중…</section>;
  }
  if (hourly.length === 0) {
    return (
      <section className="card pad empty">
        <p>시간대별 예보 데이터가 없습니다.</p>
        <p className="muted">현황 탭에서 위치를 먼저 조회해주세요.</p>
      </section>
    );
  }

  const title = isSnow
    ? "적설량 예보 · 작업 권고"
    : isRain
      ? "강수량 예보 · 작업 권고"
      : "체감온도 예보 · 작업시간 권고";
  const unit = isSnow ? "cm" : "mm";
  const basis = isSnow
    ? "1시간 예상 적설량(cm)"
    : isRain
      ? "1시간 예상 강수량(mm)"
      : reading?.model === "winter"
        ? "겨울(한파) 체감온도"
        : "여름(폭염) 체감온도";
  const precipAdvice = isSnow ? snowAdvice : rainAdvice;

  return (
    <section className="forecast">
      <div className="section-title">
        <b>시간대별</b> {title}
      </div>

      <div className="forecast__chartwrap">
        {isPrecip && <div className="forecast__unit">{unit}</div>}
        <svg
          className="forecast__chart"
          viewBox={`0 0 ${hourly.length * W} 190`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`시간대별 ${title}`}
        >
          {isPrecip ? renderPrecipBars(hourly, isSnow) : renderTempBars(hourly)}
        </svg>
      </div>

      <div className="forecast__advice card">
        {windows.length === 0 ? (
          <p className="advice advice--ok">
            {isSnow
              ? "✅ 향후 예보 구간 내 유의미한 적설이 없습니다."
              : isRain
                ? "✅ 향후 예보 구간 내 유의미한 강수가 없습니다."
                : "✅ 향후 예보 구간 내 위험 시간대가 없습니다. 일상 안전수칙을 유지하세요."}
          </p>
        ) : (
          <>
            <p className="advice advice--warn">
              {isSnow
                ? "⚠ 적설 시간대 작업 조정 권고"
                : isRain
                  ? "⚠ 강수 시간대 작업 조정 권고"
                  : "⚠ 위험 시간대 작업 조정 권고"}
            </p>
            <ul className="advice__list">
              {windows.map((w, i) => (
                <li key={i}>
                  <span className="advice__dot" style={{ background: STAGE_VAR[w.level] }} />
                  <b>
                    {w.from}시{w.from !== w.to ? `~${w.to}시` : ""}
                  </b>{" "}
                  {isPrecip ? precipAdvice(w.level) : tempAdvice(w.level)}
                </li>
              ))}
            </ul>
            <p className="muted">기준: {basis}</p>
          </>
        )}
      </div>
    </section>
  );
}
