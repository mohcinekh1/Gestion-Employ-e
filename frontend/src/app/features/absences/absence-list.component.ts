import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
} from '@angular/material/button-toggle';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../employees/employee.service';
import { AbsenceService } from './absence.service';
import {
  ABSENCE_TAB_OPTIONS,
  ABSENCE_TYPES_UI,
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_LABELS,
  type AbsenceTabFilter,
  type AbsenceStatusUi,
  type AbsenceModel,
  type AbsenceTypeUi
} from './absence.model';
import { AbsenceCalendarComponent } from './absence-calendar.component';
import { AbsenceFormComponent } from './absence-form.component';
import { AbsenceReviewComponent } from './absence-review.component';

const AVATAR_PALETTE = [
  '#378add',
  '#1d9e75',
  '#d85a30',
  '#ba7517',
  '#534ab7',
  '#0f6e56',
  '#993c1d',
  '#185fa5'
] as const;

@Component({
  selector: 'app-absence-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatButtonToggleModule,
    AbsenceCalendarComponent
  ],
  templateUrl: './absence-list.component.html',
  styleUrl: './absence-list.component.scss'
})
export class AbsenceListComponent {
  protected readonly svc = inject(AbsenceService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly emp = inject(EmployeeService);

  readonly TAB_OPTIONS = ABSENCE_TAB_OPTIONS;
  readonly typeOptionsUi = [...ABSENCE_TYPES_UI] as AbsenceTypeUi[];

  readonly departmentOptions = computed(() => {
    const names = new Set<string>();
    if (this.auth.hasRole(['ADMIN', 'MANAGER'])) {
      for (const d of this.emp.departments()) {
        const n = (d.name ?? '').trim();
        if (n) names.add(n);
      }
      return [...names].sort((a, b) => a.localeCompare(b, 'fr'));
    }
    for (const a of this.svc.items()) {
      const n = (a.department ?? '').trim();
      if (n && n !== '—') names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'));
  });

  readonly search = signal('');
  readonly typeFilter = signal<AbsenceTypeUi | ''>('');
  readonly deptFilter = signal('');
  readonly tabFilter = signal<AbsenceTabFilter>('TOUTES');

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly displayedColumns: string[] = [
    'employee',
    'type',
    'start',
    'end',
    'workingDays',
    'remaining',
    'status',
    'requestedAt',
    'actions'
  ];

  readonly canApprove = computed(() => this.auth.hasRole(['ADMIN', 'MANAGER']));

  readonly items = computed(() => this.svc.items());

  readonly pendingCount = computed(
    () => this.items().filter((a) => a.status === 'EN_ATTENTE').length
  );

  readonly onLeaveThisMonth = computed(() => {
    const ref = new Date();
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const ms = new Date(y, m, 1);
    const me = new Date(y, m + 1, 0);
    return this.items().filter((a) => {
      if (a.status !== 'APPROUVEE') return false;
      const sa = AbsenceService.atMidnight(a.startDate);
      const ea = AbsenceService.atMidnight(a.endDate);
      return !(ea < ms || sa > me);
    }).length;
  });

  readonly approvedThisMonth = computed(() => {
    const now = new Date();
    return this.items().filter((a) => {
      if (a.status !== 'APPROUVEE') return false;
      const r = a.requestedAt;
      return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth();
    }).length;
  });

  readonly averageDaysConsumed = computed(() => {
    const map = new Map<string, number>();
    for (const r of this.items()) {
      const k = `${r.employeeId}_${r.startDate.getFullYear()}`;
      map.set(k, r.remainingBalance);
    }
    if (!map.size) return 0;
    let sum = 0;
    for (const rem of map.values()) {
      sum += 30 - rem;
    }
    return sum / map.size;
  });

  readonly pendingSorted = computed(() =>
    [...this.items()]
      .filter((a) => a.status === 'EN_ATTENTE')
      .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime())
  );

  readonly filteredAbsences = computed(() => {
    const q = this.search().trim().toLowerCase();
    const tf = this.typeFilter();
    const df = this.deptFilter().trim();
    const tab = this.tabFilter();

    return this.items().filter((a) => {
      if (tab === 'EN_ATTENTE' && a.status !== 'EN_ATTENTE') return false;
      if (tab === 'APPROUVEE' && a.status !== 'APPROUVEE') return false;
      if (tab === 'REFUSEE' && a.status !== 'REFUSEE') return false;

      const nameOk =
        !q ||
        a.employeeName.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q);
      const typeOk = !tf || a.type === tf;
      const deptOk = !df || a.department === df;
      return nameOk && typeOk && deptOk;
    });
  });

