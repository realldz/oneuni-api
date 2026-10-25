import type { AxiosInstance } from 'axios';
import { OneUniApiError } from './errors.js';
import { createHttpClient } from './http.js';
import {
  resolveOptions,
  type OneUniClientOptions,
  type ResolvedOptions,
} from './options.js';
import { getCurrentIsoDate } from './utils/date.js';
import type {
  AchievementsResponse,
  AttendanceByScheduleResponse,
  AttendanceDashboardResponse,
  AttendanceSummaryResponse,
  AuthResult,
  BankReponse,
  CancelPaymentResponse,
  CheckInvoiceInfoRequest,
  CheckInvoiceInfoResponse,
  CheckinRequest,
  CheckinResponse,
  CheckinStatisticsResponse,
  CurriculumFrameworkResponse,
  DashboardInfoResponse,
  DebtResponse,
  GetBlogsRequest,
  GetBlogsResponse,
  GradeDetailResponse,
  GradesResponse,
  HomeNewsResponse,
  ListCheckinResponse,
  LoginResponse,
  NewsCategory,
  NewsCategoryResponse,
  NewsDetail,
  NewsDetailResponse,
  NoticeResponse,
  OnlineReceptDetailResponse,
  OnlineReceptInfoResponse,
  OnlineReceptResponse,
  PlainNoticesResponse,
  ReceiptDetailRequest,
  ReceiptsResponse,
  SchoolApiResponse,
  SchoolCalendarResponse,
  SchoolYearsResponse,
  ScheduleResponse,
  SemestersResponse,
  StudentCardResponse,
  StudentInfoResponse,
  SubmitPaymentReponse,
  SubmitPaymentRequest,
  TrainingAssessmentResponse,
} from './types/index.js';

type ContentType = 'application/json' | 'application/x-www-form-urlencoded';

const API_PREFIX = '/AppSVGV/api/v1';

/**
 * Client for the OneUni API (student portals of schools that use OneUni).
 *
 * @example
 * ```ts
 * const client = new OneUniClient({
 *   baseUrl: 'https://sinhvien.huce.edu.vn',
 *   schoolCode: 'HUCE',
 *   clientSecret: process.env.CLIENT_SECRET!,
 * });
 * const auth = await client.login('0101xxxx', 'password');
 * const schedule = await client.getSchedule(auth!.token);
 * ```
 */
export class OneUniClient {
  private readonly options: ResolvedOptions;
  private readonly http: AxiosInstance;

  constructor(options: OneUniClientOptions = {}) {
    this.options = resolveOptions(options);
    this.http = createHttpClient(this.options);
  }

  /* ------------------------------------------------------------------ */
  /* Infrastructure                                                      */
  /* ------------------------------------------------------------------ */

  private requireBaseUrl(): string {
    if (!this.options.baseUrl) {
      throw new OneUniApiError(
        'OneUni API baseUrl is not configured (options.baseUrl or the SCHOOL_API_BASEURL environment variable)!',
      );
    }
    return this.options.baseUrl;
  }

  /** Full URL of an endpoint under `/AppSVGV/api/v1`. */
  private apiUrl(path: string): string {
    return `${this.requireBaseUrl()}${API_PREFIX}${path}`;
  }

