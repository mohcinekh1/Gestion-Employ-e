import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService } from '../employees/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { AbsenceService } from './absence.service';
import {
  ABSENCE_TYPES_UI,
  ABSENCE_TYPE_LABELS,
  type AbsenceFormDialogData,
  type AbsenceTypeUi
} from './absence.model';

@Component({
  selector: 'app-absence-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './absence-form.component.html',
  styleUrl: './absence-form.component.scss'
})
export class AbsenceFormComponent {
  private readonly ref = inject(MatDialogRef<AbsenceFormComponent, boolean>);
  private readonly dlg = inject<AbsenceFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly employeeService = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  protected readonly absenceSvc = inject(AbsenceService);

  protected readonly types = [...ABSENCE_TYPES_UI];

  protected readonly employeeLocked = computed(() => this.auth.currentUser()?.role === 'EMPLOYEE');

  /** Libellé employé quand le compte est verrouillé (évite un mat-select vide avant chargement des choix). */
  protected readonly lockedEmployeeLine = computed(() => {
    if (!this.employeeLocked()) return null as string | null;
    const uid = this.auth.currentUser()?.employeeId;
    if (uid == null) return null;
    const row = this.employeeService.employeeChoices().find((x) => x.employeeId === uid);
    if (row) return `${row.employeeName} — ${row.department}`;
    return 'Chargement…';
  });

  protected readonly remoteBalance = signal<number | null>(null);
  submitting = false;
  submitError = '';

  protected readonly workingDaysPreview = signal(0);

  protected readonly overlapError = signal(false);
  protected readonly insufficientError = signal(false);

  readonly form = this.fb.group(
    {
      employeeId: [null as number | null, Validators.required],
      type: ['CONGE_ANNUEL' as AbsenceTypeUi, Validators.required],
      startDate: [null as Date | null, Validators.required],
      endDate: [null as Date | null, Validators.required],
      reason: ['']
    },
    { validators: [AbsenceFormComponent.dateRangeValidator] }
  );

  constructor() {
    this.employeeService.ensureChoicesLoaded();
    const u = this.auth.currentUser();
    if (u?.role === 'EMPLOYEE') {
      const eid = u.employeeId ?? null;
      if (eid != null) {
        this.form.controls.employeeId.patchValue(eid);
        this.form.controls.employeeId.disable({ emitEvent: false });
      }
    }
    if (this.dlg.presetEmployeeId != null) {
      this.form.controls.employeeId.patchValue(this.dlg.presetEmployeeId);
      if (!this.employeeLocked()) {
        /* admin preset */
      }
    }

    const applyReasonValidators = (t: AbsenceTypeUi): void => {
      const r = this.form.controls.reason;
      if (t === 'EXCEPTIONNEL') r.setValidators([Validators.required]);
      else r.setValidators([]);
      r.updateValueAndValidity({ emitEvent: false });
    };
    const recompute = (): void => {
      const raw = this.form.getRawValue();
      const s = raw.startDate;
      const e = raw.endDate;
      if (s && e) {
        this.workingDaysPreview.set(AbsenceService.calculateWorkingDays(s, e));
      } else {
        this.workingDaysPreview.set(0);
      }
      this.crossCheck();
    };

    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe((t) => {
      if (t) applyReasonValidators(t);
      recompute();
    });
    applyReasonValidators(this.form.controls.type.value ?? 'CONGE_ANNUEL');

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => recompute());

    merge(
      of(null),
      this.form.controls.employeeId.valueChanges,
      this.form.controls.startDate.valueChanges,
      this.form.controls.endDate.valueChanges
    )
      .pipe(
        switchMap(() => {
          const raw = this.form.getRawValue();
          let empId = raw.employeeId;
          const cu = this.auth.currentUser();
          if ((empId == null || empId === undefined) && cu?.role === 'EMPLOYEE') {
            empId = cu.employeeId ?? null;
          }
          const sd = raw.startDate;
          if (empId == null || empId === undefined || !sd) {
            this.remoteBalance.set(null);
            return of(null);
          }
          return this.absenceSvc.getRemainingBalance(empId, sd.getFullYear());
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (b) => {
          this.remoteBalance.set(b ?? null);
          this.crossCheck();
        },
        error: () => this.remoteBalance.set(null)
      });
  }

  typeLabelPick(t: AbsenceTypeUi): string {
    return ABSENCE_TYPE_LABELS[t];
  }

  cancel(): void {
    this.ref.close(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.submitError = '';
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const u = this.auth.currentUser();
    let empId: number | null = raw.employeeId ?? null;
    if (empId == null && u?.role === 'EMPLOYEE') {
      empId = u.employeeId ?? null;
    }
    if (empId == null) {
      this.submitError =
        u?.role === 'EMPLOYEE'
          ? 'Compte non lié à une fiche employé — contactez l’administrateur.'
          : 'Sélectionnez un employé.';
      return;
    }

    const start = raw.startDate!;
    const end = raw.endDate!;

    const uiType = raw.type ?? 'CONGE_ANNUEL';
    const wd = AbsenceService.calculateWorkingDays(start, end);
    const bal = this.remoteBalance();
    if (
      AbsenceFormComponent.balanceAppliesToType(uiType) &&
      bal != null &&
      wd > bal
    ) {
      this.insufficientError.set(true);
      return;
    }
    if (this.absenceSvc.hasPendingOrApprovedOverlap(empId, start, end)) {
      this.overlapError.set(true);
      return;
    }

    this.submitting = true;
    this.absenceSvc
      .createRequest({
        employeeId: empId,
        startDate: AbsenceService.formatApiDate(start),
        endDate: AbsenceService.formatApiDate(end),
        type: this.absenceSvc.mapTypeUiToApi(raw.type ?? 'CONGE_ANNUEL'),
        reason: raw.reason?.trim() ? raw.reason.trim() : undefined
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.ref.close(true);
        },
        error: (e) => {
          this.submitting = false;
          this.submitError = e?.error?.message ?? 'Enregistrement impossible.';
        }
      });
  }

  private crossCheck(): void {
    const raw = this.form.getRawValue();
    let empId = raw.employeeId;
    const empUser = this.auth.currentUser();
    if ((empId == null || empId === undefined) && empUser?.role === 'EMPLOYEE') {
      empId = empUser.employeeId ?? null;
    }
    const s = raw.startDate;
    const e = raw.endDate;
    const uiType = raw.type ?? 'CONGE_ANNUEL';
    if (!empId || !s || !e || this.form.hasError('dateOrder')) {
      this.insufficientError.set(false);
      this.overlapError.set(false);
      return;
    }
    const wd = AbsenceService.calculateWorkingDays(s, e);
    const bal = this.remoteBalance();
    this.insufficientError.set(
      AbsenceFormComponent.balanceAppliesToType(uiType) && bal != null && wd > bal
    );
    this.overlapError.set(this.absenceSvc.hasPendingOrApprovedOverlap(empId, s, e));
  }

  /** Aligné sur le backend : quota annuel seulement pour congés payés. */
  private static balanceAppliesToType(t: AbsenceTypeUi): boolean {
    return t === 'CONGE_ANNUEL';
  }

  private static dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const s = group.get('startDate')?.value as Date | null;
    const e = group.get('endDate')?.value as Date | null;
    if (!s || !e) return null;
    if (AbsenceService.atMidnight(e) < AbsenceService.atMidnight(s)) {
      return { dateOrder: true };
    }
    return null;
  }
}
