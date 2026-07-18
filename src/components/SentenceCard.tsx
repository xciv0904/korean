import type { ReactNode } from "react";
import type { Sentence } from "../types/sentence";

interface SentenceCardProps {
  sentence: Sentence;
  children?: ReactNode;
}

const FORMALITY_LABEL: Record<Sentence["formality"], string> = {
  formal_honorific: "敬語",
  polite: "禮貌體",
  casual_banmal: "半語",
};

// 單句卡片:顯示韓/中文(不顯示羅馬拼音 — 依使用者要求移除,逼自己直接讀
// 諺文,不依賴拼音)。
export function SentenceCard({ sentence, children }: SentenceCardProps) {
  return (
    <div className="sentence-card" data-domain={sentence.domain}>
      <div className="sentence-card__tags">
        <span className="tag tag--formality">
          {FORMALITY_LABEL[sentence.formality]}
        </span>
        {sentence.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <p className="sentence-card__korean" lang="ko">{sentence.korean}</p>
      <p className="sentence-card__chinese" lang="zh-Hant">{sentence.chinese}</p>

      {sentence.notes && <p className="sentence-card__notes">💡 {sentence.notes}</p>}

      {sentence.alternates && sentence.alternates.length > 0 && (
        <div className="sentence-card__alternates">
          {sentence.alternates.map((alt) => (
            <div key={alt.korean} className="sentence-card__alternate">
              <span lang="ko">{alt.korean}</span>
              <span className="sentence-card__alternate-usage">
                ({alt.usage})
              </span>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
