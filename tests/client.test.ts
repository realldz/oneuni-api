import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import {
  DEFAULT_ERROR_MESSAGE,
  OneUniApiError,
  OneUniClient,
  getCurrentIsoDate,
  resolveOptions,
} from '../src/index.js';

interface CapturedRequest {
  method: string;
  path: string;
  headers: Headers;
  body: unknown;
  rawBody: string;
}

let server: ReturnType<typeof Bun.serve>;
let baseUrl = '';
let captured: CapturedRequest[] = [];
let failWith500 = false;
let badRequest = false;

const STUDENT_INFO = {
  isOk: true,
  result: {
    idSinhVien: 1699896,
    maSinhVien: '01010101',
    hoTen: 'Nguyen Van A',
    hinhAnh: '',
    chiTiets: [],
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const rawBody = await request.text();
      let body: unknown = rawBody;
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }

      captured.push({
        method: request.method,
        path: url.pathname,
        headers: request.headers,
        body,
        rawBody,
      });

      if (failWith500) return new Response('boom', { status: 500 });

      const path = url.pathname;

      if (path === '/AUTH/connect/token' || path === '/AUTH//connect/token') {
        if (rawBody.includes('grant_type=refresh_token')) {
          return jsonResponse({
            access_token: 'refreshed-token',
            token_type: 'Bearer',
            expries_in: 3600,
            refresh_token: 'refresh-2',
            id_token: 'id-2',
          });
        }
        return jsonResponse({
          access_token: 'token-abc',
          token_type: 'Bearer',
          expries_in: 3600,
          refresh_token: 'refresh-abc',
          id_token: 'id-abc',
        });
      }

      if (path === '/AppSVGV/api/v1/SinhVien/Info') return jsonResponse(STUDENT_INFO);

      if (badRequest) {
        return jsonResponse({ isOk: false, errorMessages: ['bad'] }, 400);
      }

      if (path === '/AppSVGV/api/v1/SinhVien/KetQuaHocTapChiTiet') {
        return jsonResponse({ isOk: true, result: { rows: [], htmlKQHT: '<table></table>' } });
      }

      if (path === '/AppSVGV/api/v1/Notify/UpdateXemNhacNho') {
        return jsonResponse({ result: { isOk: true } });
      }

      if (path === '/AppSVGV/api/v1/Payment/SubmitThanhToan') {
        return jsonResponse({ isOk: true, result: { urlInitPayment: 'https://pay', qrCodeViewModel: {} } });
      }

      return jsonResponse({ isOk: true, result: [] });
    },
  });

  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server.stop(true);
});

beforeEach(() => {
  captured = [];
  failWith500 = false;
  badRequest = false;
});

function createClient(overrides: Record<string, unknown> = {}): OneUniClient {
  return new OneUniClient({
    baseUrl,
    schoolCode: 'HUCE',
    clientSecret: 'secret-123',
    authBaseUrl: baseUrl,
    ...overrides,
  });
}

/** Configuration environment variables the client reads as fallback (Bun loads `.env` from the repo root). */
const CONFIG_ENV_KEYS = [
  'ONEUNI_BASE_URL',
  'SCHOOL_API_BASEURL',
  'ONEUNI_SCHOOL_CODE',
  'SCHOOL_CODE',
  'ONEUNI_CLIENT_SECRET',
  'CLIENT_SECRET',
];

