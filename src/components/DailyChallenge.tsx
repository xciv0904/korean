import { useMemo, useState } from "react";
import { getDailyChallengeSentences, getTodayDateStr } from "../lib/dailyChallenge";
import { useSRS } from "../hooks/useSRS";
import type { SelfAssessment, Sentence } from "../types/sentence";
import { Celebration } from "./Celebration";
import {
  XP_PER_ATTEMPT,
  pickEncouragingMessage,
  pickGentleMessage,
} from "../lib/gamification";

const DOMAIN_LABEL: Record<Sentence["domain"], string> = {
  hotel_frontdesk: "🏨 飯店櫃檯",
  daily_dating: "💕 日常約會",
};

// 每日挑戰(依你的要求新增的小遊戲):每天固定 8 句(用日期當種子洗牌,
// 同一天重整頁面題目不變,隔天自動換一批),玩法是快閃卡:先看中文,
// 自己試著念出韓文,按「顯示韓文」對答案,再自評「記得/不熟」。
// 自評結果一樣會寫進 SRS(呼叫跟跟讀練習同一個 useSRS),所以玩這個
// 小遊戲也會影響「今日複習」的排程,不是玩假的。跟跟讀練習的差別是
// 這裡不用錄音,純粹快速複習記憶用。
export function DailyChallenge() {
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const sentences = useMemo(() => getDailyChallengeSentences(todayStr), [todayStr]);

  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState<{
    ko: string;
    zh: string;
  } | null>(null);

  const finished = cursor >= sentences.length;
  const current = sentences[Math.min(cursor, sentences.length - 1)];
  const { recordAttempt } = useSRS(current.id);

  const handleMark = async (knew: boolean) => {
    const assessment: SelfAssessment = knew ? "satisfied" : "needs_work";
    await recordAttempt(assessment);
    setResults((prev) => ({ ...prev, [current.id]: knew }));
    setCelebrationMessage(knew ? pickEncouragingMessage() : pickGentleMessage());
    setCelebrationKey((k) => k + 1);
    window.setTimeout(() => {
      setRevealed(false);
      setCelebrationMessage(null);
      setCursor((c) => c + 1);
    }, 700);
  };

  const handleRestart = () => {
    setCursor(0);
    setResults({});
    setRevealed(false);
    setCelebrationMessage(null);
  };

  if (finished) {
    const correctCount = Object.values(results).filter(Boolean).length;
    return (
      <div className="daily-challenge daily-challenge--finished">
        <p className="daily-challenge__finished-emoji" aria-hidden="true">
          🎯
        </p>
        <h3>今日挑戰完成！</h3>
        <p className="daily-challenge__score">
          記得 {correctCount} / {sentences.length} 句
        </p>
        <p className="daily-challenge__hint">明天會換一批新題目,再來挑戰！</p>
        <button type="button" onClick={handleRestart}>
          再玩一次
        </button>
      </div>
    );
  }

  return (
    <div className="daily-challenge">
      <p className="daily-challenge__progress">
        今日挑戰 {cursor + 1} / {sentences.length}
      </p>

      <div className="daily-challenge__card" data-domain={current.domain}>
        <span className="daily-challenge__domain-tag">
          {DOMAIN_LABEL[current.domain]}
        </span>
        <p className="daily-challenge__chinese" lang="zh-Hant">
          {current.chinese}
        </p>

        {!revealed && (
          <button
            type="button"
            className="daily-challenge__reveal"
            onClick={() => setRevealed(true)}
          >
            🔍 顯示韓文
          </button>
        )}

        {revealed && (
          <>
            <p className="daily-challenge__korean" lang="ko">
              {current.korean}
            </p>
            <div className="daily-challenge__mark">
              <button type="button" onClick={() => handleMark(true)}>
                👍 記得
              </button>
              <button type="button" onClick={() => handleMark(false)}>
                🔁 不熟
              </button>
            </div>
          </>
        )}
      </div>

      {celebrationMessage && (
        <Celebration
          triggerKey={celebrationKey}
          message={celebrationMessage}
          variant="gentle"
          xpGained={
            results[current.id] === true ? XP_PER_ATTEMPT : undefined
          }
        />
      )}
    </div>
  );
}
