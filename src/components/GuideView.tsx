import { useState } from "react";
import { EMERGENCY_GUIDES, EMERGENCY_CALL } from "../data/emergency";
import { STAGE_CONTENT } from "../data/stageContent";
import type { Reading } from "../lib/reading";

interface Props {
  reading: Reading | null;
}

type Tab = "heat" | "cold";

export function GuideView({ reading }: Props) {
  const [tab, setTab] = useState<Tab>(reading?.model === "winter" ? "cold" : "heat");
  const guides = EMERGENCY_GUIDES.filter((g) => g.kind === tab);
  const stages = STAGE_CONTENT[tab];

  return (
    <section className="safety">
      <div className="section-title">
        <b>응급조치</b> 가이드 & 단계 기준
      </div>

      <div className="seg seg--full">
        <button className={`seg__btn ${tab === "heat" ? "is-on" : ""}`} onClick={() => setTab("heat")}>
          온열질환(폭염)
        </button>
        <button className={`seg__btn ${tab === "cold" ? "is-on" : ""}`} onClick={() => setTab("cold")}>
          한랭질환(한파)
        </button>
      </div>

      <a className="callbtn" href={`tel:${EMERGENCY_CALL}`}>
        <span className="callbtn__num">{EMERGENCY_CALL}</span>
        <span>중증 의심 시 즉시 신고</span>
      </a>

      {guides.map((g) => (
        <article key={g.id} className="card egc">
          <header className="egc__head">
            <h3>{g.title}</h3>
            {g.red && <span className="egc__red">위급</span>}
          </header>
          <p className="egc__sum">{g.summary}</p>
          <div className="egc__cols">
            <div>
              <h4>증상</h4>
              <ul className="dots">
                {g.symptoms.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>응급조치</h4>
              <ol className="nums">
                {g.firstAid.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
          {g.red && <p className="egc__redline">🚨 {g.red}</p>}
        </article>
      ))}

      <div className="card refbox">
        <h3 className="refbox__title">{tab === "heat" ? "폭염" : "한파"} 단계 기준</h3>
        <ul className="reftable">
          {(["normal", "interest", "warning", "danger"] as const).map((lv) => {
            const m = stages[lv];
            return (
              <li key={lv}>
                <span className="ref__dot" style={{ background: m.color }} />
                <b>{m.label}</b>
                <span className="ref__th">{m.thresholdLabel}</span>
              </li>
            );
          })}
        </ul>
        {tab === "cold" && (
          <p className="draft-note">※ 한파 기준·문구는 초안입니다(안전보건처 검토 예정).</p>
        )}
      </div>
    </section>
  );
}
