# Full-Stack Web Application Template

web application template with monorepo structure.

## Recent Changes

- 000-project-template-inited: Added TypeScript 5.8+ with React 18.3+ + React, Tailwind CSS, Vite 5.4+, @headlessui/react v2.1+

## Audited project status

This is a working React/Express UGC script/storyboard prototype with a free local FFmpeg image-ad exporter and a separate guarded, paid human-AI-video phase-one workflow. The default script route still uses the in-memory template generator (`usedAI: false`). See `PROJECT_AUDIT.md`.

## Windows setup

Use two PowerShell terminals:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Backend defaults to `http://localhost:3000/api`; Vite uses port 5174 and proxies `/api` to 3000.

## Environment variables

Copy `backend/.env.example` to an untracked `backend/.env`. Supported variables: `NODE_ENV`, `PORT`, `API_PREFIX`, optional `DATABASE_URL`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_MAX_REQUESTS`. The mock runtime needs no database or paid AI key.

Never commit `.env`, passwords, cookies, tokens, API keys, store accounts, or customer data.

## Use the Codex skill

Path: `.agents/skills/tiktok-ugc-malaysia-script/SKILL.md`.

```text
$tiktok-ugc-malaysia-script

产品：户外防晒渔夫帽
目标市场：马来西亚
目标客户：钓鱼、露营和户外活动人群
真实卖点：轻便、可折叠、多颜色
视频时长：15秒
禁止虚构：没有UPF检测报告，不能写UPF50+；没有防水证明
输出：马来语脚本并附中文翻译
```

It returns a fact/risk summary, timed storyboard, Malay voiceover/captions, Chinese translations, AI draft prompts, editing order, and pre-publish checks. It neither uploads images nor calls paid APIs by default.

## Safety and cost notice

Optional AI, hosted database, and video-generation services may charge and transfer data. Review cost, terms, privacy, and authorization first. Do not keep production keys in browser local storage.

## Completed

### Basic UGC MP4 export

The current development branch includes a free local FFmpeg export path for 3–8 real product images. It creates a 15-second 1080×1920 MP4 with motion, Malay or bilingual captions, optional voiceover, and low-volume background music. See [docs/UGC_VIDEO_EXPORT.md](docs/UGC_VIDEO_EXPORT.md) for Windows setup, API details, safety limits, and the outdoor fishing hat integration test.

### Human AI video phase 1

The separate paid mode adds guarded OpenAI Videos API planning, current Sora cost estimates, explicit cost authorization, one-scene-at-a-time submission, status polling, preview, product-truth review, and cancellation of future scenes. Tests use a fake client and make no paid request. See [docs/AI_HUMAN_VIDEO_PHASE1.md](docs/AI_HUMAN_VIDEO_PHASE1.md).

React UI, in-memory products/projects, template UGC script/storyboard generation, local image compression, project display, repository audit, and Malaysia UGC Codex skill.

## Not production-ready

Secure authentication/secret storage, fully wired provider AI, durable task persistence, production-scale rendering, and current platform-policy/legal approval.
