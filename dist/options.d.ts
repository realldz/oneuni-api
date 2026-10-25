/**
 * Client configuration. Every field can be omitted and falls back to environment
 * variables (compatible with an existing `.env` from huce-bot).
 */
export interface OneUniLogger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}
export interface OneUniClientOptions {
    /**
     * Base URL of the student portal, WITHOUT `/AppSVGV`.
     * Example for HUCE: `https://sinhvien.huce.edu.vn`.
     * Fallback: `ONEUNI_BASE_URL`, then `SCHOOL_API_BASEURL`.
     */
    baseUrl?: string;
    /** School code appended to the login username: `${studentId}2${schoolCode}`. Fallback: `SCHOOL_CODE`. */
    schoolCode?: string;
    /** client_secret of the OneUni app. Fallback: `CLIENT_SECRET`. */
    clientSecret?: string;
    /** client_id used for login. Defaults to `mobile_flutter`. */
    clientId?: string;
    /** client_id used for token refresh. Defaults to `mobile_flutter_hssv`. */
    refreshClientId?: string;
    /** Authentication gateway. Defaults to `https://mobile.oneuni.com.vn`. */
    authBaseUrl?: string;
    /**
     * Disable TLS certificate verification. Only use when developing against a local
     * proxy with a self-signed CA. Fallback: environment variable `ALLOW_INSECURE_TLS === 'true'`.
     */
    allowInsecureTls?: boolean;
    /** Per-request timeout (ms). Defaults to `0` = no timeout (keeps the previous behavior). */
    timeoutMs?: number;
    /** Optional logger (winston/pino/console...). No logging by default. */
    logger?: OneUniLogger;
    /** Message surfaced for generic request failures. Defaults to `DEFAULT_ERROR_MESSAGE`. */
    errorMessage?: string;
}
export interface ResolvedOptions {
    baseUrl: string;
    schoolCode: string;
    clientSecret: string;
    clientId: string;
    refreshClientId: string;
    authBaseUrl: string;
    allowInsecureTls: boolean;
    timeoutMs: number;
    logger?: OneUniLogger;
    errorMessage: string;
}
export declare const DEFAULT_AUTH_BASE_URL = "https://mobile.oneuni.com.vn";
export declare const DEFAULT_CLIENT_ID = "mobile_flutter";
export declare const DEFAULT_REFRESH_CLIENT_ID = "mobile_flutter_hssv";
export declare const DEFAULT_ERROR_MESSAGE = "OneUni API request failed!";
export declare function resolveOptions(options?: OneUniClientOptions): ResolvedOptions;
