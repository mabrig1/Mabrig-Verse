# Mabrig Verse — Agentic Production & Publishing Workflow

## Goal
One instruction should be enough: the creator uploads a master MP3/WAV, reference images and a creative brief. The production crew then plans, generates, repairs, masters and distributes the finished music video.

## Pipeline
1. **Executive Producer** — validates inputs, rights/consent, goals, destinations and delivery settings.
2. **Music Intelligence** — transcription/lyrics, vocal timing, BPM, beats, sections, energy and hook map.
3. **Creative Director** — treatment, story arc, template selection, scene grammar and shot list.
4. **Identity & Continuity** — artist identity pack; rejects face/wardrobe/scene drift.
5. **Performance Director** — creates singing/performance shots around vocal regions.
6. **Lip-Sync Supervisor** — phoneme alignment, face tracking and local repair. Performance shots that fail sync are regenerated rather than hidden with B-roll.
7. **Cinematographer** — narrative/lyric B-roll and transitions.
8. **Editor** — beat-aware assembly, pacing and continuity.
9. **Finishing Artist** — colour, captions, audio master and multi-aspect exports.
10. **QC Critic** — scores lip sync, identity, temporal consistency, artifacts, audio, captions and platform compliance. Failed dimensions loop back to the responsible agent.
11. **Campaign Agent** — titles, descriptions, captions, hashtags, credits, thumbnails and website copy.
12. **Distribution Agent** — posts only to explicitly connected/authorized channels, records returned URLs and verifies publication.

## Provider router
Use capability-based routing rather than hard-coding one vendor. Recommended adapters:
- `OPENROUTER_API_KEY`: reasoning, treatment, captions, metadata, critic agents. Prefer free models when available, then configured fallback.
- `NVIDIA_API_KEY`: NVIDIA NIM-supported vision/reasoning/generative endpoints configured by the operator.
- `HF_TOKEN`: Hugging Face inference endpoints and open models.
- Local/self-hosted workers: FFmpeg, Whisper/WhisperX, Demucs, MediaPipe, Wav2Lip/MuseTalk-class lip-sync models, ComfyUI/video diffusion where GPU capacity exists.

The router should score providers by task capability, health, latency, quality floor and cost ceiling. A failed provider should retry safely and then fall back without losing the job state.

## Persistence / queue required before production launch
The current prototype workflow store is process memory. Replace it with durable storage before real long-running jobs:
- MongoDB/Postgres: projects, jobs, stages, artifacts, approvals, publish receipts.
- Redis/BullMQ or equivalent durable queue: retries, delayed jobs, idempotency and workers.
- R2/S3: source media, intermediates, masters and thumbnails.
- Signed upload URLs: never push large MP3/WAV/video bodies through serverless JSON routes.

## Human-control modes
- **Review first (default):** autonomous generation and QC stop at final approval before public distribution.
- **Auto publish:** after the user explicitly enables it and connects destinations, QC-approved work proceeds to distribution automatically.
- Every destination can be individually disabled. Publishing must be idempotent to prevent duplicate posts.

## Distribution adapters
Implement adapters only after OAuth/API credentials are configured for each destination:
- YouTube Data API upload
- Meta Graph API for eligible Facebook/Instagram publishing
- TikTok Content Posting API where the account/app is approved
- Website adapter: authenticated webhook/CMS endpoint for `mabrigkorie.org` (or configured site)

Never store social access tokens in client-side code. Keep tokens encrypted server-side and request the minimum scopes required.

## Suggested environment variables
```text
OPENROUTER_API_KEY=
NVIDIA_API_KEY=
HF_TOKEN=
MONGODB_URI=
REDIS_URL=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
META_APP_ID=
META_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
WEBSITE_PUBLISH_URL=
WEBSITE_PUBLISH_TOKEN=
```

## Quality gates
Do not equate an API success response with a finished video. The QC loop must reject and repair weak segments. Keep measurable thresholds configurable per template and export target. Store the score report alongside each approved master.
