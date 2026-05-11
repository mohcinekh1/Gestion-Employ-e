package com.hrmanager.backend.dto.department;

import jakarta.validation.constraints.NotBlank;

public record DepartmentRequestDTO(
        @NotBlank String name,
        String description,
        Long managerEmployeeId
) {
}
