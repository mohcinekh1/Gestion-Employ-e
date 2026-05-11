package com.hrmanager.backend.dto.salary;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SalaryResponseDTO(
        Long id,
        Long employeeId,
        String employeeName,
        BigDecimal grossAmount,
        BigDecimal netAmount,
        LocalDate effectiveDate,
        String type,
        String currency,
        String note,
        String departmentName
) {
}
