# Agentic Reuse Audit — Mabrig Video Router

Date: 2026-10-03

This upgrade deliberately reuses proven patterns already present across the Mabrig GitHub portfolio instead of inventing a second agent framework.

## Reused patterns

### BuildRx
- Weighted planner/orchestrator pipeline
- Provider fallback chains
- Time budgets and graceful degradation
- Circuit breakers and health probes
- Bounded repair/retry thinking
- Explicit separation between generation and deployment side effects

Applied here as:
- Mission Planner
- Capability Router
- provider scoring/fallback
- circuit breakers
- route-only API that cannot silently spend or publish

### AfrigrantPipeline
- Source/provider registries
- structured autonomous sync
- evidence treated as untrusted input
- explicit provider/model tracking
- strict no-fabrication rules

Applied here as:
- central provider capability registry
- dynamic runtime quota/cost metadata
- no hard-coded claims that a quota is permanently free
- account-quota metadata separated from API billing

### Scholar
- Mission decomposition
- agent trace records
- auditor/critic gate
- reviewable evidence before downstream action

Applied here as:
- Planner -> Quota Scout -> Policy Guard -> Capability Router -> Routing Critic
- complete trace returned with every routing mission

### mabrig-devshield-ai
- Observe -> prioritize -> act -> verify loop
- human approval for consequential operations
- policy gates before automatic mutation
- fail closed instead of silently bypassing a restriction

Applied here as:
- health/quota observation
- scored provider prioritization
- cost/commercial-use gates
- blocked mission when no safe route exists
- human approval flag for paid or uncertain-commercial routes

### AgentOps-Vault-Pro
- typed tool contracts
- side-effect classification
- timeout enforcement
- idempotency context
- scoped approval for external/destructive actions

Applied here as:
- `VideoToolContract`
- `runVideoTool`
- approval requirement before provider execution/publishing tools are added

### Ministry-Prayer-Agent
- model/tool separation
- named tool registry
- errors returned to the agent loop rather than crashing the entire mission

Applied here as:
- provider/tool adapters are isolated behind contracts
- routing can fall through to another eligible provider

## Current implementation boundary

The new `/api/video-router` endpoint performs **planning and routing only**.

It does not:
- spend provider credits,
- automate third-party website logins,
- bypass CAPTCHAs/rate limits,
- strip watermarks,
- publish video,
- or make paid API calls.

Generation adapters can be added behind the guarded tool contract after official API keys, authorized connectors or the local GPU worker are configured.

## Google Vids treatment

Google Vids is registered as `account-quota + connector-required`, not as a normal API provider. This prevents the architecture from pretending that Google Vids included credits and Gemini/Veo API billing are interchangeable.

A future Google Vids connector should obtain quota state through an authorized mechanism and write it into the user's provider wallet. The router can then consume that legitimate quota before a paid API fallback.
