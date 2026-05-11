package com.hrmanager.backend.dto.employee;

public record EmployeeStatusCountsDTO(
        long total,
        long active,
        long inactive
) {
}
