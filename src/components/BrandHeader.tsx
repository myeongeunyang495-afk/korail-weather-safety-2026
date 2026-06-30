import type { ViewMode } from "../hooks/useReading";

interface Props {
  source?: "kma" | "mock";
  viewMode: ViewMode;
  onViewChange: (m: ViewMode) => void;
  onInfo: () => void;
}

const MODES: { key: ViewMode; label: string }[] = [
  { key: "auto", label: "자동" },
  { key: "heat", label: "폭염" },
  { key: "rain", label: "호우" },
  { key: "snow", label: "폭설" },
  { key: "cold", label: "한파" },
];

export function BrandHeader({ source, viewMode, onViewChange, onInfo }: Props) {
  return (
    <header className="brand">
      <div className="brand__top">
        <div className="brand__id">
          <span className="brand__logo" aria-hidden="true">
            KOR<span className="brand__ai">AI</span>L
          </span>
          <span className="brand__sub">작업현장 안전</span>
        </div>
        <button className="brand__info" onClick={onInfo} aria-label="서비스 안내">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="brand__titlerow">
        <h1 className="brand__title">AI 기상정보 대응 시스템</h1>
        <span className={`src-badge src-badge--${source ?? "mock"}`}>
          <span className="src-dot" />
          {source === "kma" ? "기상청 실시간" : "테스터"}
        </span>
      </div>

      <div className="seg" role="tablist" aria-label="표시 모드">
        {MODES.map((m) => (
          <button
            key={m.key}
            role="tab"
            aria-selected={viewMode === m.key}
            className={`seg__btn ${viewMode === m.key ? "is-on" : ""}`}
            onClick={() => onViewChange(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </header>
  );
}
