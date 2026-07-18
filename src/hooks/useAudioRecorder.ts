import { useCallback, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "stopped" | "error";

// 封裝 MediaRecorder API（架構文件 3.2 節 / 5 節）。
// 這是文件第 8 節點名「風險最高的技術環節」：瀏覽器錄音權限 + 音檔格式相容性。
// 用 MediaRecorder 預設 mimeType（讓瀏覽器自己選，Chrome/Firefox 多半是
// audio/webm，Safari 是 audio/mp4），避免手動指定 mimeType 在某些瀏覽器
// 直接丟 NotSupportedError。
export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setStatus("requesting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("這個瀏覽器不支援錄音功能（缺少 MediaDevices API）。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setStatus("stopped");
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.onerror = () => {
        setStatus("error");
        setError("錄音過程發生錯誤，請重試一次。");
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      setStatus("error");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("沒有取得麥克風權限，請允許瀏覽器使用麥克風後再試一次。");
      } else {
        setError("無法啟動錄音，請確認麥克風是否可用。");
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
  }, []);

  return { status, error, audioBlob, start, stop, reset };
}
