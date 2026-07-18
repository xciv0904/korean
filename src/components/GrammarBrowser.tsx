import { useMemo } from "react";
import { ALL_GRAMMAR } from "../data";
import { GrammarCard } from "./GrammarCard";
import type { Sentence } from "../types/sentence";

const DOMAIN_LABEL: Record<Sentence["domain"], string> = {
  hotel_frontdesk: "🏨 飯店櫃檯",
  daily_dating: "💕 日常約會",
};

// 文法瀏覽(架構文件之外的補充功能):依 domain 分兩組,跟句庫/單字表
// 分組邏輯一致。每個文法點附一句應用例句(韓文 + 中文)。
export function GrammarBrowser() {
  const grouped = useMemo(() => {
    const map = new Map<Sentence["domain"], typeof ALL_GRAMMAR>();
    for (const g of ALL_GRAMMAR) {
      if (!map.has(g.domain)) map.set(g.domain, []);
      map.get(g.domain)!.push(g);
    }
    return map;
  }, []);

  return (
    <div className="grammar-browser">
      <p className="grammar-browser__hint">
        常用句型 + 中文說明 + 一句應用例句,搭配情境句庫一起練習效果更好。
      </p>
      {[...grouped.entries()].map(([domain, points]) => (
        <div key={domain} className="grammar-browser__group" data-domain={domain}>
          <h3>{DOMAIN_LABEL[domain]}</h3>
          {points.map((g) => (
            <GrammarCard key={g.id} grammar={g} />
          ))}
        </div>
      ))}
    </div>
  );
}
