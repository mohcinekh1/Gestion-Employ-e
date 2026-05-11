package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.department.DepartmentRequestDTO;
import com.hrmanager.backend.dto.department.DepartmentResponseDTO;
import com.hrmanager.backend.entity.Department;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.exception.EntityNotFoundException;
import com.hrmanager.backend.repository.DepartmentRepository;
import com.hrmanager.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DepartmentService(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getAll() {
        return departmentRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponseDTO getById(Long id) {
        return toDto(getEntityById(id));
    }

    @Transactional
    public DepartmentResponseDTO create(DepartmentRequestDTO dto) {
        Department department = new Department();
        apply(department, dto);
        return toDto(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponseDTO update(Long id, DepartmentRequestDTO dto) {
        Department department = getEntityById(id);
        apply(department, dto);
        return toDto(departmentRepository.save(department));
    }

    @Transactional
    public void delete(Long id) {
        Department department = getEntityById(id);
        departmentRepository.delete(department);
    }

    @Transactional(readOnly = true)
    public Department getEntityById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department " + id + " not found"));
    }

    private void apply(Department department, DepartmentRequestDTO dto) {
        department.setName(dto.name());
        department.setDescription(dto.description());
        if (dto.managerEmployeeId() == null) {
            department.setManagerEmployee(null);
        } else {
            Employee manager = employeeRepository.findById(dto.managerEmployeeId())
                    .orElseThrow(() -> new EntityNotFoundException("Employee " + dto.managerEmployeeId() + " not found"));
            department.setManagerEmployee(manager);
        }
    }

    private DepartmentResponseDTO toDto(Department department) {
        return new DepartmentResponseDTO(
                department.getId(),
                department.getName(),
                department.getDescription(),
                department.getManagerEmployee() != null ? department.getManagerEmployee().getId() : null
        );
    }
}
