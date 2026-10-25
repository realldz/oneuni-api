import { DEFAULT_ERROR_MESSAGE } from './options.js';

/**
 * Error thrown when calling the OneUni API. The default message is the same English
 * default exposed as `DEFAULT_ERROR_MESSAGE`; `status` / `data` / `url` are added for debugging.
 */
export class OneUniApiError extends Error {
  readonly status?: number;
  readonly data?: unknown;
  readonly url?: string;

  constructor(
    message = DEFAULT_ERROR_MESSAGE,
    info: { status?: number; data?: unknown; url?: string; cause?: unknown } = {},
  ) {
    super(message, info.cause === undefined ? undefined : { cause: info.cause });
    this.name = 'OneUniApiError';
    this.status = info.status;
    this.data = info.data;
    this.url = info.url;
  }
}
