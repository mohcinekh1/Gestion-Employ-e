package com.hrmanager.backend.controller;

import com.hrmanager.backend.dto.salary.SalaryRequestDTO;
import com.hrmanager.backend.dto.salary.SalaryResponseDTO;
import com.hrmanager.backend.service.SalaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/salaries")
@CrossOrigin(origins = "http://localhost:4200")
public class SalaryController {
    private final SalaryService salaryService;

    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    @GetMapping
    public ResponseEntity<List<SalaryResponseDTO>> getAll() {
        return ResponseEntity.ok(salaryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(salaryService.getById(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SalaryResponseDTO>> getEmployeeHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryService.getEmployeeSalaryHistory(employeeId));
    }

    @GetMapping("/employee/{employeeId}/latest")
    public ResponseEntity<SalaryResponseDTO> getLatest(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryService.getLatestSalary(employeeId));
    }

    @GetMapping("/stats/department/{deptId}")
    public ResponseEntity<BigDecimal> getDepartmentSalaryMass(@PathVariable Long deptId) {
        return ResponseEntity.ok(salaryService.getDepartmentSalaryMass(deptId));
    }

    @PostMapping
    public ResponseEntity<SalaryResponseDTO> create(@Valid @RequestBody SalaryRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salaryService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryResponseDTO> update(@PathVariable Long id, @Valid @RequestBody SalaryRequestDTO dto) {
        return ResponseEntity.ok(salaryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        salaryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
