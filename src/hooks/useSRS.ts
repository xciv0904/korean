import { useCallback, useMemo } from "react";
import type { PracticeRecord, SelfAssessment, Sentence } from "../types/sentence";
import {
  computeNextReview,
  createInitialSrsState,
  isDueForReview,
} from "../lib/srsAlgorithm";
import { usePracticeRecord, useAllPracticeRecords } from "./useIndexedDB";
import { ALL_SENTENCES } from "../data";

// 複用 Caption Note 的 SRS 邏輯(已從 caption-note-web/src/App.jsx 複製過來,
//  見 lib/srsAlgorithm.ts 開頭的來源說明)。這個 hook 對外只暴露
// 「記一筆練習 + 自評」的動作,內部演算法細節都封裝在 srsAlgorithm.ts。
export function useSRS(sentenceId: string) {
  const { record, saveRecord } = usePracticeRecord(sentenceId);

  const recordAttempt = useCallback(
    async (assessment: SelfAssessment, audioBlobKey?: string) => {
      const prev: PracticeRecord = record ?? {
        sentenceId,
        practiceCount: 0,
        lastPracticedAt: new Date().toISOString(),
        userRecordings: [],
        srs: createInitialSrsState(),
      };

      const nextSrs = computeNextReview(prev.srs, assessment);

      const updated: PracticeRecord = {
        ...prev,
        practiceCount: prev.practiceCount + 1,
        lastPracticedAt: new Date().toISOString(),
        userRecordings: audioBlobKey
          ? [
              ...prev.userRecordings,
              { timestamp: new Date().toISOString(), audioBlobKey },
            ]
          : prev.userRecordings,
        srs: nextSrs,
      };

      await saveRecord(updated);
      return updated;
    },
    [record, saveRecord, sentenceId]
  );

  return { record, recordAttempt };
}

// 全部「到期待複習」的句子(架構文件 3.3 節)。還沒練習過的句子(沒有
// practiceRecord)一律視為到期,確保新句子也會出現在複習佇列裡。
// App.tsx 的導覽徽章跟 SRSReviewSession 都用這個 hook,避免同一套邏輯
// 寫兩次。
export function useDueSentences() {
  const { records, loading, refresh } = useAllPracticeRecords();

  const dueSentences: Sentence[] = useMemo(() => {
    const recordMap = new Map(records.map((r) => [r.sentenceId, r]));
    return ALL_SENTENCES.filter((s) => {
      const record = recordMap.get(s.id);
      if (!record) return true;
      return isDueForReview(record.srs);
    });
  }, [records]);

  return { dueSentences, loading, refresh };
}
