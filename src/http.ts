import axios, { type AxiosInstance } from 'axios';
import { Agent } from 'node:https';
import { OneUniApiError } from './errors.js';
import type { ResolvedOptions } from './options.js';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'proxy-authorization'];

/** Masks sensitive headers before logging. */
export function redactHeaders(headers: unknown): Record<string, unknown> {
  if (!headers || typeof headers !== 'object') return {};
  const source =
    typeof (headers as { toJSON?: () => unknown }).toJSON === 'function'
      ? ((headers as { toJSON: () => unknown }).toJSON() as Record<string, unknown>)
      : (headers as Record<string, unknown>);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = SENSITIVE_HEADERS.includes(key.toLowerCase()) && value ? '***' : value;
  }
  return result;
}

function getResponseStatus(error: unknown): number | undefined {
  const response = (error as { response?: { status?: number } }).response;
  return response?.status;
}

function getResponseData(error: unknown): unknown {
  return (error as { response?: { data?: unknown } }).response?.data;
}

function getRequestUrl(error: unknown): string | undefined {
  return (error as { config?: { url?: string } }).config?.url;
}

/**
 * Keeps only safe metadata from the original error.
 * The raw `AxiosError` is not attached as `cause` because `cause.config.data` may contain
 * `password` / `client_secret` (login, refresh) — serializing the error would leak credentials.
 */
function sanitizeCause(error: unknown): Record<string, unknown> {
  const source = error as { name?: unknown; code?: unknown; isAxiosError?: unknown } | null;
  return {
    name: source?.name,
    code: source?.code,
    isAxiosError: source?.isAxiosError,
  };
}

/**
 * Creates the axios instance used by the whole client.
 * - Logs requests/responses at debug level (sensitive headers are masked, bodies are not logged).
 * - Network/5xx errors are converted into {@link OneUniApiError}.
 * - `validateStatus < 500` is applied at the request layer (keeps previous behavior: 4xx returns the body).
 */
export function createHttpClient(options: ResolvedOptions): AxiosInstance {
  const { logger } = options;

  if (options.allowInsecureTls) {
    logger?.warn(
      'ALLOW_INSECURE_TLS=true — TLS certificate verification is disabled. Do not use in production!',
    );
  }

  const instance = axios.create({
    timeout: options.timeoutMs,
    ...(options.allowInsecureTls
      ? { httpsAgent: new Agent({ rejectUnauthorized: false }) }
      : {}),
  });

  instance.interceptors.request.use((config) => {
    logger?.debug('Sending request:', {
      method: config.method,
      url: config.url,
      headers: redactHeaders(config.headers),
    });
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      logger?.debug('Received response:', {
        url: response.config.url,
        status: response.status,
      });
      return response;
    },
    (error: unknown) => {
      logger?.error(
        'API call failed:',
        getResponseData(error) ?? (error as Error)?.message,
      );
      return Promise.reject(
        new OneUniApiError(options.errorMessage, {
          status: getResponseStatus(error),
          data: getResponseData(error),
          url: getRequestUrl(error),
          cause: sanitizeCause(error),
        }),
      );
    },
  );

  return instance;
}
