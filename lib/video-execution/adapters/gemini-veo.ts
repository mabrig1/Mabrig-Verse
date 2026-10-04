import { fetchJson } from '../http';
import type {
  ProviderJobStatus,
  ProviderPreflight,
  ProviderSubmission,
  VideoExecutionAdapter,
  VideoExecutionInput,
} from '../types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

type OperationResponse = {
  name?: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: { uri?: string };
      }>;
    };
  };
};

function apiKey() {
  return process.env.GEMINI_API_KEY?.trim() || '';
}

function model() {
  return process.env.GEMINI_VEO_MODEL?.trim() || 'veo-3.1-generate-preview';
}

function pricePerSecond() {
  const value = Number(process.env.GEMINI_VEO_USD_PER_SECOND);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function maxCostUsd() {
  const value = Number(process.env.GEMINI_VEO_MAX_COST_USD);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export const geminiVeoAdapter: VideoExecutionAdapter = {
  providerId: 'gemini-veo',
  metered: true,

  configured() {
    return Boolean(apiKey());
  },

  async preflight(input: VideoExecutionInput): Promise<ProviderPreflight> {
    if (!apiKey()) {
      return {
        ok: false,
        providerId: 'gemini-veo',
        detail: 'GEMINI_API_KEY is not configured.',
      };
    }

    if (input.durationSeconds !== 8) {
      return {
        ok: false,
        providerId: 'gemini-veo',
        detail:
          'The configured Veo 3.1 route is treated as an 8-second generator; route other durations through another provider or split the shot.',
        model: model(),
      };
    }

    if (input.aspectRatio === '1:1') {
      return {
        ok: false,
        providerId: 'gemini-veo',
        detail:
          'The configured Veo 3.1 route supports 16:9 and 9:16 in this adapter.',
        model: model(),
      };
    }

    const unitPrice = pricePerSecond();
    const ceiling = maxCostUsd();
    if (!(unitPrice > 0) || !(ceiling > 0)) {
      return {
        ok: false,
        providerId: 'gemini-veo',
        detail:
          'Gemini/Veo paid execution requires GEMINI_VEO_USD_PER_SECOND and GEMINI_VEO_MAX_COST_USD so the server can enforce a current spend ceiling instead of assuming pricing.',
        model: model(),
      };
    }

    const estimatedCostUsd = unitPrice * input.durationSeconds;
    if (estimatedCostUsd > ceiling) {
      return {
        ok: false,
        providerId: 'gemini-veo',
        detail: `Estimated Veo cost $${estimatedCostUsd.toFixed(2)} exceeds the configured $${ceiling.toFixed(2)} ceiling.`,
        estimatedCostUsd,
        model: model(),
      };
    }

    return {
      ok: true,
      providerId: 'gemini-veo',
      detail: `Gemini/Veo preflight approved at an estimated $${estimatedCostUsd.toFixed(2)} within the server ceiling.`,
      estimatedCostUsd,
      model: model(),
    };
  },

  async submit(input: VideoExecutionInput): Promise<ProviderSubmission> {
    const result = await fetchJson<OperationResponse>(
      `${BASE_URL}/models/${encodeURIComponent(model())}:predictLongRunning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey(),
        },
        body: JSON.stringify({
          instances: [{ prompt: input.prompt }],
          parameters: {
            aspectRatio: input.aspectRatio,
          },
        }),
      },
      30_000,
    );

    if (!result.name) {
      throw new Error('Gemini/Veo did not return an operation name.');
    }

    return {
      providerId: 'gemini-veo',
      providerJobId: result.name,
      status: result.done ? 'working' : 'queued',
      model: model(),
    };
  },

  async status(providerJobId: string): Promise<ProviderJobStatus> {
    const operation = await fetchJson<OperationResponse>(
      `${BASE_URL}/${providerJobId.replace(/^\/+/, '')}`,
      {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey() },
      },
      20_000,
    );

    if (operation.error?.message) {
      return {
        providerId: 'gemini-veo',
        providerJobId,
        status: 'failed',
        outputUrls: [],
        error: operation.error.message,
      };
    }

    if (!operation.done) {
      return {
        providerId: 'gemini-veo',
        providerJobId,
        status: 'working',
        outputUrls: [],
      };
    }

    const outputUrls = (
      operation.response?.generateVideoResponse?.generatedSamples ?? []
    )
      .map((sample) => sample.video?.uri)
      .filter((uri): uri is string => Boolean(uri));

    return {
      providerId: 'gemini-veo',
      providerJobId,
      status: outputUrls.length ? 'succeeded' : 'failed',
      outputUrls,
      error: outputUrls.length
        ? undefined
        : 'Veo operation completed without a downloadable video URI.',
      metadata: {
        downloadRequiresApiKey: true,
        persistenceRequired: true,
      },
    };
  },
};
