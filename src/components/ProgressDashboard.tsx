import { useMemo, useRef, useState } from "react";
import { ALL_SENTENCES } from "../data";
import {
  exportProgress,
  importProgress,
  previewImport,
  useAllPracticeRecords,
} from "../hooks/useIndexedDB";
import type { Sentence } from "../types/sentence";

const DOMAIN_LABEL: Record<Sentence["domain"], string> = {
  hotel_frontdesk: "飯店櫃檯",
  daily_dating: "日常約會",
};

// Category 是資料檔案裡的英文代碼(例如 "check_in"、"casual_chat"),只拿來
// 當作分組 key,畫面上不直接顯示英文,改用這裡的韓中對照名稱。
const CATEGORY_LABEL: Record<string, { ko: string; zh: string }> = {
  // 飯店櫃檯
  check_in: { ko: "체크인", zh: "入住登記" },
  amenities_info: { ko: "일회용품 안내", zh: "一次性用品說明" },
  bedsheet_change: { ko: "침구 교체", zh: "床單寢具更換" },
  facilities_info: { ko: "시설 안내", zh: "飯店設施介紹" },
  item_requests: { ko: "비품 요청 응대", zh: "備品需求應對" },
  phone_handling: { ko: "전화 응대", zh: "電話應對" },
  room_issues: { ko: "객실 문제 응대", zh: "房間問題應對" },
  room_key_wifi: { ko: "객실 안내", zh: "房卡與網路說明" },
  // 日常約會
  first_meeting: { ko: "첫 만남", zh: "初次見面" },
  making_plans: { ko: "약속 잡기", zh: "約定與行程安排" },
  texting_phrases: { ko: "문자 표현", zh: "訊息聊天用語" },
  expressing_interest: { ko: "호감 표현", zh: "表達好感" },
  restaurant_ordering: { ko: "식사 자리", zh: "用餐場合應對" },
  casual_chat: { ko: "데이트 잡담", zh: "約會閒聊" },
};

function getCategoryLabel(category: string): { ko: string; zh: string } {
  return CATEGORY_LABEL[category] ?? { ko: category, zh: category };
}

// 進度總覽(架構文件 3.4 節):各 Category 完成度 + streak。
// Streak 計算先用「有練習紀錄的相異日期是否連續」的簡化版本;
// 之後要換 Caption Note 既有的 streak check-in 機制時,只需要替換
// computeStreak() 內部邏輯,對外回傳值(數字)不用變。
export function ProgressDashboard() {
  const { records, loading, refresh } = useAllPracticeRecords();
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const byCategory = useMemo(() => {
    const totalByCategory = new Map<string, number>();
    const domainByCategory = new Map<string, Sentence["domain"]>();
    for (const s of ALL_SENTENCES) {
      totalByCategory.set(s.category, (totalByCategory.get(s.category) ?? 0) + 1);
      domainByCategory.set(s.category, s.domain);
    }
    const practicedByCategory = new Map<string, number>();
    const practicedIds = new Set(records.map((r) => r.sentenceId));
    for (const s of ALL_SENTENCES) {
      if (practicedIds.has(s.id)) {
        practicedByCategory.set(
          s.category,
          (practicedByCategory.get(s.category) ?? 0) + 1
        );
      }
    }
    return [...totalByCategory.entries()].map(([category, total]) => ({
      category,
      domain: domainByCategory.get(category)!,
      total,
      practiced: practicedByCategory.get(category) ?? 0,
    }));
  }, [records]);

  const streak = useMemo(() => computeStreak(records.map((r) => r.lastPracticedAt)), [
    records,
  ]);

  const handleExport = async () => {
    const data = await exportProgress();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `korean-speaking-practice-progress-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupMessage(`已匯出 ${data.records.length} 筆練習紀錄`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允許重複選同一個檔案
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const preview = await previewImport(parsed);

      if (preview.totalInFile === 0) {
        setBackupMessage("這個檔案裡沒有找到有效的練習紀錄");
        return;
      }

      const willApply = preview.newRecords + preview.toOverwrite;
      const confirmLines = [
        `這份備份有 ${preview.totalInFile} 筆練習紀錄。`,
        `會匯入 ${willApply} 筆(其中 ${preview.newRecords} 筆是新的、${preview.toOverwrite} 筆會更新現有進度)。`,
      ];
      if (preview.skippedOlder > 0) {
        confirmLines.push(
          `另外 ${preview.skippedOlder} 筆因為比目前的進度舊,不會覆蓋,會自動略過。`
        );
      }
      confirmLines.push("確定要匯入嗎?");

      if (!window.confirm(confirmLines.join("\n"))) {
        setBackupMessage("已取消匯入");
        return;
      }

      const count = await importProgress(parsed);
      await refresh();
      setBackupMessage(`已匯入 ${count} 筆練習紀錄`);
    } catch {
      setBackupMessage("匯入失敗,請確認選的是本網站匯出的 JSON 檔");
    }
  };

  if (loading) return <p>載入進度中…</p>;

  return (
    <div className="progress-dashboard">
      <div className="progress-dashboard__streak">
        <span className="progress-dashboard__streak-number">{streak}</span>
        <span>天連續練習</span>
      </div>

      <div className="progress-dashboard__list">
        {byCategory.map(({ category, domain, total, practiced }) => {
          const pct = total === 0 ? 0 : Math.round((practiced / total) * 100);
          const label = getCategoryLabel(category);
          return (
            <div
              key={category}
              className="progress-dashboard__row"
              data-domain={domain}
            >
              <div className="progress-dashboard__row-top">
                <span className="progress-dashboard__row-title-group">
                  <span className="progress-dashboard__row-title" lang="ko">
                    {label.ko}
                  </span>
                  <span className="progress-dashboard__row-title-zh" lang="zh-Hant">
                    {label.zh}
                  </span>
                </span>
                <span className="progress-dashboard__row-domain">
                  {DOMAIN_LABEL[domain]}
                </span>
              </div>
              <div className="progress-dashboard__row-count">
                {practiced} / {total} 句
              </div>
              <div className="progress-dashboard__bar-track">
                <div
                  className="progress-dashboard__bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="progress-dashboard__backup">
        <p className="progress-dashboard__backup-hint">
          進度只存在這台裝置的瀏覽器裡,清瀏覽器資料或換裝置前建議先匯出備份。
          (只匯出練習進度,不含錄音檔案本體)
        </p>
        <div className="progress-dashboard__backup-actions">
          <button type="button" onClick={handleExport}>
            匯出進度
          </button>
          <button type="button" onClick={handleImportClick}>
            匯入進度
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            style={{ display: "none" }}
          />
        </div>
        {backupMessage && (
          <p className="progress-dashboard__backup-message">{backupMessage}</p>
        )}
      </div>
    </div>
  );
}

function computeStreak(lastPracticedTimestamps: string[]): number {
  if (lastPracticedTimestamps.length === 0) return 0;
  const dateStrings = new Set(
    lastPracticedTimestamps.map((t) => new Date(t).toDateString())
  );
  let streak = 0;
  const cursor = new Date();
  while (dateStrings.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
