import { Injectable, signal } from '@angular/core';

/** État du menu latéral sur petits écrans (drawer). */
@Injectable({ providedIn: 'root' })
export class ShellUiService {
  readonly mobileNavOpen = signal(false);

  openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }
}
