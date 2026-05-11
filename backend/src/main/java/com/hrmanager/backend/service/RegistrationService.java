package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.auth.AuthResponseDTO;
import com.hrmanager.backend.dto.auth.LoginRequestDTO;
import com.hrmanager.backend.dto.auth.RegisterDepartmentDTO;
import com.hrmanager.backend.dto.auth.RegisterRequestDTO;
import com.hrmanager.backend.dto.employee.EmployeeRequestDTO;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.exception.BadRequestException;
import com.hrmanager.backend.repository.AppUserRepository;
import com.hrmanager.backend.repository.DepartmentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class RegistrationService {
    private final EmployeeService employeeService;
    private final AppUserRepository appUserRepository;
    private final AppUserProvisioningService provisioningService;
    private final AuthService authService;
    private final DepartmentRepository departmentRepository;

    public RegistrationService(EmployeeService employeeService,
                               AppUserRepository appUserRepository,
                               AppUserProvisioningService provisioningService,
                               AuthService authService,
                               DepartmentRepository departmentRepository) {
        this.employeeService = employeeService;
        this.appUserRepository = appUserRepository;
        this.provisioningService = provisioningService;
        this.authService = authService;
        this.departmentRepository = departmentRepository;
    }

    public List<RegisterDepartmentDTO> registerMetadata() {
        return departmentRepository.findAll(Sort.by("name")).stream()
                .map(d -> new RegisterDepartmentDTO(d.getId(), d.getName()))
                .toList();
    }

    public AuthResponseDTO register(RegisterRequestDTO dto) {
        String email = dto.email().trim().toLowerCase(Locale.ROOT);
        if (LoginIdentityService.isReservedLoginEmail(email)) {
            throw new BadRequestException("Cet e-mail est réservé au compte administrateur.");
        }
        appUserRepository.findByUsername(email).ifPresent(u -> {
            throw new BadRequestException("Un compte existe déjà pour cet e-mail.");
        });

        departmentRepository.findById(dto.departmentId())
                .orElseThrow(() -> new BadRequestException("Département invalide."));

        LocalDate hireDate = dto.hireDate() != null ? dto.hireDate() : LocalDate.now();
        String phone = dto.phone();
        phone = phone != null && !phone.isBlank() ? phone.trim() : null;

        EmployeeRequestDTO employeeDto = new EmployeeRequestDTO(
                dto.firstName().trim(),
                dto.lastName().trim(),
                email,
                phone,
                hireDate,
                dto.position().trim(),
                "ACTIVE",
                dto.departmentId()
        );

        Employee employee = employeeService.createEntity(employeeDto);
        provisioningService.createEmployeeAccount(employee, email, dto.password());

        return authService.login(new LoginRequestDTO(email, dto.password()));
    }
}
