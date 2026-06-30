const LAST_REFRESH_KEY = "korail.location.lastRefreshAt";
const REFRESH_COUNT_KEY = "korail.location.refreshCount";

function getCooldownMs(): number {
  const minutes = Number(import.meta.env.VITE_LOCATION_REFRESH_COOLDOWN_MINUTES ?? 10);
  return minutes * 60 * 1000;
}

function getMaxPerSession(): number {
  return Number(import.meta.env.VITE_LOCATION_REFRESH_MAX_PER_SESSION ?? 3);
}

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.sessionStorage !== "undefined";
}

export function getLocationRefreshStatus() {
  const cooldownMs = getCooldownMs();
  const maxPerSession = getMaxPerSession();

  if (!canUseBrowserStorage()) {
    return {
      canRefresh: true,
      remainingMs: 0,
      refreshCount: 0,
      maxPerSession,
    };
  }

  const lastRefreshAt = Number(localStorage.getItem(LAST_REFRESH_KEY) ?? 0);
  const refreshCount = Number(sessionStorage.getItem(REFRESH_COUNT_KEY) ?? 0);

  const now = Date.now();
  const remainingMs = Math.max(0, cooldownMs - (now - lastRefreshAt));
  const exceededSessionLimit = refreshCount >= maxPerSession;

  return {
    canRefresh: remainingMs === 0 && !exceededSessionLimit,
    remainingMs,
    refreshCount,
    maxPerSession,
  };
}

export function markLocationRefreshed() {
  if (!canUseBrowserStorage()) return;

  const refreshCount = Number(sessionStorage.getItem(REFRESH_COUNT_KEY) ?? 0);

  localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
  sessionStorage.setItem(REFRESH_COUNT_KEY, String(refreshCount + 1));
}
