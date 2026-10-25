import type { ApiResponseResult, SchoolApiResponse } from './common.js';
import type { Notice } from './notices.js';
/** A "term" (semester) returned by `SinhVien/DotTheoSinhVien`. */
export interface Semester {
    id: number;
    soThuTu: number;
    tenDot: string;
    isActive: boolean;
}
export interface SemestersResponse extends SchoolApiResponse<Semester[]> {
}
/**
 * One item of `ResponseCardItemBaseViewModel` — used for the school year list
 * (`SinhVien/GetNamHocTheoSinhVien`). This is the OneUni app's shared card type.
 */
export interface SchoolYearItem {
    label: string;
    value: string;
    color?: string | null;
    backgroundColor?: string | null;
    isUnderline?: boolean;
    isHTML?: boolean;
    iconCode?: string | null;
    iconFont?: string | null;
    iconFontPackage?: string | null;
    parentValue?: string | null;
    isSelected?: boolean;
    isLabelBold?: boolean;
    isLabelItalic?: boolean;
    isValueBold?: boolean;
    isValueItalic?: boolean;
}
export interface SchoolYearsResponse extends SchoolApiResponse<SchoolYearItem[]> {
}
/** One academic achievement row (`SinhVien/ThanhTich`). */
export interface Achievement {
    idSinhVien: number;
    tenMonHoc: string;
    diemTongKet: number;
    diemTinChi: number;
    xepLoai: string;
    isDat: boolean;
    idLopHocPhan: number;
    diemTBLHPHe10: number;
    diemtTBLHPHe4: number;
    colorDiem: string | null;
}
export interface AchievementsResponse extends SchoolApiResponse<Achievement[]> {
}
/** One dashboard item (`SinhVien/GetThongTinDashBoardSinhVien`). */
export interface DashboardInfoItem {
    maDanhMuc: string;
    textHienThi: string;
    noiDung: string;
    isBoldText: boolean;
    isBoldNoiDung: boolean;
    sizeText: number | null;
    sizeNoiDung: number | null;
    colorText: string | null;
    colorNoiDung: string | null;
    text01: string | null;
}
export interface DashboardInfoResponse extends SchoolApiResponse<DashboardInfoItem[]> {
}
/** `result` of `SinhVien/GetTheSinhVien` — card image as base64. */
export interface StudentCard {
    base64AnhTheSV?: string;
}
export interface StudentCardResponse extends SchoolApiResponse<StudentCard> {
}
/** A class/schedule entry in `SinhVien/LichToanTruong`. */
export interface SchoolCalendarItem {
    maLopHoc: string;
    tenLopHoc: string;
    maMonHoc: string;
    maLopHocPhan: string;
    tenMonHoc: string;
    isLHPGhep: boolean;
    isLyThuyet: boolean;
    thoiGianHocThi: string;
    thu: string;
    tietHoc: string;
    nhom: string | null;
    hoTenGiangVien: string;
    tenPhong: string;
    tenKhoa: string;
    gioThi: string;
    detail: string;
}
/** This endpoint wraps two levels: `{ isOk, result: { isSuccess, data: [...] } }`. */
export interface SchoolCalendarResponse extends SchoolApiResponse<ApiResponseResult<SchoolCalendarItem[]>> {
}
export interface AttendanceSubject {
    id: number;
    maLopHocPhan: number;
    tenMonHoc: string;
    maMonHoc: number;
    soTinChi: number;
    coPhep: number;
    koPhep: number;
    stCoPhep: number;
    stKoPhep: number;
    soLanKiemTraDat: number;
    soLanKiemTraKoDat: number;
}
export interface AttendanceDot {
    idDot: number;
    namHoc: number;
    sttDot: number;
    tenDot: string;
    tongSoTinChi: number;
    tongCoPhep: number;
    tongKoPhep: number;
    monHocs: AttendanceSubject[];
}
/** `result` of `SinhVien/ThongKeDiemDanh`. */
export interface AttendanceSummary {
    tongTiet: number;
    tongCoMat: number;
    tongVang: number;
    tyLeCoMat: number;
    dots: AttendanceDot[];
}
export interface AttendanceSummaryResponse extends SchoolApiResponse<AttendanceSummary> {
}
/**
 * `SinhVien/ThongKeDiemDanhDashboard` — RE confirmed the
 * `AttendanceStaticDashboardModel` model but the detailed shape could not be extracted,
 * so `result` is typed `unknown` to avoid a wrong type.
 */
export interface AttendanceDashboardResponse extends SchoolApiResponse<unknown> {
}
/**
 * `SinhVien/DiemDanhLichHoc` — the `DiemDanhLichHocModel` model only makes the
 * `errorResult` / `result` / `isOk` fields explicit; the shape of `result` is not determined yet.
 */
export interface AttendanceByScheduleResponse extends SchoolApiResponse<unknown> {
}
export interface PlainNoticesResponse extends SchoolApiResponse<Notice[]> {
}
