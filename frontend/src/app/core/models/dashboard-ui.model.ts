export type EmployeeUiStatus = 'Actif' | 'Inactif' | 'Congé' | 'Remote';
export type AbsenceUiStatus = 'En attente' | 'Approuvé' | 'Refusé';

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trendPositive: boolean;
  iconKey: 'users' | 'userCheck' | 'calendarOff' | 'cash';
  iconBg: string;
  iconColor: string;
  barColor: string;
}

export interface RecruitmentMonth {
  monthKey: string;
  monthLabel: string;
  hires: number;
  leaves: number;
}

export interface DepartmentDonutSlice {
  name: string;
  count: number;
  color: string;
}

export interface EmployeeRecentRow {
  initials: string;
  name: string;
  title: string;
  department: string;
  status: EmployeeUiStatus;
}

export interface AbsenceRequestItem {
  initials: string;
  name: string;
  detail: string;
  status: AbsenceUiStatus;
}
