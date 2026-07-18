import { useMemo } from "react";

interface CelebrationProps {
  triggerKey: number;
  message: { ko: string; zh: string };
  variant?: "burst" | "gentle";
  xpGained?: number;
}

const CONFETTI_EMOJIS = ["🎉", "✨", "⭐", "🎊", "💫", "👏"];
const PIECE_COUNT = 10;

// 練習完成時的小小慶祝回饋(依你的要求新增)。variant="burst" 會有彩帶
// emoji 從中心炸開的動畫 + XP 提示,用在自評「滿意」的時候;
// variant="gentle" 只有文字淡入淡出,沒有炸開動畫,用在「需加強」的時候
// ——練習得不夠好也不該被負面對待,只是少了慶祝效果,不是懲罰。
// 用 triggerKey 當 React key,每次自評都會重新 mount,動畫從頭播放一次。
export function Celebration({
  triggerKey,
  message,
  variant = "burst",
  xpGained,
}: CelebrationProps) {
  const pieces = useMemo(() => {
    if (variant !== "burst") return [];
    return Array.from({ length: PIECE_COUNT }, (_, i) => ({
      angle: (360 / PIECE_COUNT) * i + (Math.random() * 20 - 10),
      distance: 50 + Math.random() * 36,
      delay: Math.random() * 0.12,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, variant]);

  return (
    <div
      key={triggerKey}
      className={`celebration celebration--${variant}`}
      role="status"
      aria-live="polite"
    >
      {variant === "burst" && (
        <div className="celebration__burst" aria-hidden="true">
          {pieces.map((p, i) => (
            <span
              key={i}
              className="celebration__piece"
              style={
                {
                  "--angle": `${p.angle}deg`,
                  "--distance": `${p.distance}px`,
                  "--delay": `${p.delay}s`,
                } as React.CSSProperties
              }
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}
      <p className="celebration__message">
        <span lang="ko">{message.ko}</span> <span lang="zh-Hant">{message.zh}</span>
        {typeof xpGained === "number" && (
          <span className="celebration__xp"> +{xpGained} XP</span>
        )}
      </p>
    </div>
  );
}
