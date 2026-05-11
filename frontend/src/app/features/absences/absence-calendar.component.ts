import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AbsenceService } from './absence.service';
import type { AbsenceModel, AbsenceTypeUi } from './absence.model';

interface DayCell {
  day: number;
  isoKey: string;
}

@Component({
  selector: 'app-absence-calendar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './absence-calendar.component.html',
  styleUrl: './absence-calendar.component.scss'
})
export class AbsenceCalendarComponent {
  protected readonly svc = inject(AbsenceService);

  /** Premier jour du mois affiché. */
  readonly selectedMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  readonly weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  readonly monthTitle = computed(() => {
    const d = this.selectedMonth();
    return d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  });

  readonly gridCells = computed(() => {
    const first = this.selectedMonth();
    const y = first.getFullYear();
    const m = first.getMonth();
    const jsFirstWeekday = new Date(y, m, 1).getDay(); // 0 Dim … 6 Sam
    const offsetMon0 = (jsFirstWeekday + 6) % 7; // Lun = 0
    const lastDay = new Date(y, m + 1, 0).getDate();
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < offsetMon0; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, isoKey: key });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    while (cells.length < 42) cells.push(null);
    return cells;
  });

  prevMonth(): void {
    const d = this.selectedMonth();
    this.selectedMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.selectedMonth();
    this.selectedMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  spansApproved(day: DayCell): AbsenceModel[] {
    const d = AbsenceCalendarComponent.parseIsoKey(day.isoKey);
    return this.svc.items().filter((a) => {
      if (a.status !== 'APPROUVEE') return false;
      const sa = AbsenceService.atMidnight(a.startDate);
      const ea = AbsenceService.atMidnight(a.endDate);
      return !(d < sa || d > ea);
    });
  }

  isToday(day: DayCell): boolean {
    const n = new Date();
    const d = AbsenceCalendarComponent.parseIsoKey(day.isoKey);
    return (
      d.getFullYear() === n.getFullYear() &&
      d.getMonth() === n.getMonth() &&
      d.getDate() === n.getDate()
    );
  }

  typeShort(type: AbsenceTypeUi): string {
    const map: Record<AbsenceTypeUi, string> = {
      CONGE_ANNUEL: 'CA',
      MALADIE: 'Mal',
      EXCEPTIONNEL: 'Exc',
      AUTRE: 'Aut'
    };
    return map[type];
  }

  badgeClass(type: AbsenceTypeUi): string {
    switch (type) {
      case 'CONGE_ANNUEL':
        return 'seg seg--annual';
      case 'MALADIE':
        return 'seg seg--sick';
      case 'EXCEPTIONNEL':
        return 'seg seg--exc';
      default:
        return 'seg seg--other';
    }
  }

  private static parseIsoKey(isoKey: string): Date {
    const [y, m, d] = isoKey.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
}
