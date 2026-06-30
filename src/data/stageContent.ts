/**
 * 단계별 안전조치 콘텐츠 (현장 표출 문구).
 *
 * - 폭염(heat): KORAIL 수도권서부본부 원본 서비스의 검증된 문구를 그대로 사용한다.
 * - 한파(cold)·호우(rain): KOSHA 한랭질환 예방 가이드·기상청 호우 안전수칙 기반 "초안"이며,
 *   draft=true 로 표시한다. 정식 배포 전 KORAIL 안전보건처 검토·확정이 필요하다.
 */
import type { HazardKind, StageLevel } from "../lib/stages";

export interface StageMeta {
  level: StageLevel;
  /** 단계 명칭: 정상/관심/주의보/경보 */
  label: string;
  emoji: string;
  /** 안전 색상 (현장 인지성 유지를 위해 고정) */
  color: string;
  /** 임계 라벨 (예: "31°C 이상") */
  thresholdLabel: string;
  /** 배너/카드 머리말 */
  headline: string;
  /** 조치사항 목록 */
  actions: string[];
  /** true = 검토 필요(한파/호우 초안) */
  draft?: boolean;
}

const SAFETY_COLORS = {
  normal: "#16a34a",
  interest: "#ca8a04",
  warning: "#ea580c",
  danger: "#dc2626",
} as const;

const EMOJI = {
  normal: "😊",
  interest: "⚡",
  warning: "⚠️",
  danger: "🚨",
} as const;

