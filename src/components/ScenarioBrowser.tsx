import { useMemo, useState } from "react";
import { ALL_SENTENCES } from "../data";
import type { Sentence } from "../types/sentence";

interface ScenarioBrowserProps {
  onSelectSentence: (sentence: Sentence) => void;
}

const DOMAIN_LABEL: Record<Sentence["domain"], string> = {
  hotel_frontdesk: "飯店櫃檯",
  daily_dating: "日常約會",
};

// 依 Domain → Category → ScenarioSet 階層瀏覽(架構文件 3.1 節)。
// MVP 資料量小(佔位 8 句),先做最簡單的分組清單,之後句庫擴充到
// 130-150 句時可以再加分頁/虛擬捲動。
export function ScenarioBrowser({ onSelectSentence }: ScenarioBrowserProps) {
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    if (!keyword.trim()) return ALL_SENTENCES;
    const kw = keyword.trim().toLowerCase();
    return ALL_SENTENCES.filter(
      (s) =>
        s.korean.includes(kw) ||
        s.chinese.includes(kw) ||
        s.tags.some((t) => t.includes(kw))
    );
  }, [keyword]);

  const grouped = useMemo(() => {
    const map = new Map<string, Sentence[]>();
    for (const s of filtered) {
      const key = `${s.domain}::${s.scenarioSet}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [filtered]);

  return (
    <div className="scenario-browser">
      <input
        type="search"
        placeholder="搜尋韓文/中文/標籤…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {filtered.length === 0 && <p>沒有符合的句子。</p>}

      {[...grouped.entries()].map(([key, sentences]) => {
        const [domain, scenarioSet] = key.split("::");
        return (
          <div key={key} className="scenario-browser__group" data-domain={domain}>
            <h3>
              {DOMAIN_LABEL[domain as Sentence["domain"]]} — {scenarioSet}
            </h3>
            <ul>
              {sentences.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onSelectSentence(s)}>
                    <span className="scenario-browser__korean" lang="ko">{s.korean}</span>
                    <span className="scenario-browser__chinese" lang="zh-Hant">{s.chinese}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
