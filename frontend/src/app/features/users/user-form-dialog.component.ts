import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EmployeeService } from '../employees/employee.service';
import { environment } from '../../../environments/environment';

export interface UserFormDialogData {
  user?: {
    id: number;
    username: string;
    role: string;
    enabled: boolean;
    employeeId: number | null;
  };
}


@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss'
})
export class UserFormDialogComponent {
  private readonly ref = inject(MatDialogRef<UserFormDialogComponent, boolean>);
  readonly dlgData = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  protected readonly employeeService = inject(EmployeeService);

  readonly apiUsers = `${environment.apiBaseUrl}/users`;
  readonly roles = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;

  readonly isEdit = !!this.dlgData.user;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(80)]],
    password: [''],
    role: ['EMPLOYEE' as string, Validators.required],
    enabled: true,
    employeeId: null as number | null
  });

  saving = false;
  errorMsg = '';

  constructor() {
    this.employeeService.ensureChoicesLoaded();
    const u = this.dlgData.user;
    if (u) {
      this.form.patchValue({
        username: u.username,
        password: '',
        role: u.role,
        enabled: u.enabled,
        employeeId: u.employeeId
      });
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  title(): string {
    return this.isEdit ? 'Modifier le compte' : 'Nouveau compte';
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: Record<string, unknown> = {
      username: raw.username.trim(),
      role: raw.role,
      enabled: raw.enabled,
      employeeId: raw.employeeId
    };
    const pwd = raw.password.trim();
    if (!this.isEdit) {
      body['password'] = pwd;
    } else if (pwd !== '') {
      body['password'] = pwd;
    }
    this.saving = true;
    const req$ = this.isEdit
      ? this.http.put<unknown>(`${this.apiUsers}/${this.dlgData.user!.id}`, body)
      : this.http.post<unknown>(this.apiUsers, body);
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.ref.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving = false;
        this.errorMsg = err?.error?.message ?? 'Enregistrement impossible.';
      }
    });
  }

  cancel(): void {
    this.ref.close(false);
  }
}
