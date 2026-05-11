/** Libellés UI ; l’API attend ACTIVE / INACTIVE. */
export type EmployeeStatusUi = 'Actif' | 'Inactif';

/** Nom du département comme renvoyé par l’API. */
export type EmployeeDepartmentName = string;

export interface EmployeeModel {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  /** Identifiant service (filtres formulaire). */
  departmentId: number;
  department: EmployeeDepartmentName;
  status: EmployeeStatusUi;
  /** Montant dernier salaire enregistré côté API (peut être 0 si inconnu). */
  salary: number;
  hireDate: string;
}

export const EMPLOYEE_STATUSES_UI: EmployeeStatusUi[] = ['Actif', 'Inactif'];

/** @deprecated Préférer `svc.departments()` chargé depuis l’API ; conservé vide pour anciens imports. */
export const EMPLOYEE_DEPARTMENTS: string[] = [];

export interface EmployeeFormDialogData {
  employee?: EmployeeModel | null;
  viewOnly?: boolean;
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
}

export interface EmployeeChoice {
  employeeId: number;
  employeeName: string;
  employeeInitials: string;
  department: EmployeeDepartmentName;
}
