# 韓文情境口說練習網站 — MVP 第一階段

依 `韓文情境口說練習網站_架構文件.md` 建置,句庫已換成你提供的正式內容(共 103 句),SRS 邏輯已從 Caption Note 原始碼複製過來,視覺樣式已套用你提供的設計交付檔。

## 快速開始

```bash
npm install
npm run dev
```

瀏覽器開啟後,建議在真實瀏覽器(非無痕/非受限環境)測試,因為口說練習需要麥克風權限。

## 部署成網站

```bash
npm run build
```

會產生 `dist/` 資料夾,裡面就是完整的靜態網站,把這個資料夾內容上傳到任何靜態網站託管平台即可,不需要伺服器端程式。

**重要:一定要用 HTTPS。** 錄音功能(`getUserMedia`)跟 PWA 的 service worker 都要求安全連線,只有 `https://` 或本機 `localhost` 才能用麥克風,單純 `http://` 的網址錄音功能會直接失效。GitHub Pages、Vercel、Netlify、Cloudflare Pages 這類平台預設都是 HTTPS,不用額外設定。

**子路徑部署(例如 GitHub Pages 的 `username.github.io/repo-name/`)已經處理好**:`vite.config.ts` 用相對路徑(`base: './'`)建置,manifest 的圖示、`start_url` 也都改成相對路徑,不管部署在根網域還是子路徑,圖示、PWA 安裝、service worker 都能正常運作,不用另外調整設定。已經實際模擬子路徑環境驗證過(在本機用 `python -m http.server` 開一個假的 `/repo-name/` 子路徑,確認 JS/CSS/manifest/圖示都能正確載入)。

GitHub Pages 常見部署方式(擇一):
- 用 GitHub Actions 自動化:每次 push 到主分支時執行 `npm run build`,把 `dist/` 部署到 Pages(GitHub 網站的 Pages 設定裡選「GitHub Actions」當來源,套用官方的 Node/Vite 範本即可)
- 手動部署:本機跑 `npm run build`,把 `dist/` 資料夾內容推到 `gh-pages` 分支,Pages 設定來源選這個分支

## 目前完成的部分

- 專案骨架:Vite + React + TypeScript(延用 Caption Note 技術棧)
- 資料層:`src/data/` 下共 103 句,取自你提供的 13 個情境檔案(飯店櫃檯 8 個情境 + 日常約會 5 個情境),schema 對應架構文件 2.2 節
- 口說練習核心流程(`ShadowingPractice.tsx`):不使用範例發音,直接看句子念出來 → `MediaRecorder` 錄音 → 錄完立即回放檢查自己發音 → 自評「滿意/需加強」→ 寫入 SRS 紀錄
- **SRS 演算法(`src/lib/srsAlgorithm.ts`)已直接複製 Caption Note(`caption-note-web/src/App.jsx`)的邏輯**,不是重新設計的 SM-2。詳見下方「SRS 演算法說明」。
- IndexedDB 儲存(`useIndexedDB.ts`,用 `idb` 套件):練習紀錄 + 錄音 Blob(只存在本機,不上傳雲端)
- 情境瀏覽、複習排程(SRSReviewSession)、進度總覽(ProgressDashboard)
- `npm run build` 已驗證可成功編譯(型別檢查 + production build 皆通過)

## SRS 演算法說明

Caption Note 用的不是傳統 SM-2(沒有 ease factor),而是固定 7 段間隔表:

```
SRS_INTERVALS = [1, 2, 4, 7, 14, 30, 60]  // 天數
```

- 自評「滿意」:等級 +1(上限第 6 級),下次複習 = 今天 + 新等級對應的天數
- 自評「需加強」:等級 -1(下限第 0 級),下次複習固定是「今天 + 1 天」
- 新句子:等級 0,今天就到期(第一次一定會出現在複習清單)

`src/types/sentence.ts` 的 `SrsState` 型別已經對應調整為 `{ level, nextReviewAt }`,拿掉了原本佔位版本的 `easeFactor` / `interval` / `repetitions`(Caption Note 沒有這些欄位)。

