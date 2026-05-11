export type SalaryDepartment = string;

/** Type grille : évolution brute affichée en % ou MAD selon colonne UI. */
export interface SalaryModel {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeInitials: string;
  department: string;
  grossSalary: number;
  netSalary: number;
  /** AAAA-MM (date d’effet). */
  month: string;
  effectiveDate: string;
  type: string;
  currency: string;
  note: string;
  /** Variation brut vs dernier bulletin même employé (pourcent arrondi 0,1). */
  evolution: number;
}

export interface DeptStat {
  department: string;
  mass: number;
  percent: number;
}

export interface SalaryFormDialogData {
  salary?: SalaryModel | null;
}

export interface SalaryDetailDialogData {
  salary: SalaryModel;
}
