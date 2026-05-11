package com.hrmanager.backend.controller;

import com.hrmanager.backend.dto.absence.AbsenceRejectRequestDTO;
import com.hrmanager.backend.dto.absence.AbsenceRequestDTO;
import com.hrmanager.backend.dto.absence.AbsenceResponseDTO;
import com.hrmanager.backend.service.AbsenceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/absences")
@CrossOrigin(origins = "http://localhost:4200")
public class AbsenceController {
    private final AbsenceService absenceService;

    public AbsenceController(AbsenceService absenceService) {
        this.absenceService = absenceService;
    }

    @GetMapping
    public ResponseEntity<List<AbsenceResponseDTO>> getAll() {
        return ResponseEntity.ok(absenceService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AbsenceResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(absenceService.getById(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AbsenceResponseDTO>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(absenceService.getByEmployee(employeeId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<AbsenceResponseDTO>> getPending() {
        return ResponseEntity.ok(absenceService.getPendingAbsences());
    }

    @PostMapping
    public ResponseEntity<AbsenceResponseDTO> create(@Valid @RequestBody AbsenceRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AbsenceResponseDTO> update(@PathVariable Long id, @Valid @RequestBody AbsenceRequestDTO dto) {
        return ResponseEntity.ok(absenceService.update(id, dto));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AbsenceResponseDTO> approve(@PathVariable Long id) {
        return ResponseEntity.ok(absenceService.approve(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AbsenceResponseDTO> reject(@PathVariable Long id, @Valid @RequestBody AbsenceRejectRequestDTO request) {
        return ResponseEntity.ok(absenceService.reject(id, request));
    }

    @GetMapping("/employee/{employeeId}/balance")
    public ResponseEntity<Integer> getBalance(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year
    ) {
        int targetYear = year == null ? java.time.LocalDate.now().getYear() : year;
        return ResponseEntity.ok(absenceService.getRemainingBalance(employeeId, targetYear));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        absenceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