**時區 bug 已修正**:Caption Note 原本的 `addDaysStr()` / `todayStr()` 用 `.toISOString()` 把本地時間轉成 UTC 字串,在 UTC+8(台灣/韓國)會讓算出來的複習日期提早一天。這個專案已經改用 `getFullYear`/`getMonth`/`getDate` 純本地時間運算,不經過 UTC 轉換,SRS_INTERVALS 表格跟升降級規則完全沒動,只有日期運算本身修正過。詳見 `srsAlgorithm.ts` 開頭註解。

## 視覺樣式

已套用你上傳的設計交付檔(`Korean Speaking Practice.dc.html` + Broadsheet 設計系統,藍色系 retune)。因為那份設計稿其實是完全不同的內容架構(track/unit 課程式,對話+選擇題測驗,沒有羅馬拼音、沒有 SRS),你確認過只要「視覺樣式」,所以我只搬了顏色/字體/間距/圓角/陰影/卡片與按鈕的 CSS tokens,套到現有的單句卡 + SRS 複習結構上,沒有改資料模型或互動邏輯。

- 主色調:飯店櫃檯用 steel blue(`#5c7a97`),日常約會用 muted indigo(`#6b7091`),句卡、分類標籤、進度條會依 domain 自動切換強調色 — 呼應設計稿兩個 track 各自的識別色
- 字體:標題/按鈕用 Source Serif 4,韓文/中文內容 fallback 到 Noto Sans KR / Noto Sans TC
- 卡片、按鈕、標籤、間距/圓角/陰影全部改用設計稿的 tokens
- 進度總覽從表格改成卡片 + 進度條(視覺呼應設計稿首頁的課程進度條樣式)
- 只改了 `index.css` / `App.css`,以及 `SentenceCard.tsx`、`ScenarioBrowser.tsx` 各加一行 `data-domain` 屬性(純標記,沒有邏輯變動),`npm run build` 已重新驗證過

## 部署前的優化(已完成)

**建議先修:**
- **HTML metadata**:`<html lang>` 改成 `zh-Hant`、標題改成「韓文情境口說練習」、加了 meta description 跟 `theme-color`,favicon 換成跟主題色一致的簡單圖示(原本是 Vite 預設的紫色 logo)
- **SRS 時區 bug 已修正**(見上一節)
- **進度匯出/匯入**:進度總覽頁最下面新增「匯出進度」/「匯入進度」,可以把 SRS 練習紀錄存成 JSON 檔備份,清瀏覽器資料或換裝置前先匯出,之後匯回來就能接續複習進度。只匯出 SRS 狀態(練習次數、等級、下次複習時間),不含錄音檔本體(錄音是本機自我檢查用,不需要長期保存)

**建議做:**
- **手機觸控體驗**:所有互動按鈕(導覽分頁、錄音、自評、搜尋框)都調整到至少 44px 高,符合觸控最小尺寸建議;窄螢幕(< 480px)另外調整了外距跟字級,避免內容太擠
- **PWA / 加到主畫面**:加了 `manifest.json`(透過 `vite-plugin-pwa`)跟對應圖示(`icon-192.png` / `icon-512.png` / `apple-touch-icon.png`),iOS/Android 都可以「加入主畫面」當 app 用,啟動後是全螢幕獨立視窗,不會看到瀏覽器網址列。同時會產生 service worker 快取 app 本身的檔案(HTML/JS/CSS/圖示),重複開啟會更快;練習資料本來就存在 IndexedDB,不受這個快取影響
- **單字表整合**:新增「單字」分頁(`VocabBrowser.tsx` / `VocabCard.tsx`),依 domain 分飯店/約會兩組瀏覽,點卡片翻看中文意思

