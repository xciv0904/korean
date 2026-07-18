import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import { useCallback, useEffect, useState } from "react";
import type { PracticeRecord } from "../types/sentence";

// 對應架構文件 2.3 節：使用者練習紀錄本機儲存在 IndexedDB。
// 兩個 object store：
// - practiceRecords：SRS 狀態 + 練習次數（依 sentenceId 查詢）
// - recordings：使用者錄音的 Blob 本體（依 audioBlobKey 查詢），
//   PracticeRecord.userRecordings 只存 key，不直接內嵌 Blob，避免單一
//   record 過大。

interface KoreanPracticeDB extends DBSchema {
  practiceRecords: {
    key: string; // sentenceId
    value: PracticeRecord;
    indexes: { "by-nextReviewAt": string };
  };
  recordings: {
    key: string; // audioBlobKey
    value: Blob;
  };
}

const DB_NAME = "korean-speaking-practice";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KoreanPracticeDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KoreanPracticeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("practiceRecords", {
          keyPath: "sentenceId",
        });
        store.createIndex("by-nextReviewAt", "srs.nextReviewAt");
        db.createObjectStore("recordings");
      },
    });
  }
  return dbPromise;
}

export async function getAllPracticeRecords(): Promise<PracticeRecord[]> {
  const db = await getDB();
  return db.getAll("practiceRecords");
}

export async function getPracticeRecord(
  sentenceId: string
): Promise<PracticeRecord | undefined> {
  const db = await getDB();
  return db.get("practiceRecords", sentenceId);
}

export async function putPracticeRecord(record: PracticeRecord): Promise<void> {
  const db = await getDB();
  await db.put("practiceRecords", record);
}

export async function saveRecordingBlob(
  key: string,
  blob: Blob
): Promise<void> {
  const db = await getDB();
  await db.put("recordings", blob, key);
}

export async function getRecordingBlob(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get("recordings", key);
}

// ---- 進度匯出/匯入(備份用)---------------------------------------------
// 只匯出 SRS 進度(practiceCount / lastPracticedAt / srs)跟錄音的
// timestamp+key 清單,不含錄音檔本體(Blob 不適合塞進 JSON,而且練習用
// 的自我檢查錄音本來就不是需要長期保存的資料)。清瀏覽器資料或換裝置前
// 匯出一份,之後可以匯入回來繼續複習進度。

export interface ProgressExport {
  version: 1;
  exportedAt: string;
  records: PracticeRecord[];
}

export async function exportProgress(): Promise<ProgressExport> {
  const records = await getAllPracticeRecords();
  return { version: 1, exportedAt: new Date().toISOString(), records };
}

function isPracticeRecord(x: unknown): x is PracticeRecord {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  if (typeof r.sentenceId !== "string") return false;
  if (!r.srs || typeof r.srs !== "object") return false;
  const srs = r.srs as Record<string, unknown>;
  return typeof srs.nextReviewAt === "string" && typeof srs.level === "number";
}

function extractRecords(data: unknown): PracticeRecord[] {
  if (Array.isArray(data)) return data.filter(isPracticeRecord);
  if (data && typeof data === "object" && "records" in data) {
    const records = (data as { records: unknown }).records;
    if (Array.isArray(records)) return records.filter(isPracticeRecord);
  }
  return [];
}

export interface ImportPreview {
  totalInFile: number;
  newRecords: number;
  toOverwrite: number;
  skippedOlder: number;
}

// 判斷「匯入的紀錄」是否比「現有紀錄」更進階，避免不小心用舊備份把新
// 進度蓋掉。比較順序：practiceCount 較多者勝出；打平的話用
// lastPracticedAt 較新者勝出。
function isAtLeastAsAdvanced(
  incoming: PracticeRecord,
  existing: PracticeRecord
): boolean {
  if (incoming.practiceCount !== existing.practiceCount) {
    return incoming.practiceCount > existing.practiceCount;
  }
  return incoming.lastPracticedAt >= existing.lastPracticedAt;
}

/** 匯入前先預覽會發生什麼事，讓使用者確認後再真的寫入。 */
export async function previewImport(data: unknown): Promise<ImportPreview> {
  const records = extractRecords(data);
  const existingAll = await getAllPracticeRecords();
  const existingById = new Map(existingAll.map((r) => [r.sentenceId, r]));

  let newRecords = 0;
  let toOverwrite = 0;
  let skippedOlder = 0;

  for (const r of records) {
    const existing = existingById.get(r.sentenceId);
    if (!existing) {
      newRecords += 1;
    } else if (isAtLeastAsAdvanced(r, existing)) {
      toOverwrite += 1;
    } else {
      skippedOlder += 1;
    }
  }

  return {
    totalInFile: records.length,
    newRecords,
    toOverwrite,
    skippedOlder,
  };
}

/**
 * 回傳實際匯入的筆數；格式不對的資料會直接被略過，不會拋錯中斷。
 * 預設只在「匯入的紀錄比現有的更進階（或現有沒有這筆）」時才覆蓋，
 * 避免舊備份把目前比較新的進度蓋掉。傳 `force: true` 可以強制全部覆蓋。
 */
export async function importProgress(
  data: unknown,
  options?: { force?: boolean }
): Promise<number> {
  const records = extractRecords(data);
  const existingAll = await getAllPracticeRecords();
  const existingById = new Map(existingAll.map((r) => [r.sentenceId, r]));

  let applied = 0;
  for (const r of records) {
    const existing = existingById.get(r.sentenceId);
    if (options?.force || !existing || isAtLeastAsAdvanced(r, existing)) {
      await putPracticeRecord(r);
      applied += 1;
    }
  }
  return applied;
}

// 單一句子的 practice record，附即時 refetch
export function usePracticeRecord(sentenceId: string) {
  const [record, setRecord] = useState<PracticeRecord | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await getPracticeRecord(sentenceId);
    setRecord(r);
    setLoading(false);
  }, [sentenceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveRecord = useCallback(
    async (updated: PracticeRecord) => {
      await putPracticeRecord(updated);
      setRecord(updated);
    },
    []
  );

  return { record, loading, saveRecord, refresh };
}

// 所有 practice records，給 SRSReviewSession / ProgressDashboard 用
export function useAllPracticeRecords() {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await getAllPracticeRecords();
    setRecords(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, loading, refresh };
}
