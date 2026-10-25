import type { ApiResponseResult, SchoolApiResponse } from './common.js';

/* ------------------------------------------------------------------ */
/* Debt                                                               */
/* ------------------------------------------------------------------ */

export interface DebtResponse extends SchoolApiResponse<DebtResult> {}

export interface DebtResult {
  congNos: Debt[];
  configs: Configs[];
  tinhChatHoaDon: unknown[];
}

export interface Debt {
  id: number;
  strId: string;
  subId: number;
  strSubId: string;
  ma: string;
  noiDungThu: string;
  soTienNop: number;
  soTienVAT: number;
  isBatBuoc: boolean;
  idDot: number;
  idNamHoc: number;
  metaData: string;
  strRequest01: string | null;
  strRequest02: string | null;
  strRequest03: string | null;
  chiTiets: DebtDetail[];
  idLoaiThu: number;
  idDangKyHocPhan: number | null;
  idDuKienThu: number | null;
  idKeHoachThuChung: number | null;
  idDangKyThiLai: number | null;
  idDangKyThiTotNghiep: number | null;
  idCongNoNoiTru: number | null;
  soLuong: number | null;
  strIDCongNo: string | null;
  idLoaiMonHoc: number;
  idKhoanThuKhac: number | null;
  idTrangThaiDangKy: number;
  ngayHetHanNopHP: string | null;
}

export interface DebtDetail {
  label: string;
  value: string | number;
}

export interface Configs {
  key: string;
  value: string;
  ghiChuForDev: string;
}

/* ------------------------------------------------------------------ */
/* Banks / payment methods                                            */
/* ------------------------------------------------------------------ */

export interface BankReponse extends SchoolApiResponse<BankResult[]> {}

/** Alias with the correct spelling. */
export type BankResponse = BankReponse;

export interface BankResult {
  loaiHinhThanhToan: number;
  tenLoaiHinhThanhToan: string;
  sttLoaiHinhThanhToan: number;
  banks: Bank[];
}

export interface Bank {
  id: number;
  maNganHang: string;
  tenNganHang: string;
  bankLogoUrl: string;
  isTrungGianTT: number | null;
  tmnCode: string | null;
  thongBao: string | null;
  phiDV: number;
  phiDVPhanTram: number | null;
  stt: number | null;
  ghiChu: string | null;
  metaData: string;
  strRequest01: string | null;
  strRequest02: string | null;
  strRequest03: string | null;
  idLoaiHinhThanhToan: number;
  tenLoaiHinhThanhToan: string | null;
  sttLoaiHinhThanhToan: number | null;
}

/* ------------------------------------------------------------------ */
/* Online receipts                                                    */
/* ------------------------------------------------------------------ */

export interface OnlineReceptResponse extends SchoolApiResponse<OnlineRecept[]> {}
export interface OnlineReceptInfoResponse extends SchoolApiResponse<OnlineReceptInfo> {}
export interface OnlineReceptDetailResponse extends SchoolApiResponse<OnlineReceptDetail[]> {}

export interface OnlineRecept {
  transID: string;
  idSoThuTrucTuyen: number;
  soPhieu: number | null;
  noiDungThu: string;
  tongTien: number;
  ngayThanhToan: string;
  isDaThanhToan: boolean;
  isDaCapNhatSoThu: boolean;
  trangThaiGD: string;
  urlInvoice: string | null;
  isHuy: boolean;
  isHienThiNutHuyThanhToan: boolean;
  metaData: unknown | null;
}

export interface OnlineReceptInfo {
  transID: string;
  urlKetQua: string;
  tongTien: number;
  daThanhToan: boolean;
  ngayThanhToan: string | null;
}

export interface OnlineReceptDetail {
  ma: string;
  noiDungThu: string;
  nienHoc: string;
  soTienNop: number;
}

/* ------------------------------------------------------------------ */
/* Payment                                                            */
/* ------------------------------------------------------------------ */

export interface SubmitPaymentReponse extends SchoolApiResponse<SubmitData> {}

/** Alias with the correct spelling. */
export type SubmitPaymentResponse = SubmitPaymentReponse;

export interface SubmitData {
  urlInitPayment: string;
  qrCodeViewModel: QRCodeViewModel;
}

export interface QRCodeViewModel {
  bank: string;
  virtualAcctName: string;
  virtualAcctId: string;
  qrImg: string;
  releaseTime: string | null;
  period: number;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string | null;
  description: string;
  partnerCode: string;
  createDate: number;
  hashCode: string;
  transID: string;
}

export interface CancelPaymentResponse extends SchoolApiResponse<CancelPaymentData> {}

export interface CancelPaymentData {
  message: string;
}

/** Body of `Payment/SubmitThanhToan`. */
export interface SubmitPaymentRequest {
  /** Debts to pay (from `getDebt()`). */
  congNos: Debt[];
  strRequest01?: string;
  strRequest02?: string;
  strRequest03?: string;
  /**
   * Receiving bank — from `getBanks()`.
   * Postman records `bank` as a **`Bank` object** (not a bank code string).
   */
  bank: Bank;
  /**
   * Present in the app's `DebtPaymentRequest` but not seen in Postman;
   * optional so callers are not forced to send it.
   */
  isSinhVien?: boolean;
  objInfoHoaDons?: unknown[];
}

/**
 * Body of `Payment/CheckThongTinXuatHoaDon`.
 *
 * Source: model `check_thong_tin_xuat_hoa_don_request.dart` + screen
 * `detail_payment_invoice_info.dart` (student/unit form) using
 * `{objInfoHoaDons, isSinhVien}`. The Postman collection instead records `{ "transID": "" }`
 * (empty body, most likely a placeholder) — needs verification with a real account.
 */
export interface CheckInvoiceInfoRequest {
  objInfoHoaDons: unknown[];
  isSinhVien: boolean;
}

export interface CheckInvoiceInfoResponse
  extends SchoolApiResponse<ApiResponseResult<boolean>> {}
