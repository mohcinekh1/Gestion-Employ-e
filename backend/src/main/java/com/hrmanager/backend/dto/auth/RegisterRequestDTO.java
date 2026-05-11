package com.hrmanager.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequestDTO(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Email @NotBlank @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @NotBlank @Size(max = 100) String position,
        @NotNull Long departmentId,
        LocalDate hireDate,
        @NotBlank @Size(min = 6, max = 80) String password
) {
}
