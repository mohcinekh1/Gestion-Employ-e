import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SalaryService } from './salary.service';
import type { SalaryDetailDialogData } from './salary.model';

@Component({
  selector: 'app-salary-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './salary-detail.component.html',
  styleUrl: './salary-detail.component.scss'
})
export class SalaryDetailComponent {
  private readonly ref = inject(MatDialogRef<SalaryDetailComponent>);
  private readonly salaryService = inject(SalaryService);

  readonly dlg = inject<SalaryDetailDialogData>(MAT_DIALOG_DATA);

  readonly lines = this.salaryService.payslipCharges(this.dlg.salary.grossSalary);
  /** Net issu de l’API (calcul serveur), affiché comme total fiable. */
  readonly net = this.dlg.salary.netSalary;

  close(): void {
    this.ref.close();
  }

  downloadPdf(): void {
    this.salaryService.generatePdf(this.dlg.salary);
  }

  fmt(n: number): string {
    return Math.round(n).toLocaleString('fr-MA');
  }

  pct(p: number): string {
    return `${p.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} %`;
  }

  monthPretty(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}
