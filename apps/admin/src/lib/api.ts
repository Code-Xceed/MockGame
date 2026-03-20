const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  skipAuthRefresh?: boolean;
};

type ApiAuthConfig = {
  getToken: () => string | null;
  refreshSession: () => Promise<string | null>;
  onAuthFailure?: () => void;
};

let authConfig: ApiAuthConfig | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiAuth(config: ApiAuthConfig | null) {
  authConfig = config;
}

async function requestRaw(path: string, opts: RequestOptions, resolvedToken?: string | null) {
  const { method = 'GET', body, headers: extraHeaders } = opts;
  const headers: Record<string, string> = { ...extraHeaders };
  if (body) headers['Content-Type'] = 'application/json';
  if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

async function getRefreshedToken() {
  if (!authConfig) return null;
  if (!refreshInFlight) {
    refreshInFlight = authConfig
      .refreshSession()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const baseToken = opts.token ?? authConfig?.getToken() ?? null;
  const first = await requestRaw(path, opts, baseToken);
  if (first.ok) return first.data as T;

  const canAttemptRefresh =
    first.status === 401 &&
    !opts.skipAuthRefresh &&
    authConfig !== null;

  if (canAttemptRefresh) {
    const refreshedToken = await getRefreshedToken();
    if (refreshedToken) {
      const retry = await requestRaw(path, opts, refreshedToken);
      if (retry.ok) return retry.data as T;
      if (retry.status === 401) authConfig?.onAuthFailure?.();
      throw new ApiError(retry.status, retry.data);
    }
    authConfig?.onAuthFailure?.();
  }

  throw new ApiError(first.status, first.data);
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof ApiError) {
    const d = err.data as Record<string, unknown> | null;
    if (d && typeof d === 'object') {
      if (typeof d.message === 'string') return d.message;
      if (Array.isArray(d.message) && d.message.length > 0) return d.message[0] as string;
    }
    return `Error ${err.status}`;
  }

  if (err instanceof TypeError) {
    return 'Cannot reach the API server. Ensure backend is running.';
  }

  return fallback;
}
