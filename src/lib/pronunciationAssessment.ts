import { blobToWav16kMono } from "./wavEncoder";
import type { AzureSpeechConfig } from "./azureConfig";

export interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string; // "None" | "Omission" | "Insertion" | "Mispronunciation"
}

export interface PronunciationScoreResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words: WordScore[];
}

// 呼叫 Azure 語音服務的「發音評估(Pronunciation Assessment)」功能
// (依你的要求新增「錄音完自動評分」)。
//
// 用官方 microsoft-cognitiveservices-speech-sdk(不是手刻 REST fetch),
// 因為這個 SDK 走 WebSocket 連線,瀏覽器可以直接連 Azure,不會遇到一般
// REST API 常見的瀏覽器 CORS 阻擋問題(這是刻意的技術選擇,REST 版本在
// 瀏覽器環境不一定能直接呼叫)。
//
// SDK 有點大(未壓縮好幾 MB),用動態 import() 延遲載入,只有使用者真的
// 觸發評分時才會下載這個套件,不會拖慢一般頁面載入速度。
//
// 注意:這段邏輯是照 Microsoft 官方文件/範例程式碼的 API 寫的
// (PronunciationAssessmentConfig 建構子參數、AudioConfig.fromWavFileInput、
// PronunciationAssessmentResult.fromResult 的屬性名稱都對照過官方型別定義),
// 但沒辦法在這個環境實際用真的 Azure 金鑰跑過完整流程驗證,第一次使用時
// 如果有問題,把瀏覽器主控台(Console)看到的錯誤訊息回報就可以除錯。
export async function assessPronunciation(
  recordedBlob: Blob,
  referenceText: string,
  config: AzureSpeechConfig
): Promise<PronunciationScoreResult> {
  const sdk = await import("microsoft-cognitiveservices-speech-sdk");

  const wavBlob = await blobToWav16kMono(recordedBlob);
  const wavFile = new File([wavBlob], "recording.wav", { type: "audio/wav" });

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.subscriptionKey,
    config.region
  );
  speechConfig.speechRecognitionLanguage = "ko-KR";

  const audioConfig = sdk.AudioConfig.fromWavFileInput(wavFile);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Word,
    true // enableMiscue:比對漏念/多念的字
  );
  pronunciationConfig.applyTo(recognizer);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        try {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            const pron = sdk.PronunciationAssessmentResult.fromResult(result);
            const words: WordScore[] = (pron.detailResult.Words ?? []).map((w) => ({
              word: w.Word,
              accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
              errorType: w.PronunciationAssessment?.ErrorType ?? "None",
            }));
            resolve({
              accuracyScore: pron.accuracyScore,
              fluencyScore: pron.fluencyScore,
              completenessScore: pron.completenessScore,
              pronScore: pron.pronunciationScore,
              words,
            });
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error("沒有偵測到語音,請確認錄音有講到話,再試一次。"));
          } else {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(
              new Error(
                `評分失敗:${cancellation.errorDetails || "請確認金鑰跟地區設定正確"}`
              )
            );
          }
        } finally {
          recognizer.close();
        }
      },
      (err) => {
        recognizer.close();
        reject(new Error(`評分請求失敗:${err}`));
      }
    );
  });
}
