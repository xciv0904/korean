// Azure 語音服務(發音評估)的金鑰/地區設定。
// 只存在使用者這台裝置的瀏覽器 localStorage,不會寫進程式碼、不會被
// commit 進 git、不會出現在部署到 GitHub Pages 的靜態檔案裡。
// 因為這是純前端網站,實際呼叫 Azure API 時金鑰還是會出現在瀏覽器的
// 網路請求裡(這是純前端架構的先天限制,任何不經後端代理的作法都一樣),
// 在 Settings 頁面已經提醒使用者這點。
const STORAGE_KEY = "korean-speaking-practice:azure-speech-config";

export interface AzureSpeechConfig {
  subscriptionKey: string;
  region: string;
}

export function getAzureConfig(): AzureSpeechConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AzureSpeechConfig>;
    if (
      typeof parsed.subscriptionKey === "string" &&
      parsed.subscriptionKey.trim() &&
      typeof parsed.region === "string" &&
      parsed.region.trim()
    ) {
      return { subscriptionKey: parsed.subscriptionKey, region: parsed.region };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAzureConfig(config: AzureSpeechConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearAzureConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAutoScoringEnabled(): boolean {
  return getAzureConfig() !== null;
}
