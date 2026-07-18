import { useState } from "react";
import "./App.css";
import { ScenarioBrowser } from "./components/ScenarioBrowser";
import { ShadowingPractice } from "./components/ShadowingPractice";
import { SRSReviewSession } from "./components/SRSReviewSession";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { VocabBrowser } from "./components/VocabBrowser";
import { GrammarBrowser } from "./components/GrammarBrowser";
import { useDueSentences } from "./hooks/useSRS";
import type { Sentence } from "./types/sentence";

type Tab = "browse" | "practice" | "review" | "vocab" | "grammar" | "progress";

// 簡化版導航(MVP 先不用 react-router,5 個分頁用 state 切換即可)。
function App() {
  const [tab, setTab] = useState<Tab>("browse");
  const [activeSentence, setActiveSentence] = useState<Sentence | null>(null);
  const { dueSentences } = useDueSentences();

  const handleSelectSentence = (sentence: Sentence) => {
    setActiveSentence(sentence);
    setTab("practice");
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>韓文情境口說練習</h1>
        <nav className="app__nav">
          <button
            type="button"
            className={tab === "browse" ? "active" : ""}
            onClick={() => setTab("browse")}
          >
            情境瀏覽
          </button>
          <button
            type="button"
            className={tab === "practice" ? "active" : ""}
            onClick={() => setTab("practice")}
            disabled={!activeSentence}
          >
            跟讀練習
          </button>
          <button
            type="button"
            className={tab === "review" ? "active" : ""}
            onClick={() => setTab("review")}
          >
            今日複習
            {dueSentences.length > 0 && (
              <span className="app__nav-badge">{dueSentences.length}</span>
            )}
          </button>
          <button
            type="button"
            className={tab === "vocab" ? "active" : ""}
            onClick={() => setTab("vocab")}
          >
            單字
          </button>
          <button
            type="button"
            className={tab === "grammar" ? "active" : ""}
            onClick={() => setTab("grammar")}
          >
            文法
          </button>
          <button
            type="button"
            className={tab === "progress" ? "active" : ""}
            onClick={() => setTab("progress")}
          >
            進度總覽
          </button>
        </nav>
      </header>

      <main className="app__main">
        {tab === "browse" && (
          <ScenarioBrowser onSelectSentence={handleSelectSentence} />
        )}
        {tab === "practice" && activeSentence && (
          <ShadowingPractice sentence={activeSentence} />
        )}
        {tab === "practice" && !activeSentence && (
          <p>先到「情境瀏覽」選一句開始練習。</p>
        )}
        {tab === "review" && <SRSReviewSession />}
        {tab === "vocab" && <VocabBrowser />}
        {tab === "grammar" && <GrammarBrowser />}
        {tab === "progress" && <ProgressDashboard />}
      </main>
    </div>
  );
}

export default App;