/** Runs fn with no OneUni configuration in the environment, then restores it exactly. */
async function withoutConfigEnv<T>(fn: () => Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const key of CONFIG_ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  try {
    return await fn();
  } finally {
    for (const key of CONFIG_ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

describe('login', () => {
  test('sends the correct form and returns token + idSinhVien', async () => {
    const client = createClient();
    const auth = await client.login('01010101', 'mat-khau');

    expect(auth).toEqual({ token: 'token-abc', idSinhVien: 1699896 });

    const [tokenRequest, infoRequest] = captured;
    expect(tokenRequest.path).toBe('/AUTH/connect/token');
    expect(tokenRequest.method).toBe('POST');
    expect(tokenRequest.rawBody).toContain('url_uni=' + encodeURIComponent(`${baseUrl}/AppSVGV`));
    expect(tokenRequest.rawBody).toContain('username=010101012HUCE');
    expect(tokenRequest.rawBody).toContain('client_id=mobile_flutter');
    expect(tokenRequest.rawBody).toContain('grant_type=password');
    expect(tokenRequest.headers.get('content-type')).toContain('application/x-www-form-urlencoded');

    expect(infoRequest.path).toBe('/AppSVGV/api/v1/SinhVien/Info');
    expect(infoRequest.headers.get('authorization')).toBe('Bearer token-abc');
  });

  test('throws a clear error when configuration is missing', async () => {
    await withoutConfigEnv(async () => {
      const client = new OneUniClient({ baseUrl, schoolCode: '', clientSecret: '', authBaseUrl: baseUrl });
      await expect(client.login('01010101', 'x')).rejects.toThrow('schoolCode');
    });
  });
});

describe('refreshToken', () => {
  test('sends refresh_token + the old Bearer token', async () => {
    const client = createClient();
    const result = await client.refreshToken('refresh-abc', 'old-token');

    expect('access_token' in result && result.access_token).toBe('refreshed-token');

    const [request] = captured;
    // The OneUni app uses "AUTH//connect/token" (double slash) for refresh.
    expect(request.path).toBe('/AUTH//connect/token');
    expect(request.rawBody).toContain('grant_type=refresh_token');
    expect(request.rawBody).toContain('refresh_token=refresh-abc');
    expect(request.rawBody).toContain('client_id=mobile_flutter_hssv');
    expect(request.headers.get('authorization')).toBe('Bearer old-token');
  });
});

describe('getSchedule', () => {
  test('defaults to today', async () => {
    const client = createClient();
    await client.getSchedule('token-abc');

    const today = getCurrentIsoDate();
    const expected = `${today.toISOString().split('T')[0]}T00:00:00.000`;
    expect(captured[0].path).toBe('/AppSVGV/api/v1/SinhVien/LichHocLichThi');
    expect(captured[0].body).toEqual({ loaiLich: 0, tuNgay: expected, denNgay: expected });
  });

  test('passes an explicit date range', async () => {
    const client = createClient();
    await client.getSchedule('token-abc', '2026-01-01T00:00:00.000', '2026-01-31T00:00:00.000');

    expect(captured[0].body).toEqual({
      loaiLich: 0,
      tuNgay: '2026-01-01T00:00:00.000',
      denNgay: '2026-01-31T00:00:00.000',
    });
  });
});

describe('other read endpoints', () => {
  test('getStudentInfo sends the Bearer token', async () => {
    const client = createClient();
    const info = await client.getStudentInfo('token-xyz');

    expect(info.result?.idSinhVien).toBe(1699896);
    expect(captured[0].headers.get('authorization')).toBe('Bearer token-xyz');
  });

  test('getGradeDetail sends the correct body', async () => {
    const client = createClient();
    await client.getGradeDetail('token-abc', 'LHP-01');

    expect(captured[0].path).toBe('/AppSVGV/api/v1/SinhVien/KetQuaHocTapChiTiet');
    expect(captured[0].body).toEqual({ idLopHocPhan: 'LHP-01' });
  });

  test('updateNoticeStatus returns result.isOk', async () => {
    const client = createClient();
    await expect(client.updateNoticeStatus('token-abc', 1, 2)).resolves.toBe(true);
    expect(captured[0].body).toEqual({ idSinhVien: 1, idGhiChu: 2 });
  });

  test('getDanhGiaRenLuyen keeps the endpoint double slash', async () => {
    const client = createClient();
    await client.getDanhGiaRenLuyen('token-abc', 1699896);

    expect(captured[0].path).toBe('/AppSVGV/api/v1/SinhVien//DanhGiaRenLuyen');
    expect(captured[0].body).toEqual({ idSinhVien: 1699896 });
  });
});

describe('remaining legacy endpoints', () => {
  test('sends the correct path/body for grades, news, attendance, notices, debt, receipts', async () => {
    const client = createClient();
    await client.getGrades('token-abc');
    await client.getNewsCategories('token-abc');
    await client.getNewsDetail('token-abc', 123);
    await client.getListCheckin('token-abc');
    await client.checkin('token-abc', { idLichHoc: 1 } as never);
    await client.getCheckinStatsDetail('token-abc');
    await client.getNotices('token-abc');
    await client.getDebt('token-abc');
    await client.getReceipts('token-abc');
    await client.getReceiptDetail('token-abc', { maHoaDon: 'HD-1' } as never);

    expect(captured.map((request) => request.path)).toEqual([
      '/AppSVGV/api/v1/SinhVien/KetQuaHocTap',
      '/AppSVGV/api/v1/TinTuc/DanhMucTinTuc',
      '/AppSVGV/api/v1/TinTuc/BlogDetail',
      '/AppSVGV/api/v1/SinhVien/LichDiemDanh',
      '/AppSVGV/api/v1/SinhVien/SubmitDiemDanh',
      '/AppSVGV/api/v1/SinhVien/ThongKeDiemDanhChiTiet',
      '/AppSVGV/api/v1/Notify/NhacNhoSinhVienPopup',
      '/AppSVGV/api/v1/Payment/CongNo',
      '/AppSVGV/api/v1/SinhVien/PhieuThuTongHop',
      '/AppSVGV/api/v1/SinhVien/ChiTietPhieuThuTongHop',
    ]);
    expect(captured[2].body).toEqual({ id: 123 });
    expect(captured[4].body).toEqual({ request: { idLichHoc: 1 } });
    expect(captured[9].body).toEqual({ maHoaDon: 'HD-1' });
    expect(
      captured.every((request) => request.headers.get('authorization') === 'Bearer token-abc'),
    ).toBe(true);
  });
});

describe('additional endpoints', () => {
  test('getSemesters / getSchoolYears / getCurriculumFramework', async () => {
    const client = createClient();
    await client.getSemesters('token-abc', 1699896);
    await client.getSchoolYears('token-abc');
    await client.getCurriculumFramework('token-abc');

    expect(captured[0].path).toBe('/AppSVGV/api/v1/SinhVien/DotTheoSinhVien');
    expect(captured[0].body).toEqual({ idSinhVien: 1699896 });
    expect(captured[1].path).toBe('/AppSVGV/api/v1/SinhVien/GetNamHocTheoSinhVien');
    expect(captured[1].body).toEqual({});
    expect(captured[2].path).toBe('/AppSVGV/api/v1/SinhVien/ChuongTrinhKhung');
  });

  test('getAchievements / getDashboardInfo / getStudentCard', async () => {
    const client = createClient();
    await client.getAchievements('token-abc', 1699896, 12);
    await client.getDashboardInfo('token-abc', 1699896);
    await client.getStudentCard('token-abc', false);

    expect(captured[0].body).toEqual({ idSinhVien: 1699896, idDot: 12 });
    expect(captured[1].body).toEqual({ idSinhVien: 1699896 });
    expect(captured[2].body).toEqual({ isMatTruoc: false });
  });

  test('getBlogs sends pagination', async () => {
    const client = createClient();
    await client.getBlogs('token-abc', { pageSize: 20, pageNumber: 2, idsDanhMuc: [2, 3] });

    expect(captured[0].path).toBe('/AppSVGV/api/v1/TinTuc/GetBlogs');
    expect(captured[0].body).toEqual({ pageSize: 20, pageNumber: 2, idsDanhMuc: [2, 3] });
  });

  test('payment endpoints send the correct body', async () => {
    const client = createClient();
    await client.getBanks('token-abc');
    await client.getOnlineReceiptInfo('token-abc', 'TRANS-1');
    await client.cancelPayment('token-abc', 'TRANS-2');
    await client.checkInvoiceInfo('token-abc', { objInfoHoaDons: [], isSinhVien: true });

    expect(captured[0].path).toBe('/AppSVGV/api/v1/Payment/Banks');
    expect(captured[1].body).toEqual({ transID: 'TRANS-1' });
    expect(captured[2].body).toEqual({ transID: 'TRANS-2' });
    expect(captured[3].body).toEqual({ objInfoHoaDons: [], isSinhVien: true });
  });

  test('submitPayment forwards the debt list + bank object untouched', async () => {
    const client = createClient();
    const congNo = { id: 1, soTienNop: 632000 } as never;
    const bank = { id: 10, maNganHang: 'BIDV', tenNganHang: 'BIDV' } as never;
    const result = await client.submitPayment('token-abc', { congNos: [congNo], bank });

    expect(result.result?.urlInitPayment).toBe('https://pay');
    expect(captured[0].body).toEqual({ congNos: [congNo], bank });
  });

  test('getBlogs omits idsDanhMuc for an empty array', async () => {
    const client = createClient();
    await client.getBlogs('token-abc', { idsDanhMuc: [] });

    expect(captured[0].body).toEqual({ pageSize: 15, pageNumber: 1 });
  });
});

describe('error handling', () => {
  test('5xx throws OneUniApiError with the status', async () => {
    failWith500 = true;
    const client = createClient();

    let caught: unknown;
    try {
      await client.getGrades('token-abc');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OneUniApiError);
    expect((caught as OneUniApiError).message).toBe(DEFAULT_ERROR_MESSAGE);
    expect((caught as OneUniApiError).status).toBe(500);
  });

  test('errorMessage option overrides the generic 5xx message', async () => {
    failWith500 = true;
    const client = createClient({ errorMessage: 'custom failure' });

    let caught: unknown;
    try {
      await client.getGrades('token-abc');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OneUniApiError);
    expect((caught as OneUniApiError).message).toBe('custom failure');
    expect((caught as OneUniApiError).status).toBe(500);
  });

  test('4xx does not throw (previous behavior: returns the body)', async () => {
    badRequest = true;
    const client = createClient();

    const response = await client.getGrades('token-abc');
    expect(response.isOk).toBe(false);
  });

  test('error cause does not contain credentials', async () => {
    failWith500 = true;
    const client = createClient();

    let caught: unknown;
    try {
      await client.login('01010101', 'super-secret-password');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OneUniApiError);
    const error = caught as OneUniApiError;
    // Only safe metadata is kept; the AxiosError is not attached (config.data holds password/client_secret).
    expect(error.cause).not.toHaveProperty('config');
    expect(error.cause).not.toHaveProperty('request');
    const serialized = JSON.stringify({ cause: error.cause, data: error.data });
    expect(serialized).not.toContain('super-secret-password');
    expect(serialized).not.toContain('secret-123');
  });

  test('debug logs do not contain Authorization or request bodies', async () => {
    const logs: unknown[][] = [];
    const client = createClient({
      logger: {
        debug: (...args: unknown[]) => logs.push(args),
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    await client.getGradeDetail('token-abc', 'LHP-01');

    const dump = JSON.stringify(logs);
    expect(dump).not.toContain('token-abc');
    expect(dump).not.toContain('LHP-01');
    expect(dump).toContain('***');
  });

  test('missing baseUrl throws when calling the API', async () => {
    await withoutConfigEnv(async () => {
      const client = new OneUniClient({ baseUrl: '' });
      await expect(client.getGrades('token-abc')).rejects.toThrow('baseUrl');
    });
  });
});

describe('resolveOptions', () => {
  test('falls back to huce-bot style environment variables', () => {
    const previous = {
      ONEUNI_BASE_URL: process.env.ONEUNI_BASE_URL,
      SCHOOL_API_BASEURL: process.env.SCHOOL_API_BASEURL,
      SCHOOL_CODE: process.env.SCHOOL_CODE,
      CLIENT_SECRET: process.env.CLIENT_SECRET,
      ALLOW_INSECURE_TLS: process.env.ALLOW_INSECURE_TLS,
    };

    process.env.SCHOOL_API_BASEURL = 'https://sinhvien.huce.edu.vn/';
    process.env.SCHOOL_CODE = 'HUCE';
    process.env.CLIENT_SECRET = 'secret-env';
    delete process.env.ONEUNI_BASE_URL;
    process.env.ALLOW_INSECURE_TLS = 'true';

    try {
      const resolved = resolveOptions();
      expect(resolved.baseUrl).toBe('https://sinhvien.huce.edu.vn');
      expect(resolved.schoolCode).toBe('HUCE');
      expect(resolved.clientSecret).toBe('secret-env');
      expect(resolved.authBaseUrl).toBe('https://mobile.oneuni.com.vn');
      expect(resolved.clientId).toBe('mobile_flutter');
      expect(resolved.refreshClientId).toBe('mobile_flutter_hssv');
      expect(resolved.allowInsecureTls).toBe(true);
      expect(resolved.errorMessage).toBe(DEFAULT_ERROR_MESSAGE);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
