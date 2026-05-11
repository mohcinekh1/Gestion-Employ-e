import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <section class="wrap">
      <p class="muted">{{ line() }}</p>
    </section>
  `,
  styles: [
    `
      .wrap {
        padding: 48px 32px;
        max-width: 560px;
      }

      .muted {
        margin: 0;
        font-size: 14px;
        color: var(--ink2);
      }
    `
  ]
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly line = computed(() => {
    const title = (this.route.snapshot.data['pageTitle'] as string | undefined) ?? 'Page';
    return `${title} — Bientôt disponible.`;
  });
}
