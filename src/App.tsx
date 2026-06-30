import { useCallback, useEffect, useRef, useState } from "react";
import { BrandHeader } from "./components/BrandHeader";
import { CurrentCard } from "./components/CurrentCard";
import { RegionPicker } from "./components/RegionPicker";
import { FavoriteBar } from "./components/FavoriteBar";
import { HourlyForecast } from "./components/HourlyForecast";
import { RecordsView } from "./components/RecordsView";
import { GuideView } from "./components/GuideView";
import { StageModal } from "./components/StageModal";
import { Onboarding } from "./components/Onboarding";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { useReading } from "./hooks/useReading";
import { useRecords } from "./hooks/useRecords";
import { useFavorites } from "./hooks/useFavorites";
import { makeRecordId, type FieldRecord } from "./lib/records";
import type { Reading } from "./lib/reading";
import type { HazardKind } from "./lib/stages";

function recordFromReading(r: Reading, note?: string): FieldRecord {
  const at = new Date();
  return {
    id: makeRecordId(at),
    at: at.toISOString(),
    location: r.location,
    hazard: r.primaryHazard,
    tempC: r.tempC,
    humidityPct: r.humidityPct,
    windMs: r.windMs,
    feelsLikeC: r.feelsLikeC,
    level: r.primaryLevel,
    source: r.source,
    note,
  };
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [modalReading, setModalReading] = useState<Reading | null>(null);
  const [forecastHazard, setForecastHazard] = useState<HazardKind | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const { reading, hourly, loading, error, queryByCoords, queryByGps } = useReading();
  const records = useRecords();
  const favorites = useFavorites();

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void queryByGps("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastReadingRef = useRef<Reading | null>(null);
  useEffect(() => {
    if (reading && reading !== lastReadingRef.current) {
      lastReadingRef.current = reading;
      if (!showOnboarding) setModalReading(reading);
    }
  }, [reading, showOnboarding]);

  const onConfirmStage = useCallback(
    (r: Reading) => {
      if (r.primaryLevel !== "normal") records.add(recordFromReading(r));
      setModalReading(null);
    },
    [records],
  );

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const isFav = reading ? favorites.has(reading.location) : false;

  return (
    <div className="app-bg">
      <div className="app-shell">
        <BrandHeader source={reading?.source} onInfo={() => setShowOnboarding(true)} />

        <main className="app-main">
          {tab === "home" && (
            <>
              <CurrentCard
                reading={reading}
                hourly={hourly}
                loading={loading}
                error={error}
                onGps={() => queryByGps("auto")}
                onOpenSafety={() => setTab("safety")}
                onOpenForecast={(hazard) => {
                  setForecastHazard(hazard);
                  setTab("forecast");
                }}
                onToggleFav={() => {
                  if (!reading) return;
                  if (isFav) {
                    const f = favorites.favorites.find((x) => x.label === reading.location);
                    if (f) favorites.remove(f.id);
                  } else {
                    favorites.add({ label: reading.location, lat: 0, lon: 0 });
                  }
                }}
                isFav={isFav}
              />
              <FavoriteBar
                favorites={favorites.favorites}
                onPick={(f) =>
                  f.lat || f.lon
                    ? queryByCoords(f.lat, f.lon, f.label, "auto")
                    : queryByGps("auto")
                }
                onRemove={favorites.remove}
              />
              <RegionPicker
                onQuery={(lat, lon, label) => {
                  void queryByCoords(lat, lon, label, "auto");
                  if (!favorites.has(label)) favorites.add({ label, lat, lon });
                }}
              />
            </>
          )}

          {tab === "forecast" && (
            <HourlyForecast
              hourly={hourly}
              reading={reading}
              loading={loading}
              hazardOverride={forecastHazard}
            />
          )}

          {tab === "records" && (
            <RecordsView
              records={records.records}
              onExport={records.exportCsv}
              onRemove={records.remove}
              onClear={records.clear}
            />
          )}

          {tab === "safety" && <GuideView reading={reading} />}
        </main>

        <BottomNav tab={tab} onTab={setTab} level={reading?.primaryLevel} recordCount={records.records.length} />
      </div>

      {modalReading && (
        <StageModal
          reading={modalReading}
          onConfirm={() => onConfirmStage(modalReading)}
          onClose={() => setModalReading(null)}
        />
      )}
      {showOnboarding && <Onboarding onClose={closeOnboarding} />}
    </div>
  );
}

