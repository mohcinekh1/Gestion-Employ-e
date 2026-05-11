package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.stats.DashboardDTO;
import com.hrmanager.backend.dto.stats.DepartmentCountDTO;
import com.hrmanager.backend.dto.stats.MonthlyHireDTO;
import com.hrmanager.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class DashboardService {
    private final EmployeeRepository employeeRepository;
    private final SalaryService salaryService;
    private final AbsenceService absenceService;
    private final EmployeeService employeeService;

    public DashboardService(EmployeeRepository employeeRepository,
                            SalaryService salaryService,
                            AbsenceService absenceService,
                            EmployeeService employeeService) {
        this.employeeRepository = employeeRepository;
        this.salaryService = salaryService;
        this.absenceService = absenceService;
        this.employeeService = employeeService;
    }

    @Transactional(readOnly = true)
    public DashboardDTO getDashboardStats() {
        long totalEmployees = employeeRepository.count();
        List<DepartmentCountDTO> byDepartment = employeeRepository.countByDepartment().stream()
                .map(row -> new DepartmentCountDTO((String) row[0], (Long) row[1]))
                .toList();
        BigDecimal totalSalaryMass = salaryService.getTotalSalaryMass().setScale(2, RoundingMode.HALF_UP);
        BigDecimal averageSalary = salaryService.getAverageSalary();
        long pendingAbsences = absenceService.countPending();
        double absenceRateThisMonth = absenceService.getAbsenceRateThisMonth(totalEmployees);
        return new DashboardDTO(
                totalEmployees,
                byDepartment,
                totalSalaryMass,
                averageSalary,
                pendingAbsences,
                Math.round(absenceRateThisMonth * 100.0) / 100.0,
                employeeService.getRecentHires(5)
        );
    }

    /** Séries chronologiques pour le graphique (les mois sont remis en ordre ancien→récent). */
    @Transactional(readOnly = true)
    public List<MonthlyHireDTO> getMonthlyRecruitmentSeries(int months) {
        int m = Math.max(1, Math.min(months, 24));
        List<Object[]> rows = new ArrayList<>(employeeRepository.countHiresGroupedByMonthDesc(m));
        Collections.reverse(rows);
        return rows.stream()
                .map(arr -> new MonthlyHireDTO(
                        (String) arr[0],
                        ((Number) arr[1]).longValue(),
                        0L
                ))
                .toList();
    }
}
