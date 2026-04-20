# 思維導圖 Zoom 狀態（聚焦模式）交互設計規範

## 1. 核心設計理念
在思維導圖中區分「一般模式」與「聚焦模式（Zoom 狀態）」，旨在解決使用者在複雜導圖中「編輯/調整結構」與「瀏覽/深度閱讀」兩種情境下的不同操作需求。

- **一般模式 (Normal Mode)**：側重結構編輯（拖曳節點改變層級、雙擊修改文字）。
- **Zoom 狀態 (Focus/Zoom Mode)**：側重全局或局部的深度瀏覽，防止誤觸修改結構。

---

## 2. 狀態觸發與退出機制

### 進入 Zoom 狀態
- **操作**：在「一般模式」下，使用滑鼠左鍵點擊任意節點。
- **反饋**：
  - 視角平滑過渡（Animation/Easing），將該節點置中。
  - 視角自動放大（Zoom In）至適合閱讀的比例。
  - 背景可能微暗或增加聚焦的視覺特效，以強調當前處於特殊狀態。

### 退出 Zoom 狀態
- **操作**：
  1. **主要途徑**：只能透過點擊畫面上固定的「退出按鈕 (Exit Button)」。
  2. **輔助途徑（推薦）**：支援鍵盤 `Esc` 鍵快捷退出，符合普遍使用者的直覺習慣。
- **反饋**：
  - 交互邏輯切換回「一般模式」。
  - 視角平滑退回（Zoom Out）至進入前的全局比例與位置。

---

## 3. Zoom 狀態下的交互邏輯變更

在進入 Zoom 狀態後，滑鼠的基礎操作將被覆寫（Override），以滿足瀏覽需求：

| 操作類型 | 一般模式 (Normal) | Zoom 狀態 (Zoom Mode) |
| :--- | :--- | :--- |
| **滑鼠滾輪 (Scroll)** | 畫面上下/左右滾動 | **縮放畫面** (向上放大、向下縮小) |
| **滑鼠拖曳 (Drag)** | 拖動節點改變位置或層級 | **平移畫布** (Panning，移動視角位置) |
| **節點點擊 (Click)** | 選取節點並進入編輯狀態 | **焦點切換** (平滑移動視角至新點擊的節點) |
| **雙擊背景 (DblClick)**| 創建新節點 | 無作用 (防止誤觸) |

---

## 4. 退出按鈕 (Exit Button) UI/UX 設計

為了確保在任意縮放與平移狀態下，使用者都能清楚找到退出方式，退出按鈕的設計需遵循以下原則：

### 4.1 位置 (Positioning)
- **固定定位 (`position: fixed` 或 `absolute` 於視窗層)**：按鈕必須固定在視窗介面上，不隨畫布（Canvas）的拖曳而移動。
- **建議擺放區域**：
  - **右上角**：最符合常見的「關閉 / 退出全螢幕」習慣。
  - **正上方懸浮 (Top Center Floating)**：像是一個狀態列，提示當前處於特殊模式。

### 4.2 視覺設計 (Visuals)
- **高對比度**：由於思維導圖背景可能很複雜，按鈕必須有實色背景（如白底或深色底）加上輕微的陰影（Drop shadow），確保能與導圖內容區分。
- **圖標與文字**：
  - 建議使用明確的圖標：如「縮小圖標 (Zoom Out)」、「返回箭頭 (Back)」或「叉號 (X)」。
  - 搭配文字標籤：例如「退出聚焦」、「返回全覽 (Exit Zoom)」，降低學習成本。
- **狀態變化 (Hover State)**：滑鼠懸停時給予明顯的反饋（如按鈕變色或放大），增加點擊欲望。

---

## 5. 技術實現建議 (偽代碼邏輯架構)

在前端實作時，建議透過狀態機 (State Machine) 來管理事件監聽：

```javascript
// 全域狀態
let isZoomMode = false;

// 點擊節點事件
function onNodeClick(node) {
  if (!isZoomMode) {
    enterZoomMode(node);
  } else {
    focusOnNode(node); // 已經在 Zoom 模式，僅切換焦點
  }
}

// 點擊退出按鈕事件
function onExitButtonClick() {
  exitZoomMode();
}

// 滑鼠滾輪事件
canvas.addEventListener('wheel', (e) => {
  if (isZoomMode) {
    e.preventDefault(); 
    handleZoom(e.deltaY); // 執行縮放
  } else {
    handleScroll(e.deltaX, e.deltaY); // 一般模式的滾動
  }
});

// 滑鼠拖曳事件 (mousedown, mousemove, mouseup)
canvas.addEventListener('mousedown', (e) => {
  const target = e.target;
  if (isZoomMode) {
    startCanvasPanning(e); // 鎖定節點，改為平移畫布
  } else {
    if (isNode(target)) {
      startNodeDragging(target, e); // 拖曳節點
    }
  }
});
```

## 6. 總結
此設計將「編輯結構」與「瀏覽內容」明確分離。透過專屬的 Zoom 狀態與清晰的退出按鈕，使用者能更專注地閱讀思維導圖的局部細節，同時利用滾輪縮放與拖曳平移的直覺操作，大幅提升大型導圖的瀏覽體驗。