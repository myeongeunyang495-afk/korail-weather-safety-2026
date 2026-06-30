import type { ForecastRow, WeatherWarning } from "../types/weather";
import { getWorstTimes } from "../lib/risk";
import NationalWarningsPanel from "./NationalWarningsPanel";
import RiskSummaryCards from "./RiskSummaryCards";
import HourlyRiskTable from "./HourlyRiskTable";
import LocationRefreshButton from "./LocationRefreshButton";

type SafetyDashboardProps = {
  siteName: string;
  currentRegionName: string;
  rows: ForecastRow[];
  warnings: WeatherWarning[];
  onLocationRefresh: () => Promise<void>;
};

export default function SafetyDashboard({
  siteName,
  currentRegionName,
  rows,
  warnings,
  onLocationRefresh,
}: SafetyDashboardProps) {
  const worstTimes = getWorstTimes(rows);

  const highestRiskRow =
    rows.find((row) => row.overallRisk === "위험") ??
    rows.find((row) => row.overallRisk === "경고") ??
    rows.find((row) => row.overallRisk === "주의") ??
    rows[0];

  return (
    <main className="safety-page">
      <section className="safety-hero">
        <div>
          <p className="eyebrow">{siteName}</p>
          <h1>AI 기상정보 대응 시스템</h1>
          <p className="hero-desc">
            폭염·한파는 체감온도 기준, 호우·강설은 강수·강설량 기준으로 표시합니다.
          </p>
        </div>

        <div className={`hero-alert ${highestRiskRow?.overallRisk ?? "정상"}`}>
          <span>현재 최고 위험 시간</span>
          <strong>
            {highestRiskRow ? `${highestRiskRow.time} ${highestRiskRow.overallRisk}` : "정보 없음"}
          </strong>
        </div>
      </section>

      <LocationRefreshButton onRefresh={onLocationRefresh} />

      <NationalWarningsPanel
        warnings={warnings}
        currentRegionName={currentRegionName}
      />

      <RiskSummaryCards rows={rows} worstTimes={worstTimes} />

      <HourlyRiskTable rows={rows} worstTimes={worstTimes} />
    </main>
  );
}