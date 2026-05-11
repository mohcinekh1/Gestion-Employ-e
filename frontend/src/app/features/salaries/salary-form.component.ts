import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../employees/employee.service';
import { SalaryService } from './salary.service';
import type { SalaryFormDialogData } from './salary.model';

@Component({
  selector: 'app-salary-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './salary-form.component.html',
  styleUrl: './salary-form.component.scss'
})
export class SalaryFormComponent {
  private readonly ref = inject(MatDialogRef<SalaryFormComponent, boolean>);
  private readonly dlgData = inject<SalaryFormDialogData>(MAT_DIALOG_DATA);
  protected readonly salaryService = inject(SalaryService);
  protected readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);

  readonly typeOptions = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'ANNUEL', label: 'Annuel' }
  ];

  readonly currencyOptions = ['MAD', 'EUR', 'USD'];

  readonly form = this.fb.nonNullable.group({
    employeeId: [null as number | null, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    effectiveDate: ['', Validators.required],
    type: ['MENSUEL', Validators.required],
    currency: ['MAD', Validators.required],
    note: ['']
  });

  saving = false;
  serverError = '';

  constructor() {
    this.employeeService.ensureChoicesLoaded();

    const e = this.dlgData.salary;
    if (e) {
      this.form.patchValue({
        employeeId: e.employeeId,
        amount: Math.round(e.grossSalary),
        effectiveDate: String(e.effectiveDate || e.month + '-01').slice(0, 10),
        type: (e.type || 'MENSUEL').toUpperCase(),
        currency: e.currency || 'MAD',
        note: e.note ?? ''
      });
      this.form.controls.employeeId.disable({ emitEvent: false });
    } else {
      const ym = this.salaryService.selectedMonthKey();
      this.form.patchValue({ effectiveDate: `${ym}-01` });
    }
  }

  get title(): string {
    return this.dlgData.salary ? 'Modifier bulletin' : 'Nouvelle fiche';
  }

  cancel(): void {
    this.ref.close(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid || this.saving) return;

    const raw = this.form.getRawValue();
    const eid =
      typeof raw.employeeId === 'number' && !Number.isNaN(raw.employeeId)
        ? raw.employeeId
        : this.dlgData.salary?.employeeId ?? null;
    if (eid == null) return;

    const payload = {
      employeeId: eid,
      amount: raw.amount,
      effectiveDate: raw.effectiveDate.slice(0, 10),
      type: String(raw.type).toUpperCase(),
      currency: String(raw.currency).toUpperCase(),
      note: raw.note?.trim() ? raw.note.trim() : null
    };

    this.saving = true;
    this.serverError = '';

    const existingId = this.dlgData.salary?.id;
    if (existingId != null) {
      this.salaryService.update(existingId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.ref.close(true);
        },
        error: () => {
          this.saving = false;
          this.serverError = 'Enregistrement impossible.';
        }
      });
    } else {
      this.salaryService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          this.ref.close(true);
        },
        error: () => {
          this.saving = false;
          this.serverError = 'Création impossible.';
        }
      });
    }
  }
}
