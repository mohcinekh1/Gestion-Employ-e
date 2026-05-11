package com.hrmanager.backend.dto.salary;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SalaryRequestDTO(
        @NotNull Long employeeId,
        @NotNull @DecimalMin("0.0") BigDecimal amount,
        @NotNull LocalDate effectiveDate,
        @NotBlank String type,
        @NotBlank String currency,
        String note
) {
}
