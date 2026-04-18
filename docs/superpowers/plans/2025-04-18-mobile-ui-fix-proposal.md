# 手機端 UI 交疊與「向下滾動」圖標自適應修復方案

## 1. 問題描述 (Problem Statement)
根據使用者提供的截圖，在手機版（窄螢幕）下出現以下排版問題：
1. **UI 元素交疊 (UI Overlap)**：左側的 HUD 選單模組（如「碎碎念」、「個人項目」等）展開時，會與背景的 Graph 節點和文字（如「10後」、「系統設定」的語言選項）嚴重重疊，導致畫面雜亂且難以閱讀。
2. **「向下滾動」圖標超出螢幕 (Scroll Hint Overflow)**：底部的滑鼠滾輪圖標與提示文字在手機版上比例不協調，甚至可能超出螢幕底部或與其他元素重疊。

## 2. 解決方案 (Proposed Solutions)

### 2.1 解決 UI 元素交疊 (Fix UI Overlap)
**核心思路**：在手機版時，將 HUD 選單與 Graph 背景分離，或縮小 Graph 的顯示範圍，避免兩者佔用相同空間。

**具體做法**：
- **調整 HUD 佈局 (Mobile HUD Layout)**：
  - 在小螢幕 (`width < 768px`) 下，將原本在左側垂直排列的 HUD 選單，改為在**螢幕底部**水平排列（類似導覽列 Dock），或者縮小選單圖標尺寸，點擊後才以覆蓋層 (Overlay/Modal) 的形式展開詳細內容。
  - 這樣可以將螢幕中上方的空間完全保留給 Graph 節點。
- **調整 Graph 邊界與縮放 (Graph Bounding Box & Scale)**：
  - 在計算 Graph 的 `dynamicScale` 和 `bounding` force 時，扣除 HUD 選單佔用的空間。例如，如果 HUD 在底部，則 Graph 的可用 `height` 應減少對應的像素。
  - 增強 Graph 節點在手機版上的排斥力 (`charge`)，並縮小連線距離 (`linkDistance`)，使節點群更緊湊，不會擴散到選單區域。
- **背景模糊處理 (Backdrop Blur)**：
  - 為 HUD 選單模組的文字區域加上半透明背景與背景模糊效果 (`backdrop-blur-sm bg-[#030a07]/80`)，即使有輕微重疊，也能保證文字的可讀性。

### 2.2 解決「向下滾動」圖標自適應 (Adapt Scroll Hint)
**核心思路**：針對不同螢幕尺寸提供合適的提示圖標與文字，並確保絕對定位的坐標不會超出螢幕。

**具體做法**：
- **響應式尺寸 (Responsive Size)**：
  - 使用 Tailwind 的響應式類別 (`md:`)。在手機版縮小 SVG 圖標的尺寸，並減小字體大小。
  - 將「向下滾動」文字在手機版改為更直覺的手勢提示，例如「向上滑動」或「Swipe Up」，並搭配手指滑動的圖標取代滑鼠滾輪。
- **安全安全距離 (Safe Area Padding)**：
  - 調整圖標的 `bottom` 屬性，確保在有 Home Indicator（如 iPhone 底部橫條）的設備上不會被遮擋（使用 `pb-safe` 或設定 `bottom-24`）。

## 3. 實作步驟 (Implementation Steps)

### Step 1: 修改 Graph.tsx 中的 HUD 渲染
```tsx
// 在 HUD 容器加上背景模糊與響應式排版
<div className="absolute left-4 md:left-12 bottom-20 md:bottom-auto md:top-0 md:py-32 flex flex-row md:flex-col gap-4 md:gap-0 ...">
  {/* 為文字區域加上半透明底色 */}
  <div className="bg-[#030a07]/80 backdrop-blur-sm p-1 rounded ...">
    <h3 className="...">...</h3>
  </div>
</div>
```

### Step 2: 更新 Scroll Hint 組件
```tsx
// 根據 isMobile 切換顯示內容與尺寸
const isMobile = dimensions.width < 768;

<div className={`absolute ${isMobile ? 'bottom-24' : 'bottom-16'} ...`}>
  {isMobile ? (
    // 手機版：顯示手指滑動 SVG
    <SwipeUpIcon className="w-6 h-6" />
  ) : (
    // 電腦版：顯示滑鼠滾輪 SVG
    <MouseScrollIcon className="w-8 h-12" />
  )}
  <p className="text-xs md:text-sm">{isMobile ? '向上滑動' : glitchText}</p>
</div>
```

### Step 3: 微調 Graph 力導向模型 (Force Simulation)
在 `useEffect` 中，當檢測到 `isMobile` 時：
- 將 `maxCharge` 和 `minCharge` 調小，讓節點更靠攏。
- 增加 `margin` 參數，讓 `dynamicScale` 縮得更小，確保整體 Graph 完整呈現在畫面上半部。

## 4. 預期效果 (Expected Outcome)
- 手機版畫面上半部清晰顯示 Graph 網路，下半部或邊緣整齊排列選單，互不干擾。
- 滾動提示適應手機螢幕大小，且文案與圖標符合觸控操作習慣。
- 背景模糊效果確保在任何情況下文字都具備高對比度。

請確認此方案是否符合您的期望？若同意，我將立即開始修改程式碼。