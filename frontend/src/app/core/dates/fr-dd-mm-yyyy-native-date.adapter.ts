import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * Même stockage que {@link NativeDateAdapter}, mais analyse les saisies en **jour / mois / année**
 * (ex. `11/05/2026` = 11 mai 2026). L’adaptateur natif utilise `Date.parse()` et interprète souvent
 * `MM/JJ/AAAA`, ce qui inversait les dates.
 */
@Injectable()
export class FrDdMmYyyyNativeDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'number') {
      return super.parse(value, parseFormat);
    }
    if (value == null || value === '') {
      return null;
    }
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }

    const s = value.trim();
    if (!s) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return super.parse(s, parseFormat);
    }

    const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/.exec(s);
    if (m) {
      const day = Number.parseInt(m[1], 10);
      const month = Number.parseInt(m[2], 10) - 1;
      let year = Number.parseInt(m[3], 10);
      if (m[3].length === 2) {
        year += year >= 70 ? 1900 : 2000;
      }
      if (
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31 &&
        Number.isFinite(year)
      ) {
        const d = this.createDate(year, month, day);
        if (
          this.isValid(d) &&
          this.getDate(d) === day &&
          this.getMonth(d) === month &&
          this.getYear(d) === year
        ) {
          return d;
        }
      }
      return this.invalid();
    }

    return super.parse(value, parseFormat);
  }
}
