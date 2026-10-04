# AI Video Competitive Benchmark

Date: 2026-10-04

This benchmark compares product ideas and public capabilities. AI Video does **not** copy source code from benchmarked projects unless a compatible dependency is intentionally adopted and its licence obligations are satisfied.

## Benchmarked projects

### Remotion
Repository: remotion-dev/remotion

Strengths:
- agentic, interactive and programmatic video creation
- reusable components and design systems
- player/editor workflows
- captions, transitions, sound effects and templates
- batch rendering and multiple render backends

Licence note:
- Remotion uses a special licence rather than a standard permissive open-source licence.
- AI Video borrows product concepts only; no Remotion code is copied by this benchmark upgrade.

### ComfyUI
Repository: Comfy-Org/ComfyUI

Strengths:
- reusable visual workflows and subgraphs
- workflow templates and App Mode
- asynchronous queues
- partial graph re-execution
- local/offline workflows
- extensible custom nodes and large model ecosystem
- workflow JSON portability

Licence note:
- GPL-3.0.
- AI Video independently implements workflow/scene concepts and does not copy ComfyUI source code.

### MoneyPrinterTurbo
Repository: harry0703/MoneyPrinterTurbo

Strengths:
- one-click topic-to-video workflow
- WebUI, API, CLI and agent workflows
- script, voiceover, footage, subtitles, music and editing pipeline
- batch output variants
- task history
- generation settings import/export
- word-by-word subtitle styles and background-music preview

Licence:
- review upstream licence before adopting code directly.
- this change only implements independently designed batch-variant and portable-settings concepts.

### Wan2.1
Repository: Wan-Video/Wan2.1

Strengths:
- text-to-video
- image-to-video
- video editing
- first/last-frame-to-video
- open local inference options
- consumer-GPU model variant
- integration with ComfyUI and Diffusers

Licence:
- Apache-2.0 for the repository code; model weights may have separate terms.
- AI Video uses Wan as an execution target/interface rather than copying inference code into the web app.

## AI Video feature position

| Capability | AI Video | Remotion | ComfyUI | MoneyPrinterTurbo | Wan2.1 |
|---|---|---|---|---|---|
| Agentic routing | Yes | Agent-oriented | Workflow driven | Agent workflow | No |
| Multi-provider video APIs | Yes | Via app code | Partner/API nodes | Multiple media/AI providers | Model family |
| Cost/quota-aware routing | Yes | App-defined | No central cross-provider wallet | Limited | No |
| Human paid-execution gate | Yes | App-defined | App-defined | App-defined | N/A |
| Scene timeline | Added | Strong | Graph-based | Workflow/task based | No |
| Scene-level partial rerun | Added | Composition-level possible | Strong | Partial workflow control | Generation task |
| Workflow JSON import/export | Added | Code/config | Strong | Settings import/export | Config/CLI |
| Batch variants | Added | Strong batch rendering | Queue batching | Strong | CLI batching |
| Render profiles | Added | Strong | Output nodes | Video settings | Model settings |
| First/last-frame mode | Added to scene model | App-defined | Supported through workflows | Limited | Strong |
| Local GPU path | Yes | Render backend | Strong | Local options | Strong |
| Commercial/right/cost policy gates | Strong | App-defined | App-defined | App-defined | Licence/model dependent |

## Competitive features added in this upgrade

1. **Scene Timeline**
   - Ordered scene cards.
   - Per-scene duration, prompt, source mode and preferred provider.
   - Reorder and duplicate scenes.

2. **Partial Rerun / Variants**
   - Create variants for a single scene without invalidating other scenes.
   - Batch plan 1–4 variants.
   - Variant history belongs to each scene.

3. **Portable Workflow JSON**
   - Export project state.
   - Import and validate project state.
   - Keeps scene order, prompts, variants, provider preferences and render preset.

4. **Render Profiles**
   - Cinema 1080p.
   - YouTube 1080p.
   - Shorts/Reels vertical.
   - Square social.
   - 4:5 feed.

5. **Advanced Source Modes**
   - Text-to-video.
   - Image-to-video.
   - Video-to-video.
   - First + last frame.

## Next competitive upgrades

Highest-value next steps:
- durable workflow history in MongoDB
- scene thumbnails and asset library in R2
- drag/drop timeline
- captions editor with word-level timing
- background-music library with preview
- scene output compare/A-B selector
- undo/redo event log
- reusable workflow templates
- webhook/API automation
- actual partial execution so only dirty scenes enter the generation queue
- deterministic FFmpeg render manifest and retryable render stages
