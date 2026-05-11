/** Modèle métier Angular (distinct du DTO backend). */
export type AbsenceTypeUi = 'CONGE_ANNUEL' | 'MALADIE' | 'EXCEPTIONNEL' | 'AUTRE';

export type AbsenceStatusUi = 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';

export interface AbsenceModel {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeInitials: string;
  department: string;
  type: AbsenceTypeUi;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  remainingBalance: number;
  status: AbsenceStatusUi;
  requestedAt: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

/** DTO brut Spring (camelCase Jackson). */
export interface AbsenceApiDto {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason?: string | null;
  createdAt?: string | null;
  approvedBy?: string | null;
}

export interface AbsenceReviewDialogData {
  mode: 'approve' | 'reject' | 'view';
  absence: AbsenceModel;
}

export interface AbsenceFormDialogData {
  presetEmployeeId?: number | null;
}

export const ABSENCE_TAB_OPTIONS = ['TOUTES', 'EN_ATTENTE', 'APPROUVEE', 'REFUSEE'] as const;
export type AbsenceTabFilter = (typeof ABSENCE_TAB_OPTIONS)[number];

export const ABSENCE_TYPES_UI: AbsenceTypeUi[] = [
  'CONGE_ANNUEL',
  'MALADIE',
  'EXCEPTIONNEL',
  'AUTRE'
];

export const ABSENCE_TYPE_LABELS: Record<AbsenceTypeUi, string> = {
  CONGE_ANNUEL: 'Congé annuel',
  MALADIE: 'Maladie',
  EXCEPTIONNEL: 'Exceptionnel',
  AUTRE: 'Autre'
};

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatusUi, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVEE: 'Approuvée',
  REFUSEE: 'Refusée'
};
