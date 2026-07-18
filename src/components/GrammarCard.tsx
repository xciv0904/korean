import type { GrammarPoint } from "../types/sentence";

interface GrammarCardProps {
  grammar: GrammarPoint;
}

// 文法卡:句型 + 中文說明 + 一句應用例句。
export function GrammarCard({ grammar }: GrammarCardProps) {
  return (
    <div className="grammar-card" data-domain={grammar.domain}>
      <p className="grammar-card__pattern" lang="ko">
        {grammar.pattern}
      </p>
      <p className="grammar-card__meaning">{grammar.meaning}</p>
      <p className="grammar-card__explanation">{grammar.explanation}</p>
      <div className="grammar-card__example">
        <p className="grammar-card__example-korean" lang="ko">
          {grammar.example.korean}
        </p>
        <p className="grammar-card__example-chinese" lang="zh-Hant">
          {grammar.example.chinese}
        </p>
      </div>
    </div>
  );
}
