import { useState } from "react";
import {
  getLocationRefreshStatus,
  markLocationRefreshed,
} from "../lib/locationRefreshLimit";

type LocationRefreshButtonProps = {
  onRefresh: () => Promise<void>;
};

export default function LocationRefreshButton({
  onRefresh,
}: LocationRefreshButtonProps) {
  const [status, setStatus] = useState(getLocationRefreshStatus());
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const latestStatus = getLocationRefreshStatus();

    if (!latestStatus.canRefresh) {
      setStatus(latestStatus);
      return;
    }

    setLoading(true);

    try {
      await onRefresh();
      markLocationRefreshed();
      setStatus(getLocationRefreshStatus());
    } finally {
      setLoading(false);
    }
  }

  const remainingMinutes = Math.ceil(status.remainingMs / 1000 / 60);

  return (
    <div className="location-refresh-box">
      <button
        type="button"
        onClick={handleClick}
        disabled={!status.canRefresh || loading}
      >
        {loading ? "현 위치 확인 중" : "현 위치 새로고침"}
      </button>

      <p>
        {status.canRefresh
          ? "개인정보 보호를 위해 위치는 날씨 조회에만 사용됩니다."
          : status.remainingMs > 0
            ? `${remainingMinutes}분 후 다시 새로고침할 수 있습니다.`
            : `이번 세션의 위치 새로고침 가능 횟수를 초과했습니다. (${status.refreshCount}/${status.maxPerSession})`}
      </p>
    </div>
  );
}