  private async post<T>(
    url: string,
    body: unknown,
    token?: string,
    contentType: ContentType = 'application/json',
  ): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await this.http.post<T>(url, body, {
      headers,
      // Keep previous behavior: return the body for 4xx so callers can read `isOk`/`errorMessages`.
      validateStatus: (status) => status < 500,
    });
    return response.data;
  }

  private requireSchoolCredentials(): void {
    if (!this.options.schoolCode) {
      throw new OneUniApiError(
        'OneUni API schoolCode is not configured (options.schoolCode or the SCHOOL_CODE environment variable)!',
      );
    }
    if (!this.options.clientSecret) {
      throw new OneUniApiError(
        'OneUni API clientSecret is not configured (options.clientSecret or the CLIENT_SECRET environment variable)!',
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* Authentication                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * OAuth2 password grant login.
   * Returns `null` when the gateway does not return an `access_token`; throws when
   * `idSinhVien` cannot be read.
   */
  async login(studentId: string, password: string): Promise<AuthResult | null> {
    this.requireSchoolCredentials();
    const baseUrl = this.requireBaseUrl();

    const params = new URLSearchParams();
    params.append('url_uni', `${baseUrl}/AppSVGV`);
    params.append('username', `${studentId}2${this.options.schoolCode}`);
    params.append('password', password);
    params.append('client_secret', this.options.clientSecret);
    params.append('client_id', this.options.clientId);
    params.append('grant_type', 'password');
    params.append('scope', 'offline_access openid');

    const response = await this.post<LoginResponse>(
      `${this.options.authBaseUrl}/AUTH/connect/token`,
      params,
      undefined,
      'application/x-www-form-urlencoded',
    );

    if (!('access_token' in response)) return null;

    const token = response.access_token;
    const studentInfo = await this.getStudentInfo(token);
    const idSinhVien = studentInfo.result?.idSinhVien;
    if (!idSinhVien) throw new OneUniApiError('Student information not found.');

    return { token, idSinhVien };
  }

  /**
   * Refreshes the access token using the `refresh_token` returned by {@link login}.
   * The old `accessToken` (if any) is sent in the Authorization header, matching the
   * OneUni app flow.
   */
  async refreshToken(refreshToken: string, accessToken?: string): Promise<LoginResponse> {
    if (!this.options.clientSecret) {
      throw new OneUniApiError(
        'OneUni API clientSecret is not configured (options.clientSecret or the CLIENT_SECRET environment variable)!',
      );
    }

    const params = new URLSearchParams();
    params.append('refresh_token', refreshToken);
    params.append('client_secret', this.options.clientSecret);
    params.append('grant_type', 'refresh_token');
    params.append('client_id', this.options.refreshClientId);

    // The OneUni app uses the literal "https://mobile.oneuni.com.vn/AUTH//connect/token"
    // (double `/`) for refresh — see re/blutter_out/asm/ems/data/api/interceptors/auth_interceptor.dart.
    return this.post<LoginResponse>(
      `${this.options.authBaseUrl}/AUTH//connect/token`,
      params,
      accessToken,
      'application/x-www-form-urlencoded',
    );
  }

  /* ------------------------------------------------------------------ */
  /* Schedule / exams                                                    */
  /* ------------------------------------------------------------------ */

  async getSchedule(
    token: string,
    tuNgay: string | null = null,
    denNgay: string | null = null,
  ): Promise<ScheduleResponse> {
    const today = getCurrentIsoDate();
    const defaultDate = `${today.toISOString().split('T')[0]}T00:00:00.000`;

    return this.post<ScheduleResponse>(this.apiUrl('/SinhVien/LichHocLichThi'), {
      loaiLich: 0,
      tuNgay: tuNgay || defaultDate,
      denNgay: denNgay || defaultDate,
    }, token);
  }

  /* ------------------------------------------------------------------ */
  /* Student info / grades                                               */
  /* ------------------------------------------------------------------ */

  async getStudentInfo(token: string): Promise<StudentInfoResponse> {
    return this.post<StudentInfoResponse>(this.apiUrl('/SinhVien/Info'), {}, token);
  }

  async getGrades(token: string): Promise<GradesResponse> {
    return this.post<GradesResponse>(this.apiUrl('/SinhVien/KetQuaHocTap'), {}, token);
  }

  async getGradeDetail(token: string, idLopHocPhan: string): Promise<GradeDetailResponse> {
    return this.post<GradeDetailResponse>(
      this.apiUrl('/SinhVien/KetQuaHocTapChiTiet'),
      { idLopHocPhan },
      token,
    );
  }

  /* ------------------------------------------------------------------ */
  /* News                                                                */
  /* ------------------------------------------------------------------ */

  async getNewsCategories(token: string): Promise<NewsCategory[]> {
    const response = await this.post<NewsCategoryResponse>(
      this.apiUrl('/TinTuc/DanhMucTinTuc'),
      {},
      token,
    );
    return response.result ?? [];
  }

  async getNewsDetail(token: string, newsId: number): Promise<NewsDetail> {
    const response = await this.post<NewsDetailResponse>(
      this.apiUrl('/TinTuc/BlogDetail'),
      { id: newsId },
      token,
    );
    return response.result ?? ({} as NewsDetail);
  }

  /** Paginated news list as JSON (`TinTuc/GetBlogs`). */
  async getBlogs(token: string, request: GetBlogsRequest = {}): Promise<GetBlogsResponse> {
    const { pageSize = 15, pageNumber = 1, idsDanhMuc } = request;
    return this.post<GetBlogsResponse>(this.apiUrl('/TinTuc/GetBlogs'), {
      pageSize,
      pageNumber,
      ...(idsDanhMuc && idsDanhMuc.length > 0 ? { idsDanhMuc } : {}),
    }, token);
  }

  /** News shown on the home screen (`TinTuc/BlogsForHome`). */
  async getHomeNews(token: string): Promise<HomeNewsResponse> {
    return this.post<HomeNewsResponse>(this.apiUrl('/TinTuc/BlogsForHome'), {}, token);
  }

  /* ------------------------------------------------------------------ */
  /* Attendance                                                          */
  /* ------------------------------------------------------------------ */

  async getListCheckin(token: string): Promise<ListCheckinResponse> {
    return this.post<ListCheckinResponse>(this.apiUrl('/SinhVien/LichDiemDanh'), {}, token);
  }

  async checkin(token: string, request: CheckinRequest): Promise<CheckinResponse> {
    return this.post<CheckinResponse>(
      this.apiUrl('/SinhVien/SubmitDiemDanh'),
      { request },
      token,
    );
  }

  async getCheckinStatsDetail(token: string): Promise<CheckinStatisticsResponse> {
    return this.post<CheckinStatisticsResponse>(
      this.apiUrl('/SinhVien/ThongKeDiemDanhChiTiet'),
      {},
      token,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Reminders / notices                                                 */
  /* ------------------------------------------------------------------ */

  async getNotices(token: string): Promise<NoticeResponse> {
    return this.post<NoticeResponse>(
      this.apiUrl('/Notify/NhacNhoSinhVienPopup'),
      {},
      token,
    );
  }

  async updateNoticeStatus(
    token: string,
    idSinhVien: number,
    idGhiChu: number,
  ): Promise<boolean> {
    const response = await this.post<{ result: { isOk: boolean } }>(
      this.apiUrl('/Notify/UpdateXemNhacNho'),
      { idSinhVien, idGhiChu },
      token,
    );
    return response.result.isOk;
  }

  /** Full reminder list (not the popup variant). */
  async getPlainNotices(token: string): Promise<PlainNoticesResponse> {
    return this.post<PlainNoticesResponse>(this.apiUrl('/Notify/NhacNhoSinhVien'), {}, token);
  }

  /* ------------------------------------------------------------------ */
  /* Debt / receipts                                                     */
  /* ------------------------------------------------------------------ */

  async getDebt(token: string): Promise<DebtResponse> {
    return this.post<DebtResponse>(this.apiUrl('/Payment/CongNo'), {}, token);
  }

  async getReceipts(token: string): Promise<ReceiptsResponse> {
    return this.post<ReceiptsResponse>(this.apiUrl('/SinhVien/PhieuThuTongHop'), {}, token);
  }

  async getReceiptDetail(
    token: string,
    request: ReceiptDetailRequest,
  ): Promise<SchoolApiResponse<unknown>> {
    return this.post<SchoolApiResponse<unknown>>(
      this.apiUrl('/SinhVien/ChiTietPhieuThuTongHop'),
      request,
      token,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Training assessment                                                 */
  /* ------------------------------------------------------------------ */

  async getDanhGiaRenLuyen(
    token: string,
    idSinhVien: number,
  ): Promise<TrainingAssessmentResponse> {
    // Keep the "//" exactly as the OneUni app calls it.
    return this.post<TrainingAssessmentResponse>(
      this.apiUrl('/SinhVien//DanhGiaRenLuyen'),
      { idSinhVien },
      token,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Academics (additional)                                              */
  /* ------------------------------------------------------------------ */

  /** List of the student's semesters/terms (`SinhVien/DotTheoSinhVien`). */
  async getSemesters(token: string, idSinhVien: number): Promise<SemestersResponse> {
    return this.post<SemestersResponse>(
      this.apiUrl('/SinhVien/DotTheoSinhVien'),
      { idSinhVien },
      token,
    );
  }

  /** List of school years (`SinhVien/GetNamHocTheoSinhVien`). */
  async getSchoolYears(token: string): Promise<SchoolYearsResponse> {
    return this.post<SchoolYearsResponse>(
      this.apiUrl('/SinhVien/GetNamHocTheoSinhVien'),
      {},
      token,
    );
  }

  /** Curriculum framework (`SinhVien/ChuongTrinhKhung`). */
  async getCurriculumFramework(token: string): Promise<CurriculumFrameworkResponse> {
    return this.post<CurriculumFrameworkResponse>(
      this.apiUrl('/SinhVien/ChuongTrinhKhung'),
      {},
      token,
    );
  }

  /** Academic achievements (`SinhVien/ThanhTich`). */
  async getAchievements(
    token: string,
    idSinhVien: number,
    idDot = 0,
  ): Promise<AchievementsResponse> {
    return this.post<AchievementsResponse>(
      this.apiUrl('/SinhVien/ThanhTich'),
      { idSinhVien, idDot },
      token,
    );
  }

  /** Student dashboard information (`SinhVien/GetThongTinDashBoardSinhVien`). */
  async getDashboardInfo(
    token: string,
    idSinhVien: number,
  ): Promise<DashboardInfoResponse> {
    return this.post<DashboardInfoResponse>(
      this.apiUrl('/SinhVien/GetThongTinDashBoardSinhVien'),
      { idSinhVien },
      token,
    );
  }

  /** Student card image as base64 (`SinhVien/GetTheSinhVien`). */
  async getStudentCard(token: string, isMatTruoc = true): Promise<StudentCardResponse> {
    return this.post<StudentCardResponse>(
      this.apiUrl('/SinhVien/GetTheSinhVien'),
      { isMatTruoc },
      token,
    );
  }

  /** School-wide calendar (`SinhVien/LichToanTruong`). */
  async getSchoolCalendar(token: string): Promise<SchoolCalendarResponse> {
    return this.post<SchoolCalendarResponse>(
      this.apiUrl('/SinhVien/LichToanTruong'),
      {},
      token,
    );
  }

  /** Aggregated attendance statistics (`SinhVien/ThongKeDiemDanh`). */
  async getAttendanceSummary(
    token: string,
    idSinhVien: number,
  ): Promise<AttendanceSummaryResponse> {
    return this.post<AttendanceSummaryResponse>(
      this.apiUrl('/SinhVien/ThongKeDiemDanh'),
      { idSinhVien },
      token,
    );
  }

  /** Attendance dashboard statistics (`SinhVien/ThongKeDiemDanhDashboard`). */
  async getAttendanceDashboard(
    token: string,
    idSinhVien: number,
  ): Promise<AttendanceDashboardResponse> {
    return this.post<AttendanceDashboardResponse>(
      this.apiUrl('/SinhVien/ThongKeDiemDanhDashboard'),
      { idSinhVien },
      token,
    );
  }

  /** Attendance for a schedule entry (`SinhVien/DiemDanhLichHoc`). */
  async getAttendanceBySchedule(
    token: string,
    idLichHoc: number,
    isLichHoc = true,
  ): Promise<AttendanceByScheduleResponse> {
    return this.post<AttendanceByScheduleResponse>(
      this.apiUrl('/SinhVien/DiemDanhLichHoc'),
      { idLichHoc, isLichHoc },
      token,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Payments (additional)                                               */
  /* ------------------------------------------------------------------ */

  /** List of banks/payment methods (`Payment/Banks`). */
  async getBanks(token: string): Promise<BankReponse> {
    return this.post<BankReponse>(this.apiUrl('/Payment/Banks'), {}, token);
  }

  /** List of online receipts (`Payment/PhieuThuTrucTuyen`). */
  async getOnlineReceipts(token: string, idSinhVien: number): Promise<OnlineReceptResponse> {
    return this.post<OnlineReceptResponse>(
      this.apiUrl('/Payment/PhieuThuTrucTuyen'),
      { idSinhVien },
      token,
    );
  }

  /** Details of one online receipt (`Payment/GetPhieuThuTrucTuyenInfo`). */
  async getOnlineReceiptInfo(token: string, transID: string): Promise<OnlineReceptInfoResponse> {
    return this.post<OnlineReceptInfoResponse>(
      this.apiUrl('/Payment/GetPhieuThuTrucTuyenInfo'),
      { transID },
      token,
    );
  }

  /** Online receipt line items (`Payment/PhieuThuTrucTuyenChiTiet`). */
  async getOnlineReceiptDetail(
    token: string,
    idSoThuTrucTuyen: number,
  ): Promise<OnlineReceptDetailResponse> {
    return this.post<OnlineReceptDetailResponse>(
      this.apiUrl('/Payment/PhieuThuTrucTuyenChiTiet'),
      { idSoThuTrucTuyen },
      token,
    );
  }

  /** Create a payment (`Payment/SubmitThanhToan`). */
  async submitPayment(
    token: string,
    request: SubmitPaymentRequest,
  ): Promise<SubmitPaymentReponse> {
    return this.post<SubmitPaymentReponse>(
      this.apiUrl('/Payment/SubmitThanhToan'),
      request,
      token,
    );
  }

  /** Cancel a payment (`Payment/HuyThanhToan`). */
  async cancelPayment(token: string, transID: string): Promise<CancelPaymentResponse> {
    return this.post<CancelPaymentResponse>(
      this.apiUrl('/Payment/HuyThanhToan'),
      { transID },
      token,
    );
  }

  /** Validate invoice details (`Payment/CheckThongTinXuatHoaDon`). */
  async checkInvoiceInfo(
    token: string,
    request: CheckInvoiceInfoRequest,
  ): Promise<CheckInvoiceInfoResponse> {
    return this.post<CheckInvoiceInfoResponse>(
      this.apiUrl('/Payment/CheckThongTinXuatHoaDon'),
      request,
      token,
    );
  }
}

/** Convenience factory. */
export function createOneUniClient(options: OneUniClientOptions = {}): OneUniClient {
  return new OneUniClient(options);
}
