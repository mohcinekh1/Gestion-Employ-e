package com.hrmanager.backend.dto.absence;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AbsenceRequestDTO(
        @NotNull Long employeeId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank String type,
        String reason
) {
}
