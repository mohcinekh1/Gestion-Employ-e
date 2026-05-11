import { computed, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  EmployeeChoice,
  EmployeeDepartmentName,
  EmployeeModel,
  EmployeeStatusUi
} from './employee.model';

/** Réponse pagination Spring Data. */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface EmployeeApiDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  hireDate: string;
  position: string;
  status: string;
  departmentId: number;
  departmentName: string;
  latestSalaryAmount: number | string | null;
}

interface EmployeeLightApiDto {
  id: number;
  firstName: string;
  lastName: string;
  departmentName: string;
}

export interface DepartmentDto {
  id: number;
  name: string;
  description?: string | null;
  managerEmployeeId?: number | null;
}

export interface EmployeeWriteDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
}

function mapApiStatusToUi(s: string): EmployeeStatusUi {
  return String(s || '').toUpperCase() === 'INACTIVE' ? 'Inactif' : 'Actif';
}

function mapUiStatusToApi(s: EmployeeStatusUi): 'ACTIVE' | 'INACTIVE' {
  return s === 'Inactif' ? 'INACTIVE' : 'ACTIVE';
}

function mapEmployeeApiToModel(dto: EmployeeApiDto): EmployeeModel {
  let sal = 0;
  const raw = dto.latestSalaryAmount;
  if (raw != null && raw !== '') {
    sal =
      typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(sal)) sal = 0;
  }
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone ?? '',
    position: dto.position,
    departmentId: dto.departmentId,
    department: dto.departmentName ?? '',
    status: mapApiStatusToUi(dto.status),
    salary: sal,
    hireDate: String(dto.hireDate).slice(0, 10)
  };
}

/**
 * Liste employés depuis l’API (pagination serveur).
 * Sélecteurs légers : `/employees/simple-list` + cache.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/employees`;
  private readonly deptUrl = `${environment.apiBaseUrl}/departments`;

  private readonly _pageRows = signal<EmployeeModel[]>([]);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);

  readonly pageRows = computed(() => this._pageRows());
  readonly totalElements = computed(() => this._totalElements());
  readonly totalPages = computed(() => this._totalPages());

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly departments = signal<DepartmentDto[]>([]);
  /** Message utilisateur lorsque `/departments` échoue (réseau / droits). */
  readonly departmentsLoadError = signal<string | null>(null);

  readonly statusCounts = signal({ total: 0, active: 0, inactive: 0 });

  private choicesCacheValid = false;
  private readonly _choices = signal<EmployeeChoice[]>([]);
  readonly employeeChoices = computed(() => this._choices());

  /** Pour compat : alias de `pageRows`. */
  readonly employees = computed(() => this._pageRows());

  fetchPage(options: {
    pageIndex: number;
    pageSize: number;
    search: string;
    departmentId: number | null;
    statusUi: string;
  }): void {
    let params = new HttpParams()
      .set('page', String(options.pageIndex))
      .set('size', String(options.pageSize))
      .set('sortBy', 'lastName');

    const q = options.search.trim();
    if (q) params = params.set('search', q);
    if (options.departmentId != null && !Number.isNaN(options.departmentId)) {
      params = params.set('departmentId', String(options.departmentId));
    }
    const st = mapFilterStatusToApi(options.statusUi);
    if (st) params = params.set('status', st);

    this.loading.set(true);
    this.http.get<SpringPage<EmployeeApiDto>>(this.baseUrl, { params }).subscribe({
      next: (p) => {
        this._pageRows.set((p.content ?? []).map(mapEmployeeApiToModel));
        this._totalElements.set(p.totalElements ?? 0);
        this._totalPages.set(p.totalPages ?? 0);
        this.loading.set(false);
        this.loadError.set(null);
      },
      error: () => {
        this._pageRows.set([]);
        this._totalElements.set(0);
        this._totalPages.set(0);
        this.loading.set(false);
        this.loadError.set('Impossible de charger les employés.');
      }
    });
  }

  loadDepartments(): void {
    this.http.get<DepartmentDto[]>(this.deptUrl).subscribe({
      next: (rows) => {
        this.departments.set(rows ?? []);
        this.departmentsLoadError.set(null);
      },
      error: () => {
        this.departments.set([]);
        this.departmentsLoadError.set(
          'Impossible de charger les départements. Vérifiez votre connexion ou vos droits.'
        );
      }
    });
  }

  loadStatusCounts(): void {
    this.http
      .get<{ total: number; active: number; inactive: number }>(`${this.baseUrl}/status-counts`)
      .subscribe({
        next: (c) =>
          this.statusCounts.set({
            total: c.total ?? 0,
            active: c.active ?? 0,
            inactive: c.inactive ?? 0
          }),
        error: () => this.statusCounts.set({ total: 0, active: 0, inactive: 0 })
      });
  }

  /** Charge la liste légère pour paie / absences (cache). */
  ensureChoicesLoaded(): void {
    if (this.choicesCacheValid) return;
    this.http.get<EmployeeLightApiDto[]>(`${this.baseUrl}/simple-list`).subscribe({
      next: (list) => {
        const mapped: EmployeeChoice[] = (list ?? []).map((e) => ({
          employeeId: e.id,
          employeeName: `${e.firstName} ${e.lastName}`.trim(),
          employeeInitials: `${(e.firstName[0] ?? '').toUpperCase()}${(e.lastName[0] ?? '').toUpperCase()}`,
          department: (e.departmentName ?? '') as EmployeeDepartmentName
        }));
        this._choices.set(mapped.sort((a, b) => a.employeeId - b.employeeId));
        this.choicesCacheValid = true;
      },
      error: () => this._choices.set([])
    });
  }

  invalidateChoicesCache(): void {
    this.choicesCacheValid = false;
    this._choices.set([]);
  }

  getById(id: number): Observable<EmployeeModel> {
    return this.http
      .get<EmployeeApiDto>(`${this.baseUrl}/${id}`)
      .pipe(map(mapEmployeeApiToModel));
  }

  create(body: EmployeeWriteDto): Observable<EmployeeApiDto> {
    return this.http.post<EmployeeApiDto>(this.baseUrl, body).pipe(
      tap(() => {
        this.invalidateChoicesCache();
      })
    );
  }

  update(id: number, body: EmployeeWriteDto): Observable<EmployeeApiDto> {
    return this.http.put<EmployeeApiDto>(`${this.baseUrl}/${id}`, body).pipe(
      tap(() => {
        this.invalidateChoicesCache();
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.invalidateChoicesCache();
      })
    );
  }

  /** Export CSV fourni par le backend (UTF-8). */
  triggerServerCsvDownload(): void {
    this.http
      .get(`${this.baseUrl}/export/csv`, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) return;
          const dispo = res.headers.get('Content-Disposition');
          let name = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
          if (dispo) {
            const m = /filename=([^;]+)/i.exec(dispo);
            if (m) name = m[1].trim().replace(/^"|"$/g, '');
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
          queueMicrotask(() => URL.revokeObjectURL(url));
        },
        error: () => void 0
      });
  }

  findByIdLocal(id: number): EmployeeModel | undefined {
    return this._pageRows().find((e) => e.id === id);
  }
}

function mapFilterStatusToApi(statusUi: string): string | undefined {
  if (!statusUi) return undefined;
  if (statusUi === 'Actif') return 'ACTIVE';
  if (statusUi === 'Inactif') return 'INACTIVE';
  return undefined;
}

export { mapUiStatusToApi, mapApiStatusToUi };
