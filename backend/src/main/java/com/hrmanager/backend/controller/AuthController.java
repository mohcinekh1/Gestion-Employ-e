package com.hrmanager.backend.controller;

import com.hrmanager.backend.dto.auth.AuthResponseDTO;
import com.hrmanager.backend.dto.auth.LoginRequestDTO;
import com.hrmanager.backend.dto.auth.RegisterDepartmentDTO;
import com.hrmanager.backend.dto.auth.RegisterRequestDTO;
import com.hrmanager.backend.service.AuthService;
import com.hrmanager.backend.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {
    private final AuthService authService;
    private final RegistrationService registrationService;

    public AuthController(AuthService authService, RegistrationService registrationService) {
        this.authService = authService;
        this.registrationService = registrationService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/register/metadata")
    public ResponseEntity<List<RegisterDepartmentDTO>> registerMetadata() {
        return ResponseEntity.ok(registrationService.registerMetadata());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.register(request));
    }
}
