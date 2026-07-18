import { useMemo } from "react";
import { ALL_VOCAB } from "../data";
import { VocabCard } from "./VocabCard";
import type { Sentence, VocabPos } from "../types/sentence";

const DOMAIN_LABEL: Record<Sentence["domain"], string> = {
  hotel_frontdesk: "飯店櫃檯",
  daily_dating: "日常約會",
};

const POS_ORDER: VocabPos[] = ["noun", "verb", "adjective"];
const POS_GROUP_LABEL: Record<VocabPos, string> = {
  noun: "名詞",
  verb: "動詞",
  adjective: "形容詞",
};

// 單字表瀏覽(架構文件之外的補充功能):先依 domain 分兩組(跟句庫的分組
// 邏輯一致),組內再依詞性(名詞/動詞/形容詞)細分,方便針對動詞、形容詞
// 個別複習。點卡片看中文意思,自己先想再確認。
export function VocabBrowser() {
  const grouped = useMemo(() => {
    const map = new Map<Sentence["domain"], typeof ALL_VOCAB>();
    for (const word of ALL_VOCAB) {
      if (!map.has(word.domain)) map.set(word.domain, []);
      map.get(word.domain)!.push(word);
    }
    return map;
  }, []);

  return (
    <div className="vocab-browser">
      <p className="vocab-browser__hint">
        點卡片看中文意思,自己先想再確認。
      </p>
      {[...grouped.entries()].map(([domain, words]) => (
        <div key={domain} className="vocab-browser__group" data-domain={domain}>
          <h3>{DOMAIN_LABEL[domain]}</h3>
          {POS_ORDER.map((pos) => {
            const wordsForPos = words.filter((w) => w.pos === pos);
            if (wordsForPos.length === 0) return null;
            return (
              <div key={pos} className="vocab-browser__pos-group">
                <h4>{POS_GROUP_LABEL[pos]}</h4>
                <div className="vocab-browser__grid">
                  {wordsForPos.map((word) => (
                    <VocabCard key={word.korean} word={word} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
