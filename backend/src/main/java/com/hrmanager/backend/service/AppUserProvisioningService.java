package com.hrmanager.backend.service;

import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.Role;
import com.hrmanager.backend.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserProvisioningService {
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserProvisioningService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void createEmployeeAccount(Employee employee, String username, String rawPassword) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(Role.EMPLOYEE);
        user.setEmployee(employee);
        user.setEnabled(true);
        appUserRepository.save(user);
    }
}
