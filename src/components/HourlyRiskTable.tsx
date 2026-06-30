import type { ForecastRow } from "../types/weather";
import { isWorstTime, type WorstTimes } from "../lib/risk";

type HourlyRiskTableProps = {
  rows: ForecastRow[];
  worstTimes: WorstTimes;
};

const sourceLabel = {
  official: "공식",
  calculated: "계산",
  estimated: "추정",
  mock: "임시",
};

export default function HourlyRiskTable({
  rows,
  worstTimes,
}: HourlyRiskTableProps) {
  return (
    <section className="table-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">시간대별 예보</p>
          <h2>최고 위험 시간 빨간색 표시</h2>
        </div>
      </div>

      <div className="table-scroll">
        <table className="risk-table">
          <thead>
            <tr>
              <th>시간</th>
              <th>실제기온</th>
              <th>체감온도</th>
              <th>호우</th>
              <th>강설</th>
              <th>종합상태</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const heatWorst = isWorstTime(worstTimes, "heat", row.time);
              const coldWorst = isWorstTime(worstTimes, "cold", row.time);
              const rainWorst = isWorstTime(worstTimes, "rain", row.time);
              const snowWorst = isWorstTime(worstTimes, "snow", row.time);

              const tempDanger = heatWorst || coldWorst;
              const rowDanger = tempDanger || rainWorst || snowWorst;

              return (
                <tr key={row.time} className={rowDanger ? "row-danger" : ""}>
                  <td className="time-cell">{row.time}</td>

                  <td>{row.temperature.toFixed(1)}℃</td>

                  <td className={tempDanger ? "danger-cell" : ""}>
                    <strong>{row.apparentTemperature.toFixed(1)}℃</strong>
                    <small>{sourceLabel[row.apparentTemperatureSource]}</small>
                  </td>

                  <td className={rainWorst ? "danger-cell" : ""}>
                    {row.rainfall}mm
                  </td>

                  <td className={snowWorst ? "danger-cell" : ""}>
                    {row.snowfall}cm
                  </td>

                  <td>
                    <span className={`status ${row.overallRisk}`}>
                      {row.overallRisk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}