import type { PracticeRecord } from "../types/sentence";
import { ALL_SENTENCES } from "../data";

// 遊戲化機制(架構文件之外的補充功能,依你的要求新增,讓練習更有目標感/
// 成就感)。刻意設計成「完全從既有的 practiceRecords 資料算出來」,不新增
// IndexedDB 的欄位或 store——這樣不用改資料庫版本、也不用擔心匯出/匯入
// 備份漏掉新資料,XP/等級/成就每次都是即時算的,永遠跟練習紀錄同步。

// ---- XP / 等級 ----
// 每次練習(不管自評滿意或需加強,願意開口練習就給獎勵,不因為講得不好而
// 扣分或不給獎勵——避免打擊練習意願)給 10 XP。
export const XP_PER_ATTEMPT = 10;
const XP_PER_LEVEL = 100;

export function computeTotalXP(records: PracticeRecord[]): number {
  return records.reduce((sum, r) => sum + r.practiceCount * XP_PER_ATTEMPT, 0);
}

export interface LevelInfo {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
}

export function computeLevelInfo(xp: number): LevelInfo {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressPct: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

// ---- 成就徽章 ----
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  records: PracticeRecord[];
  streak: number;
  totalAttempts: number;
}

function practicedSentenceIds(records: PracticeRecord[]): Set<string> {
  return new Set(records.filter((r) => r.practiceCount > 0).map((r) => r.sentenceId));
}

const HOTEL_SENTENCE_IDS = ALL_SENTENCES.filter((s) => s.domain === "hotel_frontdesk").map(
  (s) => s.id
);
const DATING_SENTENCE_IDS = ALL_SENTENCES.filter((s) => s.domain === "daily_dating").map(
  (s) => s.id
);

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "첫걸음",
    description: "跨出第一步:完成第一次練習",
    emoji: "🌱",
    isUnlocked: ({ totalAttempts }) => totalAttempts >= 1,
  },
  {
    id: "warming_up",
    title: "열심히 연습 중",
    description: "累積練習 50 次",
    emoji: "🔥",
    isUnlocked: ({ totalAttempts }) => totalAttempts >= 50,
  },
  {
    id: "practice_maniac",
    title: "연습 마니아",
    description: "累積練習 200 次",
    emoji: "💪",
    isUnlocked: ({ totalAttempts }) => totalAttempts >= 200,
  },
  {
    id: "week_streak",
    title: "일주일 연속",
    description: "連續練習 7 天",
    emoji: "📅",
    isUnlocked: ({ streak }) => streak >= 7,
  },
  {
    id: "month_streak",
    title: "한 달 연속",
    description: "連續練習 30 天",
    emoji: "🏆",
    isUnlocked: ({ streak }) => streak >= 30,
  },
  {
    id: "hotel_complete",
    title: "호텔 완주",
    description: "飯店櫃檯句庫全部練習過一次",
    emoji: "🏨",
    isUnlocked: ({ records }) => {
      const done = practicedSentenceIds(records);
      return HOTEL_SENTENCE_IDS.every((id) => done.has(id));
    },
  },
  {
    id: "dating_complete",
    title: "데이트 완주",
    description: "日常約會句庫全部練習過一次",
    emoji: "💕",
    isUnlocked: ({ records }) => {
      const done = practicedSentenceIds(records);
      return DATING_SENTENCE_IDS.every((id) => done.has(id));
    },
  },
  {
    id: "master_level",
    title: "마스터 레벨",
    description: "有 15 句以上的 SRS 等級升到最高(第 6 級)",
    emoji: "⭐",
    isUnlocked: ({ records }) => records.filter((r) => r.srs.level >= 6).length >= 15,
  },
];

export function computeUnlockedAchievements(
  records: PracticeRecord[],
  streak: number
): { achievement: Achievement; unlocked: boolean }[] {
  const totalAttempts = records.reduce((sum, r) => sum + r.practiceCount, 0);
  const ctx: AchievementContext = { records, streak, totalAttempts };
  return ACHIEVEMENTS.map((achievement) => ({
    achievement,
    unlocked: achievement.isUnlocked(ctx),
  }));
}

// ---- 練習完成時的鼓勵訊息(隨機挑一句,韓文 + 中文) ----
export const ENCOURAGING_MESSAGES = [
  { ko: "잘했어요!", zh: "做得好！" },
  { ko: "훌륭해요!", zh: "太棒了！" },
  { ko: "완벽해요!", zh: "完美！" },
  { ko: "최고예요!", zh: "你最棒了！" },
  { ko: "멋져요!", zh: "太厲害了！" },
  { ko: "대단해요!", zh: "真了不起！" },
  { ko: "잘 하고 있어요!", zh: "做得很不錯！" },
];

export function pickEncouragingMessage(): { ko: string; zh: string } {
  return ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
}

export const GENTLE_MESSAGES = [
  { ko: "괜찮아요, 다시 해봐요!", zh: "沒關係，再試一次！" },
  { ko: "연습하면 늘어요!", zh: "多練習就會進步！" },
  { ko: "조금씩 나아지고 있어요!", zh: "正在一點一點進步！" },
];

export function pickGentleMessage(): { ko: string; zh: string } {
  return GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];
}
