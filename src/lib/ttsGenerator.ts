// 建置時批次生成 TTS 音檔的腳本(架構文件 4 / 5 節):build time 用,非執行期。
//
// 目前狀態:public/audio/*.mp3 是用 ffmpeg 生成的 1 秒測試音(440Hz 正弦波),
// 純粹用來驗證「範例音檔播放 → 錄音 → 雙軌比對」這條流程能不能跑通,
// 不是真的韓文發音,正式內容不能用。
//
// 之後接上真正的 TTS 服務(架構文件建議 Naver Clova TTS 或 Google Cloud TTS
// 韓文語音)時,大致步驟:
// 1. 讀取 src/data/**/*.json 裡每一句的 korean 欄位
// 2. 呼叫 TTS API,把回傳的音檔存到 public/audio/{sentence.id}.mp3
// 3. 這支腳本應該用 `node` 或 `tsx` 在 build 前手動跑一次,不要在瀏覽器執行期呼叫,
//    避免每次載入頁面都要等 API(架構文件第 8 節第 4 點)
//
// 範例(需要自行補上 API 金鑰與 SDK):
//
// import { readdirSync, readFileSync, writeFileSync } from "fs";
// import path from "path";
//
// async function generateAll() {
//   const dataDir = path.resolve(__dirname, "../data");
//   // ... 遍歷 dataDir 底下所有 domain 資料夾的 json 檔
//   // ... 對每一句呼叫 TTS API,取得音檔 buffer
//   // ... writeFileSync(`public/audio/${sentence.id}.mp3`, buffer)
// }
//
// generateAll();

export {};
