package com.hrmanager.backend.dto.employee;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        LocalDate hireDate,
        String position,
        String status,
        Long departmentId,
        String departmentName,
        BigDecimal latestSalaryAmount
) {
}
