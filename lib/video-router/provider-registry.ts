import type {
  ProviderCatalogEntry,
  ProviderRuntimeState,
  VideoGenerationRequest,
} from './types';

export const VIDEO_PROVIDER_REGISTRY: ProviderCatalogEntry[] = [
  {
    id: 'local-wan',
    label: 'Local / self-hosted video worker',
    access: 'self-hosted',
    integration: 'local-worker',
    envKeys: ['GPU_WORKER_URL', 'GPU_WORKER_TOKEN'],
    enabledByDefault: true,
    priority: 100,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      audioDriven: true,
      aspectRatios: ['16:9', '9:16', '1:1'],
    },
    commercialUse: 'allowed',
    watermark: 'none',
    notes:
      'Uses the operator-controlled GPU worker. Provider-credit cost is zero, but compute and electricity still have real cost.',
  },
  {
    id: 'google-vids',
    label: 'Google Vids included quota',
    access: 'account-quota',
    integration: 'connector-required',
    envKeys: ['GOOGLE_VIDS_BRIDGE_ENABLED'],
    enabledByDefault: false,
    priority: 95,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: false,
      audioDriven: false,
      aspectRatios: ['16:9', '9:16'],
    },
    commercialUse: 'plan-dependent',
    watermark: 'unknown',
    notes:
      'Represents user-owned Google Vids quota. It is deliberately separate from the Gemini/Veo API and must only be enabled through an authorized connector or local bridge.',
  },
  {
    id: 'gemini-veo',
    label: 'Google Gemini / Veo API',
    access: 'official-api',
    integration: 'server-api',
    envKeys: ['GEMINI_API_KEY'],
    enabledByDefault: true,
    priority: 90,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      audioDriven: false,
      aspectRatios: ['16:9', '9:16'],
    },
    commercialUse: 'plan-dependent',
    watermark: 'possible',
    notes: 'Official programmable Google video-generation route. Billing is separate from Google Vids account quota.',
  },
  {
    id: 'runway',
    label: 'Runway API',
    access: 'official-api',
    integration: 'server-api',
    envKeys: ['RUNWAY_API_KEY'],
    enabledByDefault: true,
    priority: 85,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      audioDriven: false,
      aspectRatios: ['16:9', '9:16', '1:1'],
    },
    commercialUse: 'plan-dependent',
    watermark: 'possible',
    notes: 'Official Runway API adapter slot. Website subscription credits and API billing should be tracked separately.',
  },
  {
    id: 'eden',
    label: 'Eden AI video gateway',
    access: 'paid-gateway',
    integration: 'server-api',
    envKeys: ['EDENAI_API_KEY'],
    enabledByDefault: true,
    priority: 70,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: false,
      audioDriven: false,
      aspectRatios: ['16:9', '9:16', '1:1'],
    },
    commercialUse: 'plan-dependent',
    watermark: 'unknown',
    notes: 'Multi-provider paid fallback. Treat model-specific licence and watermark metadata as dynamic provider state.',
  },
  {
    id: 'comet',
    label: 'CometAPI video gateway',
    access: 'paid-gateway',
    integration: 'server-api',
    envKeys: ['COMETAPI_API_KEY'],
    enabledByDefault: true,
    priority: 65,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      audioDriven: false,
      aspectRatios: ['16:9', '9:16', '1:1'],
    },
    commercialUse: 'plan-dependent',
    watermark: 'unknown',
    notes: 'Multi-model paid fallback. Model catalogue, pricing, quota and rights must be refreshed rather than hard-coded.',
  },
];

const truthy = (value?: string) =>
  value === '1' || value?.trim().toLowerCase() === 'true';

function configured(entry: ProviderCatalogEntry): boolean {
  if (entry.id === 'google-vids') {
    return truthy(process.env.GOOGLE_VIDS_BRIDGE_ENABLED);
  }
  return entry.envKeys.every((key) => Boolean(process.env[key]?.trim()));
}

export function runtimeStatesFromEnvironment(): ProviderRuntimeState[] {
  return VIDEO_PROVIDER_REGISTRY.map((entry) => {
    const isConfigured = configured(entry);
    return {
      providerId: entry.id,
      configured: isConfigured,
      available: isConfigured,
      healthy: isConfigured,
      quotaUnit:
        entry.access === 'self-hosted'
          ? 'unlimited'
          : undefined,
      reason: isConfigured
        ? undefined
        : `Missing configuration for ${entry.label}.`,
    };
  });
}

export function providerSupportsRequest(
  entry: ProviderCatalogEntry,
  request: VideoGenerationRequest,
): string[] {
  const reasons: string[] = [];
  const source = request.source ?? 'text';

  if (source === 'text' && !entry.capabilities.textToVideo) {
    reasons.push('text-to-video is not supported');
  }
  if (source === 'image' && !entry.capabilities.imageToVideo) {
    reasons.push('image-to-video is not supported');
  }
  if (source === 'video' && !entry.capabilities.videoToVideo) {
    reasons.push('video-to-video is not supported');
  }
  if (source === 'audio' && !entry.capabilities.audioDriven) {
    reasons.push('audio-driven generation is not supported');
  }
  if (
    entry.capabilities.maxDurationSeconds &&
    request.durationSeconds > entry.capabilities.maxDurationSeconds
  ) {
    reasons.push(
      `requested duration exceeds ${entry.capabilities.maxDurationSeconds}s provider limit`,
    );
  }
  if (
    entry.capabilities.aspectRatios.length &&
    !entry.capabilities.aspectRatios.includes(request.aspectRatio)
  ) {
    reasons.push(`aspect ratio ${request.aspectRatio} is not supported`);
  }

  return reasons;
}

export function providerById(id: string) {
  return VIDEO_PROVIDER_REGISTRY.find((provider) => provider.id === id);
}
