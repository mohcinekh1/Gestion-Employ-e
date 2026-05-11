export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: number | null;
}

export interface CurrentUser {
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  /** Renseigné côté serveur lorsque le compte est lié à un employé. */
  employeeId?: number | null;
}

export interface RegisterDepartmentDTO {
  id: number;
  name: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  departmentId: number;
  hireDate?: string | null;
  password: string;
}
