import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { UserFormDialogComponent } from './user-form-dialog.component';

interface UserDto {
  id: number;
  username: string;
  role: string;
  enabled: boolean;
  employeeId: number | null;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  readonly rows = signal<UserDto[]>([]);
  readonly loadError = signal('');
  readonly displayedColumns = ['username', 'role', 'enabled', 'employeeId', 'actions'];

  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.http.get<UserDto[]>(this.apiUrl).subscribe({
      next: (r) => {
        this.rows.set(r ?? []);
        this.loadError.set('');
      },
      error: () => this.loadError.set('Impossible de charger les comptes utilisateurs.')
    });
  }

  openCreate(): void {
    this.dialog
      .open(UserFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        data: {}
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) this.reload();
      });
  }

  openEdit(row: UserDto): void {
    this.dialog
      .open(UserFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        data: { user: row }
      })
      .afterClosed()
      .subscribe((ok: unknown) => {
        if (ok) this.reload();
      });
  }
}
