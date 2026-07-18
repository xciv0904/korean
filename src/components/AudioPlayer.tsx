import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string | Blob;
  label: string;
}

// 播放範例音檔或使用者錄音（架構文件 4 節元件表）。
export function AudioPlayer({ src, label }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [src]);

  const resolvedSrc = src instanceof Blob ? objectUrl ?? undefined : src;

  const handlePlay = () => {
    setPlayError(false);
    audioRef.current?.play().catch(() => setPlayError(true));
  };

  return (
    <div className="audio-player">
      <button type="button" onClick={handlePlay} disabled={!resolvedSrc}>
        ▶ {label}
      </button>
      <audio
        ref={audioRef}
        src={resolvedSrc}
        onError={() => setPlayError(true)}
        preload="none"
      />
      {playError && (
        <span className="audio-player__error">錄音無法播放，請重新錄一次試試。</span>
      )}
    </div>
  );
}
