package com.hrmanager.backend.dto.department;

public record DepartmentResponseDTO(
        Long id,
        String name,
        String description,
        Long managerEmployeeId
) {
}
