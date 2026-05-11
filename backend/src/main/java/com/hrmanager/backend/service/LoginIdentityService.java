package com.hrmanager.backend.service;

import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.entity.Role;
import com.hrmanager.backend.repository.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Résout le compte à authentifier quand plusieurs lignes correspondent (ex.e-mail admin utilisé aussi comme username employé).
 * Les comptes {@link Role#ADMIN} sont prioritaires.
 */
@Service
public class LoginIdentityService {

    public static final String RESERVED_ADMIN_EMAIL = "admin@hrmanager.local".toLowerCase(Locale.ROOT);

    /** Compte admin de démo créé par {@link com.hrmanager.backend.config.ReferenceDataBootstrap}. */
    public static final String DEMO_GMAIL_ADMIN = "admin@gmail.com".toLowerCase(Locale.ROOT);

    private static final Set<String> RESERVED_LOGIN_EMAILS = Set.of(
            RESERVED_ADMIN_EMAIL,
            DEMO_GMAIL_ADMIN
    );

    private final AppUserRepository appUserRepository;

    public LoginIdentityService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public static boolean isReservedLoginEmail(String email) {
        if (email == null) return false;
        return RESERVED_LOGIN_EMAILS.contains(email.trim().toLowerCase(Locale.ROOT));
    }

    /** Identifiant saisi après {@code strip()} obligatoirement. */
    public Optional<AppUser> resolveMatchingUser(String strippedLoginIdent) {
        if (strippedLoginIdent.isEmpty()) {
            return Optional.empty();
        }
        List<AppUser> matches = appUserRepository.findAllMatchingLogin(strippedLoginIdent);
        if (matches.isEmpty()) {
            return Optional.empty();
        }
        if (matches.size() == 1) {
            return Optional.of(matches.get(0));
        }
        return matches.stream().filter(u -> u.getRole() == Role.ADMIN).findFirst()
                .or(() -> Optional.of(matches.get(0)));
    }
}
