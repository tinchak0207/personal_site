# 思維導圖全局與局部 (Zoom) 交互設計規範

## 1. 核心設計理念
在思維導圖的前端交互中，**不存在「閱讀」與「編輯」的分別，只有「全局 (Global)」與「局部 (Local/Zoom)」視角的切換**。
無論處於哪種視角，使用者皆可進行新增、刪除、修改節點等基礎導圖操作。兩種視角的核心差異僅在於**畫布視角定位**與**滑鼠基礎操作邏輯的覆寫**，以滿足總覽全局與深度聚焦局部的不同需求。

- **全局模式 (Global State)**：預設的思維導圖總覽視角，適合大幅度的結構調整與整體瀏覽。
- **局部模式 (Zoom State)**：聚焦於特定節點及其子樹的視角，操作邏輯轉向「畫布探索」，防止視角或結構在聚焦操作時意外跑版。

---

## 2. 狀態觸發與退出機制

### 進入 Zoom 狀態（局部模式）
- **操作**：在全局模式下，使用滑鼠左鍵點擊任意節點。
- **反饋**：
  - 視角平滑過渡（Animation/Easing），將點擊的節點置中對齊。
  - 視角自動放大（Zoom In）至適合該節點及其周圍結構的比例。

### 退出 Zoom 狀態（返回全局模式）
- **操作**：
  - **唯一途徑**：只能透過點擊畫面右上角的「紅色像素退出按鈕」。
- **反饋**：
  - 交互邏輯切換回全局模式。
  - 視角平滑退回（Zoom Out）至進入前的全局比例與位置。

---

## 3. Zoom 狀態下的交互邏輯變更

進入 Zoom 狀態後，為了方便在局部細節中探索，滑鼠的基礎行為會發生改變：

| 操作類型 | 全局模式 (Global) | Zoom 狀態 (Local/Zoom) |
| :--- | :--- | :--- |
| **滑鼠滾輪 (Scroll)** | 畫面上下/左右滾動 | **縮放畫面** (向上放大、向下縮小畫布) |
| **滑鼠拖曳 (Drag)** | 拖動節點改變位置或層級 | **平移畫布** (Panning，移動視角位置，不改變節點位置) |
| **節點點擊 (Click)** | 選取節點 (觸發 Zoom) | **焦點切換** (平滑移動視角至新點擊的節點，維持在 Zoom 狀態) |

---

## 4. 退出按鈕 (Exit Button) UI/UX 設計

為了配合產品風格並確保按鈕不被導圖內容遮蔽，退出按鈕採用**紅色像素風格 (Pixel Art)** 的 SVG，並強制固定在畫面右上角。

### 4.1 位置定位 (CSS Positioning)
按鈕必須採用絕對定位或固定定位，吸附在視窗的右上角：
```css
.zoom-exit-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  z-index: 9999; /* 確保在畫布最上層 */
  transition: transform 0.1s ease;
}
.zoom-exit-btn:hover {
  transform: scale(1.1); /* 懸停時稍微放大 */
}
.zoom-exit-btn:active {
  transform: scale(0.95); /* 點擊時微縮反饋 */
}
```

### 4.2 紅色像素風格 SVG 原始碼
使用純粹的 SVG `rect` 拼湊出的像素叉號（X），並加入 `shape-rendering="crispEdges"` 屬性以保證邊緣銳利，呈現完美的像素感 (Pixel Art)：

```html
<!-- 像素風格紅色退出按鈕 SVG -->
<svg class="zoom-exit-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11" shape-rendering="crispEdges">
  <!-- 像素紅色背景 -->
  <rect width="11" height="11" fill="#FF0000" />
  
  <!-- 像素白色 X 圖標 -->
  <path fill="#FFFFFF" d="
    M 2 2 h 1 v 1 h 1 v 1 h 1 v 1 h 1 v 1 h 1 v -1 h 1 v -1 h 1 v -1 h 1 v -1
    h 1 v 1 h -1 v 1 h -1 v 1 h -1 v 1 h 1 v 1 h 1 v 1 h 1 v 1
    h -1 v -1 h -1 v -1 h -1 v -1 h -1 v 1 h -1 v 1 h -1 v 1
    h -1 v -1 h 1 v -1 h 1 v -1 h -1 v -1 h -1 v -1
  " />
  <!-- 更簡潔的 11x11 像素白 X 實現 -->
  <!-- 
    (2,2)(8,2)
    (3,3)(7,3)
    (4,4)(6,4)
      (5,5)
    (4,6)(6,6)
    (3,7)(7,7)
    (2,8)(8,8)
  -->
  <rect x="2" y="2" width="1" height="1" fill="#ffffff"/>
  <rect x="8" y="2" width="1" height="1" fill="#ffffff"/>
  <rect x="3" y="3" width="1" height="1" fill="#ffffff"/>
  <rect x="7" y="3" width="1" height="1" fill="#ffffff"/>
  <rect x="4" y="4" width="1" height="1" fill="#ffffff"/>
  <rect x="6" y="4" width="1" height="1" fill="#ffffff"/>
  <rect x="5" y="5" width="1" height="1" fill="#ffffff"/>
  <rect x="4" y="6" width="1" height="1" fill="#ffffff"/>
  <rect x="6" y="6" width="1" height="1" fill="#ffffff"/>
  <rect x="3" y="7" width="1" height="1" fill="#ffffff"/>
  <rect x="7" y="7" width="1" height="1" fill="#ffffff"/>
  <rect x="2" y="8" width="1" height="1" fill="#ffffff"/>
  <rect x="8" y="8" width="1" height="1" fill="#ffffff"/>
</svg>
```
*(備註：上方 SVG 包含兩種 X 的畫法，開發時擇一使用 `rect` 組合或 `path` 即可，`rect` 組合能最直覺保證像素不失真。)*

---

## 5. 技術實現邏輯 (偽代碼)

在前端實作中，將狀態分為 `isZoomMode`：

```javascript
// 全域狀態
let isZoomMode = false;

// 節點點擊事件
function onNodeClick(node) {
  if (!isZoomMode) {
    isZoomMode = true;
    showExitButton(); // 顯示右上角的像素退出按鈕
    zoomToNode(node); // 放大並置中節點
  } else {
    zoomToNode(node); // 已經在局部模式，僅平滑切換焦點
  }
}

// 點擊右上角退出按鈕
document.querySelector('.zoom-exit-btn').addEventListener('click', () => {
  isZoomMode = false;
  hideExitButton();
  resetToGlobalView(); // 退回全局視角
});

// 滑鼠滾輪事件
canvas.addEventListener('wheel', (e) => {
  if (isZoomMode) {
    e.preventDefault(); 
    handleCanvasZoom(e.deltaY); // 縮放畫布
  } else {
    handleCanvasScroll(e.deltaX, e.deltaY); // 全局模式的上下左右滾動
  }
});

// 滑鼠拖曳事件 (mousedown, mousemove, mouseup)
canvas.addEventListener('mousedown', (e) => {
  if (isZoomMode) {
    startCanvasPanning(e); // 局部模式：平移畫布
  } else {
    if (isNode(e.target)) {
      startNodeDragging(e.target, e); // 全局模式：拖曳節點
    }
  }
});
```
