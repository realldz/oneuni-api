/**
 * Types shared by every OneUni API response.
 */
export interface ApiErrorMessage {
  errorCode: string;
  errorMessage: string;
  errorValues: string[];
}

export interface PagingInfo {
  totalItems?: number;
  pageSize?: number;
  pageNumber?: number;
}

/** Standard OneUni wrapper: `{ isOk, result, errorMessages }`. */
export interface SchoolApiResponse<T> {
  isOk: boolean;
  result?: T | null;
  errorMessages?: ApiErrorMessage[];
  /** Some endpoints return this field instead of `result`. */
  errorResult?: unknown;
  pagingInfo?: PagingInfo;
}

/** Wrapper nested inside `result` for some endpoints (e.g. LichToanTruong). */
export interface ApiResponseResult<T> {
  isSuccess?: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
}

/** `result` in paged form: `{ items, pagingInfo }`. */
export interface PagedData<T> {
  items: T[];
  pagingInfo?: PagingInfo;
}