export const STAGE_CONTENT: Record<HazardKind, Record<StageLevel, StageMeta>> = {
  // ── 폭염 (원본 검증 문구) ──────────────────────────────
  heat: {
    normal: {
      level: "normal",
      label: "정상",
      emoji: EMOJI.normal,
      color: SAFETY_COLORS.normal,
      thresholdLabel: "31°C 미만",
      headline: "체감온도 정상 단계 (체감온도 31°C 미만)",
      actions: [
        "현재 체감온도 양호 (안전 근무 가능 상태)",
        "정기적인 시원한 수분(음용수) 섭취 지도",
        "일상적인 현장 보건 예방 체계 상시 유지",
      ],
    },
    interest: {
      level: "interest",
      label: "관심",
      emoji: EMOJI.interest,
      color: SAFETY_COLORS.interest,
      thresholdLabel: "31°C 이상",
      headline: "관심 단계 (체감온도 31°C 이상)",
      actions: [
        "근로자 대상 온열질환 예방교육 철저",
        "휴게시간: 시간당 10~15분 이상 휴식 제공",
        "개인용 보냉장구 사전 준비 및 필요시 즉시 지급",
        "폭염 업무담당자 지정 및 근로자 건강상태 수시 확인",
      ],
    },
    warning: {
      level: "warning",
      label: "폭염주의보",
      emoji: EMOJI.warning,
      color: SAFETY_COLORS.warning,
      thresholdLabel: "33°C 이상",
      headline: "폭염주의보 단계 (체감온도 33°C 이상)",
      actions: [
        "근로자 대상 온열질환 예방교육 철저",
        "휴게시간: 시간당 10~15분 이상 휴식 취해야 함",
        "휴식 부여가 곤란한 경우 개인용 보냉장구 또는 냉방·통풍장치 지급 및 가동",
      ],
    },
    danger: {
      level: "danger",
      label: "폭염경보",
      emoji: EMOJI.danger,
      color: SAFETY_COLORS.danger,
      thresholdLabel: "35°C 이상",
      headline: "폭염경보 단계 (체감온도 35°C 이상)",
      actions: [
        "근로자 대상 온열질환 예방교육 철저",
        "휴게시간: 매 시간당 15분 이상 의무 휴식 부여",
        "온열질환 의심자 즉시 작업 중단 및 휴식시간 추가 배정",
        "무더위 시간대(14~17시) 불가피한 경우 제외하고 옥외작업 중지 권고",
      ],
    },
  },

  // ── 한파 (초안 · 검토 필요) ────────────────────────────
  cold: {
    normal: {
      level: "normal",
      label: "정상",
      emoji: EMOJI.normal,
      color: SAFETY_COLORS.normal,
      thresholdLabel: "-10°C 초과",
      headline: "체감온도 정상 단계 (한파 위험 낮음)",
      draft: true,
      actions: [
        "현재 체감온도 양호 (정상 근무 가능 상태)",
        "따뜻한 물 등 온음료 수시 섭취 지도",
        "방한복·방한장구 착용 상태 점검",
      ],
    },
    interest: {
      level: "interest",
      label: "관심",
      emoji: EMOJI.interest,
      color: SAFETY_COLORS.interest,
      thresholdLabel: "-10°C 이하",
      headline: "한파 관심 단계 (체감온도 -10°C 이하)",
      draft: true,
      actions: [
        "근로자 대상 한랭질환 예방교육 및 작업 전 건강상태 확인",
        "따뜻한 휴게공간(난방) 확보 및 수시 휴식",
        "방한복·방한화·방한장갑 등 개인 보온장구 지급·착용",
      ],
    },
    warning: {
      level: "warning",
      label: "한파주의보",
      emoji: EMOJI.warning,
      color: SAFETY_COLORS.warning,
      thresholdLabel: "-12°C 이하",
      headline: "한파주의보 단계 (체감온도 -12°C 이하)",
      draft: true,
      actions: [
        "고령자·고혈압 등 취약 근로자 옥외작업 조정",
        "시간당 따뜻한 장소에서 휴식 부여",
        "결빙·미끄럼 구간 점검 및 제설·미끄럼 방지 조치",
        "2인 1조 작업 및 상호 건강상태 수시 확인",
      ],
    },
    danger: {
      level: "danger",
      label: "한파경보",
      emoji: EMOJI.danger,
      color: SAFETY_COLORS.danger,
      thresholdLabel: "-15°C 이하",
      headline: "한파경보 단계 (체감온도 -15°C 이하)",
      draft: true,
      actions: [
        "불가피한 경우 제외 옥외 고강도 작업 중지 권고",
        "한랭질환(저체온증·동상) 의심자 즉시 작업 중단·보온·응급조치",
        "단독작업 금지, 비상연락체계 상시 유지",
        "혹한 시간대(새벽·심야) 옥외작업 최소화",
      ],
    },
  },

  // ── 호우 (초안 · 검토 필요) ────────────────────────────
  rain: {
    normal: {
      level: "normal",
      label: "정상",
      emoji: EMOJI.normal,
      color: SAFETY_COLORS.normal,
      thresholdLabel: "무강수",
      headline: "강수 없음 (호우 위험 낮음)",
      draft: true,
      actions: [
        "강수 없음 — 일상 안전수칙 유지",
        "기상 변화 및 호우 특보 발효 여부 수시 확인",
      ],
    },
    interest: {
      level: "interest",
      label: "관심",
      emoji: EMOJI.interest,
      color: SAFETY_COLORS.interest,
      thresholdLabel: "강수 있음",
      headline: "강수 관심 단계 (비/눈)",
      draft: true,
      actions: [
        "우의·미끄럼 방지 신발 등 우천 보호구 착용",
        "젖은 노면·선로 미끄럼 및 시야 저하 주의",
        "전기·신호 설비 인근 감전 위험 점검",
      ],
    },
    warning: {
      level: "warning",
      label: "호우주의보",
      emoji: EMOJI.warning,
      color: SAFETY_COLORS.warning,
      thresholdLabel: "호우주의보",
      headline: "호우주의보 단계",
      draft: true,
      actions: [
        "저지대·하천변·법면 등 침수·붕괴 위험구역 작업 조정",
        "옥외 고소·중장비 작업 일시 중지 검토",
        "배수·양수 설비 점검 및 비상 대기",
        "근로자 비상연락 및 대피경로 사전 공유",
      ],
    },
    danger: {
      level: "danger",
      label: "호우경보",
      emoji: EMOJI.danger,
      color: SAFETY_COLORS.danger,
      thresholdLabel: "호우경보",
      headline: "호우경보 단계",
      draft: true,
      actions: [
        "침수·산사태·붕괴 위험구역 옥외작업 중지 권고",
        "근로자 안전지대 대피 및 인원 점검",
        "선로 침수·토사유입 등 시설피해 즉시 보고",
        "기상 호전 및 안전 확인 전 작업 재개 금지",
      ],
    },
  },

  // ── 폭설 (초안 · 검토 필요) ────────────────────────────
  snow: {
    normal: {
      level: "normal",
      label: "정상",
      emoji: EMOJI.normal,
      color: SAFETY_COLORS.normal,
      thresholdLabel: "적설 없음",
      headline: "적설 없음 (폭설 위험 낮음)",
      draft: true,
      actions: [
        "적설 없음 — 일상 안전수칙 유지",
        "기상 변화 및 대설 특보 발효 여부 수시 확인",
      ],
    },
    interest: {
      level: "interest",
      label: "관심",
      emoji: EMOJI.interest,
      color: SAFETY_COLORS.interest,
      thresholdLabel: "강설",
      headline: "강설 관심 단계",
      draft: true,
      actions: [
        "방한·미끄럼 방지 보호구 착용",
        "결빙·미끄럼 구간 주의 및 제설 준비",
        "전차선·신호설비 착설(着雪) 점검",
      ],
    },
    warning: {
      level: "warning",
      label: "대설주의보",
      emoji: EMOJI.warning,
      color: SAFETY_COLORS.warning,
      thresholdLabel: "시간당 1cm↑",
      headline: "대설주의보 단계",
      draft: true,
      actions: [
        "제설·융설 작업 및 미끄럼 방지 조치",
        "옥외 고소·중장비 작업 조정",
        "선로 전환기·분기기 결빙 점검",
        "근로자 보온 및 2인 1조 작업",
      ],
    },
    danger: {
      level: "danger",
      label: "대설경보",
      emoji: EMOJI.danger,
      color: SAFETY_COLORS.danger,
      thresholdLabel: "시간당 3cm↑",
      headline: "대설경보 단계",
      draft: true,
      actions: [
        "불가피한 경우 제외 옥외작업 중지 권고",
        "열차 운행·선로 적설 상황 즉시 보고",
        "고립·저체온 대비 비상연락·대피체계 유지",
        "제설 인력·장비 비상 투입",
      ],
    },
  },
};

/** 위험 종류 한글명 */
export const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "폭염",
  cold: "한파",
  rain: "호우",
  snow: "폭설",
};

export function getStageMeta(hazard: HazardKind, level: StageLevel): StageMeta {
  return STAGE_CONTENT[hazard][level];
}
