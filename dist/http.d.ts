import { type AxiosInstance } from 'axios';
import type { ResolvedOptions } from './options.js';
/** Masks sensitive headers before logging. */
export declare function redactHeaders(headers: unknown): Record<string, unknown>;
/**
 * Creates the axios instance used by the whole client.
 * - Logs requests/responses at debug level (sensitive headers are masked, bodies are not logged).
 * - Network/5xx errors are converted into {@link OneUniApiError}.
 * - `validateStatus < 500` is applied at the request layer (keeps previous behavior: 4xx returns the body).
 */
export declare function createHttpClient(options: ResolvedOptions): AxiosInstance;
