import type { ForecastRow } from "../types/weather";
import type { WorstTimes } from "../lib/risk";

type RiskSummaryCardsProps = {
  rows: ForecastRow[];
  worstTimes: WorstTimes;
};

export default function RiskSummaryCards({
  rows,
  worstTimes,
}: RiskSummaryCardsProps) {
  const maxHeat = Math.max(...rows.map((row) => row.apparentTemperature));
  const minCold = Math.min(...rows.map((row) => row.apparentTemperature));
  const maxRain = Math.max(...rows.map((row) => row.rainfall));
  const maxSnow = Math.max(...rows.map((row) => row.snowfall));

  return (
    <section className="risk-grid">
      <RiskCard
        title="폭염"
        value={`${maxHeat.toFixed(1)}℃`}
        time={worstTimes.heat.join(", ") || "-"}
        description="체감온도 최고 시간"
      />

      <RiskCard
        title="한파"
        value={`${minCold.toFixed(1)}℃`}
        time={worstTimes.cold.join(", ") || "-"}
        description="체감온도 최저 시간"
      />

      <RiskCard
        title="호우"
        value={`${maxRain}mm`}
        time={worstTimes.rain.join(", ") || "-"}
        description="강수량 최고 시간"
      />

      <RiskCard
        title="강설"
        value={`${maxSnow}cm`}
        time={worstTimes.snow.join(", ") || "-"}
        description="강설량 최고 시간"
      />
    </section>
  );
}

function RiskCard({
  title,
  value,
  time,
  description,
}: {
  title: string;
  value: string;
  time: string;
  description: string;
}) {
  return (
    <article className="risk-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{time}</p>
      <small>{description}</small>
    </article>
  );
}