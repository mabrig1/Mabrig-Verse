import { geminiVeoAdapter } from './adapters/gemini-veo';
import { localGpuAdapter } from './adapters/local-gpu';
import { runwayAdapter } from './adapters/runway';
import type {
  ExecutionProviderId,
  VideoExecutionAdapter,
} from './types';

const adapters: Record<ExecutionProviderId, VideoExecutionAdapter> = {
  'local-wan': localGpuAdapter,
  'gemini-veo': geminiVeoAdapter,
  runway: runwayAdapter,
};

export function executionAdapter(providerId: ExecutionProviderId) {
  return adapters[providerId];
}

export function executionAdapters() {
  return Object.values(adapters);
}
