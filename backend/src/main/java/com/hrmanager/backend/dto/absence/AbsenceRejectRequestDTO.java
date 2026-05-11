package com.hrmanager.backend.dto.absence;

import jakarta.validation.constraints.NotBlank;

public record AbsenceRejectRequestDTO(
        @NotBlank String reason
) {
}
