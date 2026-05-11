import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import {
  EMPLOYEE_STATUSES_UI,
  type EmployeeFormDialogData,
  type EmployeeModel,
  type EmployeeStatusUi
} from './employee.model';
import {
  EmployeeService,
  EmployeeWriteDto,
  mapUiStatusToApi
} from './employee.service';

@Component({
  selector: 'app-employee-form',
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
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent {
  private readonly ref = inject(MatDialogRef<EmployeeFormComponent, boolean>);
  readonly dlgData = inject<EmployeeFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  protected readonly svc = inject(EmployeeService);

  readonly statuses = EMPLOYEE_STATUSES_UI;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(40)]],
    position: ['', [Validators.required, Validators.maxLength(120)]],
    departmentId: [null as number | null, Validators.required],
    hireDate: [null as Date | null, Validators.required],
    statusUi: ['Actif' as EmployeeStatusUi, Validators.required]
  });

  submitting = false;

  constructor() {
    this.svc.loadDepartments();
    const e = this.dlgData.employee;
    if (e) {
      const d = EmployeeFormComponent.isoToLocalDate(e.hireDate);
      this.form.patchValue({
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        position: e.position,
        departmentId: e.departmentId,
        hireDate: d,
        statusUi: e.status
      });
    }
    if (this.dlgData.viewOnly) {
      this.form.disable({ emitEvent: false });
    }
  }

  get title(): string {
    if (this.dlgData.viewOnly) return 'Employé';
    return this.dlgData.employee ? 'Modifier employé' : 'Nouvel employé';
  }

  cancel(): void {
    this.ref.close(false);
  }

  submit(): void {
    if (this.dlgData.viewOnly) return;
    this.form.markAllAsTouched();
    const hire = this.form.controls.hireDate.value;
    if (!hire || !(hire instanceof Date) || Number.isNaN(hire.getTime())) {
      this.form.controls.hireDate.setErrors({ required: true });
    }
    if (!this.form.valid) return;

    const v = this.form.getRawValue();
    const hireDateStr = EmployeeFormComponent.formatIso(v.hireDate as Date);
    const deptId = v.departmentId;
    if (deptId == null) return;

    const body: EmployeeWriteDto = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      phone: (v.phone ?? '').trim() || '',
      hireDate: hireDateStr,
      position: v.position.trim(),
      status: mapUiStatusToApi(v.statusUi),
      departmentId: deptId
    };

    const existing = this.dlgData.employee;
    this.submitting = true;
    const req$ = existing?.id
      ? this.svc.update(existing.id, body)
      : this.svc.create(body);

    req$.subscribe({
      next: () => {
        this.submitting = false;
        this.ref.close(true);
      },
      error: (e) => {
        this.submitting = false;
        alert(EmployeeFormComponent.readApiError(e));
      }
    });
  }

  salaryLabel(row: EmployeeModel): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(row.salary ?? 0);
  }

  static isoToLocalDate(iso: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
    if (!m) return new Date(iso);
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d);
  }

  static readApiError(e: unknown): string {
    const ex = e as { error?: unknown; message?: string };
    const b = ex?.error;
    if (typeof b === 'string' && b.trim()) return b;
    if (b && typeof b === 'object' && 'message' in b) {
      const m = (b as { message?: unknown }).message;
      if (typeof m === 'string' && m.trim()) return m;
    }
    if (typeof ex?.message === 'string' && ex.message) return ex.message;
    return 'Enregistrement impossible.';
  }

  static formatIso(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
