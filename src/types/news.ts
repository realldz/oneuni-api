import type { PagedData, SchoolApiResponse } from './common.js';

export interface NewsResponse extends SchoolApiResponse<News[]> {}
export interface NewsCategoryResponse extends SchoolApiResponse<NewsCategory[]> {}
export interface NewsDetailResponse extends SchoolApiResponse<NewsDetail> {}

/** `result` of the GetBlogs endpoint: `{ items, pagingInfo }`. */
export interface GetBlogsResponse extends SchoolApiResponse<PagedData<News>> {}

/**
 * `TinTuc/BlogsForHome` — RE recorded `BaseResponse<NewsModel>` (a single item),
 * but the endpoint name suggests a list; keep both possibilities to stay safe.
 */
export interface HomeNewsResponse extends SchoolApiResponse<News | News[]> {}

export interface News {
  id: number;
  tieuDe: string;
  tomTat: string;
  hinhDaiDien: string;
  soThuTu: number;
  ngayDangTin: string;
  nguoiDangTin: string;
  idDanhMuc: number;
  tenDanhMuc: string;
}

export interface NewsCategory {
  id: number;
  tenDanhMucTinTuc: string;
  soThuTu: number;
  ghiChu: string;
}

export interface NewsDetail {
  id: number;
  tieuDe: string;
  noiDung: string;
  soLuotXem: number;
  isBinhLuan: boolean;
  ngayDangTin: string;
  nguoiDangTin: string;
  idDanhMuc: number;
  tenDanhMuc: string;
  lienQuans: string[];
  fileAttachs: string[];
}

export interface GetBlogsRequest {
  pageSize?: number;
  pageNumber?: number;
  /** News category ids to fetch. */
  idsDanhMuc?: number[];
}
