package com.hrmanager.backend.dto.auth;

public record AuthResponseDTO(
        String token,
        String tokenType,
        String username,
        String role,
        Long employeeId
) {
}
