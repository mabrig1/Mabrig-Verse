# Mabrig Verse — Smallest Working Production Path

This path proves **real upload → durable Mongo job → durable Redis queue → separate FFmpeg worker → ffprobe QC → downloadable MP4 master** without pretending any external AI, R2, GPU model, or social publishing API is configured.

## What is real in this slice

- MongoDB stores render job state and events.
- Redis stores the worker handoff queue.
- The app and worker are separate containers/processes.
- Source audio and masters live on a Docker named volume shared by app + worker.
- FFmpeg creates a real H.264/AAC MP4 master.
- ffprobe verifies duration, H.264 video and AAC audio before the job becomes `ready`.
- `/api/render/:id/download` returns the finished MP4 only after QC passes.

## What is intentionally not active yet

- OpenRouter / NVIDIA / Hugging Face creative agents
- R2/S3 object storage
- GPU video generation or lip sync
- YouTube / Instagram / Facebook / TikTok / website publishing

Those adapters should only be enabled after their real credentials and account approvals exist.

## Start the stack

```bash
docker compose up --build
```

Services:

- App: `http://localhost:3000`
- Worker health: `http://localhost:8080/health`
- MongoDB: internal Docker network
- Redis: internal Docker network

## Upload one real audio file

```bash
curl -sS -X POST http://localhost:3000/api/render \
  -F 'audio=@/absolute/path/to/song.mp3' \
  -F 'brief=First Mabrig Verse production proof' \
  -F 'ratio=16:9'
```

Expected response:

```json
{
  "id": "mv_...",
  "state": "queued",
  "statusUrl": "/api/render/mv_...",
  "message": "Upload accepted and queued for the FFmpeg worker."
}
```

## Watch status

```bash
curl -sS http://localhost:3000/api/render/<JOB_ID>
```

Normal state progression:

`queued → rendering → qc → ready`

A ready job includes persisted QC similar to:

```json
{
  "passed": true,
  "duration": 213.4,
  "videoCodec": "h264",
  "audioCodec": "aac",
  "checks": ["duration>0", "video=h264", "audio=aac"]
}
```

## Download the master

```bash
curl -L http://localhost:3000/api/render/<JOB_ID>/download -o mabrig-verse-master.mp4
```

The proof master is deliberately visually simple: a black 1920×1080 canvas (or 1080×1920 for `9:16`) carrying the uploaded audio. That is enough to verify the production plumbing before adding generative image/video, lip-sync and editing agents.

## Failure behavior

- Missing Mongo/Redis configuration returns a configuration error instead of silently falling back to memory.
- Unsupported/empty/oversized audio is rejected before queueing.
- FFmpeg failure produces `state=failed` with the captured error.
- Failed ffprobe QC never exposes a downloadable master.
- Switching away from `STORAGE_DRIVER=local` returns `501` until an actual object-storage adapter exists.

## Next smallest upgrades after this proof

1. Add an R2/S3 storage adapter and signed uploads; retain local storage for development.
2. Replace the simple Redis list with BullMQ if job retries, backoff, concurrency controls and dashboards are needed.
3. Connect the 12-agent orchestration stages to this durable render job and artifact model.
4. Add image/reference ingestion and a first deterministic visual template.
5. Add GPU/lip-sync providers only after their endpoints and credentials are actually configured.
6. Add publishing adapters one destination at a time, with idempotent receipts and explicit authorization.
