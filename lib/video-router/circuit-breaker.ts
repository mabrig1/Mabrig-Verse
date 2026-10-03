type CircuitState = {
  failures: number;
  openedAt?: number;
  lastFailureAt?: number;
};

const FAILURE_THRESHOLD = 3;
const RESET_AFTER_MS = 60_000;

class CircuitBreakerRegistry {
  private states = new Map<string, CircuitState>();

  isOpen(key: string) {
    const state = this.states.get(key);
    if (!state?.openedAt) return false;
    if (Date.now() - state.openedAt >= RESET_AFTER_MS) {
      this.states.set(key, { failures: 0 });
      return false;
    }
    return true;
  }

  recordSuccess(key: string) {
    this.states.set(key, { failures: 0 });
  }

  recordFailure(key: string) {
    const current = this.states.get(key) ?? { failures: 0 };
    const failures = current.failures + 1;
    this.states.set(key, {
      failures,
      lastFailureAt: Date.now(),
      openedAt: failures >= FAILURE_THRESHOLD ? Date.now() : current.openedAt,
    });
  }

  snapshot() {
    return Array.from(this.states.entries()).map(([providerId, state]) => ({
      providerId,
      open: this.isOpen(providerId),
      failures: state.failures,
      lastFailureAt: state.lastFailureAt,
    }));
  }
}

export const videoCircuitBreakers = new CircuitBreakerRegistry();

export class VideoProviderCircuitOpenError extends Error {
  constructor(providerId: string) {
    super(`Video provider circuit is open for "${providerId}".`);
    this.name = 'VideoProviderCircuitOpenError';
  }
}

export async function withVideoCircuitBreaker<T>(
  providerId: string,
  fn: () => Promise<T>,
) {
  if (videoCircuitBreakers.isOpen(providerId)) {
    throw new VideoProviderCircuitOpenError(providerId);
  }

  try {
    const result = await fn();
    videoCircuitBreakers.recordSuccess(providerId);
    return result;
  } catch (error) {
    videoCircuitBreakers.recordFailure(providerId);
    throw error;
  }
}
