import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EmployeeFormComponent } from './employee-form.component';
import { EmployeeService } from './employee.service';
import { EMPLOYEE_STATUSES_UI, type EmployeeModel } from './employee.model';

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
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent {
  protected readonly svc = inject(EmployeeService);
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly searchQuery = signal('');
  /** Identifiant service en string ou vide. */
  readonly deptFilter = signal<string>('');
  readonly statusFilter = signal<string>('');

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly viewMode = signal<'table' | 'grid'>('table');

  readonly statuses = EMPLOYEE_STATUSES_UI;

  /** Promotion vers MANAGER : réservé à l’ADMIN (aligné sur `/api/users/**`). */
  readonly isAdminUser = computed(() => this.auth.hasRole(['ADMIN']));

  readonly displayedColumns: string[] = [
    'select',
    'employee',
    'department',
    'position',
    'status',
    'salary',
    'hireDate',
    'actions'
  ];

  readonly selection = new SelectionModel<EmployeeModel>(true, []);

  readonly statsTotal = computed(() => this.svc.statusCounts().total);
  readonly statsActifs = computed(() => this.svc.statusCounts().active);
  readonly statsInactifs = computed(() => this.svc.statusCounts().inactive);
  readonly statsDeptCount = computed(() => this.svc.departments().length);

  constructor() {
    this.bootstrap();
    effect(
      () => {
        void this.searchQuery();
        void this.deptFilter();
        void this.statusFilter();
        void this.pageIndex();
        void this.pageSize();
        this.pullPage();
      },
      { allowSignalWrites: true }
    );
  }

  private bootstrap(): void {
    this.svc.loadDepartments();
    this.svc.loadStatusCounts();
    this.svc.ensureChoicesLoaded();
  }

  private pullPage(): void {
    const deptIdRaw = this.deptFilter().trim();
    const departmentId =
      deptIdRaw === '' || deptIdRaw == null ? null : Number(deptIdRaw);
    this.svc.fetchPage({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      search: this.searchQuery(),
      departmentId:
        departmentId != null && !Number.isNaN(departmentId) ? departmentId : null,
      statusUi: this.statusFilter()
    });
  }

  refreshMeta(): void {
    this.svc.loadStatusCounts();
    this.pullPage();
  }

  avatarColor(row: EmployeeModel): string {
    const i = Math.max(0, row.id) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[i]!;
  }

  initials(row: EmployeeModel): string {
    return `${row.firstName[0] ?? ''}${row.lastName[0] ?? ''}`.toUpperCase();
  }

  deptPillClass(dep: string): string {
    return `dept-pill ${this.deptBadgeSlug(dep)}`;
  }

  private deptBadgeSlug(dep: string): string {
    const h = [...dep].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
    return ['dept-a', 'dept-b', 'dept-c', 'dept-d'][h] ?? 'dept-a';
  }

  statusPillClass(status: EmployeeModel['status']): string {
    return `st-pill ${status === 'Inactif' ? 'st-inactif' : 'st-actif'}`;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
    this.selection.clear();
  }

  setDept(value: string | undefined): void {
    this.deptFilter.set(value ?? '');
    this.pageIndex.set(0);
    this.selection.clear();
  }

  setStatus(value: string | undefined): void {
    this.statusFilter.set(value ?? '');
    this.pageIndex.set(0);
    this.selection.clear();
  }

  onViewChange(ev: MatButtonToggleChange): void {
    const v = ev.value as 'table' | 'grid' | undefined;
    if (v) this.viewMode.set(v);
  }

  formatSalary(amount: number): string {
    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)} MAD`;
  }

  onPaginate(ev: PageEvent): void {
    this.pageSize.set(ev.pageSize);
    this.pageIndex.set(ev.pageIndex);
  }

  isAllSelected(): boolean {
    const rows = this.svc.pageRows();
    return rows.length > 0 && rows.every((r) => this.selection.isSelected(r));
  }

  onMasterCheck(checked: boolean): void {
    const rows = this.svc.pageRows();
    rows.forEach((r) =>
      checked ? this.selection.select(r) : this.selection.deselect(r)
    );
  }

  checkboxLabel(row?: EmployeeModel): string {
    if (!row) return `${this.isAllSelected() ? 'désélectionner' : 'sélectionner'} toutes les lignes`;
    return `${this.selection.isSelected(row) ? 'désélectionner' : 'sélectionner'} ligne ${row.email}`;
  }

  onRowCheck(row: EmployeeModel, checked: boolean): void {
    if (checked) this.selection.select(row);
    else this.selection.deselect(row);
  }

  exportCsv(): void {
    this.svc.triggerServerCsvDownload();
  }

  openCreate(): void {
    this.dialog
      .open(EmployeeFormComponent, {
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-heading',
        data: {}
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) this.refreshMeta();
      });
  }

  openView(row: EmployeeModel): void {
    this.dialog.open(EmployeeFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { employee: row, viewOnly: true }
    });
  }

  openEdit(row: EmployeeModel): void {
    this.dialog
      .open(EmployeeFormComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { employee: row }
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) this.refreshMeta();
      });
  }

  promoteToManager(row: EmployeeModel): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        data: {
          title: 'Promouvoir manager',
          message: `Attribuer le rôle MANAGER au compte utilisateur lié à ${row.firstName} ${row.lastName} ? (L’employé doit déjà posséder un compte, ex. après inscription.)`,
          confirmLabel: 'Promouvoir'
        }
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (!ok) return;
        this.http
          .post<{ role: string }>(
            `${environment.apiBaseUrl}/users/employees/${row.id}/promote-to-manager`,
            {}
          )
          .subscribe({
            next: () => this.refreshMeta(),
            error: (err: { error?: { message?: string } }) =>
              alert(err?.error?.message ?? 'Promotion impossible.')
          });
      });
  }

  confirmDelete(row: EmployeeModel): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '380px',
        maxWidth: '95vw',
        data: {
          title: 'Supprimer l’employé',
          message: `Confirmer la suppression de ${row.firstName} ${row.lastName} ?`,
          confirmLabel: 'Supprimer'
        }
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (!ok) return;
        this.selection.deselect(row);
        this.svc.delete(row.id).subscribe({
          next: () => this.refreshMeta(),
          error: () => alert('Suppression impossible.')
        });
      });
  }

  trackById(_: number, row: EmployeeModel): number {
    return row.id;
  }
}
