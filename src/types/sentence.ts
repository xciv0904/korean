// 對應架構文件 2.2 節 — Sentence 資料結構
export type Formality = "formal_honorific" | "polite" | "casual_banmal";

export interface SentenceAlternate {
  korean: string;
  usage: string;
}

export interface Sentence {
  id: string;
  domain: "hotel_frontdesk" | "daily_dating";
  category: string;
  scenarioSet: string;
  korean: string;
  chinese: string;
  formality: Formality;
  romanization: string;
  audioUrl: string;
  notes?: string;
  alternates?: SentenceAlternate[];
  tags: string[];
  difficulty: number;
}

// 對應架構文件 2.3 節 — 使用者練習紀錄 (IndexedDB)
//
// 欄位對應 Caption Note(caption-note-web/src/App.jsx)的 SRS 資料結構:
// - level:「滿意」升一級、「需加強」降一級,對應 SRS_INTERVALS 的索引(0-6)
// - nextReviewAt:"YYYY-MM-DD" 日期字串(不含時間),對應 Caption Note 的
//   nextReview,用字串比較(<=)判斷是否到期,跟原版邏輯完全一致
//
// 沒有 easeFactor / repetitions:Caption Note 用的是固定 7 段間隔表,
// 不是傳統 SM-2,所以不需要這兩個欄位。
export interface SrsState {
  level: number;
  nextReviewAt: string; // "YYYY-MM-DD"
}

export interface UserRecording {
  timestamp: string;
  audioBlobKey: string;
}

export interface PracticeRecord {
  sentenceId: string;
  practiceCount: number;
  lastPracticedAt: string;
  userRecordings: UserRecording[];
  srs: SrsState;
}

// 自評結果,決定 SRS 下一次複習時間怎麼調整
// satisfied  對應 Caption Note 的 know = true(升級)
// needs_work 對應 Caption Note 的 know = false(降級 + 隔天複習)
export type SelfAssessment = "satisfied" | "needs_work";

// 單字表(vocabulary.json)— 韓中對照,跟 Sentence schema 不一樣(沒有
// SRS、沒有情境分類),只是簡單的單字卡內容。有 domain 欄位方便跟句庫
// 一樣分飯店/約會兩組瀏覽,pos 欄位(詞性)方便再細分名詞/動詞/形容詞。
export type VocabPos = "noun" | "verb" | "adjective";

export interface VocabWord {
  korean: string;
  chinese: string;
  domain: "hotel_frontdesk" | "daily_dating";
  pos: VocabPos;
}

// 文法點(架構文件之外的補充功能):句型 + 中文說明 + 一個應用例句,
// 依 domain 分組跟句庫/單字表一致。
export interface GrammarPoint {
  id: string;
  domain: "hotel_frontdesk" | "daily_dating";
  pattern: string;
  meaning: string;
  explanation: string;
  example: {
    korean: string;
    chinese: string;
  };
}
