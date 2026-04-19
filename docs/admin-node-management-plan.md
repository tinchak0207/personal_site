# Admin頁面節點管理功能重構方案 (Admin Page Node Management Refactoring Plan)

> **Goal:** 將原本分散在三個獨立 Tab 的「節點管理 (Nodes)」、「二級節點 (Sub-nodes)」與「連線管理 (Edges)」整合為單一的「節點系統 (Node System)」管理介面，以實體 (Entity) 為中心進行統一管理，提升操作直覺性。
> **Architecture:** 採用 Master-Detail 視圖設計，將二級節點和連線的 CRUD 邏輯封裝至個別節點的管理頁面中。
> **Tech Stack:** React, Tailwind CSS, Supabase

---

## 1. 核心設計思路 (Core Design Strategy)

目前 Admin 控制台將 `nodes` (主節點)、`subnodes` (二級節點) 和 `edges` (節點連線) 分散在三個不同的 Tab 進行管理。這種設計缺乏實體關聯性，當用戶想要完整編輯一個主節點的生態（它的子節點與它和誰連線）時，必須在不同 Tab 之間切換。

**重構後：**
- **移除舊 Tabs**：在 `Admin.tsx` 中，只保留一個 `nodes` Tab。
- **統一管理入口**：在 `GraphNodesManager` 列表中，點擊某個節點的 `EDIT` 按鈕，進入該節點的「綜合管理面板」。
- **綜合管理面板**包含三大區塊：
  1. **基本屬性 (Basic Info)**：修改該節點本身的名稱、ID、地址等。
  2. **專屬二級節點 (Sub-Nodes)**：直接列出屬於該節點 (`parent_node_id === currentNode.id`) 的二級節點，並提供就地新增、修改與刪除。
  3. **節點連線 (Connections/Edges)**：列出其他所有主節點，透過 Toggle 開關直接管理當前節點與其他節點的連線狀態。

---

## 2. 程式碼修改範圍 (Implementation Tasks)

### Task 1: 更新導航與路由 (`Admin.tsx`)

**Files:**
- Modify: `src/pages/Admin.tsx`

**Steps:**
- 修改 `AdminTab` 型別，移除 `subnodes` 和 `edges`。
- 在 Tab Navigation 區塊移除 `[ SUB-NODES ]` 和 `6. 連線管理 (EDGES)` 的按鈕。
- 在 Tab Content 區塊移除 `<GraphSubNodesManager />` 和 `<GraphEdgesManager />` 的渲染邏輯。

### Task 2: 重構節點管理介面 (`GraphNodesManager.tsx`)

**Files:**
- Modify: `src/components/admin/GraphNodesManager.tsx`

**Steps:**
- **載入資料擴充**：當進入編輯模式 (`editingNode !== null`) 時，額外載入 `graph_subnodes` (過濾出當前節點為 parent 的資料) 和 `graph_edges` (包含當前節點的連線)。
- **視圖拆分**：將原先的單一表單重構為三個子區塊。
  - **區塊 A：Node Basic Info** (原有的表單邏輯，加上儲存按鈕)。
  - **區塊 B：Sub-Nodes Management** (整合原 `GraphSubNodesManager` 的邏輯，但 `parent_node_id` 固定為當前編輯節點)。
  - **區塊 C：Edges Management** (整合原 `GraphEdgesManager` 的邏輯，顯示其他節點並提供連線 Toggle)。
- **狀態合併**：為了避免單一元件過於龐大，考慮將 Sub-Nodes 和 Edges 的管理邏輯拆分為兩個內部子元件 (例如 `NodeSubNodesPanel` 和 `NodeEdgesPanel`) 放置於同一個檔案或獨立檔案中。

### Task 3: 提取/整合子節點與連線管理組件

**Files:**
- Create: `src/components/admin/NodeSubNodesPanel.tsx` (可選)
- Create: `src/components/admin/NodeEdgesPanel.tsx` (可選)

**Steps:**
- 將原 `GraphSubNodesManager` 的核心邏輯 (增刪改查) 移植到 `NodeSubNodesPanel`，並接收 `parentNodeId` 作為 Prop。
- 將原 `GraphEdgesManager` 的核心邏輯移植到 `NodeEdgesPanel`，並接收 `focusNodeId` 作為 Prop。
- 確保所有 API 操作 (Supabase CRUD) 都帶有適當的 Loading 和 Error 狀態回傳給父層。

### Task 4: 刪除廢棄檔案

**Files:**
- Delete: `src/components/admin/GraphSubNodesManager.tsx`
- Delete: `src/components/admin/GraphEdgesManager.tsx`

**Steps:**
- 確認所有功能已正確轉移且無錯誤後，刪除這些不再使用的檔案，保持專案整潔。

---

## 3. 使用者體驗 (UX) 流程

1. 進入 `ADMIN_CONSOLE` -> 點擊 **5. 節點管理 (NODES)**。
2. 看到所有主節點列表。
3. 點擊 `AI NATIVE` 節點的 `EDIT` 按鈕。
4. 進入 `AI NATIVE` 綜合管理視圖：
   - **基本資訊**：修改 `AI NATIVE` 的名稱、半徑等。
   - **二級節點**：看到屬於 `AI NATIVE` 的二級節點列表，可直接填寫表單新增一個子節點。
   - **連線管理**：看到所有其他主節點 (如 `INFP`, `Cat`) 呈現為按鈕/開關，點擊即可切換它們與 `AI NATIVE` 之間的連線。
5. 點擊「BACK (返回)」返回主節點列表。

---
> 註：請您檢閱此方案，若無問題請回覆「批准」或「同意」，我將立即開始執行程式碼的修改。