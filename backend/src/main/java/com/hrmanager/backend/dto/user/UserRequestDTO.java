package com.hrmanager.backend.dto.user;

import jakarta.validation.constraints.NotBlank;

public record UserRequestDTO(
        @NotBlank String username,
        /** Obligatoire à la création ; laisser vide pour conserver le mot de passe lors d’une mise à jour. */
        String password,
        @NotBlank String role,
        Boolean enabled,
        Long employeeId
) {
}
