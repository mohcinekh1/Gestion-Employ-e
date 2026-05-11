import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  AbsenceRequestItem,
  DashboardKpi,
  DepartmentDonutSlice,
  EmployeeRecentRow,
  EmployeeUiStatus,
  RecruitmentMonth
} from '../models/dashboard-ui.model';

/** Rayon du trait du donut SVG (vue 100×100). */
export const DONUT_RADIUS = 43;
export const DONUT_STROKE = 14;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

interface DepartmentCountApi {
  departmentName: string;
  count: number;
}

interface EmployeeRecentApi {
  id?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  position?: string | null;
  status?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  latestSalaryAmount?: string | number | null;
}

interface DashboardApiDto {
  totalEmployees: number;
  employeesByDepartment: DepartmentCountApi[];
  totalSalaryMass: string | number;
  averageSalary: string | number;
  pendingAbsences: number;
  absenceRateThisMonth: number;
  recentHires: EmployeeRecentApi[];
}

interface MonthlyHireApiDto {
  monthKey: string;
  hires: number;
  departures: number;
}

const DONUT_COLORS = ['#378add', '#1d9e75', '#d85a30', '#ba7517', '#534ab7', '#0f6e56', '#993c1d', '#185fa5'] as const;

function num(v: string | number | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

function formatCompactMad(n: number): string {
  const r = Math.round(n);
  if (r >= 1_000_000) {
    const k = r / 1_000_000;
    return `${k.toLocaleString('fr-MA', { maximumFractionDigits: 1 })} M`;
  }
  if (r >= 1000) {
    const k = r / 1000;
    return `${k.toLocaleString('fr-MA', { maximumFractionDigits: 1 })} k`;
  }
  return r.toLocaleString('fr-MA');
}

function monthLabelFromKey(yk: string): string {
  const s = String(yk || '').slice(0, 7);
  const [y, m] = s.split('-').map(Number);
  if (!y || !m) return s;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace(/\.$/, '');
}

function mapStatus(status: string | null | undefined): EmployeeUiStatus {
  const u = String(status || '').toUpperCase();
  if (u === 'INACTIVE') return 'Inactif';
  return 'Actif';
}

function mapRecent(e: EmployeeRecentApi): EmployeeRecentRow {
  const fn = (e.firstName ?? '').trim();
  const ln = (e.lastName ?? '').trim();
  const initials = `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || '?';
  return {
    initials,
    name: `${fn} ${ln}`.trim() || '(Sans nom)',
    title: (e.position ?? '').trim() || '—',
    department: (e.departmentName ?? '').trim() || '—',
    status: mapStatus(e.status)
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/stats`;

  readonly chartRange = signal<'6m' | '12m'>('6m');
  readonly loadError = signal<string | null>(null);

  private readonly _dashboard = signal<DashboardApiDto | null>(null);
  private readonly _recruitment = signal<MonthlyHireApiDto[]>([]);

  constructor() {
    this.refreshAll();
  }

  refreshAll(): void {
    this.refreshDashboard();
    this.refreshRecruitment();
  }

  private refreshDashboard(): void {
    this.http.get<DashboardApiDto>(`${this.base}/dashboard`).subscribe({
      next: (d) => {
        this._dashboard.set(d);
        this.loadError.set(null);
      },
      error: () => {
        this._dashboard.set(null);
        this.loadError.set('Impossible de charger le tableau de bord.');
      }
    });
  }

  private refreshRecruitment(): void {
    const months = this.chartRange() === '6m' ? 6 : 12;
    this.http.get<MonthlyHireApiDto[]>(`${this.base}/recruitment`, { params: { months: String(months) } }).subscribe({
      next: (rows) => this._recruitment.set(rows ?? []),
      error: () => this._recruitment.set([])
    });
  }

  readonly pendingAbsencesCount = computed(() => this._dashboard()?.pendingAbsences ?? 0);

  readonly recruitmentSeries = computed<RecruitmentMonth[]>(() => {
    const rows = this._recruitment();
    return rows.map((r) => ({
      monthKey: r.monthKey,
      monthLabel: monthLabelFromKey(r.monthKey),
      hires: r.hires,
      leaves: r.departures ?? 0
    }));
  });

  readonly kpis = computed<DashboardKpi[]>(() => {
    const d = this._dashboard();
    const rec = this._recruitment();
    const lastHires = rec.length ? rec[rec.length - 1]!.hires : 0;

    if (!d) {
      return [
        {
          id: 'total',
          label: 'Total employés',
          value: '—',
          trendLabel: 'Chargement…',
          trendPositive: true,
          iconKey: 'users',
          iconBg: 'var(--blue-50)',
          iconColor: 'var(--blue-600)',
          barColor: 'var(--blue-600)'
        },
        {
          id: 'presence',
          label: 'Taux d’absence (mois)',
          value: '—',
          trendLabel: '',
          trendPositive: true,
          iconKey: 'userCheck',
          iconBg: 'var(--green-50)',
          iconColor: 'var(--green-600)',
          barColor: 'var(--green-600)'
        },
        {
          id: 'pending',
          label: 'Absences en attente',
          value: '—',
          trendLabel: '',
          trendPositive: false,
          iconKey: 'calendarOff',
          iconBg: 'var(--amber-50)',
          iconColor: 'var(--amber-600)',
          barColor: 'var(--amber-600)'
        },
        {
          id: 'payroll',
          label: 'Masse salariale',
          value: '—',
          trendLabel: '',
          trendPositive: true,
          iconKey: 'cash',
          iconBg: 'var(--teal-50)',
          iconColor: 'var(--teal-600)',
          barColor: 'var(--teal-600)'
        }
      ];
    }

    const totalMass = num(d.totalSalaryMass);
    const avgSalary = num(d.averageSalary);
    const rate = d.absenceRateThisMonth ?? 0;
    const rateGood = rate <= 5;

    return [
      {
        id: 'total',
        label: 'Total employés',
        value: d.totalEmployees.toLocaleString('fr-MA'),
        trendLabel:
          lastHires > 0
            ? `+${lastHires.toLocaleString('fr-MA')} dernier mois affiché`
            : 'Aucune embauche sur la plage',
        trendPositive: lastHires >= 0,
        iconKey: 'users',
        iconBg: 'var(--blue-50)',
        iconColor: 'var(--blue-600)',
        barColor: 'var(--blue-600)'
      },
      {
        id: 'presence',
        label: 'Taux d’absence (mois)',
        value: `${rate.toLocaleString('fr-MA', { maximumFractionDigits: 2 })} %`,
        trendLabel: 'Effectif observé ce mois',
        trendPositive: rateGood,
        iconKey: 'userCheck',
        iconBg: 'var(--green-50)',
        iconColor: 'var(--green-600)',
        barColor: 'var(--green-600)'
      },
      {
        id: 'pending',
        label: 'Absences en attente',
        value: String(d.pendingAbsences),
        trendLabel: 'À traiter',
        trendPositive: d.pendingAbsences === 0,
        iconKey: 'calendarOff',
        iconBg: 'var(--amber-50)',
        iconColor: 'var(--amber-600)',
        barColor: 'var(--amber-600)'
      },
      {
        id: 'payroll',
        label: 'Masse salariale',
        value: `${formatCompactMad(totalMass)} MAD`,
        trendLabel: `Moy. ${formatCompactMad(avgSalary)} MAD`,
        trendPositive: true,
        iconKey: 'cash',
        iconBg: 'var(--teal-50)',
        iconColor: 'var(--teal-600)',
        barColor: 'var(--teal-600)'
      }
    ];
  });

  readonly departmentSlices = computed<DepartmentDonutSlice[]>(() => {
    const d = this._dashboard();
    const rows = d?.employeesByDepartment ?? [];
    return rows.map((row, i) => ({
      name: row.departmentName || '—',
      count: row.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length]!
    }));
  });

  readonly employeeTotalDonut = computed(() =>
    this.departmentSlices().reduce((acc, s) => acc + s.count, 0)
  );

  readonly recentEmployees = computed<EmployeeRecentRow[]>(() => {
    const d = this._dashboard();
    return (d?.recentHires ?? []).map(mapRecent);
  });

  readonly absenceRequests = signal<AbsenceRequestItem[]>([]);

  setChartRange(range: '6m' | '12m'): void {
    if (this.chartRange() === range) return;
    this.chartRange.set(range);
    this.refreshRecruitment();
  }
}
