import { useState } from "react";
import { useTranslate } from "../hooks/useTranslate";

// 中文 → 韓文翻譯小工具。輸入中文,按翻譯,顯示機器翻譯的韓文結果。
// 用途是想到一句話但不知道韓文怎麼講的時候快速查一下,不是句庫本體的
// 一部分(不會存進 SRS 複習清單),結果僅供參考,機器翻譯不保證道地。
export function TranslateTool() {
  const [input, setInput] = useState("");
  const { status, result, error, translate } = useTranslate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    translate(input);
  };

  return (
    <div className="translate-tool">
      <p className="translate-tool__hint">
        輸入中文,幫你翻成韓文參考用。這是機器翻譯,語氣、口語程度不一定準確,適合用來抓大概意思,正式或重要場合建議再跟母語人士確認一次。
      </p>

      <form className="translate-tool__form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入想翻譯的中文句子…"
          rows={4}
          maxLength={400}
          lang="zh-Hant"
        />
        <button type="submit" disabled={!input.trim() || status === "loading"}>
          {status === "loading" ? "翻譯中…" : "翻譯"}
        </button>
      </form>

      {status === "error" && error && (
        <p className="translate-tool__error" role="alert">
          {error}
        </p>
      )}

      {status === "success" && result && (
        <div className="translate-tool__result">
          <span className="translate-tool__result-label">韓文翻譯</span>
          <p className="translate-tool__result-text" lang="ko">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
