package com.hrmanager.backend.config;

import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.entity.Department;
import com.hrmanager.backend.entity.Role;
import com.hrmanager.backend.repository.AppUserRepository;
import com.hrmanager.backend.repository.DepartmentRepository;
import com.hrmanager.backend.service.LoginIdentityService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Données minimales si la base est vide : départements (pour l’inscription) et compte administrateur.
 * <p>
 * Identifiants par défaut : {@code admin} / {@code Admin123!} et compte démo {@link LoginIdentityService#DEMO_GMAIL_ADMIN} / {@code 123456789}.
 */
@Component
public class ReferenceDataBootstrap implements ApplicationRunner {

    private static final String DEFAULT_ADMIN_USERNAME = "admin";
    private static final String DEFAULT_ADMIN_EMAIL = LoginIdentityService.RESERVED_ADMIN_EMAIL;
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin123!";

    private static final String GMAIL_DEMO_ADMIN = LoginIdentityService.DEMO_GMAIL_ADMIN;
    private static final String GMAIL_DEMO_PASSWORD = "123456789";

    private final DepartmentRepository departmentRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${hr.bootstrap.reset-admin-password:false}")
    private boolean resetAdminPassword;

    /** Si true, réaligne l’e-mail du compte {@code admin} / ADMIN sur {@link LoginIdentityService#RESERVED_ADMIN_EMAIL} (corrige typos du type .com). */
    @Value("${hr.bootstrap.sync-admin-email:true}")
    private boolean syncAdminEmail;

    /** Réencode le mot de passe du compte admin@gmail.com (ADMIN) comme {@link #GMAIL_DEMO_PASSWORD}. */
    @Value("${hr.bootstrap.reset-gmail-demo-admin-password:false}")
    private boolean resetGmailDemoAdminPassword;

    public ReferenceDataBootstrap(DepartmentRepository departmentRepository,
                                  AppUserRepository appUserRepository,
                                  PasswordEncoder passwordEncoder) {
        this.departmentRepository = departmentRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedDepartmentsIfEmpty();
        seedAdminIfAbsent();
        seedGmailDemoAdminIfAbsent();
    }

    private void seedDepartmentsIfEmpty() {
        if (departmentRepository.count() > 0) {
            return;
        }
        persistDepartment("Direction", "Direction générale");
        persistDepartment("Ressources humaines", "Service RH");
        persistDepartment("Informatique", "DSI / développement");
        persistDepartment("Finance", "Comptabilité et finances");
        persistDepartment("Marketing", "Communication et marketing");
    }

    private void persistDepartment(String name, String description) {
        Department d = new Department();
        d.setName(name);
        d.setDescription(description);
        departmentRepository.save(d);
    }

    private void seedAdminIfAbsent() {
        appUserRepository.findByUsername(DEFAULT_ADMIN_USERNAME).ifPresentOrElse(
                existing -> patchAdminEmailIfMissing(existing),
                this::persistNewAdminUser
        );
    }

    private void patchAdminEmailIfMissing(AppUser existing) {
        if (!Role.ADMIN.equals(existing.getRole()) || !DEFAULT_ADMIN_USERNAME.equals(existing.getUsername())) {
            return;
        }
        boolean dirty = false;
        if (syncAdminEmail) {
            String cur = existing.getEmail();
            if (cur == null || cur.isBlank()
                    || !DEFAULT_ADMIN_EMAIL.equals(cur.trim().toLowerCase(Locale.ROOT))) {
                existing.setEmail(DEFAULT_ADMIN_EMAIL);
                dirty = true;
            }
        } else if (existing.getEmail() == null || existing.getEmail().isBlank()) {
            existing.setEmail(DEFAULT_ADMIN_EMAIL);
            dirty = true;
        }
        if (resetAdminPassword) {
            existing.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            dirty = true;
        }
        if (dirty) {
            appUserRepository.save(existing);
        }
    }

    private void persistNewAdminUser() {
        AppUser admin = new AppUser();
        admin.setUsername(DEFAULT_ADMIN_USERNAME);
        admin.setEmail(DEFAULT_ADMIN_EMAIL);
        admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        appUserRepository.save(admin);
    }

    private void seedGmailDemoAdminIfAbsent() {
        appUserRepository.findByUsername(GMAIL_DEMO_ADMIN).ifPresentOrElse(
                this::patchGmailDemoAdminIfConfigured,
                this::persistNewGmailDemoAdmin
        );
    }

    private void persistNewGmailDemoAdmin() {
        AppUser u = new AppUser();
        u.setUsername(GMAIL_DEMO_ADMIN);
        u.setEmail(GMAIL_DEMO_ADMIN);
        u.setPasswordHash(passwordEncoder.encode(GMAIL_DEMO_PASSWORD));
        u.setRole(Role.ADMIN);
        u.setEnabled(true);
        appUserRepository.save(u);
    }

    private void patchGmailDemoAdminIfConfigured(AppUser existing) {
        if (!Role.ADMIN.equals(existing.getRole())) {
            return;
        }
        boolean dirty = false;
        if (resetGmailDemoAdminPassword) {
            existing.setPasswordHash(passwordEncoder.encode(GMAIL_DEMO_PASSWORD));
            dirty = true;
        }
        if (existing.getEmail() == null || existing.getEmail().isBlank()
                || !GMAIL_DEMO_ADMIN.equals(existing.getEmail().trim().toLowerCase(Locale.ROOT))) {
            existing.setEmail(GMAIL_DEMO_ADMIN);
            dirty = true;
        }
        if (dirty) {
            appUserRepository.save(existing);
        }
    }
}