**第二輪(進階優化):**
- **匯入進度加了保護機制**:之前是無條件覆蓋,現在會先比對(依 `practiceCount` 高低、打平比 `lastPracticedAt`)算出「幾筆新的、幾筆會更新、幾筆比較舊會略過」,彈出確認對話框列出這些數字,使用者確認後才真的寫入,不會被舊備份不小心蓋掉新進度。邏輯在 `useIndexedDB.ts` 的 `previewImport()` / `importProgress()`。
- **今日複習分頁加了到期數量徽章**:導覽列「今日複習」按鈕現在會顯示今天有幾句到期(例如「今日複習 12」),不用點進去才知道。到期句子的計算邏輯抽成 `useSRS.ts` 裡的 `useDueSentences()`,App.tsx 的徽章跟 SRSReviewSession 共用同一份邏輯。
- **無障礙**:韓文文字都加了 `lang="ko"`、中文加了 `lang="zh-Hant"`,螢幕閱讀器會用正確的語言規則發音。另外重新算過所有淺色/次要文字的對比度,原本部分文字(color-mix 45-60% 透明度)只有 2.5-3.9:1,低於 WCAG AA 正常文字要求的 4.5:1,已經統一調整到 70% 透明度(對比度 5+),按鈕/徽章的實色填底也從 `--color-accent` 換成更深的 `--color-accent-600`,白字在上面對比度從 4.14 提升到 5.66。

## 內容擴充(單字 / 文法)

- **單字表**:拿掉了「TV」,加上 `domain` 欄位分組,飯店櫃檯類新增 10 個(櫃檯、退房、訂房、保證金、房卡、電梯、大廳、叫醒服務、早餐、行李寄放),現在共 25 個;約會類原本新增的「男朋友/女朋友」你說太簡單,已經拿掉,現在約會類是 8 個(相親、曖昧、約會、告白、交往、撒嬌、紀念日、心動)。單字表分頁依 domain 分兩組顯示,共 33 個單字。
- **文法(新分頁)**:架構文件原本沒有這個功能,新增「文法」分頁,飯店櫃檯 6 個 + 日常約會 6 個常用句型,每個都有:句型、中文語義、用法說明、一句應用例句(韓文 + 中文)。句型是從已有的句庫內容裡歸納出來的(例如「-아/어 주시겠어요?」「-(으)ㄹ래요?」),資料在 `src/data/grammar/`,型別是 `GrammarPoint`。

## 第三輪句庫擴充

- 新增你指定的句子:「오늘 밥 사줘서 고마워요. 다음엔 제가 살게요.」(謝謝你今天請我吃飯，下次換我請你),放進 `restaurant_ordering.json`,情境是「식사 후 감사 인사」。
- 新增接話句:「근데 사진보다 실물이 훨씬 나으신 것 같아요.」(不過你本人比照片更好看),緊接在原本「프로필 사진이랑 실물이 좀 다르시네요?」後面,放在 `first_meeting.json` 裡同一句的正下方。
- 新增一個新情境分類 `casual_chat.json`(約會中閒聊,8 句):稱讚外表、天氣話題、日常生活、拍照邀約、興趣話題、下次計畫等,補足「見面約會聊天」這塊。
- 句庫總數:103 → **113 句**(飯店櫃檯 8 個情境不變,日常約會從 5 個情境增加到 6 個情境)。

## 第四輪句庫擴充

- `casual_chat.json` 裡「취미 이야기(興趣話題)」那句的興趣從「등산(爬山)」改成「필라테스(皮拉提斯)」。
- 「외모 칭찬(稱讚外表)」新增 4 句:仿照你給的「我覺得你長得很像(某藝人),有人這樣說過嗎」句型(用車銀優當例子,附一句不指名藝人的保守版 alternate),再加稱讚眼睛、笑容、穿搭風格各一句,分散不同切入角度,不會太單一。
- 句庫總數:113 → **117 句**。

## 第五輪:單字表新增動詞/形容詞

- 之前的單字表全部是名詞,依你的要求補上動詞、形容詞,程度抓 TOPIK 3-4 級(避免太簡單的初級單字)。
- `VocabWord` 型別新增 `pos`(詞性:`noun`/`verb`/`adjective`)欄位,單字卡左上角會顯示「名/動/形」小標籤,單字表分頁在飯店/約會兩組底下再依詞性分「名詞/動詞/形容詞」三個子區塊,方便針對動詞、形容詞單獨複習。
- 飯店櫃檯新增 10 個動詞(예약하다、취소하다、연장하다、문의하다、요청하다、확인하다、제공하다、이용하다、고장 나다、교체하다)+ 4 個形容詞(불편하다、시끄럽다、만족스럽다、불친절하다),多是入住/退房、設備故障、客訴情境會用到的字。
- 日常約會新增 9 個動詞(고백하다、헤어지다、다가가다、챙기다、그리워하다、끌리다、흔들리다、오해하다、삐지다)+ 3 個形容詞(어색하다、다정하다、무뚝뚝하다);原本就有的「사귀다」「설레다」重新標成動詞,不算新增。
- 單字表總數:33 → **59 個**(飯店 25 名詞 + 14 動詞/形容詞 = 39;約會 6 名詞 + 14 動詞/形容詞 = 20)。

