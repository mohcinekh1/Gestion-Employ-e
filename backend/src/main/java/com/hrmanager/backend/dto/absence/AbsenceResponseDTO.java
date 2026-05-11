package com.hrmanager.backend.dto.absence;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AbsenceResponseDTO(
        Long id,
        Long employeeId,
        String employeeName,
        LocalDate startDate,
        LocalDate endDate,
        String type,
        String status,
        String reason,
        LocalDateTime createdAt,
        String approvedBy
) {
}
