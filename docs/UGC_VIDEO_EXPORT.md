# Basic TikTok Malaysia UGC MP4 export

This feature turns 3–8 verified product images into a 15-second, 1080×1920 H.264 MP4. It uses the repository's Malaysia UGC compliance rules and local FFmpeg only. It does not call a paid video API.

## Windows prerequisites

Install Node.js and pnpm, then install FFmpeg from the Windows package catalog:

```powershell
winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
```

Open a new terminal and verify both binaries:

```powershell
ffmpeg -version
ffprobe -version
```

If a new terminal still cannot find them, locate the package with `winget list --id Gyan.FFmpeg` and add its `bin` directory to `PATH`. The backend also accepts process-level `FFMPEG_PATH` and `FFPROBE_PATH` variables; do not store sensitive values in browser storage.

## Local run without reading `backend/.env`

Backend:

```powershell
cd backend
$env:SKIP_DOTENV='1'
$env:NODE_ENV='development'
$env:PORT='3000'
pnpm install
pnpm dev
```

Frontend, in another terminal:

```powershell
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5174/ugc-export`.

## Workflow

1. Enter verified product details and evidence gaps.
2. Upload 3–8 JPEG, PNG, or WebP product images and arrange them in order.
3. Optionally upload MP3, WAV, or M4A voiceover and background music.
4. Choose Malay-only or bilingual Malay/Chinese captions.
5. Generate and poll the task until the preview and MP4 download are ready.

Output is written to:

```text
output/<product-slug>-ugc-my.mp4
```

## Free voiceover behavior

The backend detects `espeak-ng` as an optional, free local TTS engine. If it is available, `ttsMode=auto` uses its Malay voice. If it is not available, rendering continues without narration and returns a warning so the user can upload a voiceover file. Background music is mixed at 18% volume while uploaded or generated narration is mixed at full volume.

## API

- `GET /api/ugc-video/capabilities`
- `POST /api/ugc-video/tasks` as multipart form data
- `GET /api/ugc-video/tasks/:taskId`
- `GET /api/ugc-video/tasks/:taskId/video`
- `GET /api/ugc-video/tasks/:taskId/download`

The upload endpoint accepts `images`, optional `voiceover`, optional `music`, and a JSON `metadata` field. Files are validated by signature and FFprobe, stored under a random temporary task directory, never executed, and deleted after rendering.

## Test

```powershell
cd backend
$env:SKIP_DOTENV='1'
pnpm test:ugc-video
```

The outdoor fishing hat integration case creates real images, renders an MP4, extracts a preview frame, and verifies codec, duration, dimensions, and output size.
