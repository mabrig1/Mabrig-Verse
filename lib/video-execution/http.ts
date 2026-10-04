export class ProviderHttpError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 20_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await response.text();
    if (!response.ok) {
      throw new ProviderHttpError(
        `Provider returned HTTP ${response.status}`,
        response.status,
        text.slice(0, 2000),
      );
    }

    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function safeProviderError(error: unknown) {
  if (error instanceof ProviderHttpError) {
    return `${error.message}: ${error.body.slice(0, 500)}`;
  }
  return error instanceof Error ? error.message : String(error);
}
