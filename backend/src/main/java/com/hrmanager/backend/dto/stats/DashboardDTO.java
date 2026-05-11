package com.hrmanager.backend.dto.stats;

import com.hrmanager.backend.dto.employee.EmployeeResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
        long totalEmployees,
        List<DepartmentCountDTO> employeesByDepartment,
        BigDecimal totalSalaryMass,
        BigDecimal averageSalary,
        long pendingAbsences,
        double absenceRateThisMonth,
        List<EmployeeResponseDTO> recentHires
) {
}
