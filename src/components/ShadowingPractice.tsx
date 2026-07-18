import { useState } from "react";
import type { Sentence, SelfAssessment } from "../types/sentence";
import { SentenceCard } from "./SentenceCard";
import { AudioRecorder } from "./AudioRecorder";
import { Celebration } from "./Celebration";
import { useSRS } from "../hooks/useSRS";
import { saveRecordingBlob } from "../hooks/useIndexedDB";
import {
  XP_PER_ATTEMPT,
  pickEncouragingMessage,
  pickGentleMessage,
} from "../lib/gamification";

interface ShadowingPracticeProps {
  sentence: Sentence;
  onNext?: () => void;
}

// 口說練習核心元件(架構文件 3.2 節,文件第 8 節點名的最高風險技術環節)。
// 不使用範例發音(不需要 TTS),流程簡化為:
// 1) 看句子念出來,按錄音鍵用 MediaRecorder 錄下自己的發音
// 2) 錄完立即回放,自己聽發音準不準
// 3) 自評滿意/需加強 → 寫入 SRS 紀錄,決定下次複習時間
// 4) 錄音存 IndexedDB(本機,不上傳雲端)
//
// 註:曾經加過「錄完自動評分」(呼叫 Azure 語音服務的發音評估 API),
// 你覺得申請金鑰太麻煩,已經整個移除,恢復成單純自評的版本。
export function ShadowingPractice({ sentence, onNext }: ShadowingPracticeProps) {
  const { record, recordAttempt } = useSRS(sentence.id);
  const [userBlob, setUserBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<SelfAssessment | null>(
    null
  );
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState<{
    ko: string;
    zh: string;
  } | null>(null);

  const handleRecorded = (blob: Blob) => {
    setUserBlob(blob);
    setLastAssessment(null);
    setCelebrationMessage(null);
  };

  const handleAssess = async (assessment: SelfAssessment) => {
    if (!userBlob) return;
    setSaving(true);
    try {
      const audioBlobKey = `${sentence.id}_${Date.now()}`;
      await saveRecordingBlob(audioBlobKey, userBlob);
      await recordAttempt(assessment, audioBlobKey);
      setLastAssessment(assessment);
      setCelebrationMessage(
        assessment === "satisfied" ? pickEncouragingMessage() : pickGentleMessage()
      );
      setCelebrationKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shadowing-practice">
      <SentenceCard sentence={sentence}>
        <div className="shadowing-practice__record">
          <p className="shadowing-practice__hint">
            照著上面的句子念出來,錄下自己的發音,錄完可以回放檢查。
          </p>
          <AudioRecorder onRecorded={handleRecorded} />
        </div>

        {userBlob && (
          <div className="shadowing-practice__assess">
            <p>聽完自己的錄音,自評一下這次發音:</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAssess("satisfied")}
            >
              👍 滿意
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAssess("needs_work")}
            >
              🔁 需加強
            </button>
          </div>
        )}

        {lastAssessment && record && celebrationMessage && (
          <div className="shadowing-practice__result">
            <Celebration
              triggerKey={celebrationKey}
              message={celebrationMessage}
              variant={lastAssessment === "satisfied" ? "burst" : "gentle"}
              xpGained={lastAssessment === "satisfied" ? XP_PER_ATTEMPT : undefined}
            />
            <p>
              已記錄 #{record.practiceCount} 次練習,下次複習時間:{" "}
              {new Date(record.srs.nextReviewAt + "T00:00:00").toLocaleDateString()}
            </p>
            {onNext && (
              <button type="button" onClick={onNext}>
                下一句 →
              </button>
            )}
          </div>
        )}
      </SentenceCard>
    </div>
  );
}
