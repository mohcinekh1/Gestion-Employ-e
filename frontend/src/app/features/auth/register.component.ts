import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';
import type { RegisterDepartmentDTO } from '../../core/models/auth.model';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShellComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly departments = signal<RegisterDepartmentDTO[]>([]);
  readonly loadMetaError = signal('');
  readonly submitError = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    position: ['', [Validators.required, Validators.maxLength(100)]],
    departmentId: [null as number | null, Validators.required],
    hireDate: [''],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(80)]]
  });

  ngOnInit(): void {
    this.auth.getRegisterMetadata().subscribe({
      next: (rows) => {
        this.departments.set(rows ?? []);
        this.loadMetaError.set('');
      },
      error: () => {
        this.departments.set([]);
        this.loadMetaError.set(
          'Impossible de charger les départements. Réessayez plus tard ou vérifiez que le backend est disponible.'
        );
      }
    });
  }

  submit(): void {
    this.submitError.set('');
    this.form.markAllAsTouched();
    if (!this.form.valid) return;
    if (this.departments().length === 0) {
      this.submitError.set(
        'Aucun département disponible. Démarrez le backend : des départements et un compte admin sont créés automatiquement si la base est vide.'
      );
      return;
    }

    const v = this.form.getRawValue();
    const rawDept = v.departmentId;
    const deptId =
      typeof rawDept === 'string' ? Number.parseInt(rawDept, 10) : rawDept ?? NaN;
    if (!Number.isFinite(deptId)) {
      this.submitError.set('Département invalide.');
      return;
    }

    this.loading.set(true);
    const hireTrim = (v.hireDate ?? '').trim();
    this.auth
      .register({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        email: v.email.trim().toLowerCase(),
        phone: v.phone.trim() ? v.phone.trim() : null,
        position: v.position.trim(),
        departmentId: deptId,
        hireDate: hireTrim || null,
        password: v.password
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/absences');
        },
        error: (e) => {
          this.loading.set(false);
          this.submitError.set(RegisterComponent.parseRegisterError(e));
        }
      });
  }

  private static parseRegisterError(e: unknown): string {
    const ex = e as { error?: { message?: string; errors?: Record<string, string> } };
    const b = ex?.error;
    if (!b) return 'Inscription impossible (réseau ou serveur).';
    if (b.errors && typeof b.errors === 'object') {
      const parts = Object.values(b.errors).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    if (typeof b.message === 'string' && b.message.trim()) return b.message.trim();
    return 'Inscription impossible.';
  }
}
