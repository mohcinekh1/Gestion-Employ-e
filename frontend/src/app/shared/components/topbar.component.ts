import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { IconUserPlus, TablerIconComponent } from '@tabler/icons-angular';
import { AuthService } from '../../core/services/auth.service';
import { ShellUiService } from '../../core/services/shell-ui.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, TablerIconComponent, MatIconModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly shellUi = inject(ShellUiService);
  private readonly router = inject(Router);

  readonly today = new Date();

  readonly pageTitle = signal('Dashboard');

  readonly canManageEmployees = computed(() => this.authService.hasRole(['ADMIN', 'MANAGER']));

  protected readonly iconUserPlus = IconUserPlus;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.applyRouteTitle(this.router.routerState.snapshot.root);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe(() => this.applyRouteTitle(this.router.routerState.snapshot.root));
  }

  private applyRouteTitle(root: ActivatedRouteSnapshot): void {
    let r = root;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const title = r.data['pageTitle'] as string | undefined;
    this.pageTitle.set(title ?? 'Dashboard');
  }
}
