import type { SchoolApiResponse } from './common.js';
export interface TrainingAssessmentResponse extends SchoolApiResponse<TrainingAssessment[]> {
}
export interface TrainingAssessment {
    idDot: number;
    tenDot: string;
    namHoc: number;
    soThuTu: number;
    khenThuongs: Array<unknown>;
    kyLuats: Array<unknown>;
    diemRenLuyens: TrainingPoint[];
}
export interface TrainingPoint {
    soDiem: number;
    xepLoai: string;
}
