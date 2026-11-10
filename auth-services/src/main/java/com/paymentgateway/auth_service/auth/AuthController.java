package com.paymentgateway.auth_service.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.paymentgateway.auth_service.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(RegisterResponse.from(user));
    }

    @PostMapping("/login")
    ResponseEntity<LoginResult> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    ResponseEntity<MeResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(new MeResponse(jwt.getSubject(), jwt.getClaimAsString("role")));
    }
}
// this is a Spring Boot REST controller that handles user authentication
// requests. It provides endpoints for user registration and login, returning
// appropriate responses based on the request data.