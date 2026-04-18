# PRD: 客製化 MP3 音樂播放器與像素 CD 光碟動畫

## 1. 背景與目標 (Background & Objectives)
**背景**：為了增強網站的沉浸感、賽博龐克與復古像素風格的氛圍，我們計劃引入一個客製化的 MP3 播放器組件。
**目標**：
- 允許使用者或網站管理員上傳自訂的 MP3 樂曲。
- 播放音樂時，UI 需展示一個旋轉的像素藝術 (Pixel Art) 風格 SVG CD 唱片光碟。
- 提供直覺的播放控制（播放/暫停、音軌切換），並確保與現有 HUD 介面風格一致。

---

## 2. 功能需求 (Functional Requirements)

### 2.1 音訊上傳與管理 (Audio Upload & Management)
- **前端上傳介面**：在管理後台或特定隱藏區塊提供檔案上傳按鈕，限制上傳格式為 `.mp3`。
- **儲存方案**：整合現有的 Supabase 儲存空間 (Supabase Storage)，將 MP3 檔案上傳至專屬 Bucket (例如 `audio_assets`)。
- **資料結構**：在資料庫建立 `tracks` 表格，記錄歌曲名稱、檔案 URL、上傳時間等資訊。

### 2.2 播放器核心功能 (Player Core)
- **基礎控制**：播放 (Play)、暫停 (Pause)、音量控制 (Volume)、進度條 (Progress Bar)。
- **全域播放 (Global Playback)**：將播放器設計為 React 全域狀態 (Context/Zustand)，確保使用者在切換頁面（如進入 Blog 或 Projects）時音樂不會中斷。
- **瀏覽器策略適配**：因應現代瀏覽器的自動播放限制 (Autoplay Policy)，初次播放必須由使用者主動點擊觸發。

### 2.3 像素風格 CD 動畫 UI (Pixel Art CD UI)
- **視覺設計**：使用 SVG 繪製復古像素風格的 CD/黑膠唱片。
- **動態互動**：
  - **播放中**：CD 呈現平滑的無限旋轉動畫 (`animate-[spin_4s_linear_infinite]`)。
  - **暫停中**：動畫暫停 (`animation-play-state: paused`)。
  - **懸停效果**：滑鼠懸停於 CD 上時，可顯示歌曲名稱的 Glitch (故障) 效果文字。

---

## 3. 技術實作方案 (Technical Implementation)

### 3.1 系統架構
- **元件規劃**：
  - `PixelCD.tsx`：純視覺的 SVG 像素 CD 與旋轉動畫。
  - `AudioPlayer.tsx`：負責 `<audio>` 標籤封裝與控制面板。
  - `AudioContext.tsx`：全域狀態管理。

### 3.2 資料庫 Schema (Supabase)
```sql
CREATE TABLE tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.3 像素 CD SVG 範例設計 (Concept)
CD 的 SVG 結構將使用 `<rect>` 元素拼接出像素感，包含：
1. **外框與光碟本體**：使用深灰色與金屬色交替的同心像素圓。
2. **中心孔洞**：透明或背景色的中心。
3. **反光效果**：在對角線加上白色/淺藍色的像素塊，當旋轉時能產生光碟反光的視覺錯覺。

```tsx
// 概念性程式碼
<svg width="64" height="64" viewBox="0 0 64 64" className={isPlaying ? 'animate-spin' : ''}>
  {/* 外圈 */}
  <path d="..." fill="#333" />
  {/* 像素軌跡 */}
  <rect x="20" y="10" width="4" height="4" fill="#666" />
  {/* 反光 */}
  <rect x="40" y="20" width="4" height="4" fill="#4ADE80" opacity="0.8" />
  {/* 中心孔洞 */}
  <rect x="28" y="28" width="8" height="8" fill="#030a07" />
</svg>
```

---

## 4. 使用者體驗與介面位置 (UX/UI Positioning)
- **位置**：建議放置於畫面**右下角**或**左下角**，與現有的深色 HUD 主題 (Deep Scroll HUD) 融合。
- **收合模式**：預設僅顯示旋轉的 Pixel CD，點擊或懸停時向左/向上展開顯示完整的播放器控制列與歌曲資訊。
- **色彩計畫**：遵循主視覺的霓虹綠 (`#4ADE80`) 與深邃綠 (`#030a07`)，控制按鈕在 `active` 狀態下加入發光陰影 (Drop Shadow)。

---

## 5. 里程碑與排程 (Milestones)
- **Phase 1：靜態 UI 與動畫實作**
  - 繪製 Pixel CD 的 SVG 資源。
  - 建立前端播放器組件框架，並寫死一首本地 MP3 進行測試。
- **Phase 2：音訊核心邏輯與全域狀態**
  - 引入 React Context 管理播放狀態。
  - 實作進度條與音量控制的互動邏輯。
- **Phase 3：Supabase 整合 (上傳與讀取)**
  - 在後台介面 (如 `Admin.tsx`) 實作檔案上傳至 Supabase Storage 的功能。
  - 播放器啟動時動態向資料庫抓取歌曲清單 (Playlist)。
- **Phase 4：細節打磨與優化**
  - 處理行動端 (Mobile) 瀏覽器的鎖屏播放控制 (Media Session API)。
  - 加入音訊切換時的淡入淡出 (Fade in/out) 體驗。