# Project Audit

Target: `anjin243/tiktok-ugc-script-generator`, `main`. Method: read-only GitHub tree/source inspection. No paid API was called, and committed `backend/.env` was deliberately not opened.

## 1. Current structure

```text
.
├─ .genie/      # CloudStudio helpers
├─ backend/     # Express/TypeScript, Prisma, mock and AI modules
├─ docs/        # Product/design metadata and poster
├─ frontend/    # React/Vite app
├─ .cloudstudio
├─ .gitignore
└─ README.md
```

No Docker/Compose file, Python requirements file, existing `SKILL.md`, or repository-level Codex skill was found.

## 2. Frontend stack

React 18, TypeScript 5.9, Vite 5, Tailwind CSS 4, Radix/shadcn-style components, TanStack Query, Axios, React Router, React Hook Form, Zod, and Framer Motion.

## 3. Backend stack

Node.js/TypeScript, Express 4, Zod, Prisma 6, PostgreSQL schema, Pino, Jest/Supertest. The default app mounts an in-memory mock API, so PostgreSQL is not required by the default runtime.

## 4. Startup entries

- Frontend: `frontend/src/main.tsx` → `frontend/src/App.tsx`.
- Backend: `backend/src/index.ts` → `backend/src/app.ts`.
- Default business routes: `backend/src/modules/mock-api.ts`.

## 5. Install commands

Run `npm install` separately in `frontend` and `backend`. npm and pnpm lockfiles coexist; use one package manager consistently.

## 6. Windows local startup

Install Node.js 18+. In separate PowerShell windows run `cd backend; npm install; npm run dev` and `cd frontend; npm install; npm run dev`. Open the Vite URL. The included proxy fix sends `/api` to backend port 3000.

## 7. Environment variables

`NODE_ENV`, `PORT`, `API_PREFIX`, optional `DATABASE_URL`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_MAX_REQUESTS`. The mock runtime needs no database.

## 8. Third-party services/APIs

Source includes optional integrations or stubs for OpenAI, Google Gemini, DeepSeek, Zhipu GLM, SiliconFlow/Qwen, Ollama, Tencent, Baidu, Aliyun, Supabase, PostgreSQL/Prisma, and downstream video-generation products. The default mounted generator calls none of them.

## 9. Potentially paid interfaces

OpenAI, Gemini, Zhipu, SiliconFlow, Tencent, Baidu, Aliyun, hosted database, and video-generation services may charge or impose quotas. Ollama is local but requires compute/model installation. The new skill requires no paid API.

## 10. Is UGC generation real?

Partly. The default route creates a structured template script/storyboard from inputs and reports `usedAI: false`. A separate `generate.ts` has real provider calls but is not mounted by `app.ts`. The default product is therefore a functional template generator, not a fully connected AI generator.

## 11. Template or unfinished product?

A substantial prototype built on a full-stack template. UI, in-memory APIs, scripts, and storyboards exist; README was still template text; database-backed/provider routers are not mounted; claimed AI image/material/export features are incomplete; Malaysia-specific compliance and bilingual output were absent.

## 12. Missing files, paths, or runtime problems

- Frontend proxy used port 3002 while backend defaulted to 3000.
- `.cloudstudio` advertises frontend 5173 while Vite uses 5174.
- Default backend mounts mock routes, not separate product/project/generate/recognize/settings routers.
- Frontend references `/api/ai/recommend-selling-points`; no confirmed mounted route was found.
- Frontend defines multipart upload; the inspected default backend uses base64 images and no confirmed multipart route was found.
- No Docker setup or root workspace manifest exists.

## 13. Existing skill

None before this change.

## 14. Account, key, upload, and privacy risks

- `backend/.env` is committed despite `*.env` ignore. It was not opened; rotate any real credentials and review history.
- `.env.example` contained a credential-looking database password; this change replaces it with placeholders.
- Frontend stores provider keys in `localStorage` and can send them with base64 product images to the backend/third-party provider.
- Provider error text may be logged; avoid sensitive payloads.
- Default API has a 10 MB JSON limit, no authentication, and no confirmed rate-limit middleware.
- `api-client.ts` reads `auth_token`, but no working login flow was found.

## 15. Recommended minimum repair

Align ports; use placeholder examples; rotate and safely untrack committed secrets; document the mock default honestly; keep provider keys server-side before production; add authentication, rate limiting, upload validation, provider allowlisting, and explicit cost/data consent.

## 16. Dangerous operations not recommended

Do not run unknown `.genie` scripts without line-by-line review; run `prisma migrate reset`; force-push; merge to `main`; casually rewrite secret history; keep real keys in browser/commits; enable paid providers or uploads without consent; or advertise mock output as AI/final-video generation.
