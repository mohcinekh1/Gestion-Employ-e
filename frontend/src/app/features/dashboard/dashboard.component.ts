import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartConfiguration } from 'chart.js';
import {
  IconCalendarOff,
  IconCash,
  IconTrendingDown,
  IconTrendingUp,
  IconUserCheck,
  IconUsers,
  TablerIconComponent
} from '@tabler/icons-angular';
import { BaseChartDirective } from 'ng2-charts';
import type { DashboardKpi } from '../../core/models/dashboard-ui.model';
import {
  DashboardService,
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  DONUT_STROKE
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, TablerIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly dashboard = inject(DashboardService);

  protected readonly DONUT_RADIUS = DONUT_RADIUS;
  protected readonly DONUT_STROKE = DONUT_STROKE;

  protected readonly iconUsers = IconUsers;
  protected readonly iconUserCheck = IconUserCheck;
  protected readonly iconCalendarOff = IconCalendarOff;
  protected readonly iconCash = IconCash;
  protected readonly iconTrendUp = IconTrendingUp;
  protected readonly iconTrendDown = IconTrendingDown;
  readonly barChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const s = this.dashboard.recruitmentSeries();
    return {
      labels: s.map((r) => r.monthLabel),
      datasets: [
        {
          label: 'Embauches',
          data: s.map((r) => r.hires),
          backgroundColor: '#378add',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'Départs',
          data: s.map((r) => r.leaves),
          backgroundColor: '#e2e0da',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          maxBarThickness: 18
        }
      ]
    };
  });

  readonly barChartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const s = this.dashboard.recruitmentSeries();
    const maxVal = Math.max(
      1,
      ...s.flatMap((r) => [r.hires, r.leaves])
    );
    const niceMax = Math.ceil(maxVal * 1.15);
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b6960',
            font: { family: "'DM Sans', sans-serif", size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          max: niceMax,
          border: { display: false },
          grid: { color: 'rgba(226, 224, 218, 0.7)' },
          ticks: {
            precision: 0,
            color: '#9b9a95',
            font: { family: "'DM Mono', monospace", size: 10 }
          }
        }
      }
    };
  });

  readonly donutSegments = computed(() => {
    const slices = this.dashboard.departmentSlices();
    const total = this.dashboard.employeeTotalDonut();
    if (!total) return [];
    let angleAccum = 0;
    const c = DONUT_CIRCUMFERENCE;
    return slices.map((slice) => {
      const frac = slice.count / total;
      const len = frac * c;
      const dashPattern = `${len} ${c - len}`;
      const rotateAttr =
        angleAccum !== 0 ? `rotate(${angleAccum} 50 50)` : undefined as string | undefined;
      angleAccum += frac * 360;
      return {
        ...slice,
        dashPattern,
        rotateAttr
      };
    });
  });

  pendingCount(): number {
    return this.dashboard.pendingAbsencesCount();
  }

  setRange(range: '6m' | '12m'): void {
    this.dashboard.setChartRange(range);
  }

  rangeSignal(): '6m' | '12m' {
    return this.dashboard.chartRange();
  }

  resolveKpiIcon(k: DashboardKpi) {
    switch (k.iconKey) {
      case 'users':
        return IconUsers;
      case 'userCheck':
        return IconUserCheck;
      case 'calendarOff':
        return IconCalendarOff;
      case 'cash':
        return IconCash;
      default:
        return IconUsers;
    }
  }

  avatarTint(seed: string): string {
    const pale = ['#e6f1fb', '#eaf3de', '#e1f5ee', '#faeeda', '#faece7'];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * 17) % 360;
    return pale[h % pale.length];
  }
}
