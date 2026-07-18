import { useEffect } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { AudioPlayer } from "./AudioPlayer";

interface AudioRecorderProps {
  onRecorded?: (blob: Blob) => void;
}

// 封裝 MediaRecorder 邏輯的 UI(架構文件 4 節元件表)。
export function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const { status, error, audioBlob, start, stop, reset } = useAudioRecorder();

  const handleStop = () => {
    stop();
  };

  useEffect(() => {
    if (audioBlob && status === "stopped") {
      onRecorded?.(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, status]);

  return (
    <div className="audio-recorder">
      {status === "idle" && (
        <button type="button" onClick={start}>
          🎙 開始錄音
        </button>
      )}
      {status === "requesting" && <span>正在請求麥克風權限…</span>}
      {status === "recording" && (
        <button type="button" onClick={handleStop} className="recording">
          ⏹ 停止錄音
        </button>
      )}
      {status === "stopped" && audioBlob && (
        <div className="audio-recorder__result">
          <AudioPlayer src={audioBlob} label="播放我的錄音" />
          <button type="button" onClick={reset}>
            重新錄音
          </button>
        </div>
      )}
      {status === "error" && (
        <div className="audio-recorder__error">
          <span>{error}</span>
          <button type="button" onClick={reset}>
            重試
          </button>
        </div>
      )}
    </div>
  );
}
