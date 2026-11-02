package com.paymentgateway.auth_service.auth;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.paymentgateway.auth_service.user.User;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }
                         

      @PostMapping("/register")
    ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        Map<String, Object> body = Map.of(
            "id", user.getId().toString(),
            "email", user.getEmail(),
            "firstName", user.getFirstName(),
            "role", user.getRole().name());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
    record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        // FAKE for now: any password works, except the word "wrong"
        if ("wrong".equals(request.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "INVALID_CREDENTIALS"));
        }
        Map<String, Object> body = Map.of(
            "token", "fake-jwt-token",
            "role", "CUSTOMER",
            "firstName", "Jane",
            "expiresInSeconds", 3600);
        return ResponseEntity.ok(body);
    }
}
//this is a Spring Boot REST controller that handles user authentication requests. It provides endpoints for user registration and login, returning appropriate responses based on the request data.    