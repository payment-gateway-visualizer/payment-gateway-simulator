package com.paymentgateway.auth_service.auth;

import com.paymentgateway.auth_service.user.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @NotBlank @Size(max = 75)
    String firstName,

    @NotBlank @Size(max = 75)
    String lastName,

    @NotBlank @Email @Size(max = 255)
    String email,

    @NotBlank @Pattern(regexp = "^\\+?[0-9 ]{9,15}$")
    String phone,

    @NotNull
    Role role,

    @NotBlank @Size(min = 8, max = 72)
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$")
    String password
) {}
