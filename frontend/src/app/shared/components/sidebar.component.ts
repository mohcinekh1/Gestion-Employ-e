import { Component, computed, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IconBriefcase,
  IconCalendarOff,
  IconCurrencyDollar,
  IconLayoutDashboard,
  IconShieldLock,
  IconUsers,
  TablerIconComponent
} from '@tabler/icons-angular';
import type { TablerIcon } from '@tabler/icons-angular';
import { AuthService } from '../../core/services/auth.service';
import { ShellUiService } from '../../core/services/shell-ui.service';
import { AbsenceService } from '../../features/absences/absence.service';

type SidebarIconKey = 'dashboard' | 'users' | 'money' | 'calendar' | 'shield';

interface SidebarNavRow {
  path: string;
  label: string;
  iconKey: SidebarIconKey;
  /** Badge « nombre d’absences en attente » réservé aux rôles de gestion. */
  absencePendingBadge?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TablerIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  protected readonly absenceSvc = inject(AbsenceService);
  private readonly router = inject(Router);
  private readonly shellUi = inject(ShellUiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.absenceSvc.refreshManagerPendingBadge();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.shellUi.closeMobileNav());
  }

  protected readonly iconBriefcase = IconBriefcase;
  protected readonly iconLayoutDashboard = IconLayoutDashboard;
  protected readonly iconUsers = IconUsers;
  protected readonly iconCurrencyDollar = IconCurrencyDollar;
  protected readonly iconCalendarOff = IconCalendarOff;
  protected readonly iconShieldLock = IconShieldLock;

  readonly principalNav = computed((): SidebarNavRow[] => {
    const role = this.authService.currentUser()?.role;
    const rows: SidebarNavRow[] = [];
    if (role === 'ADMIN' || role === 'MANAGER') {
      rows.push(
        { path: '/dashboard', label: 'Dashboard', iconKey: 'dashboard' },
        { path: '/employees', label: 'Employés', iconKey: 'users' },
        { path: '/salaries', label: 'Salaires', iconKey: 'money' }
      );
    }
    rows.push({
      path: '/absences',
      label: 'Absences',
      iconKey: 'calendar',
      absencePendingBadge: true
    });
    return rows;
  });

  readonly adminNav = computed((): SidebarNavRow[] =>
    this.authService.hasRole(['ADMIN'])
      ? [{ path: '/users', label: 'Utilisateurs', iconKey: 'shield' }]
      : []
  );

  readonly pendingAbsenceBadgeLabel = computed(() => {
    if (!this.authService.hasRole(['ADMIN', 'MANAGER'])) {
      return null;
    }
    const n = this.absenceSvc.managerPendingCount();
    return n > 0 ? `${n}` : null;
  });

  resolveIcon(key: SidebarIconKey): TablerIcon {
    switch (key) {
      case 'dashboard':
        return IconLayoutDashboard;
      case 'users':
        return IconUsers;
      case 'money':
        return IconCurrencyDollar;
      case 'calendar':
        return IconCalendarOff;
      default:
        return IconShieldLock;
    }
  }

  readonly userInitials = computed(() => {
    const name = this.authService.currentUser()?.username?.trim() ?? '';
    if (!name) return '—';
    const parts = name.split(/[.\s_@-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });
}
