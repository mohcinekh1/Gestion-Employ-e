package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.employee.EmployeeLightDTO;
import com.hrmanager.backend.dto.employee.EmployeeRequestDTO;
import com.hrmanager.backend.dto.employee.EmployeeResponseDTO;
import com.hrmanager.backend.dto.employee.EmployeeStatusCountsDTO;
import com.hrmanager.backend.entity.Department;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.EmployeeStatus;
import com.hrmanager.backend.entity.Salary;
import com.hrmanager.backend.exception.BadRequestException;
import com.hrmanager.backend.exception.EntityNotFoundException;
import com.hrmanager.backend.repository.EmployeeRepository;
import com.hrmanager.backend.repository.SalaryRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final DepartmentService departmentService;
    private final SalaryRepository salaryRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentService departmentService,
                           SalaryRepository salaryRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentService = departmentService;
        this.salaryRepository = salaryRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getAll() {
        return employeeRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponseDTO> getAllPaged(int page,
                                                 int size,
                                                 String sortBy,
                                                 String search,
                                                 Long departmentId,
                                                 String status) {
        Specification<Employee> spec = buildFilterSpec(search, departmentId, status);
        Sort sort = Sort.by(Sort.Direction.ASC, resolveSortField(sortBy));
        Pageable pageable = PageRequest.of(page, size, sort);
        return employeeRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<Employee> getAllEntities() {
        return employeeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getRecentHires(int limit) {
        return employeeRepository.findRecentHires(PageRequest.of(0, limit)).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDTO getById(Long id) {
        return toDto(getEntityById(id));
    }

    @Transactional
    public EmployeeResponseDTO create(EmployeeRequestDTO dto) {
        return toDto(createEntity(dto));
    }

    /**
     * Création brute (pour inscription publique après double transaction employé/compte).
     */
    @Transactional
    public Employee createEntity(EmployeeRequestDTO dto) {
        employeeRepository.findByEmail(dto.email()).ifPresent(e -> {
            throw new BadRequestException("Email already in use");
        });
        Employee employee = new Employee();
        apply(employee, dto);
        return employeeRepository.save(employee);
    }

    @Transactional
    public EmployeeResponseDTO update(Long id, EmployeeRequestDTO dto) {
        Employee employee = getEntityById(id);
        employeeRepository.findByEmail(dto.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(e -> {
                    throw new BadRequestException("Email already in use");
                });
        apply(employee, dto);
        return toDto(employeeRepository.save(employee));
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = getEntityById(id);
        employeeRepository.delete(employee);
    }

    public Employee getEntityById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee " + id + " not found"));
    }

    @Transactional(readOnly = true)
    public List<EmployeeLightDTO> getSimpleEmployeeList() {
        return employeeRepository.findAll(Sort.by("lastName", "firstName")).stream()
                .map(e -> new EmployeeLightDTO(
                        e.getId(),
                        e.getFirstName(),
                        e.getLastName(),
                        e.getDepartment().getName()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeStatusCountsDTO getStatusCounts() {
        long total = employeeRepository.count();
        long active = employeeRepository.countByStatus(EmployeeStatus.ACTIVE);
        long inactive = employeeRepository.countByStatus(EmployeeStatus.INACTIVE);
        return new EmployeeStatusCountsDTO(total, active, inactive);
    }

    private Specification<Employee> buildFilterSpec(String search, Long departmentId, String statusParam) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.strip().toLowerCase(Locale.ROOT) + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }
            if (departmentId != null) {
                preds.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (statusParam != null && !statusParam.isBlank()) {
                try {
                    EmployeeStatus st = EmployeeStatus.valueOf(statusParam.trim().toUpperCase(Locale.ROOT));
                    preds.add(cb.equal(root.get("status"), st));
                } catch (IllegalArgumentException e) {
                    preds.add(cb.equal(cb.literal(1), cb.literal(0)));
                }
            }
            if (preds.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };
    }

    private String resolveSortField(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "lastName";
        }
        return switch (sortBy.trim()) {
            case "firstName", "lastName", "email", "hireDate", "position" -> sortBy.trim();
            default -> "lastName";
        };
    }

    private void apply(Employee employee, EmployeeRequestDTO dto) {
        Department department = departmentService.getEntityById(dto.departmentId());
        employee.setFirstName(dto.firstName());
        employee.setLastName(dto.lastName());
        employee.setEmail(dto.email());
        employee.setPhone(dto.phone());
        employee.setHireDate(dto.hireDate());
        employee.setPosition(dto.position());
        employee.setStatus(EmployeeStatus.valueOf(dto.status().toUpperCase()));
        employee.setDepartment(department);
    }

    public EmployeeResponseDTO toDto(Employee e) {
        BigDecimal latestSalary = salaryRepository.findTopByEmployeeOrderByEffectiveDateDesc(e)
                .map(Salary::getAmount)
                .orElse(null);
        return new EmployeeResponseDTO(
                e.getId(),
                e.getFirstName(),
                e.getLastName(),
                e.getEmail(),
                e.getPhone(),
                e.getHireDate(),
                e.getPosition(),
                e.getStatus().name(),
                e.getDepartment().getId(),
                e.getDepartment().getName(),
                latestSalary
        );
    }
}
