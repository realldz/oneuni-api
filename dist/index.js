// src/options.ts
var DEFAULT_AUTH_BASE_URL = "https://mobile.oneuni.com.vn";
var DEFAULT_CLIENT_ID = "mobile_flutter";
var DEFAULT_REFRESH_CLIENT_ID = "mobile_flutter_hssv";
var DEFAULT_ERROR_MESSAGE = "OneUni API request failed!";
function readEnv(name) {
  if (typeof process === "undefined" || !process.env)
    return;
  return process.env[name];
}
function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "")
      return value.trim();
  }
  return "";
}
function resolveOptions(options = {}) {
  return {
    baseUrl: trimTrailingSlash(firstNonEmpty(options.baseUrl, readEnv("ONEUNI_BASE_URL"), readEnv("SCHOOL_API_BASEURL"))),
    schoolCode: firstNonEmpty(options.schoolCode, readEnv("ONEUNI_SCHOOL_CODE"), readEnv("SCHOOL_CODE")),
    clientSecret: firstNonEmpty(options.clientSecret, readEnv("ONEUNI_CLIENT_SECRET"), readEnv("CLIENT_SECRET")),
    clientId: firstNonEmpty(options.clientId, readEnv("ONEUNI_CLIENT_ID")) || DEFAULT_CLIENT_ID,
    refreshClientId: firstNonEmpty(options.refreshClientId, readEnv("ONEUNI_REFRESH_CLIENT_ID")) || DEFAULT_REFRESH_CLIENT_ID,
    authBaseUrl: trimTrailingSlash(firstNonEmpty(options.authBaseUrl, readEnv("ONEUNI_AUTH_BASE_URL")) || DEFAULT_AUTH_BASE_URL),
    allowInsecureTls: options.allowInsecureTls ?? readEnv("ALLOW_INSECURE_TLS") === "true",
    timeoutMs: options.timeoutMs ?? 0,
    logger: options.logger,
    errorMessage: options.errorMessage ?? DEFAULT_ERROR_MESSAGE
  };
}

// src/errors.ts
class OneUniApiError extends Error {
  status;
  data;
  url;
  constructor(message = DEFAULT_ERROR_MESSAGE, info = {}) {
    super(message, info.cause === undefined ? undefined : { cause: info.cause });
    this.name = "OneUniApiError";
    this.status = info.status;
    this.data = info.data;
    this.url = info.url;
  }
}

// src/http.ts
import axios from "axios";
import { Agent } from "node:https";
var SENSITIVE_HEADERS = ["authorization", "cookie", "set-cookie", "proxy-authorization"];
function redactHeaders(headers) {
  if (!headers || typeof headers !== "object")
    return {};
  const source = typeof headers.toJSON === "function" ? headers.toJSON() : headers;
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    result[key] = SENSITIVE_HEADERS.includes(key.toLowerCase()) && value ? "***" : value;
  }
  return result;
}
function getResponseStatus(error) {
  const response = error.response;
  return response?.status;
}
function getResponseData(error) {
  return error.response?.data;
}
function getRequestUrl(error) {
  return error.config?.url;
}
function sanitizeCause(error) {
  const source = error;
  return {
    name: source?.name,
    code: source?.code,
    isAxiosError: source?.isAxiosError
  };
}
function createHttpClient(options) {
  const { logger } = options;
  if (options.allowInsecureTls) {
    logger?.warn("ALLOW_INSECURE_TLS=true — TLS certificate verification is disabled. Do not use in production!");
  }
  const instance = axios.create({
    timeout: options.timeoutMs,
    ...options.allowInsecureTls ? { httpsAgent: new Agent({ rejectUnauthorized: false }) } : {}
  });
  instance.interceptors.request.use((config) => {
    logger?.debug("Sending request:", {
      method: config.method,
      url: config.url,
      headers: redactHeaders(config.headers)
    });
    return config;
  });
  instance.interceptors.response.use((response) => {
    logger?.debug("Received response:", {
      url: response.config.url,
      status: response.status
    });
    return response;
  }, (error) => {
    logger?.error("API call failed:", getResponseData(error) ?? error?.message);
    return Promise.reject(new OneUniApiError(options.errorMessage, {
      status: getResponseStatus(error),
      data: getResponseData(error),
      url: getRequestUrl(error),
      cause: sanitizeCause(error)
    }));
  });
  return instance;
}

// src/utils/date.ts
function getCurrentIsoDate() {
  return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000);
}

// src/client.ts
var API_PREFIX = "/AppSVGV/api/v1";

