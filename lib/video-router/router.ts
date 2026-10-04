import { videoCircuitBreakers } from './circuit-breaker';
import {
  providerById,
  providerSupportsRequest,
  VIDEO_PROVIDER_REGISTRY,
} from './provider-registry';
import type {
  ProviderCandidate,
  ProviderRuntimeState,
  RejectedProvider,
  RoutingDecision,
  VideoGenerationRequest,
} from './types';

function providerIsFree(
  providerId: string,
  state: ProviderRuntimeState,
): boolean {
  const provider = providerById(providerId);
  if (!provider) return false;
  if (provider.access === 'self-hosted') return true;
  if (
    provider.access === 'account-quota' &&
    typeof state.quotaRemaining === 'number' &&
    state.quotaRemaining > 0
  ) {
    return true;
  }
  return (
    typeof state.estimatedCostUsd === 'number' &&
    state.estimatedCostUsd <= 0
  );
}

function scoreProvider(
  providerId: string,
  state: ProviderRuntimeState,
  request: VideoGenerationRequest,
) {
  const provider = providerById(providerId);
  if (!provider) return { score: 0, reasons: ['provider not registered'] };

  let score = provider.priority;
  const reasons: string[] = [];

  if (providerIsFree(providerId, state)) {
    score += request.mode === 'free-only' ? 80 : 45;
    reasons.push('no metered provider charge for this request');
  } else if (request.mode === 'best-quality') {
    score += 10;
  }

  if (request.preferredProviders?.includes(providerId)) {
    score += 30;
    reasons.push('explicitly preferred');
  }

  if (provider.commercialUse === 'allowed') {
    score += request.commercialUse ? 25 : 8;
    reasons.push('commercial-use policy is explicitly allowed');
  }

  if (typeof state.qualityScore === 'number') {
    score += Math.max(0, Math.min(20, state.qualityScore * 20));
    reasons.push('runtime quality score included');
  }

  if (
    typeof state.quotaRemaining === 'number' &&
    state.quotaRemaining > 0
  ) {
    score += Math.min(20, Math.log10(state.quotaRemaining + 1) * 10);
    reasons.push(
      `${state.quotaRemaining} ${state.quotaUnit ?? 'quota units'} available`,
    );
  }

  if (typeof state.latencyMs === 'number') {
    score += Math.max(0, 10 - state.latencyMs / 3000);
  }

  return { score, reasons };
}

export function routeVideoGeneration(
  request: VideoGenerationRequest,
  runtimeStates: ProviderRuntimeState[],
): RoutingDecision {
  const stateByProvider = new Map(
    runtimeStates.map((state) => [state.providerId, state]),
  );

  const candidates: ProviderCandidate[] = [];
  const rejected: RejectedProvider[] = [];
  const warnings: string[] = [];

  for (const provider of VIDEO_PROVIDER_REGISTRY) {
    const reasons: string[] = [];
    const state = stateByProvider.get(provider.id);

    if (request.blockedProviders?.includes(provider.id)) {
      reasons.push('blocked by request policy');
    }

    if (!state) {
      reasons.push('no runtime state is available');
    } else {
      if (!state.configured) {
        reasons.push(state.reason || 'provider is not configured');
      }
      if (!state.available) {
        reasons.push(state.reason || 'provider is unavailable');
      }
      if (!state.healthy) {
        reasons.push(state.reason || 'provider health check failed');
      }
    }

    if (videoCircuitBreakers.isOpen(provider.id)) {
      reasons.push('provider circuit breaker is open');
    }

    reasons.push(...providerSupportsRequest(provider, request));

    if (provider.access === 'account-quota' && state) {
      if (typeof state.quotaRemaining !== 'number') {
        reasons.push('connected account quota has not been measured');
      } else if (state.quotaRemaining <= 0) {
        reasons.push('account quota is exhausted');
      }
    }

    if (
      request.mode === 'commercial-safe' &&
      provider.commercialUse !== 'allowed'
    ) {
      reasons.push(
        `commercial-use policy is ${provider.commercialUse}; commercial-safe mode requires explicit allowance`,
      );
    }

    const costKnown = typeof state?.estimatedCostUsd === 'number';
    const estimatedCostUsd = costKnown
      ? Math.max(0, state!.estimatedCostUsd!)
      : 0;
    const isFree = state ? providerIsFree(provider.id, state) : false;
    const isMeteredProvider =
      provider.access === 'official-api' ||
      provider.access === 'paid-gateway';

    if (request.mode === 'free-only' && !isFree) {
      reasons.push('free-only mode forbids metered provider spend');
    }

    if (isMeteredProvider && !costKnown) {
      reasons.push(
        'current generation cost has not been estimated; router will not assume a metered API is free',
      );
    }

    if (isMeteredProvider && !request.allowPaidFallback) {
      reasons.push('paid fallback is not explicitly enabled');
    }

    if (
      isMeteredProvider &&
      costKnown &&
      typeof request.maxCostUsd === 'number' &&
      estimatedCostUsd > request.maxCostUsd
    ) {
      reasons.push(
        `estimated cost $${estimatedCostUsd.toFixed(4)} exceeds request budget $${request.maxCostUsd.toFixed(4)}`,
      );
    }

    if (reasons.length > 0) {
      rejected.push({ providerId: provider.id, reasons });
      continue;
    }

    const scored = scoreProvider(provider.id, state!, request);
    candidates.push({
      providerId: provider.id,
      score: Number(scored.score.toFixed(2)),
      reasons: scored.reasons,
      estimatedCostUsd,
      quotaRemaining: state?.quotaRemaining,
      quotaUnit: state?.quotaUnit,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0] ?? null;

  if (!selected) {
    warnings.push(
      'No provider currently satisfies capability, health, quota, commercial-use and budget policy.',
    );
  } else {
    const selectedProvider = providerById(selected.providerId);
    if (
      request.commercialUse &&
      selectedProvider?.commercialUse !== 'allowed'
    ) {
      warnings.push(
        `${selectedProvider?.label ?? selected.providerId} has ${selectedProvider?.commercialUse ?? 'unknown'} commercial-use terms; verify the connected plan before publishing commercially.`,
      );
    }
    if (selectedProvider?.watermark !== 'none') {
      warnings.push(
        `${selectedProvider?.label ?? selected.providerId} may apply a watermark depending on model or plan.`,
      );
    }
  }

  const selectedProvider = selected
    ? providerById(selected.providerId)
    : undefined;

  return {
    selectedProviderId: selected?.providerId ?? null,
    candidates,
    rejected,
    warnings,
    requiresHumanApproval:
      Boolean(selected && selected.estimatedCostUsd > 0) ||
      Boolean(
        request.commercialUse &&
          selectedProvider &&
          selectedProvider.commercialUse !== 'allowed',
      ),
  };
}
