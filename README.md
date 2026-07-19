# Full-Stack Web Application Template

web application template with monorepo structure.

## Recent Changes

- 000-project-template-inited: Added TypeScript 5.8+ with React 18.3+ + React, Tailwind CSS, Vite 5.4+, @headlessui/react v2.1+

## Audited project status

This is a working React/Express UGC script/storyboard prototype. By default, the backend mounts an in-memory template generator (`usedAI: false`); provider-backed AI code exists separately but is not mounted. It does not generate a finished video. See `PROJECT_AUDIT.md`.

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

React UI, in-memory products/projects, template UGC script/storyboard generation, local image compression, project display, repository audit, and Malaysia UGC Codex skill.

## Not production-ready

Secure authentication/secret storage, fully wired provider AI, reliable upload, durable persistence, finished video generation, and current platform-policy/legal approval.
