import { type OneUniClientOptions } from './options.js';
import type { AchievementsResponse, AttendanceByScheduleResponse, AttendanceDashboardResponse, AttendanceSummaryResponse, AuthResult, BankReponse, CancelPaymentResponse, CheckInvoiceInfoRequest, CheckInvoiceInfoResponse, CheckinRequest, CheckinResponse, CheckinStatisticsResponse, CurriculumFrameworkResponse, DashboardInfoResponse, DebtResponse, GetBlogsRequest, GetBlogsResponse, GradeDetailResponse, GradesResponse, HomeNewsResponse, ListCheckinResponse, LoginResponse, NewsCategory, NewsDetail, NoticeResponse, OnlineReceptDetailResponse, OnlineReceptInfoResponse, OnlineReceptResponse, PlainNoticesResponse, ReceiptDetailRequest, ReceiptsResponse, SchoolApiResponse, SchoolCalendarResponse, SchoolYearsResponse, ScheduleResponse, SemestersResponse, StudentCardResponse, StudentInfoResponse, SubmitPaymentReponse, SubmitPaymentRequest, TrainingAssessmentResponse } from './types/index.js';
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
export declare class OneUniClient {
    private readonly options;
    private readonly http;
    constructor(options?: OneUniClientOptions);
    private requireBaseUrl;
    /** Full URL of an endpoint under `/AppSVGV/api/v1`. */
    private apiUrl;
    private post;
    private requireSchoolCredentials;
    /**
     * OAuth2 password grant login.
     * Returns `null` when the gateway does not return an `access_token`; throws when
     * `idSinhVien` cannot be read.
     */
    login(studentId: string, password: string): Promise<AuthResult | null>;
    /**
     * Refreshes the access token using the `refresh_token` returned by {@link login}.
     * The old `accessToken` (if any) is sent in the Authorization header, matching the
     * OneUni app flow.
     */
    refreshToken(refreshToken: string, accessToken?: string): Promise<LoginResponse>;
    getSchedule(token: string, tuNgay?: string | null, denNgay?: string | null): Promise<ScheduleResponse>;
    getStudentInfo(token: string): Promise<StudentInfoResponse>;
    getGrades(token: string): Promise<GradesResponse>;
    getGradeDetail(token: string, idLopHocPhan: string): Promise<GradeDetailResponse>;
    getNewsCategories(token: string): Promise<NewsCategory[]>;
    getNewsDetail(token: string, newsId: number): Promise<NewsDetail>;
    /** Paginated news list as JSON (`TinTuc/GetBlogs`). */
    getBlogs(token: string, request?: GetBlogsRequest): Promise<GetBlogsResponse>;
    /** News shown on the home screen (`TinTuc/BlogsForHome`). */
    getHomeNews(token: string): Promise<HomeNewsResponse>;
    getListCheckin(token: string): Promise<ListCheckinResponse>;
    checkin(token: string, request: CheckinRequest): Promise<CheckinResponse>;
    getCheckinStatsDetail(token: string): Promise<CheckinStatisticsResponse>;
    getNotices(token: string): Promise<NoticeResponse>;
    updateNoticeStatus(token: string, idSinhVien: number, idGhiChu: number): Promise<boolean>;
    /** Full reminder list (not the popup variant). */
    getPlainNotices(token: string): Promise<PlainNoticesResponse>;
    getDebt(token: string): Promise<DebtResponse>;
    getReceipts(token: string): Promise<ReceiptsResponse>;
    getReceiptDetail(token: string, request: ReceiptDetailRequest): Promise<SchoolApiResponse<unknown>>;
    getDanhGiaRenLuyen(token: string, idSinhVien: number): Promise<TrainingAssessmentResponse>;
    /** List of the student's semesters/terms (`SinhVien/DotTheoSinhVien`). */
    getSemesters(token: string, idSinhVien: number): Promise<SemestersResponse>;
    /** List of school years (`SinhVien/GetNamHocTheoSinhVien`). */
    getSchoolYears(token: string): Promise<SchoolYearsResponse>;
    /** Curriculum framework (`SinhVien/ChuongTrinhKhung`). */
    getCurriculumFramework(token: string): Promise<CurriculumFrameworkResponse>;
    /** Academic achievements (`SinhVien/ThanhTich`). */
    getAchievements(token: string, idSinhVien: number, idDot?: number): Promise<AchievementsResponse>;
    /** Student dashboard information (`SinhVien/GetThongTinDashBoardSinhVien`). */
    getDashboardInfo(token: string, idSinhVien: number): Promise<DashboardInfoResponse>;
    /** Student card image as base64 (`SinhVien/GetTheSinhVien`). */
    getStudentCard(token: string, isMatTruoc?: boolean): Promise<StudentCardResponse>;
    /** School-wide calendar (`SinhVien/LichToanTruong`). */
    getSchoolCalendar(token: string): Promise<SchoolCalendarResponse>;
    /** Aggregated attendance statistics (`SinhVien/ThongKeDiemDanh`). */
    getAttendanceSummary(token: string, idSinhVien: number): Promise<AttendanceSummaryResponse>;
    /** Attendance dashboard statistics (`SinhVien/ThongKeDiemDanhDashboard`). */
    getAttendanceDashboard(token: string, idSinhVien: number): Promise<AttendanceDashboardResponse>;
    /** Attendance for a schedule entry (`SinhVien/DiemDanhLichHoc`). */
    getAttendanceBySchedule(token: string, idLichHoc: number, isLichHoc?: boolean): Promise<AttendanceByScheduleResponse>;
    /** List of banks/payment methods (`Payment/Banks`). */
    getBanks(token: string): Promise<BankReponse>;
    /** List of online receipts (`Payment/PhieuThuTrucTuyen`). */
    getOnlineReceipts(token: string, idSinhVien: number): Promise<OnlineReceptResponse>;
    /** Details of one online receipt (`Payment/GetPhieuThuTrucTuyenInfo`). */
    getOnlineReceiptInfo(token: string, transID: string): Promise<OnlineReceptInfoResponse>;
    /** Online receipt line items (`Payment/PhieuThuTrucTuyenChiTiet`). */
    getOnlineReceiptDetail(token: string, idSoThuTrucTuyen: number): Promise<OnlineReceptDetailResponse>;
    /** Create a payment (`Payment/SubmitThanhToan`). */
    submitPayment(token: string, request: SubmitPaymentRequest): Promise<SubmitPaymentReponse>;
    /** Cancel a payment (`Payment/HuyThanhToan`). */
    cancelPayment(token: string, transID: string): Promise<CancelPaymentResponse>;
    /** Validate invoice details (`Payment/CheckThongTinXuatHoaDon`). */
    checkInvoiceInfo(token: string, request: CheckInvoiceInfoRequest): Promise<CheckInvoiceInfoResponse>;
}
/** Convenience factory. */
export declare function createOneUniClient(options?: OneUniClientOptions): OneUniClient;
