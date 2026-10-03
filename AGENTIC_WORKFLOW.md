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

## Universal video router

The app now includes an agentic routing layer at `/api/video-router`.

Every video-generation mission goes through:

1. **Mission Planner** — normalizes duration, source type, aspect ratio, budget and mode.
2. **Quota Scout** — combines server configuration with the user's connected quota wallet.
3. **Policy Guard** — blocks unapproved spend and applies commercial-use constraints.
4. **Capability Router** — rejects unhealthy/incompatible providers and ranks eligible routes.
5. **Routing Critic** — checks the primary choice against fallbacks and surfaces warnings.

Routing modes:
- `free-only` — zero metered provider spend only.
- `free-preferred` — consume legitimate included/self-hosted capacity first; paid fallback remains explicit.
- `commercial-safe` — only routes with explicitly allowed commercial-use policy.
- `best-quality` — quality may outrank free capacity, but paid execution still requires explicit permission and budget.

### Provider classes

- **Account quota:** Google Vids and future user-owned included quotas. Google Vids remains separate from Gemini/Veo API billing and requires an authorized connector/local bridge.
- **Official APIs:** Gemini/Veo and Runway.
- **Paid gateways:** Eden AI and CometAPI.
- **Self-hosted:** operator GPU worker for Wan/ComfyUI-class generation, lip sync and FFmpeg.

Quota, model rights, watermark behaviour and pricing are runtime metadata. Do not hard-code temporary free-plan values into routing logic.

## Reasoning provider router

For treatment, captions, metadata and critic agents:
- `OPENROUTER_API_KEY`: primary multi-model reasoning route.
- `NVIDIA_API_KEY`: NVIDIA NIM-supported vision/reasoning fallback.
- `HF_TOKEN`: Hugging Face inference/open-model fallback.

## Reliability patterns reused from the Mabrig portfolio

- Circuit breakers and graceful fallback from BuildRx.
- Provider/source registries from AfrigrantPipeline.
- Mission traces and critic gates from Scholar.
- Observe → prioritize → verify guardrails from DevShield.
- Typed side-effect tools, idempotency and scoped approvals from AgentOps-Vault-Pro.
- Tool-loop isolation from Ministry-Prayer-Agent.

See `docs/AGENTIC_REUSE_AUDIT.md` for the repository audit.

## Persistence / queue required before production launch
The current prototype production workflow store is process memory. Replace it with durable storage before real long-running jobs:
- MongoDB/Postgres: projects, jobs, stages, artifacts, approvals, quota wallet and publish receipts.
- Redis/BullMQ or equivalent durable queue: retries, delayed jobs, idempotency and workers.
- R2/S3: source media, intermediates, masters and thumbnails.
- Signed upload URLs: never push large MP3/WAV/video bodies through serverless JSON routes.

## Human-control modes
- **Review first (default):** autonomous generation and QC stop at final approval before public distribution.
- **Auto publish:** after the user explicitly enables it and connects destinations, QC-approved work proceeds to distribution automatically.
- Paid generation must never be silently enabled by a fallback.
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

GOOGLE_VIDS_BRIDGE_ENABLED=false
GEMINI_API_KEY=
RUNWAY_API_KEY=
EDENAI_API_KEY=
COMETAPI_API_KEY=
VIDEO_ROUTER_PAID_FALLBACK=false
VIDEO_ROUTER_MAX_COST_USD=0

MONGODB_URI=
REDIS_URL=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
GPU_WORKER_URL=
GPU_WORKER_TOKEN=

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
