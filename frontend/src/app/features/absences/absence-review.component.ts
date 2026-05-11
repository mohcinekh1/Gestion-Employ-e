import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { AbsenceService } from './absence.service';
import {
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_LABELS,
  type AbsenceReviewDialogData,
  type AbsenceModel
} from './absence.model';

@Component({
  selector: 'app-absence-review',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DatePipe
  ],
  templateUrl: './absence-review.component.html',
  styleUrl: './absence-review.component.scss'
})
export class AbsenceReviewComponent {
  private readonly ref = inject(MatDialogRef<AbsenceReviewComponent, boolean>);
  private readonly dto = inject<AbsenceReviewDialogData>(MAT_DIALOG_DATA);
  protected readonly absenceService = inject(AbsenceService);
  private readonly fb = inject(FormBuilder);

  protected readonly data = this.dto;

  protected readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(1)]]
  });

  submitting = false;
  errorMsg = '';

  protected get title(): string {
    switch (this.dto.mode) {
      case 'approve':
        return 'Approuver la demande';
      case 'reject':
        return 'Refuser la demande';
      default:
        return 'Demande d’absence';
    }
  }

  close(): void {
    this.ref.close(false);
  }

  confirmApprove(): void {
    this.errorMsg = '';
    this.submitting = true;
    this.absenceService.approve(this.dto.absence.id).subscribe({
      next: () => {
        this.submitting = false;
        this.ref.close(true);
      },
      error: (e) => {
        this.submitting = false;
        this.errorMsg = e?.error?.message ?? 'Action impossible.';
      }
    });
  }

  confirmReject(): void {
    this.rejectForm.markAllAsTouched();
    if (this.rejectForm.invalid) return;
    const reason = this.rejectForm.controls.reason.value.trim();
    if (!reason) return;
    this.errorMsg = '';
    this.submitting = true;
    this.absenceService.reject(this.dto.absence.id, reason).subscribe({
      next: () => {
        this.submitting = false;
        this.ref.close(true);
      },
      error: (e) => {
        this.submitting = false;
        this.errorMsg = e?.error?.message ?? 'Action impossible.';
      }
    });
  }

  typeLabel(a: AbsenceModel): string {
    return ABSENCE_TYPE_LABELS[a.type];
  }

  statusLabel(a: AbsenceModel): string {
    return ABSENCE_STATUS_LABELS[a.status];
  }
}
