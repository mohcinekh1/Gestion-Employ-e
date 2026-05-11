package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.salary.SalaryRequestDTO;
import com.hrmanager.backend.dto.salary.SalaryResponseDTO;
import com.hrmanager.backend.entity.Department;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.Salary;
import com.hrmanager.backend.entity.SalaryType;
import com.hrmanager.backend.exception.EntityNotFoundException;
import com.hrmanager.backend.repository.SalaryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class SalaryService {
    private final SalaryRepository salaryRepository;
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;

    public SalaryService(SalaryRepository salaryRepository, EmployeeService employeeService, DepartmentService departmentService) {
        this.salaryRepository = salaryRepository;
        this.employeeService = employeeService;
        this.departmentService = departmentService;
    }

    public List<SalaryResponseDTO> getAll() {
        return salaryRepository.findAll().stream().map(this::toDto).toList();
    }

    public List<SalaryResponseDTO> getEmployeeSalaryHistory(Long employeeId) {
        Employee employee = employeeService.getEntityById(employeeId);
        return salaryRepository.findByEmployeeOrderByEffectiveDateDesc(employee).stream().map(this::toDto).toList();
    }

    public SalaryResponseDTO getLatestSalary(Long employeeId) {
        Employee employee = employeeService.getEntityById(employeeId);
        Optional<Salary> latest = salaryRepository.findTopByEmployeeOrderByEffectiveDateDesc(employee);
        return latest.map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("No salary found for employee " + employeeId));
    }

    public SalaryResponseDTO getById(Long id) {
        return toDto(getEntityById(id));
    }

    public SalaryResponseDTO create(SalaryRequestDTO dto) {
        Salary salary = new Salary();
        apply(salary, dto);
        return toDto(salaryRepository.save(salary));
    }

    public SalaryResponseDTO update(Long id, SalaryRequestDTO dto) {
        Salary salary = getEntityById(id);
        apply(salary, dto);
        return toDto(salaryRepository.save(salary));
    }

    public void delete(Long id) {
        Salary salary = getEntityById(id);
        salaryRepository.delete(salary);
    }

    public BigDecimal calculateNetSalary(BigDecimal grossSalary) {
        return grossSalary.multiply(BigDecimal.valueOf(0.78)).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getDepartmentSalaryMass(Long departmentId) {
        Department department = departmentService.getEntityById(departmentId);
        return salaryRepository.getDepartmentSalaryMass(department.getId());
    }

    public BigDecimal getTotalSalaryMass() {
        return salaryRepository.getTotalSalaryMass();
    }

    public BigDecimal getAverageSalary() {
        return BigDecimal.valueOf(salaryRepository.getAverageSalary()).setScale(2, RoundingMode.HALF_UP);
    }

    private Salary getEntityById(Long id) {
        return salaryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Salary " + id + " not found"));
    }

    private void apply(Salary salary, SalaryRequestDTO dto) {
        Employee employee = employeeService.getEntityById(dto.employeeId());
        salary.setEmployee(employee);
        salary.setAmount(dto.amount());
        salary.setEffectiveDate(dto.effectiveDate());
        salary.setType(SalaryType.valueOf(dto.type().toUpperCase()));
        salary.setCurrency(dto.currency().toUpperCase());
        salary.setNote(dto.note());
    }

    private SalaryResponseDTO toDto(Salary s) {
        BigDecimal netAmount = calculateNetSalary(s.getAmount());
        String dept = s.getEmployee().getDepartment() != null
                ? s.getEmployee().getDepartment().getName()
                : "";
        return new SalaryResponseDTO(
                s.getId(),
                s.getEmployee().getId(),
                s.getEmployee().getFirstName() + " " + s.getEmployee().getLastName(),
                s.getAmount(),
                netAmount,
                s.getEffectiveDate(),
                s.getType().name(),
                s.getCurrency(),
                s.getNote(),
                dept
        );
    }
}
