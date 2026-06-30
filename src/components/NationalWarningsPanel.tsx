import type { WeatherWarning } from "../types/weather";

type NationalWarningsPanelProps = {
  warnings: WeatherWarning[];
  currentRegionName: string;
};

export default function NationalWarningsPanel({
  warnings,
  currentRegionName,
}: NationalWarningsPanelProps) {
  const activeWarnings = warnings.filter((warning) => warning.command !== "해제");

  const warningCount = activeWarnings.filter((warning) => warning.level === "주의보").length;
  const alertCount = activeWarnings.filter((warning) => warning.level === "경보").length;
  const preAlertCount = activeWarnings.filter((warning) => warning.level === "예비특보").length;

  const myRegionWarnings = activeWarnings.filter((warning) =>
    warning.regionName.includes(currentRegionName)
  );

  const topWarnings = activeWarnings
    .slice()
    .sort((a, b) => {
      const weight = { 경보: 3, 주의보: 2, 예비특보: 1 };
      return weight[b.level] - weight[a.level];
    })
    .slice(0, 5);

  return (
    <section className="warning-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">전국 기상특보</p>
          <h2>오늘 주의보·경보 현황</h2>
        </div>

        <div className="warning-counts">
          <span className="count danger">경보 {alertCount}</span>
          <span className="count caution">주의보 {warningCount}</span>
          <span className="count prepare">예비 {preAlertCount}</span>
        </div>
      </div>

      <div className={myRegionWarnings.length > 0 ? "my-warning active" : "my-warning"}>
        <strong>내 현장 영향</strong>
        <span>
          {myRegionWarnings.length > 0
            ? myRegionWarnings
                .map((warning) => `${warning.regionName} ${warning.warningType}${warning.level}`)
                .join(", ")
            : "현재 현장 직접 특보 없음"}
        </span>
      </div>

      <div className="warning-list">
        {topWarnings.length === 0 ? (
          <p className="empty-text">현재 표시할 전국 기상특보가 없습니다.</p>
        ) : (
          topWarnings.map((warning) => (
            <article
              key={warning.id}
              className={`warning-item ${warning.level === "경보" ? "danger" : ""}`}
            >
              <strong>{warning.warningType}{warning.level}</strong>
              <span>{warning.regionName}</span>
              <small>{warning.announcedAt}</small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}