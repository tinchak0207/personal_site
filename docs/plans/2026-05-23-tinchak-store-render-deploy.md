# Tinchak Store deploy note

## Decision

- Vercel is not the right primary target for this codebase.
- This project is a long-running Go server with queue-backed order creation and worker-based auto fulfillment.
- Render fits because it supports a public web service, a background worker, Postgres, and Redis-compatible Key Value.

## Why Vercel was skipped

- Vercel's Go runtime is for Go functions inside `/api`, not for a persistent Gin server process.
- This app requires a queue for order creation and card-secret auto fulfillment, so a single serverless deployment is the wrong shape.

## What was added

- `Dockerfile.render`
  Uses the official `dujiao-all` release so the storefront and admin UI are bundled into one service.
- `scripts/render-entrypoint.sh`
  Converts Render's Redis URL into the individual Redis/queue env vars this app expects.
- `render.yaml`
  Creates:
  - `tinchak-store` web service
  - `tinchak-store-redis` Render Key Value
  - `tinchak-store-db` Render Postgres
- `.github/workflows/render-keepalive.yml`
  Hits `/health` every 10 minutes using the `RENDER_KEEPALIVE_URL` secret.

## Important limits

- The web service is set to `free` for a cheap experiment.
- Render free web services spin down after 15 minutes of no traffic, so the keepalive workflow exists for that.
- The web service runs the app in `all` mode, so HTTP and the asynq worker live in the same container to avoid paying for a separate worker during the experiment.
- Render free web storage is ephemeral. Uploaded images and any local files under `/app/uploads` are not durable on free web.
- For real selling, upgrade the web service and attach a persistent disk at `/app/uploads`, and consider upgrading Postgres and Key Value off free tiers.

## Render setup checklist

1. Create an empty GitHub repo under your own account.
2. Replace the current upstream and push:
   `git remote remove origin`
   `git remote add origin https://github.com/YOUR_GITHUB_NAME/YOUR_REPO.git`
   `git add .`
   `git commit -m "Prepare Tinchak store deploy"`
   `git push -u origin main`
3. Open the Render Blueprint link with:
   `scripts\open-render-blueprint.bat https://github.com/YOUR_GITHUB_NAME/YOUR_REPO`
4. In Render, fill the required secret `BOOTSTRAP_DEFAULT_ADMIN_PASSWORD`.
5. After deploy, add custom domain `store.tinchak0207.xyz`.
6. In GitHub repo secrets, add `RENDER_KEEPALIVE_URL=https://store.tinchak0207.xyz`.
7. Open `https://store.tinchak0207.xyz/console-tinchak`.
