package com.paymentgateway.auth_service.auth;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    record RegisterRequest(String firstName, String lastName, String email,
                           String phone, String role, String password) {}

    @PostMapping("/register")
    ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        // FAKE for now: nothing is saved yet
        Map<String, Object> body = Map.of(
            "id", UUID.randomUUID().toString(),
            "email", request.email(),
            "firstName", request.firstName(),
            "role", request.role());
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