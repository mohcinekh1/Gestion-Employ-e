import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SalaryService } from './salary.service';
import { SalaryDetailComponent } from './salary-detail.component';
import { SalaryFormComponent } from './salary-form.component';
import type { SalaryModel } from './salary.model';

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
  selector: 'app-salary-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    BaseChartDirective
  ],
  templateUrl: './salary-list.component.html',
  styleUrl: './salary-list.component.scss'
})
export class SalaryListComponent {
  protected readonly svc = inject(SalaryService);
  private readonly dialog = inject(MatDialog);

  readonly searchQuery = signal('');
  readonly deptFilter = signal<string>('');

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly deptOptions = computed(() => this.svc.deptNamesInData());

  readonly displayedColumns: string[] = [
    'employee',
    'department',
    'brut',
    'cotisations',
    'net',
    'evolution',
    'type',
    'effectiveDate',
    'actions'
  ];

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const d = this.deptFilter().trim();

    const base = this.svc.rowsForSelectedMonth();

    const arr = [...base].sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'fr'));

    return arr.filter((row) => {
      const mq = !q || row.employeeName.toLowerCase().includes(q);
      const md = !d || row.department === d;
      return mq && md;
    });
  });

  readonly pagedRows = computed(() => {
    const all = this.filteredRows();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(all.length / size) - 1);
    const idx = Math.min(this.pageIndex(), maxPage);
    const start = idx * size;
    return all.slice(start, start + size);
  });

  readonly barChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const stacks = this.svc.chartBrutTotals();
    return {
      labels: stacks.map((s) => s.label),
      datasets: [
        {
          label: 'Net à payer',
          data: stacks.map((s) => s.net),
          backgroundColor: '#e2e0da',
          stack: 'paie',
          borderRadius: { bottomLeft: 4, bottomRight: 4, topLeft: 0, topRight: 0 },
          borderSkipped: false,
          maxBarThickness: 26
        },
        {
          label: 'Charges (brut − net)',
          data: stacks.map((s) => s.surplus),
          backgroundColor: '#1d9e75',
          stack: 'paie',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          maxBarThickness: 26
        }
      ]
    };
  });

  readonly barChartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const stacks = this.svc.chartBrutTotals();
    const maxStack = Math.max(1, ...stacks.map((s) => s.brut));
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: '#6b6960',
            font: { family: "'DM Sans', sans-serif", size: 11 }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: maxStack * 1.08,
          border: { display: false },
          grid: { color: 'rgba(226, 224, 218, 0.7)' },
          ticks: {
            color: '#9b9a95',
            font: { family: "'DM Mono', monospace", size: 10 },
            callback: (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
          }
        }
      }
    };
  });

  constructor() {
    effect(
      () => {
        const all = this.filteredRows();
        const size = this.pageSize();
        const maxPage = Math.max(0, Math.ceil(all.length / size) - 1);
        if (this.pageIndex() > maxPage) {
          this.pageIndex.set(maxPage);
        }
      },
      { allowSignalWrites: true }
    );
  }

  fmt(n: number): string {
    return Math.round(n).toLocaleString('fr-MA');
  }

  formatKTotal(brut: number): string {
    const k = brut / 1000;
    if (k >= 10) return `${Math.round(k)}k`;
    if (k >= 1) return `${k.toLocaleString('fr-MA', { maximumFractionDigits: 1 })}k`;
    return `${Math.round(brut).toLocaleString('fr-MA')}`;
  }

  avatarColor(row: SalaryModel): string {
    const i = Math.max(0, row.employeeId) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[i]!;
  }

  deptPillClass(dep: string): string {
    const h = [...dep].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
    const cls = ['dept-inf', 'dept-fin', 'dept-mkt', 'dept-rh'][h] ?? 'dept-inf';
    return `dept-pill ${cls}`;
  }

  typeLabel(t: string): string {
    const u = String(t || '').toUpperCase();
    if (u === 'MENSUEL') return 'Mensuel';
    if (u === 'ANNUEL') return 'Annuel';
    return t || '—';
  }

  evoClass(v: number): string {
    if (v > 0) return 'evo-pos';
    if (v === 0) return 'evo-zero';
    return 'evo-neg';
  }

  onSearch(v: string): void {
    this.searchQuery.set(v);
    this.pageIndex.set(0);
  }

  setDept(v: string): void {
    this.deptFilter.set(v ?? '');
    this.pageIndex.set(0);
  }

  onPaginate(ev: PageEvent): void {
    this.pageSize.set(ev.pageSize);
    this.pageIndex.set(ev.pageIndex);
  }

  openSlip(row: SalaryModel): void {
    this.dialog.open(SalaryDetailComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: { salary: row }
    });
  }

  openEdit(row: SalaryModel): void {
    this.dialog
      .open(SalaryFormComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { salary: row }
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) void this.svc.refreshList();
      });
  }

  createNew(): void {
    this.dialog
      .open(SalaryFormComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: {}
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) void this.svc.refreshList();
      });
  }

  download(row: SalaryModel): void {
    this.svc.generatePdf(row);
  }

  trackById(_: number, row: SalaryModel): number {
    return row.id;
  }

  netAmount(row: SalaryModel): number {
    return row.netSalary;
  }

  cotisations(row: SalaryModel): number {
    return this.svc.calculateCotisationsRow(row);
  }

  formatEffective(d: string): string {
    const s = String(d || '').slice(0, 10);
    if (s.length !== 10) return s || '—';
    const [y, m, day] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, day);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
