/** 체감온도 기록일지 — localStorage 영속 + CSV 내보내기 */
import { useCallback, useState } from "react";
import { loadJson, saveJson } from "../lib/storage";
import { toCsv, type FieldRecord } from "../lib/records";

const KEY = "feelslike.records";
const MAX = 1000;

export function useRecords() {
  const [records, setRecords] = useState<FieldRecord[]>(() =>
    loadJson<FieldRecord[]>(KEY, []),
  );

  const update = useCallback((next: FieldRecord[]) => {
    const capped = next.slice(0, MAX);
    setRecords(capped);
    saveJson(KEY, capped);
  }, []);

  const add = useCallback(
    (record: FieldRecord) => {
      setRecords((prev) => {
        const next = [record, ...prev].slice(0, MAX);
        saveJson(KEY, next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveJson(KEY, next);
      return next;
    });
  }, []);

  const clear = useCallback(() => update([]), [update]);

  const exportCsv = useCallback(() => {
    const blob = new Blob([toCsv(records)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `체감온도_기록일지_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  return { records, add, remove, clear, exportCsv };
}
