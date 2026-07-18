import { useState } from "react";
import { getSentenceById } from "../data";
import { useDueSentences } from "../hooks/useSRS";
import { ShadowingPractice } from "./ShadowingPractice";

// 複習排程(架構文件 3.3 節):只跳出到期的句子,練習完自動排下一次時間。
export function SRSReviewSession() {
  const { dueSentences, loading, refresh } = useDueSentences();
  const [cursor, setCursor] = useState(0);

  if (loading) return <p>載入複習資料中…</p>;

  if (dueSentences.length === 0) {
    return <p>🎉 今天沒有待複習的句子了!</p>;
  }

  const current = dueSentences[Math.min(cursor, dueSentences.length - 1)];
  const resolved = getSentenceById(current.id);
  if (!resolved) return null;

  const handleNext = () => {
    refresh();
    setCursor((c) => (c + 1 < dueSentences.length ? c + 1 : c));
  };

  return (
    <div className="srs-review-session">
      <p className="srs-review-session__progress">
        今日待複習:{dueSentences.length - cursor} / {dueSentences.length}
      </p>
      <ShadowingPractice sentence={resolved} onNext={handleNext} />
    </div>
  );
}
