import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../employees/employee.service';
import type {
  AbsenceApiDto,
  AbsenceModel,
  AbsenceStatusUi,
  AbsenceTypeUi
} from './absence.model';
import { environment } from '../../../environments/environment';

/** Requête création côté backend. */
export interface AbsenceApiRequest {
  employeeId: number;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  private readonly http = inject(HttpClient);
  private readonly employeeService = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/absences`;

  private readonly _items = signal<AbsenceModel[]>([]);
  /** Nombre de demandes en attente (ADMIN / MANAGER uniquement ; pour badge menu). */
  private readonly _managerPendingCount = signal(0);

  readonly items = computed(() => this._items());

  readonly managerPendingCount = computed(() => this._managerPendingCount());

  /** À appeler au chargement app / après actions de validation RH. */
  refreshManagerPendingBadge(): void {
    if (!this.auth.hasRole(['ADMIN', 'MANAGER'])) {
      this._managerPendingCount.set(0);
      return;
    }
    this.http.get<AbsenceApiDto[]>(`${this.apiUrl}/pending`).subscribe({
      next: (rows) => this._managerPendingCount.set(rows?.length ?? 0),
      error: () => this._managerPendingCount.set(0)
    });
  }

  load(): void {
    this.http.get<AbsenceApiDto[]>(this.apiUrl).subscribe({
      next: (rows) => {
        const mapped = rows.map((dto) => this.mapDto(dto));
        const withBalance = AbsenceService.attachRemainingBalances(mapped).sort((a, b) => b.id - a.id);
        this._items.set(withBalance);
      },
      error: () => this._items.set([])
    });
    this.refreshManagerPendingBadge();
  }

  createRequest(payload: AbsenceApiRequest): Observable<AbsenceApiDto> {
    return this.http.post<AbsenceApiDto>(this.apiUrl, payload).pipe(tap(() => this.load()));
  }

  /** Backend : `PUT /api/absences/{id}/approve`. */
  approve(id: number): Observable<AbsenceApiDto> {
    return this.http.put<AbsenceApiDto>(`${this.apiUrl}/${id}/approve`, {}).pipe(tap(() => this.load()));
  }

  /** Backend : `PUT /api/absences/{id}/reject` + corps `{ reason }`. */
  reject(id: number, reason: string): Observable<AbsenceApiDto> {
    return this.http.put<AbsenceApiDto>(`${this.apiUrl}/${id}/reject`, { reason }).pipe(tap(() => this.load()));
  }

  /** Solde restant (jours) pour l’employé et l’année — API serveur. */
  getRemainingBalance(employeeId: number, year?: number): Observable<number> {
    const y = year ?? new Date().getFullYear();
    return this.http.get<number>(`${this.apiUrl}/employee/${employeeId}/balance`, {
      params: { year: String(y) }
    });
  }

  static calculateWorkingDays(start: Date, end: Date): number {
    const a = AbsenceService.atMidnight(start);
    const b = AbsenceService.atMidnight(end);
    if (b < a) return 0;
    let n = 0;
    const cur = new Date(a);
    while (cur <= b) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) n++;
      cur.setDate(cur.getDate() + 1);
    }
    return n;
  }

  getRemainingBalanceLocal(employeeId: number, year: number): number {
    const consumed = this.approvedConsumedDays(employeeId, year);
    return Math.max(0, 30 - consumed);
  }

  approvedConsumedDays(employeeId: number, year: number): number {
    return this._items()
      .filter(
        (x) =>
          x.employeeId === employeeId &&
          x.status === 'APPROUVEE' &&
          x.startDate.getFullYear() === year
      )
      .reduce((sum, x) => sum + x.workingDays, 0);
  }

  /**
   * Chevauchement avec une absence déjà approuvée (contrat spec).
   * Pour la validation « plein pot » cohérente avec le backend, utiliser aussi `hasPendingOrApprovedOverlap`.
   */
  checkOverlap(employeeId: number, start: Date, end: Date, excludeId?: number): boolean {
    return this.hasApprovedOverlap(employeeId, start, end, excludeId);
  }

  /** Aligné sur la règle métier serveur : EN_ATTENTE + APPROUVE. */
  hasPendingOrApprovedOverlap(
    employeeId: number,
    start: Date,
    end: Date,
    excludeId?: number
  ): boolean {
    const sa = AbsenceService.atMidnight(start);
    const ea = AbsenceService.atMidnight(end);
    return this._items().some((a) => {
      if (excludeId != null && a.id === excludeId) return false;
      if (a.employeeId !== employeeId) return false;
      if (a.status !== 'APPROUVEE' && a.status !== 'EN_ATTENTE') return false;
      const sb = AbsenceService.atMidnight(a.startDate);
      const eb = AbsenceService.atMidnight(a.endDate);
      return !(ea < sb || eb < sa);
    });
  }

  private hasApprovedOverlap(
    employeeId: number,
    start: Date,
    end: Date,
    excludeId?: number
  ): boolean {
    const sa = AbsenceService.atMidnight(start);
    const ea = AbsenceService.atMidnight(end);
    return this._items().some((a) => {
      if (excludeId != null && a.id === excludeId) return false;
      if (a.employeeId !== employeeId) return false;
      if (a.status !== 'APPROUVEE') return false;
      const sb = AbsenceService.atMidnight(a.startDate);
      const eb = AbsenceService.atMidnight(a.endDate);
      return !(ea < sb || eb < sa);
    });
  }

  mapTypeUiToApi(type: AbsenceTypeUi): string {
    switch (type) {
      case 'CONGE_ANNUEL':
        return 'CONGE_PAYE';
      case 'MALADIE':
        return 'MALADIE';
      case 'EXCEPTIONNEL':
        return 'SANS_SOLDE';
      case 'AUTRE':
        return 'AUTRE';
      default:
        return 'AUTRE';
    }
  }

  private mapDto(dto: AbsenceApiDto): AbsenceModel {
    const emp = this.employeeService.employeeChoices().find((e) => e.employeeId === dto.employeeId);
    const fromName = dto.employeeName
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
    const initials = emp?.employeeInitials ?? (fromName.length > 0 ? fromName : '—');
    const department = emp?.department ?? '—';
    const start = AbsenceService.parseIsoDate(dto.startDate);
    const end = AbsenceService.parseIsoDate(dto.endDate);
    const working = AbsenceService.calculateWorkingDays(start, end);
    const requestedAt =
      dto.createdAt != null && dto.createdAt !== ''
        ? new Date(dto.createdAt)
        : AbsenceService.parseIsoDate(dto.startDate);

    const st = AbsenceService.mapStatusApiToUi(dto.status);
    return {
      id: dto.id,
      employeeId: dto.employeeId,
      employeeName: dto.employeeName,
      employeeInitials: initials,
      department,
      type: AbsenceService.mapTypeApiToUi(dto.type),
      startDate: start,
      endDate: end,
      workingDays: working,
      remainingBalance: 0,
      status: st,
      requestedAt,
      approvedBy: st === 'APPROUVEE' && dto.approvedBy ? dto.approvedBy : undefined,
      rejectionReason:
        st === 'REFUSEE' && dto.reason != null && dto.reason !== '' ? dto.reason : undefined
    };
  }

  private static attachRemainingBalances(rows: AbsenceModel[]): AbsenceModel[] {
    const consumed = new Map<string, number>();
    for (const r of rows) {
      if (r.status !== 'APPROUVEE') continue;
      const y = r.startDate.getFullYear();
      const k = `${r.employeeId}_${y}`;
      consumed.set(k, (consumed.get(k) ?? 0) + r.workingDays);
    }
    return rows.map((r) => {
      const y = r.startDate.getFullYear();
      const used = consumed.get(`${r.employeeId}_${y}`) ?? 0;
      return { ...r, remainingBalance: Math.max(0, 30 - used) };
    });
  }

  private static mapTypeApiToUi(t: string): AbsenceTypeUi {
    switch ((t || '').toUpperCase()) {
      case 'CONGE_PAYE':
        return 'CONGE_ANNUEL';
      case 'MALADIE':
        return 'MALADIE';
      case 'SANS_SOLDE':
        return 'EXCEPTIONNEL';
      case 'AUTRE':
        return 'AUTRE';
      default:
        return 'AUTRE';
    }
  }

  private static mapStatusApiToUi(s: string): AbsenceStatusUi {
    switch ((s || '').toUpperCase()) {
      case 'APPROUVE':
      case 'APPROUVÉ':
        return 'APPROUVEE';
      case 'REFUSE':
      case 'REFUSÉ':
        return 'REFUSEE';
      default:
        return 'EN_ATTENTE';
    }
  }

  private static parseIsoDate(iso: string): Date {
    const [y, m, d] = iso.split('T')[0].split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }

  static atMidnight(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** `YYYY-MM-DD` en date locale (évite décal UTC). */
  static formatApiDate(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
}
