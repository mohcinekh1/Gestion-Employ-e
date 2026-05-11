export interface Salary {
  id: number;
  employeeId: number;
  employeeName: string;
  grossAmount: number;
  netAmount: number;
  effectiveDate: string;
  type: 'MENSUEL' | 'ANNUEL';
  currency: string;
  note: string;
}

export interface SalaryRequest {
  employeeId: number;
  amount: number;
  effectiveDate: string;
  type: 'MENSUEL' | 'ANNUEL';
  currency: string;
  note: string;
}