## 第六輪:部署前優化

- **GitHub Pages 子路徑修正**:`vite.config.ts` 加了 `base: './'`,manifest 的圖示路徑跟 `start_url`/`scope` 也都改成相對路徑。之前是寫死絕對路徑 `/`,如果部署在子路徑(例如 GitHub Pages 的 `username.github.io/repo-name/`)會抓不到 JS/CSS/圖示、PWA 也裝不起來。已經用本機模擬子路徑環境的方式驗證過,確認修好了。部署在根網域(自訂網域、Vercel、Netlify)不受影響,完全相容。
- **加了錯誤防護(Error Boundary)**:`src/components/ErrorBoundary.tsx`,包在 `main.tsx` 最外層。之前如果畫面執行期間出錯,整個 App 會變成一片空白,使用者完全不知道發生什麼事。現在會顯示簡單的錯誤畫面 + 「重新整理」按鈕,並提醒練習紀錄跟錄音都存在裝置本機不會遺失。
- **README 補上部署說明**(見上方「部署成網站」章節):build 指令、HTTPS 是硬性需求(錄音功能靠這個)、GitHub Pages 部署方式。
- **殘留檔案**:`public/icons.svg`(舊版沒用到的圖示檔)確認沒有被程式引用,可以手動刪除;`public/audio/` 底下的舊測試音檔也一樣。這兩個我這邊技術上刪不掉(這個資料夾是唯讀掛載,只能新增/覆蓋檔案,不能刪除),麻煩你自己在 Finder 裡刪就可以,不影響網站運作。
- 額外確認過:`npm run lint`(oxlint)目前 0 warning / 0 error,建置流程本來就有做的型別檢查(`tsc`)也沒問題。

## 第七輪:情境瀏覽手機版排版修正

- 「情境瀏覽」清單裡每一句原本是韓文/中文左右並排(`display: flex; justify-content: space-between`),手機螢幕窄的時候兩邊各自被擠成半個卡片寬,文字擠在一起很難讀。已經改成韓文在上、中文在下,兩者都佔滿卡片寬度(`flex-direction: column`),寬螢幕/窄螢幕都適用。

## 第八輪:新增「中翻韓」翻譯小工具

- 新增分頁「中翻韓」:輸入中文句子,按翻譯,顯示韓文翻譯結果。用途是想到一句話但不知道韓文怎麼講時快速查一下,結果不會存進句庫或 SRS 複習清單,單純是查詢工具。
- **技術選擇**:這個網站是純前端靜態網站(部署在 GitHub Pages,沒有自己的後端伺服器)。像 Google Cloud Translation、Naver Papago 這類品質較好的正式翻譯 API 都需要 API 金鑰,金鑰寫在前端程式碼裡任何人打開瀏覽器開發者工具都看得到,會被盜用來刷你的額度,所以沒辦法直接用。
- **翻譯來源(第九輪更新)**:一開始用 MyMemory Translation API,你反應翻得不夠準確,已經改成優先呼叫 Google 翻譯網頁版在用的內部端點(`translate.googleapis.com`)——不需要金鑰、有開放 CORS、品質跟你平常在 google.com/translate 網頁上用的差不多,比 MyMemory 好上不少。這個端點沒有官方文件、不保證穩定(Google 隨時可能調整或擋掉),所以加了自動備援:Google 那邊失敗時會自動改打 MyMemory,盡量不要整個功能掛掉,兩個來源都失敗才會顯示錯誤訊息。
- **注意事項**:不管哪個來源,都是機器翻譯,語氣、口語程度不一定完全準確,畫面上已經加了提醒(僅供參考,正式場合建議再跟母語人士確認)。這個功能需要連網才能用,跟原本錄音/SRS 複習(完全存在本機,離線也能用)是分開的,沒有連網時只有這個分頁會顯示錯誤訊息,其他功能不受影響。單次查詢字數上限 400 字(超過會提示分段翻譯)。
- 程式碼在 `src/hooks/useTranslate.ts`(呼叫 API、Google 失敗自動改打 MyMemory、處理 loading/錯誤狀態)+ `src/components/TranslateTool.tsx`(輸入框 + 翻譯按鈕 + 結果顯示)。

