# image.tinchak0207.xyz

一個以開源底座為核心、重新品牌化的 AI 圖片生成前端站。

目前這個專案已完成：

- 選定並落地開源底座：`vercel-labs/ai-sdk-image-generator`
- 備份原本自製版本到 [archived-custom-ui](</C:/Users/user/Documents/New project/image-tinchak0207/archived-custom-ui>)
- 將主專案切換為成熟可運行的圖片生成工作台
- 收斂成單品牌 `image.tinchak0207.xyz`
- 將後端改為走單一圖片生成通道，並支援主 / 備中轉站 fallback

## 現在的技術方向

- 前端框架：Next.js App Router
- UI 基底：shadcn/ui + Tailwind CSS
- 圖片生成：AI SDK + OpenAI-compatible image endpoint
- 品牌方向：`image.tinchak0207.xyz`
- 視覺方向：偏 iOS 26 liquid glass、白卡、微漸變、柔和環境光

## 已做的改造

- 去掉原模板的多供應商 demo 心智
- 收斂成單一品牌圖片工作台
- 中文化首頁、輸入區、提示詞建議與結果展示
- 將圖片生成 route 改成主 / 備端點 fallback
- 補好本地可運行配置，`localhost:3000` 可啟動

## 環境變數

建立 `.env.local`：

```env
IMAGE_API_KEY="your_primary_api_key"
IMAGE_API_BASE_URL="https://share-api.com/v1"
IMAGE_API_MODEL="gpt-image-2"

IMAGE_API_KEY_FALLBACK="your_fallback_api_key"
IMAGE_API_BASE_URL_FALLBACK="https://happycode.vip/v1"
```

## 本地啟動

```bash
npm install
npm run build
npm run start
```

若只做開發調整：

```bash
npm run dev
```

## 目前最重要的檔案

- [src/app/page.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/app/page.tsx>)
- [src/app/layout.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/app/layout.tsx>)
- [src/app/globals.css](</C:/Users/user/Documents/New project/image-tinchak0207/src/app/globals.css>)
- [src/app/api/generate-images/route.ts](</C:/Users/user/Documents/New project/image-tinchak0207/src/app/api/generate-images/route.ts>)
- [src/app/api/healthz/route.ts](</C:/Users/user/Documents/New project/image-tinchak0207/src/app/api/healthz/route.ts>)
- [src/components/Header.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/components/Header.tsx>)
- [src/components/ImagePlayground.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/components/ImagePlayground.tsx>)
- [src/components/PromptInput.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/components/PromptInput.tsx>)
- [src/components/ModelSelect.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/components/ModelSelect.tsx>)
- [src/components/ImageDisplay.tsx](</C:/Users/user/Documents/New project/image-tinchak0207/src/components/ImageDisplay.tsx>)
- [src/lib/provider-config.ts](</C:/Users/user/Documents/New project/image-tinchak0207/src/lib/provider-config.ts>)
- [src/lib/suggestions.ts](</C:/Users/user/Documents/New project/image-tinchak0207/src/lib/suggestions.ts>)
- [DEPLOYMENT.md](</C:/Users/user/Documents/New project/image-tinchak0207/DEPLOYMENT.md>)
- [deploy/cloudflare-keepalive/worker.js](</C:/Users/user/Documents/New project/image-tinchak0207/deploy/cloudflare-keepalive/worker.js>)
- [deploy/cloudflare-keepalive/wrangler.toml.example](</C:/Users/user/Documents/New project/image-tinchak0207/deploy/cloudflare-keepalive/wrangler.toml.example>)

## 下一步最值得做

1. 把結果工作區再往完整 SaaS 工作台收斂
2. 把 mobile 端做得更像 App / WebView 首頁
3. 接登入、額度、訂單與支付
4. 做生成歷史持久化
5. 補正式 domain metadata、OG 圖與部署設定
