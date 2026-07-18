import { useState } from "react";
import type { VocabPos, VocabWord } from "../types/sentence";

interface VocabCardProps {
  word: VocabWord;
}

const POS_LABEL: Record<VocabPos, string> = {
  noun: "名",
  verb: "動",
  adjective: "形",
};

// 單字卡:點一下切換顯示/隱藏中文意思,跟 SentenceCard 的拼音切換互動
// 邏輯一致(先看韓文自己回想,再確認意思)。左上角小標籤顯示詞性(名/動/形)。
export function VocabCard({ word }: VocabCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      className="vocab-card"
      data-domain={word.domain}
      onClick={() => setRevealed((v) => !v)}
      aria-pressed={revealed}
    >
      <span className="vocab-card__pos" aria-hidden="true">
        {POS_LABEL[word.pos]}
      </span>
      <span className="vocab-card__korean" lang="ko">
        {word.korean}
      </span>
      <span
        className={
          revealed ? "vocab-card__chinese" : "vocab-card__chinese vocab-card__chinese--hidden"
        }
        lang={revealed ? "zh-Hant" : undefined}
      >
        {revealed ? word.chinese : "點一下看意思"}
      </span>
    </button>
  );
}
