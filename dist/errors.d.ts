/**
 * Error thrown when calling the OneUni API. The default message is the same English
 * default exposed as `DEFAULT_ERROR_MESSAGE`; `status` / `data` / `url` are added for debugging.
 */
export declare class OneUniApiError extends Error {
    readonly status?: number;
    readonly data?: unknown;
    readonly url?: string;
    constructor(message?: string, info?: {
        status?: number;
        data?: unknown;
        url?: string;
        cause?: unknown;
    });
}
