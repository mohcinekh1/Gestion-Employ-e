package com.hrmanager.backend.dto.user;

public record UserResponseDTO(
        Long id,
        String username,
        String role,
        boolean enabled,
        Long employeeId
) {
}
