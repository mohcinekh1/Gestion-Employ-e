package com.hrmanager.backend.security;

import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.service.LoginIdentityService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final LoginIdentityService loginIdentityService;

    public UserDetailsServiceImpl(LoginIdentityService loginIdentityService) {
        this.loginIdentityService = loginIdentityService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String ident = username.strip();
        AppUser appUser = loginIdentityService.resolveMatchingUser(ident)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + ident));
        return User.builder()
                .username(appUser.getUsername())
                .password(appUser.getPasswordHash())
                .disabled(!appUser.isEnabled())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + appUser.getRole().name())))
                .build();
    }
}
