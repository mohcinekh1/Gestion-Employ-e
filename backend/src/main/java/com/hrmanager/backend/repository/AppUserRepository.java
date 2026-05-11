package com.hrmanager.backend.repository;

import com.hrmanager.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);

    Optional<AppUser> findByEmployee_Id(Long employeeId);

    @Query("SELECT u FROM AppUser u LEFT JOIN FETCH u.employee WHERE u.username = :username")
    Optional<AppUser> findByUsernameWithEmployee(@Param("username") String username);

    /** Tous les comptes qui correspondent au login ou à l’e-mail (pour désambiguïser ADMIN vs employé). */
    @Query("""
            SELECT u FROM AppUser u
            WHERE u.username = :loginIdent
               OR (u.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(:loginIdent)))
            """)
    List<AppUser> findAllMatchingLogin(@Param("loginIdent") String loginIdent);
}
