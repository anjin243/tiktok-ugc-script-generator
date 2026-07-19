# Human AI video workflow — phase 1

This phase adds a guarded workflow for real image-to-video generation through the official OpenAI Videos API. Tests use an injected fake client and never make a paid request.

## Official API assumptions

- Create: `POST https://api.openai.com/v1/videos`
- Status: `GET /v1/videos/{video_id}`
- Content: `GET /v1/videos/{video_id}/content`
- Models: `sora-2` (default) and `sora-2-pro`
- Clip durations exposed by the UI: 4 or 8 seconds
- One `input_reference` object is sent per scene. The planner assigns one of the 1–4 uploaded images to each scene.
- Default portrait generation is 720×1280. Pro can select 1024×1792. Final post-production can scale approved clips to 1080×1920.

OpenAI's current model pages label the Sora 2 series as Legacy. API availability therefore depends on the user's OpenAI project. Confirm current model status and pricing before enabling a paid generation.

Official references:

- https://developers.openai.com/api/reference/resources/videos/methods/create
- https://developers.openai.com/api/docs/models/sora-2
- https://developers.openai.com/api/docs/models/sora-2-pro

## API key

Copy `backend/.env.example` to `backend/.env` yourself and set:

```dotenv
OPENAI_API_KEY=your_project_key_here
```

The key is read only by the backend. It is never returned by a route, sent to the frontend, stored in localStorage, or included in task JSON. Do not commit `backend/.env`.

To avoid reading `backend/.env`, inject it into the terminal instead:

```powershell
$env:OPENAI_API_KEY='your_project_key_here'
$env:SKIP_DOTENV='1'
pnpm dev
```

## Windows startup

Backend:

```powershell
cd backend
pnpm install
pnpm dev
```

Frontend in a second terminal:

```powershell
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5174/ai-video`.

## Cost confirmation flow

1. Fill the product, adult model, setting, style, language, and immutable product details.
2. Upload 1–4 product reference images.
3. Keep `sora-2`, 720×1280, 4 seconds, and four scenes for the default lower-cost plan.
4. Click **计算调用次数与预计费用**. This does not call OpenAI.
5. Click **创建任务（不会调用付费API）**. This validates and stores the plan and images locally.
6. Review the estimate, enable the cost checkbox, and type `确认付费生成` exactly.
7. Click **确认费用（仍不生成）**. This still does not call OpenAI.
8. Click **生成第一个4秒真人测试镜头（付费）**. This is the first action that submits the scene to `POST /v1/videos`.

Each scene is generated individually. There is no automatic paid retry. A later scene stays locked until every earlier scene is manually marked publishable.

## Product-truth review

Every downloaded scene must be previewed and checked for main color, structure, logo, product quantity, and accessories. Any failed item marks the scene unpublishable. Unapproved scenes cannot reach `ready_to_finalize`.

Cancelling stops future scene submissions. It cannot undo a job already submitted to OpenAI, which may still complete and may still be billed.

## Phase boundary

Phase 1 implements input, estimates, guarded paid submission, status polling, MP4 download, persisted task snapshots, per-scene preview/review, and cancellation of future scenes. Final FFmpeg assembly is deferred until approved real scene outputs exist, so subtitle timing, voiceover, music ducking, and the 15-second cut can be verified against actual media.

## No-paid-call tests

```powershell
cd backend
$env:FFMPEG_PATH='C:\path\to\ffmpeg.exe'
$env:FFPROBE_PATH='C:\path\to\ffprobe.exe'
pnpm test:ugc-video
```

The AI workflow test injects a fake OpenAI client and asserts that draft creation, estimation, and cost authorization make zero video-generation calls.
