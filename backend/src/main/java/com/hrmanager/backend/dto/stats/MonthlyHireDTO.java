package com.hrmanager.backend.dto.stats;

/** Point de série pour le graphique embauches (YYYY-MM). Les départs peuvent rester à 0 tant qu’il n’y a pas de source métier. */
public record MonthlyHireDTO(
        String monthKey,
        long hires,
        long departures
) {
}
