package com.paymentgateway.auth_service.user;

import java.util.Locale;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.paymentgateway.auth_service.common.ApiException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Finds a CUSTOMER by email or phone, cleaned the same way registration cleans them.
    public User findCustomer(String identifier) {
        String value = identifier.trim();
        Optional<User> found = value.contains("@")
                ? userRepository.findByEmail(value.toLowerCase(Locale.ROOT))
                : userRepository.findByPhone(value.replace(" ", ""));

        // Merchants and admins can't be asked for money, so they count as "not found"
        return found
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND"));
    }
}