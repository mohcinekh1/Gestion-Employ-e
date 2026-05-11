package com.hrmanager.backend.dto.auth;

/** Départements exposés pendant l'inscription publique (id + libellé). */
public record RegisterDepartmentDTO(Long id, String name) {
}
