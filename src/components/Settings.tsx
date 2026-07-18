import { useState, type FormEvent } from "react";
import { getAzureConfig, saveAzureConfig, clearAzureConfig } from "../lib/azureConfig";

const REGION_OPTIONS = [
  { value: "koreacentral", label: "Korea Central(首爾,建議選這個)" },
  { value: "eastasia", label: "East Asia(香港)" },
  { value: "southeastasia", label: "Southeast Asia(新加坡)" },
  { value: "japaneast", label: "Japan East(東京)" },
  { value: "eastus", label: "East US" },
  { value: "westus2", label: "West US 2" },
  { value: "westeurope", label: "West Europe" },
];

// 設定頁(依你的要求新增「錄音完自動評分」功能的前置設定)。自動評分需要
// 呼叫 Azure 語音服務的發音評估 API,這個 API 需要金鑰,金鑰只存在瀏覽器
// localStorage,不會進 git/GitHub。詳細技術說明見 README「自動發音評分」章節。
export function Settings() {
  const existing = getAzureConfig();
  const [subscriptionKey, setSubscriptionKey] = useState(existing?.subscriptionKey ?? "");
  const [region, setRegion] = useState(existing?.region ?? "koreacentral");
  const [saved, setSaved] = useState(false);
  const [hasConfig, setHasConfig] = useState(existing !== null);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmedKey = subscriptionKey.trim();
    if (!trimmedKey) return;
    saveAzureConfig({ subscriptionKey: trimmedKey, region });
    setHasConfig(true);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    clearAzureConfig();
    setSubscriptionKey("");
    setHasConfig(false);
    setSaved(false);
  };

  return (
    <div className="settings">
      <h3>自動評分設定</h3>
      <p className="settings__status">
        {hasConfig ? "✅ 已設定,跟讀練習錄完音會自動評分" : "⚪ 尚未設定,跟讀練習目前只有自評"}
      </p>
      <p className="settings__hint">
        「錄音完自動評分」需要 Azure 語音服務的發音評估功能,不是免費不用申請的功能——這個金鑰只存在你這台裝置的瀏覽器裡,不會寫進網站程式碼或上傳到
        GitHub,但因為是純前端網站,實際呼叫 API 時金鑰還是會出現在瀏覽器的網路請求裡。如果在公用電腦上用這個網站,離開前記得按下面的「清除金鑰」。
      </p>

      <details className="settings__guide">
        <summary>還沒有 Azure 金鑰？點這裡看怎麼申請(免費額度)</summary>
        <ol>
          <li>
            前往{" "}
            <a href="https://portal.azure.com" target="_blank" rel="noreferrer">
              Azure Portal
            </a>
            ,用 Microsoft 帳號登入(沒有的話可以免費註冊)
          </li>
          <li>上方搜尋「Speech」→ 選「語音服務 / Speech services」→ 建立</li>
          <li>定價層選「Free F0」(每月免費約 5 小時語音辨識額度,個人練習用綽綽有餘)</li>
          <li>建立完成後,進資源頁面左側選單的「金鑰及端點」,複製「金鑰 1」,並記下建立時選的地區(Region)</li>
          <li>把金鑰貼到下面表單,地區選一致的,按「儲存」</li>
        </ol>
      </details>

      <form className="settings__form" onSubmit={handleSave}>
        <label className="settings__field">
          <span>訂閱金鑰(Subscription Key)</span>
          <input
            type="password"
            value={subscriptionKey}
            onChange={(e) => setSubscriptionKey(e.target.value)}
            placeholder="貼上你的 Azure 語音服務金鑰"
            autoComplete="off"
          />
        </label>
        <label className="settings__field">
          <span>地區(Region)</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div className="settings__actions">
          <button type="submit" disabled={!subscriptionKey.trim()}>
            儲存
          </button>
          <button type="button" onClick={handleClear}>
            清除金鑰
          </button>
        </div>
        {saved && <p className="settings__saved">已儲存,回「跟讀練習」錄完音就會自動評分。</p>}
      </form>
    </div>
  );
}
