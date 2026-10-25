import type { SchoolApiResponse } from './common.js';

export interface ReceiptsResponse extends SchoolApiResponse<PhieuThuTongHop[]> {}

/** Summary receipt (api/v1/SinhVien/PhieuThuTongHop). */
export interface PhieuThuTongHop {
  id: number;
  soPhieu: string;
  maHoaDon: string;
  idLoaiThu: number;
  donViThu: string;
  ngayThu: string;
  tongTien: number;
  urlInvoice: string;
  ma: string;
  noiDung: string;
  soTienNop: number;
  duKienNop: number;
  hocKy: string;
  idDot: number;
  nienHoc: string;
  idNamHoc: number;
  soTienMG: number;
  phanTramMienGiam: number;
  [key: string]: unknown;
}

/** Request of api/v1/SinhVien/ChiTietPhieuThuTongHop. */
export interface ReceiptDetailRequest {
  idSinhVien: number;
  maSinhVien: string;
  soPhieu: string;
  idLoaiThu: number;
  maHoaDon: string;
}
