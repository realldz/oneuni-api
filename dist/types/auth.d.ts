/**
 * Response of the OAuth2 `/AUTH/connect/token` flow (login and refresh token).
 */
export interface SucessLogin {
    access_token: string;
    token_type: string;
    expries_in: number;
    refresh_token: string;
    id_token: string;
}
export interface FailedLogin {
    warningMessages: Array<unknown>;
    errorMessages: [
        {
            errorCode: string;
            errorMessage: string;
            errorValues: Array<string>;
        }
    ];
    isOk: boolean;
}
export type LoginResponse = SucessLogin | FailedLogin;
/** Compact result after login: token + student id. */
export interface AuthResult {
    token: string;
    idSinhVien: number;
}
