package com.hrmanager.backend.dto.employee;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EmployeeRequestDTO(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        String phone,
        @NotNull LocalDate hireDate,
        @NotBlank String position,
        @NotBlank String status,
        @NotNull Long departmentId
) {
}
