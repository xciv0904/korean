import { useCallback, useRef, useState } from "react";

export type TranslateStatus = "idle" | "loading" | "success" | "error";

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  responseDetails?: string;
}

// 中文 → 韓文翻譯小工具(架構文件之外的補充功能)。
// 這個網站是純前端靜態網站(部署在 GitHub Pages,沒有自己的後端伺服器),
// 沒辦法用需要 API 金鑰的服務(例如 Google Cloud Translation、Naver
// Papago)——金鑰放在前端程式碼裡任何人都看得到,會被盜用。
// 改用 MyMemory Translation API(https://mymemory.translated.net/):
// 不需要金鑰、瀏覽器可以直接呼叫(有開放 CORS)、免費額度個人使用綽綽有餘。
// 缺點:機器翻譯,語氣/口語程度不一定準確,只能當作參考,不能完全取代
// 自己判斷,畫面上有附這個提醒。
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_INPUT_LENGTH = 400; // MyMemory 免費版對單次查詢字數有限制,抓保守一點

export function useTranslate() {
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const translate = useCallback(async (chineseText: string) => {
    const trimmed = chineseText.trim();
    setResult(null);
    setError(null);

    if (!trimmed) {
      setStatus("idle");
      return;
    }

    if (trimmed.length > MAX_INPUT_LENGTH) {
      setStatus("error");
      setError(`文字太長了(超過 ${MAX_INPUT_LENGTH} 字),請分段翻譯。`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");

    try {
      const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(trimmed)}&langpair=zh-TW|ko`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`網路請求失敗(狀態碼 ${res.status})`);
      }

      const data = (await res.json()) as MyMemoryResponse;
      const translatedText = data.responseData?.translatedText;
      const statusCode = Number(data.responseStatus);

      if (!translatedText || (statusCode && statusCode !== 200)) {
        throw new Error(data.responseDetails || "翻譯服務暫時無法使用,請稍後再試。");
      }

      setResult(translatedText);
      setStatus("success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "翻譯失敗,請確認網路連線後再試一次。"
      );
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, translate, reset };
}
