export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
  departmentName: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