  readonly filteredSorted = computed(() =>
    [...this.filteredAbsences()].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
  );

  readonly pagedRows = computed(() => {
    const all = this.filteredSorted();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(all.length / size) - 1);
    const idx = Math.min(this.pageIndex(), maxPage);
    const start = idx * size;
    return all.slice(start, start + size);
  });

  readonly pageLength = computed(() => this.filteredSorted().length);

  constructor() {
    if (this.auth.hasRole(['ADMIN', 'MANAGER'])) {
      this.emp.loadDepartments();
    }
    this.refresh();
  }

  refresh(): void {
    this.svc.load();
  }

  trackByAbsence(_: number, row: AbsenceModel): number {
    return row.id;
  }

  typeLabel(t: AbsenceTypeUi): string {
    return ABSENCE_TYPE_LABELS[t];
  }

  statusLabel(s: AbsenceStatusUi): string {
    return ABSENCE_STATUS_LABELS[s];
  }

  avatarColor(seed: number): string {
    const i = Math.abs(seed * 997) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[i]!;
  }

  typeBadgeClass(t: AbsenceTypeUi): string {
    switch (t) {
      case 'CONGE_ANNUEL':
        return 'badge badge--annual';
      case 'MALADIE':
        return 'badge badge--sick';
      case 'EXCEPTIONNEL':
        return 'badge badge--exc';
      default:
        return 'badge badge--other';
    }
  }

  tabLabel(tab: AbsenceTabFilter): string {
    switch (tab) {
      case 'TOUTES':
        return 'Toutes';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'APPROUVEE':
        return 'Approuvées';
      default:
        return 'Refusées';
    }
  }

  balanceBarPct(rem: number): number {
    return Math.max(0, Math.min(100, Math.round((Math.max(rem, 0) / 30) * 100)));
  }

  statusBadgeClass(st: AbsenceModel['status']): string {
    switch (st) {
      case 'EN_ATTENTE':
        return 'st st--wait';
      case 'APPROUVEE':
        return 'st st--ok';
      default:
        return 'st st--no';
    }
  }

  onTabChange(ev: MatButtonToggleChange): void {
    this.tabFilter.set(ev.value as AbsenceTabFilter);
    this.pageIndex.set(0);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  setTypeFilter(value: AbsenceTypeUi | ''): void {
    this.typeFilter.set(value);
    this.pageIndex.set(0);
  }

  setDeptFilter(value: string | undefined): void {
    this.deptFilter.set(value ?? '');
    this.pageIndex.set(0);
  }

  onPaginator(ev: PageEvent): void {
    this.pageSize.set(ev.pageSize);
    this.pageIndex.set(ev.pageIndex);
  }

  openNew(): void {
    this.dialog.open(AbsenceFormComponent, {
      width: '520px',
      disableClose: true,
      data: {}
    });
  }

  openApprove(a: AbsenceModel): void {
    this.dialog.open(AbsenceReviewComponent, {
      width: '480px',
      data: { mode: 'approve' as const, absence: a }
    });
  }

  openReject(a: AbsenceModel): void {
    this.dialog.open(AbsenceReviewComponent, {
      width: '480px',
      data: { mode: 'reject' as const, absence: a }
    });
  }

  openView(a: AbsenceModel): void {
    this.dialog.open(AbsenceReviewComponent, {
      width: '480px',
      data: { mode: 'view' as const, absence: a }
    });
  }

}
