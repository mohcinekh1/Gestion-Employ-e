import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MANAGER'], pageTitle: 'Dashboard' }
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./features/employees/employee-list.component').then((m) => m.EmployeeListComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MANAGER'], pageTitle: 'Employés' }
  },
  {
    path: 'salaries',
    loadComponent: () =>
      import('./features/salaries/salary-list.component').then((m) => m.SalaryListComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MANAGER'], pageTitle: 'Salaires' }
  },
  {
    path: 'absences',
    loadComponent: () =>
      import('./features/absences/absence-list.component').then((m) => m.AbsenceListComponent),
    canActivate: [authGuard],
    data: { pageTitle: 'Absences' }
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/user-list.component').then((m) => m.UserListComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'], pageTitle: 'Utilisateurs' }
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
