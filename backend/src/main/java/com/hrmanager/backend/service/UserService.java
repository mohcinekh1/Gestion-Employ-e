package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.user.UserRequestDTO;
import com.hrmanager.backend.dto.user.UserResponseDTO;
import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.Role;
import com.hrmanager.backend.exception.BadRequestException;
import com.hrmanager.backend.exception.EntityNotFoundException;
import com.hrmanager.backend.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final AppUserRepository appUserRepository;
    private final EmployeeService employeeService;
    private final PasswordEncoder passwordEncoder;

    public UserService(AppUserRepository appUserRepository, EmployeeService employeeService, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.employeeService = employeeService;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponseDTO> getAll() {
        return appUserRepository.findAll().stream().map(this::toDto).toList();
    }

    public UserResponseDTO getById(Long id) {
        return toDto(getEntityById(id));
    }

    public UserResponseDTO create(UserRequestDTO dto) {
        if (dto.password() == null || dto.password().isBlank()) {
            throw new BadRequestException("Le mot de passe est obligatoire pour un nouveau compte.");
        }
        appUserRepository.findByUsername(dto.username()).ifPresent(u -> {
            throw new BadRequestException("Username already in use");
        });
        AppUser user = new AppUser();
        apply(user, dto, true);
        return toDto(appUserRepository.save(user));
    }

    public UserResponseDTO update(Long id, UserRequestDTO dto) {
        AppUser user = getEntityById(id);
        appUserRepository.findByUsername(dto.username())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(u -> {
                    throw new BadRequestException("Username already in use");
                });
        apply(user, dto, false);
        return toDto(appUserRepository.save(user));
    }

    public void delete(Long id) {
        AppUser user = getEntityById(id);
        appUserRepository.delete(user);
    }

    public AppUser getEntityById(Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User " + id + " not found"));
    }

    private void apply(AppUser user, UserRequestDTO dto, boolean createMode) {
        user.setUsername(dto.username());
        user.setRole(Role.valueOf(dto.role().toUpperCase()));
        user.setEnabled(dto.enabled() == null || dto.enabled());
        if (createMode || (dto.password() != null && !dto.password().isBlank())) {
            user.setPasswordHash(passwordEncoder.encode(dto.password()));
        }
        if (dto.employeeId() == null) {
            user.setEmployee(null);
        } else {
            Employee employee = employeeService.getEntityById(dto.employeeId());
            user.setEmployee(employee);
        }
    }

    /**
     * Passe au rôle MANAGER le compte lié à l’employé (inscription ou compte créé par l’admin).
     */
    public UserResponseDTO promoteEmployeeToManager(Long employeeId) {
        AppUser user = appUserRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> new BadRequestException("Aucun compte utilisateur n’est lié à cet employé."));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Impossible de modifier le rôle d’un administrateur via cette action.");
        }
        user.setRole(Role.MANAGER);
        return toDto(appUserRepository.save(user));
    }

    private UserResponseDTO toDto(AppUser user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.isEnabled(),
                user.getEmployee() != null ? user.getEmployee().getId() : null
        );
    }
}
