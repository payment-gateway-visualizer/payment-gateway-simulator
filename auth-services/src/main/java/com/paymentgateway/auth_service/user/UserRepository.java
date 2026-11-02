package com.paymentgateway.auth_service.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}

//this is a Spring Data JPA repository interface for the User entity. It provides methods to perform CRUD operations and custom queries on the users table, such as finding a user by email and checking if a user exists by email or phone.    