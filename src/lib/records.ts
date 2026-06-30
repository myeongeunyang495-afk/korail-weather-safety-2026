/**
 * 체감온도 기록일지 (法定 기록 자동화).
 *
 * 폭염 체감온도 31°C 이상(또는 한파 임계 이하) 발생 시, 작업현장은 「체감온도 기록일지」를
 * 작성·보관해야 한다. 본 모듈은 조회 1건을 기록 항목으로 만들고, CSV 로 내보낸다.
 */
import type { HazardKind, StageLevel } from "./stages";
import { formatTimestamp } from "./format";

export interface FieldRecord {
  id: string;
  /** 기록 시각 ISO */
  at: string;
  /** 위치명 */
  location: string;
  hazard: HazardKind;
  tempC: number;
  humidityPct: number;
  windMs: number;
  feelsLikeC: number;
  level: StageLevel;
  source: "kma" | "mock";
  /** 관리자 메모(조치 결과 등) */
  note?: string;
}

const LEVEL_LABEL: Record<StageLevel, string> = {
  normal: "정상",
  interest: "관심",
  warning: "주의보",
  danger: "경보",
};

const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "폭염",
  cold: "한파",
  rain: "호우",
  snow: "폭설",
};

/** 기록 ID 생성 (시각+난수, 충돌 방지) */
export function makeRecordId(at: Date): string {
  return `${at.getTime()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * 기록을 남겨야 하는 단계인지 (관심 단계 이상 = 31°C↑ 등).
 * 법정 기록 의무는 폭염 체감온도 31°C 이상부터이므로 관심 단계 이상을 대상으로 한다.
 */
export function shouldRecord(level: StageLevel): boolean {
  return level !== "normal";
}

/** 기록 배열 → CSV 문자열 (엑셀 호환, BOM 포함) */
export function toCsv(records: FieldRecord[]): string {
  const header = [
    "기록시각",
    "위치",
    "구분",
    "기온(°C)",
    "습도(%)",
    "풍속(m/s)",
    "체감온도(°C)",
    "단계",
    "출처",
    "메모",
  ];
  const rows = records.map((r) => [
    formatTimestamp(new Date(r.at)),
    r.location,
    HAZARD_LABEL[r.hazard],
    r.tempC.toFixed(1),
    String(Math.round(r.humidityPct)),
    r.windMs.toFixed(1),
    r.feelsLikeC.toFixed(1),
    LEVEL_LABEL[r.level],
    r.source === "kma" ? "기상청" : "모의",
    r.note ?? "",
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [header, ...rows].map((cols) => cols.map((c) => escape(String(c))).join(","));
  return "﻿" + lines.join("\r\n");
}

export { LEVEL_LABEL, HAZARD_LABEL };
