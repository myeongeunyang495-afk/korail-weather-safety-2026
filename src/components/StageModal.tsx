import type { CSSProperties } from "react";
import { getStageMeta, HAZARD_LABEL } from "../data/stageContent";
import { formatTemp } from "../lib/format";
import type { Reading } from "../lib/reading";

interface Props {
  reading: Reading;
  onConfirm: () => void;
  onClose: () => void;
}

export function StageModal({ reading, onConfirm, onClose }: Props) {
  const meta = getStageMeta(reading.primaryHazard, reading.primaryLevel);
  const willRecord = reading.primaryLevel !== "normal";
  const isRain = reading.primaryHazard === "rain";
  const isSnow = reading.primaryHazard === "snow";
  const amountText =
    reading.rn1mm < 10 ? reading.rn1mm.toFixed(1) : String(Math.round(reading.rn1mm));
  const headline = isSnow
    ? `시간당 적설량 ${amountText}cm`
    : isRain
      ? `시간당 강수량 ${amountText}mm`
      : `체감온도 ${formatTemp(reading.feelsLikeC)}`;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="단계별 조치사항">
      <div
        className="modal__win"
        style={{ "--stage": meta.color } as CSSProperties}
      >
        <div className="modal__bar" />
        <div className="modal__head">
          <span className="modal__emoji">{meta.emoji}</span>
          <div>
            <p className="modal__kicker">{HAZARD_LABEL[reading.primaryHazard]} · {meta.label} 단계</p>
            <h2 className="modal__title">{headline}</h2>
          </div>
        </div>

        <p className="modal__lead">
          코레일 안전수칙 지침에 따라 현재 단계에 맞는 현장 조치사항을 확인하세요.
        </p>

        <ul className="acts acts--modal">
          {meta.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>

        {willRecord && (
          <p className="modal__record">
            📋 ‘조치 완료’ 시 <b>체감온도 기록일지</b>에 자동 저장됩니다.
          </p>
        )}
        {meta.draft && (
          <p className="draft-note">※ 본 조치문구는 초안입니다(안전보건처 검토 예정).</p>
        )}

        <div className="modal__btns">
          <button className="btn btn--stage" onClick={onConfirm}>
            현장 확인 및 조치 완료
          </button>
          <button className="modal__later" onClick={onClose}>
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
