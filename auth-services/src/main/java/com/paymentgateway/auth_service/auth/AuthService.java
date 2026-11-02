package com.paymentgateway.auth_service.auth;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.paymentgateway.auth_service.common.ApiException;
import com.paymentgateway.auth_service.user.Role;
import com.paymentgateway.auth_service.user.User;
import com.paymentgateway.auth_service.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request) {
        // Nobody can make themselves an admin through the public form
        if (request.role() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED");
        }

        // Clean the data so "Jane@X.com" and "jane@x.com" are the same person
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String phone = request.phone().replace(" ", "");

        // Is it already taken?
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_TAKEN");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_TAKEN");
        }

        // Scramble the password, build the user, save it
        String passwordHash = passwordEncoder.encode(request.password());
        User user = new User(email, phone, passwordHash,
                request.firstName().trim(), request.lastName().trim(), request.role());
        return userRepository.save(user);
    }
}
//this is a Spring service class that handles user registration. It validates the registration request, checks for existing users, hashes the password, and saves the new user to the database. It also ensures that users cannot register as admins through the public form.       
