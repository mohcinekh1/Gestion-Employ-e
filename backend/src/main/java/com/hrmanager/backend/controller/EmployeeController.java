package com.hrmanager.backend.controller;

import com.hrmanager.backend.dto.employee.EmployeeLightDTO;
import com.hrmanager.backend.dto.employee.EmployeeRequestDTO;
import com.hrmanager.backend.dto.employee.EmployeeResponseDTO;
import com.hrmanager.backend.dto.employee.EmployeeStatusCountsDTO;
import com.hrmanager.backend.service.EmployeeService;
import com.hrmanager.backend.service.ExportService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:4200")
public class EmployeeController {
    private final EmployeeService employeeService;
    private final ExportService exportService;

    public EmployeeController(EmployeeService employeeService, ExportService exportService) {
        this.employeeService = employeeService;
        this.exportService = exportService;
    }

    @GetMapping
    public ResponseEntity<Page<EmployeeResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(
                employeeService.getAllPaged(page, size, sortBy, search, departmentId, status)
        );
    }

    /** Liste minimale pour formulaires paie et absences. */
    @GetMapping("/simple-list")
    public ResponseEntity<List<EmployeeLightDTO>> simpleList() {
        return ResponseEntity.ok(employeeService.getSimpleEmployeeList());
    }

    @GetMapping("/status-counts")
    public ResponseEntity<EmployeeStatusCountsDTO> statusCounts() {
        return ResponseEntity.ok(employeeService.getStatusCounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> update(@PathVariable Long id, @Valid @RequestBody EmployeeRequestDTO dto) {
        return ResponseEntity.ok(employeeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/excel")
    public ResponseEntity<InputStreamResource> exportExcel() {
        InputStreamResource resource = new InputStreamResource(exportService.exportEmployeesToExcel(employeeService.getAllEntities()));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<InputStreamResource> exportCsv() {
        InputStreamResource resource = new InputStreamResource(exportService.exportEmployeesToCsv(employeeService.getAllEntities()));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }
}
