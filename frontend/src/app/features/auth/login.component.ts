import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        const target = res.role === 'EMPLOYEE' ? '/absences' : '/dashboard';
        void this.router.navigateByUrl(target);
      },
      error: (err: unknown) => {
        this.errorMessage.set(this.resolveLoginError(err));
        this.loading.set(false);
      }
    });
  }

  private resolveLoginError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Impossible de joindre le serveur. Démarrez le backend (port 8080) et ng serve avec proxy /api.';
      }
      if (err.status === 401) {
        return 'Identifiants invalides. Vérifiez votre e-mail ou identifiant et votre mot de passe.';
      }
      if (err.status >= 500) {
        return 'Erreur serveur. Consultez la console du backend et redémarrez après une mise à jour.';
      }
    }
    return 'Échec de la connexion.';
  }
}
