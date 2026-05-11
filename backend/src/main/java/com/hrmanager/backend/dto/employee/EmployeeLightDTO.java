package com.hrmanager.backend.dto.employee;

public record EmployeeLightDTO(
        Long id,
        String firstName,
        String lastName,
        String departmentName
) {
}