## 第十輪:飯店句庫新增指路/設施問答

- `facilities_info.json` 新增 4 句:
  - 「정문에서 나가셔서 왼쪽으로 5분 정도 걸어가시면 백화점이 있어요.」(從大門出去,往左邊走五分鐘左右,有一間百貨公司)
  - 「정문에서 나가셔서 오른쪽으로 5분 정도 걸어가시면 편의점이 있어요.」(從大門出去,往右邊走五分鐘左右,有一間便利商店)——跟上一句同句型只換方向跟目的地,方便對照練習
  - 「흡연 구역은 정문 오른쪽에 있어요.」(吸菸區在大門右側區域)
  - 「죄송하지만 여기서는 맥주를 판매하지 않아요.」(不好意思,這裡沒有賣啤酒)

## 第十一輪:進度總覽分類名稱改成韓中對照

- 「進度總覽」裡每個分類原本直接顯示資料檔案用的英文代碼(例如 `check_in`、`casual_chat`),你反應不想看到英文,已經改成韓文分類名稱(粗體)+ 中文翻譯(小字),例如「체크인 / 入住登記」「데이트 잡담 / 約會閒聊」。英文代碼還是留在資料裡當內部分組用的 key,只是畫面上不會顯示出來。對照表在 `ProgressDashboard.tsx` 的 `CATEGORY_LABEL`,涵蓋全部 14 個分類(飯店 8 個 + 約會 6 個)。
- 句庫總數:117 → **121 句**。

## 第十二輪:讓網站更有趣(遊戲化 + 慶祝回饋 + 每日挑戰 + 視覺活潑化)

依你的要求「網站再弄得有趣一點」,四個方向都做了一點,全部都是純前端計算,沒有新增 IndexedDB 欄位或 store,不影響現有的匯出/匯入備份格式:

- **XP / 等級系統**:每次練習(不管自評「滿意」還是「需加強」,只要願意開口練習就給獎勵,不會因為講得不夠好而扣分或不給獎勵,避免打擊練習意願)給 10 XP,每 100 XP 升一級。XP 直接從現有的 `practiceCount` 算出來(`練習次數 × 10`),不是額外存的數字,所以永遠跟練習紀錄同步,也會包含在匯出的備份裡。「進度總覽」最上面新增等級徽章 + 經驗值進度條。
- **成就徽章**:8 個徽章,例如「첫걸음(跨出第一步)」「일주일 연속(連續 7 天)」「호텔 완주(飯店句庫全部練習過)」「마스터 레벨(15 句以上達到 SRS 最高等級)」,一樣是從現有練習紀錄即時算出來的,解鎖的徽章會變成彩色,還沒解鎖的是灰階。位置也在「進度總覽」。程式碼在 `src/lib/gamification.ts`。
- **練習完成的慶祝回饋**:跟讀練習自評「滿意」時,螢幕上會有 emoji 彩帶炸開的小動畫 + 隨機一句韓中對照的鼓勵語(例如「잘했어요! 做得好！」)+「+10 XP」提示;自評「需加強」則只顯示溫和的鼓勵文字(「연습하면 늘어요! 多練習就會進步！」),沒有炸開動畫——講得不夠好不該被當成懲罰,只是少了慶祝效果。程式碼在 `src/components/Celebration.tsx`。
- **每日挑戰(新分頁)**:每天固定 8 句(用日期字串當種子洗牌,同一天重整頁面題目不變,隔天自動換一批,不用另外存「今天玩過了嗎」這種狀態),玩法是快閃卡:先看中文,自己試著念出韓文,按「顯示韓文」對答案,再自評「記得/不熟」。這裡的自評一樣會寫進 SRS 複習排程,不是玩假的小遊戲,也會影響「今日複習」。程式碼在 `src/components/DailyChallenge.tsx` + `src/lib/dailyChallenge.ts`。
- **視覺活潑化**:導覽列 7 個分頁都加上對應 emoji(📖🎙️🔁🎯📚✏️🌐📊);情境瀏覽/單字/文法/進度總覽/每日挑戰裡的「飯店櫃檯」「日常約會」分類標題都加上 🏨/💕;全站按鈕新增按下去會有輕微縮小的回饋動畫(`transform: scale(0.96)`),點擊起來更有回饋感。

