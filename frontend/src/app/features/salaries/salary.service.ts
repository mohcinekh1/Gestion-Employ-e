import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { DeptStat, SalaryModel } from './salary.model';

function pad2(n: number): string {
  return `${n}`.padStart(2, '0');
}

function formatYmFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function parseYm(y: string): Date {
  const [yy, mm] = y.split('-').map(Number);
  return new Date(yy, mm - 1, 1);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function shortMonthLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace(/\.$/, '');
}

interface SalaryApiDto {
  id: number;
  employeeId: number;
  employeeName: string;
  grossAmount: number | string;
  netAmount: number | string;
  effectiveDate: string;
  type: string;
  currency: string;
  note?: string | null;
  departmentName: string | null;
}

function num(v: number | string): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

function initialsFrom(name: string): string {
  const p = name.split(/\s+/).filter(Boolean);
  const a = p[0]?.[0] ?? '';
  const b = p[p.length - 1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
}

function mapApiRow(d: SalaryApiDto): SalaryModel {
  const eff = String(d.effectiveDate).slice(0, 10);
  return {
    id: d.id,
    employeeId: d.employeeId,
    employeeName: d.employeeName,
    employeeInitials: initialsFrom(d.employeeName),
    department: d.departmentName ?? '',
    grossSalary: num(d.grossAmount),
    netSalary: num(d.netAmount),
    month: eff.slice(0, 7),
    effectiveDate: eff,
    type: (d.type || '').toUpperCase(),
    currency: (d.currency || 'EUR').toUpperCase(),
    note: d.note ?? '',
    evolution: 0
  };
}

function attachEvolutions(list: SalaryModel[]): SalaryModel[] {
  const byEmp = new Map<number, SalaryModel[]>();
  for (const r of list) {
    if (!byEmp.has(r.employeeId)) byEmp.set(r.employeeId, []);
    byEmp.get(r.employeeId)!.push({ ...r });
  }
  const out: SalaryModel[] = [];
  for (const arr of byEmp.values()) {
    arr.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    let prevGross = 0;
    for (const row of arr) {
      row.evolution =
        prevGross === 0
          ? 0
          : Math.round(((row.grossSalary - prevGross) / prevGross) * 1000) / 10;
      prevGross = row.grossSalary;
      out.push(row);
    }
  }
  return out.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
}

export interface SalaryWriteDto {
  employeeId: number;
  amount: number;
  effectiveDate: string;
  type: string;
  currency: string;
  note?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SalaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/salaries`;

  private readonly _salaries = signal<SalaryModel[]>([]);
  readonly loadError = signal<string | null>(null);

  readonly selectedMonth = signal<Date>(startOfMonth(new Date()));

  readonly salaries = computed(() => this._salaries());

  readonly selectedMonthKey = computed(() => formatYmFromDate(this.selectedMonth()));

  readonly selectedMonthLongLabel = computed(() => {
    const d = this.selectedMonth();
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  constructor() {
    this.refreshList();
  }

  refreshList(): void {
    this.http.get<SalaryApiDto[]>(this.baseUrl).subscribe({
      next: (rows) => {
        const mapped = (rows ?? []).map(mapApiRow);
        this._salaries.set(attachEvolutions(mapped));
        this.loadError.set(null);
      },
      error: () => {
        this._salaries.set([]);
        this.loadError.set('Impossible de charger les salaires.');
      }
    });
  }

  readonly rowsForSelectedMonth = computed(() => {
    const key = this.selectedMonthKey();
    return this._salaries().filter((s) => s.month === key);
  });

  readonly totalMassGrossForMonth = computed(() =>
    this.rowsForSelectedMonth().reduce((acc, r) => acc + r.grossSalary, 0)
  );

  readonly averageGrossRounded = computed(() => {
    const rows = this.rowsForSelectedMonth();
    if (!rows.length) return 0;
    return Math.round(this.totalMassGrossForMonth() / rows.length);
  });

  readonly totalSalaryRecords = computed(() => this._salaries().length);

  readonly deptNamesInData = computed(() => {
    const s = new Set<string>();
    for (const r of this._salaries()) {
      if (r.department) s.add(r.department);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
  });

  readonly chartSixMonths = computed(() => {
    const end = startOfMonth(this.selectedMonth());
    const keys: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = addMonths(end, -i);
      keys.push({
        key: formatYmFromDate(d),
        label: shortMonthLabel(d)
      });
    }
    return keys;
  });

  readonly chartBrutTotals = computed(() => {
    const months = this.chartSixMonths();
    const ks = months.map((x) => x.key);
    const sums = ks.map(() => ({ brut: 0, net: 0 }));
    for (const row of this._salaries()) {
      const ix = ks.indexOf(row.month);
      if (ix >= 0) {
        sums[ix].brut += row.grossSalary;
        sums[ix].net += row.netSalary;
      }
    }
    return months.map((m, i) => {
      const brut = sums[i].brut;
      const net = sums[i].net;
      return {
        key: m.key,
        label: m.label,
        brut,
        net,
        surplus: Math.max(0, brut - net)
      };
    });
  });

  readonly deptBreakdown = computed((): DeptStat[] => {
    const rows = this.rowsForSelectedMonth();
    const total = rows.reduce((a, r) => a + r.grossSalary, 0) || 1;
    const byDept = new Map<string, number>();
    for (const r of rows) {
      const d = r.department || '—';
      byDept.set(d, (byDept.get(d) ?? 0) + r.grossSalary);
    }
    return [...byDept.entries()]
      .map(([department, mass]) => ({
        department,
        mass,
        percent: Math.round((mass / total) * 10000) / 100
      }))
      .sort((a, b) => b.mass - a.mass);
  });

  prevMonth(): void {
    this.selectedMonth.update((d) => addMonths(d, -1));
  }

  nextMonth(): void {
    this.selectedMonth.update((d) => addMonths(d, 1));
  }

  setSelectedMonthYm(ym: string): void {
    this.selectedMonth.set(parseYm(ym));
  }

  calculateNetRow(s: SalaryModel): number {
    return s.netSalary;
  }

  calculateCotisationsRow(s: SalaryModel): number {
    return Math.round(Math.max(0, s.grossSalary - s.netSalary));
  }

  payslipCharges(gross: number): {
    cnss: number;
    amo: number;
    ir: number;
    totalDeductions: number;
    netRounded: number;
  } {
    const cnss = Math.round(gross * 0.0448);
    const amo = Math.round(gross * 0.0226);
    const ir = Math.round(gross * 0.1526);
    const totalDeductions = cnss + amo + ir;
    const netRounded = Math.round(gross * 0.78);
    return { cnss, amo, ir, totalDeductions, netRounded };
  }

  generatePdf(reference: SalaryModel): void {
    const slips = this.payslipCharges(reference.grossSalary);
    void slips;
    alert(`PDF simulation — ${reference.employeeName}\nContrat brut : ${reference.grossSalary.toLocaleString('fr-MA')}`);
  }

  create(payload: SalaryWriteDto) {
    return this.http.post<SalaryApiDto>(this.baseUrl, payload).pipe(
      tap(() => this.refreshList())
    );
  }

  update(id: number, payload: SalaryWriteDto) {
    return this.http.put<SalaryApiDto>(`${this.baseUrl}/${id}`, payload).pipe(
      tap(() => this.refreshList())
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.refreshList())
    );
  }
}
