import { Employee } from './employee.model';

export interface DepartmentCount {
  departmentName: string;
  count: number;
}

export interface DashboardStats {
  totalEmployees: number;
  employeesByDepartment: DepartmentCount[];
  totalSalaryMass: number;
  averageSalary: number;
  pendingAbsences: number;
  absenceRateThisMonth: number;
  recentHires: Employee[];
}
