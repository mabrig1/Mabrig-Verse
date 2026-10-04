import { routeVideoGeneration } from './router';
import { runtimeStatesFromEnvironment } from './provider-registry';
import type {
  AgentTraceStep,
  ProviderRuntimeState,
  VideoGenerationRequest,
  VideoRoutingMission,
} from './types';

function missionId() {
  return `video_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function traceStep(
  trace: AgentTraceStep[],
  agent: string,
  action: string,
  startedAt: number,
  detail: string,
  status: AgentTraceStep['status'] = 'completed',
) {
  trace.push({
    agent,
    action,
    status,
    detail,
    durationMs: Date.now() - startedAt,
  });
}

function validateRequest(input: VideoGenerationRequest): VideoGenerationRequest {
  const prompt = input.prompt?.trim();
  if (!prompt) throw new Error('prompt is required');

  const durationSeconds = Number(input.durationSeconds);
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > 180
  ) {
    throw new Error('durationSeconds must be between 1 and 180');
  }

  const allowedRatios = new Set(['16:9', '9:16', '1:1']);
  if (!allowedRatios.has(input.aspectRatio)) {
    throw new Error('aspectRatio must be 16:9, 9:16 or 1:1');
  }

  const maxCostUsd =
    typeof input.maxCostUsd === 'number'
      ? Math.max(0, input.maxCostUsd)
      : undefined;

  return {
    ...input,
    prompt,
    durationSeconds,
    source: input.source ?? 'text',
    commercialUse: Boolean(input.commercialUse),
    allowPaidFallback: Boolean(input.allowPaidFallback),
    maxCostUsd,
    preferredProviders: input.preferredProviders?.slice(0, 10),
    blockedProviders: input.blockedProviders?.slice(0, 20),
  };
}

function sanitizeWalletState(
  states: ProviderRuntimeState[] | undefined,
): ProviderRuntimeState[] {
  if (!states) return [];

  return states.slice(0, 50).map((state) => ({
    providerId: String(state.providerId).slice(0, 80),
    configured: Boolean(state.configured),
    healthy: Boolean(state.healthy),
    available: Boolean(state.available),
    quotaRemaining:
      typeof state.quotaRemaining === 'number' &&
      Number.isFinite(state.quotaRemaining)
        ? Math.max(0, state.quotaRemaining)
        : undefined,
    quotaUnit: state.quotaUnit,
    quotaRenewsAt:
      typeof state.quotaRenewsAt === 'string'
        ? state.quotaRenewsAt.slice(0, 80)
        : undefined,
    estimatedCostUsd:
      typeof state.estimatedCostUsd === 'number' &&
      Number.isFinite(state.estimatedCostUsd)
        ? Math.max(0, state.estimatedCostUsd)
        : undefined,
    latencyMs:
      typeof state.latencyMs === 'number' && Number.isFinite(state.latencyMs)
        ? Math.max(0, state.latencyMs)
        : undefined,
    qualityScore:
      typeof state.qualityScore === 'number' &&
      Number.isFinite(state.qualityScore)
        ? Math.max(0, Math.min(1, state.qualityScore))
        : undefined,
    reason:
      typeof state.reason === 'string' ? state.reason.slice(0, 300) : undefined,
  }));
}

function mergeRuntimeStates(
  environmentStates: ProviderRuntimeState[],
  walletStates: ProviderRuntimeState[],
) {
  const map = new Map(
    environmentStates.map((state) => [state.providerId, state]),
  );

  for (const wallet of walletStates) {
    const base = map.get(wallet.providerId);
    map.set(wallet.providerId, {
      ...base,
      ...wallet,
      configured: wallet.configured || base?.configured || false,
      healthy: wallet.healthy,
      available: wallet.available,
    });
  }

  return Array.from(map.values());
}

/**
 * Agentic routing mission adapted from patterns already used in the
 * Mabrig repositories:
 * Planner -> Quota Scout -> Policy Guard -> Capability Router -> Critic.
 *
 * It produces a plan only. Generation remains a separate side effect so
 * a routing request cannot silently spend money or publish anything.
 */
export function runVideoRoutingMission(
  rawRequest: VideoGenerationRequest,
  walletStates?: ProviderRuntimeState[],
): VideoRoutingMission {
  const trace: AgentTraceStep[] = [];

  let startedAt = Date.now();
  const request = validateRequest(rawRequest);
  traceStep(
    trace,
    'Mission Planner',
    'normalize-request',
    startedAt,
    `Prepared ${request.durationSeconds}s ${request.source ?? 'text'} video mission in ${request.mode} mode.`,
  );

  startedAt = Date.now();
  const environmentStates = runtimeStatesFromEnvironment();
  const sanitizedWallet = sanitizeWalletState(walletStates);
  const runtimeStates = mergeRuntimeStates(
    environmentStates,
    sanitizedWallet,
  );
  traceStep(
    trace,
    'Quota Scout',
    'assemble-provider-wallet',
    startedAt,
    `Evaluated ${runtimeStates.length} provider states; ${sanitizedWallet.length} came from the connected/user quota wallet.`,
  );

  startedAt = Date.now();
  const paidBlocked = !request.allowPaidFallback;
  traceStep(
    trace,
    'Policy Guard',
    'apply-cost-and-rights-policy',
    startedAt,
    paidBlocked
      ? 'Paid fallback is locked. Router may only select zero-metered routes.'
      : `Paid fallback is enabled with ${typeof request.maxCostUsd === 'number' ? `a $${request.maxCostUsd.toFixed(2)} request ceiling` : 'no request-specific ceiling'}.`,
  );

  startedAt = Date.now();
  const decision = routeVideoGeneration(request, runtimeStates);
  traceStep(
    trace,
    'Capability Router',
    'rank-providers',
    startedAt,
    decision.selectedProviderId
      ? `Selected ${decision.selectedProviderId} from ${decision.candidates.length} eligible provider(s).`
      : 'No provider passed the current capability, health, quota and policy gates.',
    decision.selectedProviderId ? 'completed' : 'blocked',
  );

  startedAt = Date.now();
  const top = decision.candidates[0];
  const runnerUp = decision.candidates[1];
  const criticDetail = !top
    ? 'Routing critic confirms the mission is blocked rather than silently crossing a cost or capability boundary.'
    : runnerUp
      ? `Primary ${top.providerId} scored ${top.score}; fallback ${runnerUp.providerId} scored ${runnerUp.score}. ${decision.warnings.length} warning(s) surfaced for review.`
      : `Primary ${top.providerId} is the only eligible route. ${decision.warnings.length} warning(s) surfaced for review.`;
  traceStep(
    trace,
    'Routing Critic',
    'challenge-routing-decision',
    startedAt,
    criticDetail,
    decision.selectedProviderId ? 'completed' : 'degraded',
  );

  return {
    missionId: missionId(),
    request,
    decision,
    trace,
    createdAt: new Date().toISOString(),
  };
}
