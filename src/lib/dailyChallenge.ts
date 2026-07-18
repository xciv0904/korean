import type { Sentence } from "../types/sentence";
import { ALL_SENTENCES } from "../data";

const CHALLENGE_SIZE = 8;

// 每日挑戰:用「今天的日期字串」當隨機種子,同一天不管重整幾次頁面都是
// 同一組題目,隔天日期變了自動換一批,不需要額外存「今天挑戰完了沒」這種
// 狀態到資料庫——完全從日期算出來,簡單又不會跟練習紀錄的 schema 混在一起。
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function getDailyChallengeSentences(dateStr: string = todayDateStr()): Sentence[] {
  const rng = mulberry32(hashString(dateStr));
  const shuffled = [...ALL_SENTENCES];
  // Fisher-Yates,用 seeded RNG 洗牌,同一天結果固定
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, CHALLENGE_SIZE);
}

export function getTodayDateStr(): string {
  return todayDateStr();
}
