export type VideoRoutingMode =
  | 'free-only'
  | 'free-preferred'
  | 'commercial-safe'
  | 'best-quality';

export type ProviderAccessKind =
  | 'account-quota'
  | 'official-api'
  | 'paid-gateway'
  | 'self-hosted';

export type ProviderIntegrationMode =
  | 'server-api'
  | 'local-worker'
  | 'connector-required';

export type QuotaUnit = 'credits' | 'clips' | 'seconds' | 'jobs' | 'unlimited';

export type CommercialUsePolicy = 'allowed' | 'plan-dependent' | 'unknown';

export type WatermarkPolicy = 'none' | 'possible' | 'required' | 'unknown';

export type VideoCapability = {
  textToVideo: boolean;
  imageToVideo: boolean;
  videoToVideo: boolean;
  audioDriven: boolean;
  maxDurationSeconds?: number;
  aspectRatios: string[];
};

export type ProviderCatalogEntry = {
  id: string;
  label: string;
  access: ProviderAccessKind;
  integration: ProviderIntegrationMode;
  envKeys: string[];
  enabledByDefault: boolean;
  priority: number;
  capabilities: VideoCapability;
  commercialUse: CommercialUsePolicy;
  watermark: WatermarkPolicy;
  notes: string;
};

export type ProviderRuntimeState = {
  providerId: string;
  configured: boolean;
  healthy: boolean;
  available: boolean;
  quotaRemaining?: number;
  quotaUnit?: QuotaUnit;
  quotaRenewsAt?: string;
  estimatedCostUsd?: number;
  latencyMs?: number;
  qualityScore?: number;
  reason?: string;
};

export type VideoGenerationRequest = {
  prompt: string;
  durationSeconds: number;
  aspectRatio: string;
  mode: VideoRoutingMode;
  source?: 'text' | 'image' | 'video' | 'audio';
  commercialUse?: boolean;
  allowPaidFallback?: boolean;
  maxCostUsd?: number;
  preferredProviders?: string[];
  blockedProviders?: string[];
};

export type ProviderCandidate = {
  providerId: string;
  score: number;
  reasons: string[];
  estimatedCostUsd: number;
  quotaRemaining?: number;
  quotaUnit?: QuotaUnit;
};

export type RejectedProvider = {
  providerId: string;
  reasons: string[];
};

export type RoutingDecision = {
  selectedProviderId: string | null;
  candidates: ProviderCandidate[];
  rejected: RejectedProvider[];
  warnings: string[];
  requiresHumanApproval: boolean;
};

export type AgentTraceStep = {
  agent: string;
  action: string;
  status: 'completed' | 'blocked' | 'degraded';
  detail: string;
  durationMs: number;
};

export type VideoRoutingMission = {
  missionId: string;
  request: VideoGenerationRequest;
  decision: RoutingDecision;
  trace: AgentTraceStep[];
  createdAt: string;
};
