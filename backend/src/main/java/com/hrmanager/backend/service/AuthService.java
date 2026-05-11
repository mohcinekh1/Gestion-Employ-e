package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.auth.AuthResponseDTO;
import com.hrmanager.backend.dto.auth.LoginRequestDTO;
import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.exception.BadRequestException;
import com.hrmanager.backend.repository.AppUserRepository;
import com.hrmanager.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       AppUserRepository appUserRepository,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
        this.jwtService = jwtService;
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        String loginIdent = request.username().strip();
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginIdent, request.password()));
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        AppUser appUser = appUserRepository.findByUsernameWithEmployee(userDetails.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));
        Long empId = appUser.getEmployee() != null ? appUser.getEmployee().getId() : null;
        String token = jwtService.generateToken(userDetails, appUser.getRole().name(), empId);
        return new AuthResponseDTO(token, "Bearer", appUser.getUsername(), appUser.getRole().name(), empId);
    }
}
