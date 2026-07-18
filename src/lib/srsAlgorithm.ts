// ============================================================================
// 複製自 Caption Note(caption-note-web/src/App.jsx 第 111-142, 806-814 行)
// 的 SRS 邏輯,核心演算法(固定 7 段間隔表、升級/降級規則)完全比照原版,
// 只把欄位名稱調整成本專案慣例(level / nextReviewAt)。
//
// 這不是傳統 SM-2(沒有 ease factor):
// 答對(滿意)就升一級,依「新等級」對應的天數排下一次複習;
// 答錯(需加強)就降一級,固定隔天複習。
//
// 對照原始碼(邏輯數值一致,日期函式已修正,見下方「時區修正」說明):
//   const SRS_INTERVALS = [1, 2, 4, 7, 14, 30, 60];
//   const level = know
//     ? Math.min(v.level + 1, SRS_INTERVALS.length - 1)
//     : Math.max(v.level - 1, 0);
//   const nextReview = know
//     ? addDaysStr(today, SRS_INTERVALS[level])
//     : addDaysStr(today, 1);
//   // 到期判斷: vocabs.filter((v) => v.nextReview <= today)
//
// ── 時區修正(與 Caption Note 原版的唯一差異)──────────────────────────
// Caption Note 原本的 todayStr() / addDaysStr() 用
// `new Date().toISOString().slice(0, 10)`,也就是先取本地時間、再轉成 UTC
// 字串。在 UTC+8(台灣/韓國)這種正時區下,這個轉換會讓算出來的日期提早
//一天(本地午夜換算成 UTC 是前一天下午)。這裡改用 getFullYear /
// getMonth / getDate 純本地時間運算,不經過 UTC 轉換,兩個函式的「輸入
// 輸出介面」跟原版一樣(吃/吐 "YYYY-MM-DD" 字串),只有內部實作換成不受
// 時區影響的寫法。SRS_INTERVALS 表格跟升降級規則完全沒動。
// ============================================================================

import type { SelfAssessment, SrsState } from "../types/sentence";

const SRS_INTERVALS = [1, 2, 4, 7, 14, 30, 60];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayStr(): string {
  return formatLocalDate(new Date());
}

function addDaysStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day); // 本地時間建構,不經過 UTC
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function createInitialSrsState(): SrsState {
  return {
    level: 0,
    nextReviewAt: todayStr(),
  };
}

/**
 * 依使用者自評結果(滿意 / 需加強)計算下一次複習時間。
 * 對應架構文件 3.2 節第 4 點:「使用者自評 → 寫入 SRS 紀錄,決定下次複習時間」
 * 升降級規則與 Caption Note 的 gradeCard() 完全一致。
 */
export function computeNextReview(
  current: SrsState,
  assessment: SelfAssessment
): SrsState {
  const today = todayStr();
  const know = assessment === "satisfied";

  const level = know
    ? Math.min(current.level + 1, SRS_INTERVALS.length - 1)
    : Math.max(current.level - 1, 0);

  const nextReviewAt = know
    ? addDaysStr(today, SRS_INTERVALS[level])
    : addDaysStr(today, 1);

  return { level, nextReviewAt };
}

/**
 * 到期判斷,比照 Caption Note 用日期字串直接比較(v.nextReview <= today)。
 */
export function isDueForReview(srs: SrsState, now: Date = new Date()): boolean {
  return srs.nextReviewAt <= formatLocalDate(now);
}
