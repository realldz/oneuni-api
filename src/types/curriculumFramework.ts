import type { SchoolApiResponse } from './common.js';

export interface CurriculumFrameworkResponse extends SchoolApiResponse<CurriculumFramework> {}

export interface CurriculumFramework {
  tenNganh: string;
  tenChuyenNganh: string;
  heDaoTao: string;
  loaiHinhDaoTao: string;
  hocKys: CurriculumSemester[];
}

export interface CurriculumSemester {
  hocKy: number;
  tongSoTC: number;
  soTCBatBuoc: number;
  soTCTuChon: number;
  monBatBuoc: CurriculumCourse[];
  monTuChon: CurriculumCourse[];
}

export interface CurriculumCourse {
  id: number;
  maMonHoc: number;
  maHocPhan: number;
  tenMonHoc: string;
  dvht: number;
  soTinChi: string;
  soTietLyThuyet: number;
  soTietThucHanh: number;
  soNhomTuChon: number;
  soTietTHBT: number;
  soDVHTTuChon: number | null;
  isLyThuyet: boolean;
  isBatBuoc: boolean;
  isDat: boolean;
  hocPhanTruocTienQuyetSongHanh: string;
  hocPhanTruoc: string | null;
  hocPhanTienQuyet: string | null;
  hocPhanSongHanh: string | null;
  maHocPhanTuongDuong: string | null;
}

/** Alias kept for compatibility with the old (misspelled) name in the huce-bot repo. */
export type CirriculumFrameworkResponse = CurriculumFrameworkResponse;
export type CirriculumFramework = CurriculumFramework;
