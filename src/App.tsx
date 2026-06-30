import { useEffect, useState } from "react";
import SafetyDashboard from "./components/SafetyDashboard";
import { fetchForecastRows, fetchNationalWarnings } from "./services/weatherService";
import { mockForecastRows, mockWarnings } from "./mocks/weatherMock";
import type { ForecastRow, WeatherWarning } from "./types/weather";
import "./styles/dashboard.css";

function App() {
  const [rows, setRows] = useState<ForecastRow[]>(mockForecastRows);
  const [warnings, setWarnings] = useState<WeatherWarning[]>(mockWarnings);

  const siteName = "서부본부 작업현장";
  const currentRegionName = "서울";

  async function loadWeatherData() {
    const forecastRows = await fetchForecastRows({
      nx: 60,
      ny: 127,
      baseDate: getBaseDate(),
      baseTime: getBaseTime(),
    });

    const nationalWarnings = await fetchNationalWarnings();

    setRows(forecastRows);
    setWarnings(nationalWarnings);
  }

  async function handleLocationRefresh() {
    await loadWeatherData();
  }

  useEffect(() => {
    document.title = "AI 기상정보 대응 시스템";
    loadWeatherData();
  }, []);

  return (
    <SafetyDashboard
      siteName={siteName}
      currentRegionName={currentRegionName}
      rows={rows}
      warnings={warnings}
      onLocationRefresh={handleLocationRefresh}
    />
  );
}

function getBaseDate(): string {
  const now = new Date();
  const baseDate = new Date(now);

  // 00~01시는 오늘 02시 발표 자료가 아직 없으므로 전날 23시 자료를 사용한다.
  if (now.getHours() < 2) {
    baseDate.setDate(baseDate.getDate() - 1);
  }

  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
  const dd = String(baseDate.getDate()).padStart(2, "0");

  return `${yyyy}${mm}${dd}`;
}

function getBaseTime(): string {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 2) return "2300";
  if (hour < 5) return "0200";
  if (hour < 8) return "0500";
  if (hour < 11) return "0800";
  if (hour < 14) return "1100";
  if (hour < 17) return "1400";
  if (hour < 20) return "1700";
  if (hour < 23) return "2000";

  return "2300";
}

export default App;