import { useCallback, useRef, useState } from "react";

export type TranslateStatus = "idle" | "loading" | "success" | "error";

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  responseDetails?: string;
}

// Google 翻譯網頁版用的內部端點格式:[[[譯文, 原文, ...], [第二段譯文, 第二段原文, ...], ...], ...]
// 長文字會被拆成好幾段,每段是最外層陣列的一個元素,要自己串回完整譯文。
type GoogleTranslateSegment = [string, string, ...unknown[]];
type GoogleTranslateResponse = [GoogleTranslateSegment[] | null, ...unknown[]];

// 中文 → 韓文翻譯小工具(架構文件之外的補充功能)。
// 這個網站是純前端靜態網站(部署在 GitHub Pages,沒有自己的後端伺服器),
// 沒辦法用需要 API 金鑰的服務(例如 Google Cloud Translation、Naver
// Papago 的正式 API)——金鑰放在前端程式碼裡任何人都看得到,會被盜用。
//
// 主要翻譯來源改用 Google 翻譯網頁版在用的內部端點(translate.googleapis.com,
// 不需要金鑰、有開放 CORS、品質接近正常的 google.com/translate)。這是非官方、
// 沒有文件的端點,Google 隨時可能調整或擋掉,所以留了 MyMemory Translation API
// 當備援——Google 那個失敗時自動改打 MyMemory,盡量不要整個功能掛掉。
// 不管哪個來源,都是機器翻譯,語氣/口語程度不一定準確,只能當參考,畫面上有
// 附這個提醒。
const GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_INPUT_LENGTH = 400;

async function translateWithGoogle(text: string, signal: AbortSignal): Promise<string> {
  const url = `${GOOGLE_ENDPOINT}?client=gtx&sl=zh-TW&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Google 翻譯請求失敗(狀態碼 ${res.status})`);

  const data = (await res.json()) as GoogleTranslateResponse;
  const segments = data[0];
  if (!segments || segments.length === 0) throw new Error("Google 翻譯沒有回傳結果");

  return segments.map((seg) => seg[0]).join("");
}

async function translateWithMyMemory(text: string, signal: AbortSignal): Promise<string> {
  const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=zh-TW|ko`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`翻譯請求失敗(狀態碼 ${res.status})`);

  const data = (await res.json()) as MyMemoryResponse;
  const translatedText = data.responseData?.translatedText;
  const statusCode = Number(data.responseStatus);

  if (!translatedText || (statusCode && statusCode !== 200)) {
    throw new Error(data.responseDetails || "翻譯服務暫時無法使用,請稍後再試。");
  }

  return translatedText;
}

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
      let translatedText: string;
      try {
        translatedText = await translateWithGoogle(trimmed, controller.signal);
      } catch (googleErr) {
        if (googleErr instanceof DOMException && googleErr.name === "AbortError") throw googleErr;
        // Google 端點失敗(可能被擋、逾時、格式變了),自動改用備援來源
        translatedText = await translateWithMyMemory(trimmed, controller.signal);
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
