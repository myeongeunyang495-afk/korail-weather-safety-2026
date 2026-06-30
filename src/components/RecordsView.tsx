import { formatTimestamp } from "../lib/format";
import { LEVEL_LABEL, HAZARD_LABEL, type FieldRecord } from "../lib/records";

interface Props {
  records: FieldRecord[];
  onExport: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function RecordsView({ records, onExport, onRemove, onClear }: Props) {
  return (
    <section className="records">
      <div className="section-title">
        <b>체감온도</b> 기록일지 · {records.length}건
      </div>

      <p className="records__law card">
        체감온도 <b>31°C 이상</b>(또는 한파 임계 이하) 발생 시 「체감온도 기록일지」 작성·보관이
        필요합니다. 단계 팝업에서 <b>‘조치 완료’</b>를 누르면 자동 저장됩니다.
      </p>

      <div className="records__tools">
        <button className="btn btn--brand sm" onClick={onExport} disabled={!records.length}>
          CSV 내보내기
        </button>
        <button className="btn btn--ghost sm" onClick={() => window.print()} disabled={!records.length}>
          인쇄
        </button>
        <button
          className="btn btn--ghost sm danger"
          onClick={() => {
            if (records.length && confirm("모든 기록을 삭제할까요?")) onClear();
          }}
          disabled={!records.length}
        >
          전체 삭제
        </button>
      </div>

      {records.length === 0 ? (
        <div className="card pad empty">
          <p>아직 기록이 없습니다.</p>
          <p className="muted">관심 단계 이상 조회 후 ‘조치 완료’를 누르면 기록됩니다.</p>
        </div>
      ) : (
        <ul className="reclist">
          {records.map((r) => (
            <li key={r.id} className="rec card" data-level={r.level}>
              <div className="rec__main">
                <div className="rec__top">
                  <span className={`lvtag lvtag--${r.level}`}>
                    {HAZARD_LABEL[r.hazard]} {LEVEL_LABEL[r.level]}
                  </span>
                  <span className="rec__feel">{r.feelsLikeC.toFixed(1)}°C</span>
                </div>
                <p className="rec__loc">{r.location}</p>
                <p className="rec__meta">
                  {formatTimestamp(new Date(r.at))} · 기온 {r.tempC.toFixed(1)}° · 습도{" "}
                  {Math.round(r.humidityPct)}% · {r.source === "kma" ? "기상청" : "모의"}
                </p>
              </div>
              <button className="rec__del" onClick={() => onRemove(r.id)} aria-label="기록 삭제">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