class OneUniClient {
  options;
  http;
  constructor(options = {}) {
    this.options = resolveOptions(options);
    this.http = createHttpClient(this.options);
  }
  requireBaseUrl() {
    if (!this.options.baseUrl) {
      throw new OneUniApiError("OneUni API baseUrl is not configured (options.baseUrl or the SCHOOL_API_BASEURL environment variable)!");
    }
    return this.options.baseUrl;
  }
  apiUrl(path) {
    return `${this.requireBaseUrl()}${API_PREFIX}${path}`;
  }
  async post(url, body, token, contentType = "application/json") {
    const headers = { "Content-Type": contentType };
    if (token)
      headers.Authorization = `Bearer ${token}`;
    const response = await this.http.post(url, body, {
      headers,
      validateStatus: (status) => status < 500
    });
    return response.data;
  }
  requireSchoolCredentials() {
    if (!this.options.schoolCode) {
      throw new OneUniApiError("OneUni API schoolCode is not configured (options.schoolCode or the SCHOOL_CODE environment variable)!");
    }
    if (!this.options.clientSecret) {
      throw new OneUniApiError("OneUni API clientSecret is not configured (options.clientSecret or the CLIENT_SECRET environment variable)!");
    }
  }
  async login(studentId, password) {
    this.requireSchoolCredentials();
    const baseUrl = this.requireBaseUrl();
    const params = new URLSearchParams;
    params.append("url_uni", `${baseUrl}/AppSVGV`);
    params.append("username", `${studentId}2${this.options.schoolCode}`);
    params.append("password", password);
    params.append("client_secret", this.options.clientSecret);
    params.append("client_id", this.options.clientId);
    params.append("grant_type", "password");
    params.append("scope", "offline_access openid");
    const response = await this.post(`${this.options.authBaseUrl}/AUTH/connect/token`, params, undefined, "application/x-www-form-urlencoded");
    if (!("access_token" in response))
      return null;
    const token = response.access_token;
    const studentInfo = await this.getStudentInfo(token);
    const idSinhVien = studentInfo.result?.idSinhVien;
    if (!idSinhVien)
      throw new OneUniApiError("Student information not found.");
    return { token, idSinhVien };
  }
  async refreshToken(refreshToken, accessToken) {
    if (!this.options.clientSecret) {
      throw new OneUniApiError("OneUni API clientSecret is not configured (options.clientSecret or the CLIENT_SECRET environment variable)!");
    }
    const params = new URLSearchParams;
    params.append("refresh_token", refreshToken);
    params.append("client_secret", this.options.clientSecret);
    params.append("grant_type", "refresh_token");
    params.append("client_id", this.options.refreshClientId);
    return this.post(`${this.options.authBaseUrl}/AUTH//connect/token`, params, accessToken, "application/x-www-form-urlencoded");
  }
  async getSchedule(token, tuNgay = null, denNgay = null) {
    const today = getCurrentIsoDate();
    const defaultDate = `${today.toISOString().split("T")[0]}T00:00:00.000`;
    return this.post(this.apiUrl("/SinhVien/LichHocLichThi"), {
      loaiLich: 0,
      tuNgay: tuNgay || defaultDate,
      denNgay: denNgay || defaultDate
    }, token);
  }
  async getStudentInfo(token) {
    return this.post(this.apiUrl("/SinhVien/Info"), {}, token);
  }
  async getGrades(token) {
    return this.post(this.apiUrl("/SinhVien/KetQuaHocTap"), {}, token);
  }
  async getGradeDetail(token, idLopHocPhan) {
    return this.post(this.apiUrl("/SinhVien/KetQuaHocTapChiTiet"), { idLopHocPhan }, token);
  }
  async getNewsCategories(token) {
    const response = await this.post(this.apiUrl("/TinTuc/DanhMucTinTuc"), {}, token);
    return response.result ?? [];
  }
  async getNewsDetail(token, newsId) {
    const response = await this.post(this.apiUrl("/TinTuc/BlogDetail"), { id: newsId }, token);
    return response.result ?? {};
  }
  async getBlogs(token, request = {}) {
    const { pageSize = 15, pageNumber = 1, idsDanhMuc } = request;
    return this.post(this.apiUrl("/TinTuc/GetBlogs"), {
      pageSize,
      pageNumber,
      ...idsDanhMuc && idsDanhMuc.length > 0 ? { idsDanhMuc } : {}
    }, token);
  }
  async getHomeNews(token) {
    return this.post(this.apiUrl("/TinTuc/BlogsForHome"), {}, token);
  }
  async getListCheckin(token) {
    return this.post(this.apiUrl("/SinhVien/LichDiemDanh"), {}, token);
  }
  async checkin(token, request) {
    return this.post(this.apiUrl("/SinhVien/SubmitDiemDanh"), { request }, token);
  }
  async getCheckinStatsDetail(token) {
    return this.post(this.apiUrl("/SinhVien/ThongKeDiemDanhChiTiet"), {}, token);
  }
  async getNotices(token) {
    return this.post(this.apiUrl("/Notify/NhacNhoSinhVienPopup"), {}, token);
  }
  async updateNoticeStatus(token, idSinhVien, idGhiChu) {
    const response = await this.post(this.apiUrl("/Notify/UpdateXemNhacNho"), { idSinhVien, idGhiChu }, token);
    return response.result.isOk;
  }
  async getPlainNotices(token) {
    return this.post(this.apiUrl("/Notify/NhacNhoSinhVien"), {}, token);
  }
  async getDebt(token) {
    return this.post(this.apiUrl("/Payment/CongNo"), {}, token);
  }
  async getReceipts(token) {
    return this.post(this.apiUrl("/SinhVien/PhieuThuTongHop"), {}, token);
  }
  async getReceiptDetail(token, request) {
    return this.post(this.apiUrl("/SinhVien/ChiTietPhieuThuTongHop"), request, token);
  }
  async getDanhGiaRenLuyen(token, idSinhVien) {
    return this.post(this.apiUrl("/SinhVien//DanhGiaRenLuyen"), { idSinhVien }, token);
  }
  async getSemesters(token, idSinhVien) {
    return this.post(this.apiUrl("/SinhVien/DotTheoSinhVien"), { idSinhVien }, token);
  }
  async getSchoolYears(token) {
    return this.post(this.apiUrl("/SinhVien/GetNamHocTheoSinhVien"), {}, token);
  }
  async getCurriculumFramework(token) {
    return this.post(this.apiUrl("/SinhVien/ChuongTrinhKhung"), {}, token);
  }
  async getAchievements(token, idSinhVien, idDot = 0) {
    return this.post(this.apiUrl("/SinhVien/ThanhTich"), { idSinhVien, idDot }, token);
  }
  async getDashboardInfo(token, idSinhVien) {
    return this.post(this.apiUrl("/SinhVien/GetThongTinDashBoardSinhVien"), { idSinhVien }, token);
  }
  async getStudentCard(token, isMatTruoc = true) {
    return this.post(this.apiUrl("/SinhVien/GetTheSinhVien"), { isMatTruoc }, token);
  }
  async getSchoolCalendar(token) {
    return this.post(this.apiUrl("/SinhVien/LichToanTruong"), {}, token);
  }
  async getAttendanceSummary(token, idSinhVien) {
    return this.post(this.apiUrl("/SinhVien/ThongKeDiemDanh"), { idSinhVien }, token);
  }
  async getAttendanceDashboard(token, idSinhVien) {
    return this.post(this.apiUrl("/SinhVien/ThongKeDiemDanhDashboard"), { idSinhVien }, token);
  }
  async getAttendanceBySchedule(token, idLichHoc, isLichHoc = true) {
    return this.post(this.apiUrl("/SinhVien/DiemDanhLichHoc"), { idLichHoc, isLichHoc }, token);
  }
  async getBanks(token) {
    return this.post(this.apiUrl("/Payment/Banks"), {}, token);
  }
  async getOnlineReceipts(token, idSinhVien) {
    return this.post(this.apiUrl("/Payment/PhieuThuTrucTuyen"), { idSinhVien }, token);
  }
  async getOnlineReceiptInfo(token, transID) {
    return this.post(this.apiUrl("/Payment/GetPhieuThuTrucTuyenInfo"), { transID }, token);
  }
  async getOnlineReceiptDetail(token, idSoThuTrucTuyen) {
    return this.post(this.apiUrl("/Payment/PhieuThuTrucTuyenChiTiet"), { idSoThuTrucTuyen }, token);
  }
  async submitPayment(token, request) {
    return this.post(this.apiUrl("/Payment/SubmitThanhToan"), request, token);
  }
  async cancelPayment(token, transID) {
    return this.post(this.apiUrl("/Payment/HuyThanhToan"), { transID }, token);
  }
  async checkInvoiceInfo(token, request) {
    return this.post(this.apiUrl("/Payment/CheckThongTinXuatHoaDon"), request, token);
  }
}
function createOneUniClient(options = {}) {
  return new OneUniClient(options);
}
export {
  resolveOptions,
  getCurrentIsoDate,
  createOneUniClient,
  OneUniClient,
  OneUniApiError,
  DEFAULT_REFRESH_CLIENT_ID,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_CLIENT_ID,
  DEFAULT_AUTH_BASE_URL
};

//# debugId=3228B93DA298DF8F64756E2164756E21
//# sourceMappingURL=index.js.map