## 第十三輪:錄音完自動評分(已移除)

原本依你的要求做了「錄音完自動評分」,用 Azure 語音服務的發音評估 API(因為 iPhone Safari 不支援瀏覽器內建語音辨識,才選 Azure)。你後來反應申請 Azure 帳號、設定金鑰太麻煩,決定不要這個功能,已經整個移除,`ShadowingPractice.tsx` 恢復成單純自評「滿意/需加強」的版本,`package.json` 也拿掉了 `microsoft-cognitiveservices-speech-sdk` 依賴。

- `src/components/Settings.tsx`、`src/lib/azureConfig.ts`、`src/lib/wavEncoder.ts`、`src/lib/pronunciationAssessment.ts` 這 4 個檔案已經沒有任何地方引用,技術上刪不掉(跟前面提到的 `public/icons.svg` 一樣,這個資料夾是唯讀掛載,只能新增/覆蓋不能刪除),麻煩你自己在 Finder 裡刪掉這 4 個檔案就可以,不影響網站運作。

## 其他備註

- **不顯示羅馬拼音**:依你的要求,句卡已經拿掉羅馬拼音顯示/切換按鈕,只留韓文 + 中文,逼自己直接讀諺文。這剛好也是原本設計交付檔裡明確寫的產品需求(「No romanization is shown anywhere ... per product requirement」),兩邊一致。
- **不需要範例發音**:已依你的要求拿掉 TTS/範例音檔播放,`sentence.audioUrl` 欄位還留在資料裡(相容架構文件 schema),但畫面上不會用到,`src/lib/ttsGenerator.ts` 留著當作未來想加回來時的參考。`public/audio/` 底下還留著幾個舊的測試嗶聲檔案(沒有被程式引用,可以忽略或手動刪除)。

## 專案結構

對照架構文件第 4 節,額外多了 `VocabBrowser` / `VocabCard`(單字表)跟 `GrammarBrowser` / `GrammarCard`(文法,都不在原始架構文件範圍內):

```
src/
├── data/
│   ├── hotel_frontdesk/ daily_dating/   # 句庫 JSON(共 103 句)
│   ├── grammar/                         # 文法 JSON(飯店 6 + 約會 6)
│   └── vocabulary.json                  # 單字表(飯店 25 + 約會 10 = 35)
├── components/     # ScenarioBrowser / SentenceCard / ShadowingPractice / AudioRecorder / AudioPlayer /
│                   # SRSReviewSession / ProgressDashboard / VocabBrowser / VocabCard /
│                   # GrammarBrowser / GrammarCard / TranslateTool / DailyChallenge / Celebration /
│                   # ErrorBoundary
├── hooks/          # useAudioRecorder / useSRS(含 useDueSentences)/ useIndexedDB(含匯出匯入)
├── lib/            # srsAlgorithm.ts(已複製 Caption Note 邏輯)/ ttsGenerator.ts(未使用,保留參考)/
│                   # gamification.ts(XP/等級/成就)/ dailyChallenge.ts(每日挑戰洗牌邏輯)
└── App.tsx         # 8 個分頁的簡易導覽(瀏覽 / 練習 / 複習 / 每日挑戰 / 單字 / 文法 / 中翻韓 / 進度)
```

## 技術備註

- Vite 8 的 production build 在部分沙盒/網路掛載檔案系統上,`npm install` 換版本套件時可能因為 rename/unlink 權限問題失敗(這是環境限制,不是程式碼問題);在你自己的電腦上正常執行應該不會遇到。
- 錄音權限:第一次按「開始錄音」瀏覽器會跳出麥克風授權提示,務必允許。
