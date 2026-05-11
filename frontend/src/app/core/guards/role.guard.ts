import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[]) ?? [];
  if (!roles.length || authService.hasRole(roles)) {
    return true;
  }
  const ur = authService.currentUser()?.role;
  return ur === 'EMPLOYEE' ? router.parseUrl('/absences') : router.parseUrl('/dashboard');
};
