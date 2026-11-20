package com.paymentgateway.auth_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import com.paymentgateway.auth_service.user.UserRepository;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;

@Configuration
public class AuthorizationServerConfig {

    // The list of approved apps (table oauth2_registered_client)
    @Bean
    RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate) {
        return new JdbcRegisteredClientRepository(jdbcTemplate);
    }

    // The record of what was issued to whom (table oauth2_authorization)
    @Bean
    OAuth2AuthorizationService authorizationService(JdbcTemplate jdbcTemplate,
            RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationService(jdbcTemplate, registeredClientRepository);
    }

    // What each user agreed to (table oauth2_authorization_consent)
    @Bean
    OAuth2AuthorizationConsentService authorizationConsentService(JdbcTemplate jdbcTemplate,
            RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, registeredClientRepository);
    }

    @Bean
    OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer(UserRepository userRepository) {
        return context -> {
            String type = context.getTokenType().getValue();
            boolean isAccessToken = OAuth2TokenType.ACCESS_TOKEN.getValue().equals(type);
            boolean isIdToken = "id_token".equals(type);
            if (!isAccessToken && !isIdToken) {
                return;
            }
            userRepository.findByEmail(context.getPrincipal().getName()).ifPresent(user -> {
                context.getClaims().subject(user.getId().toString());
             if (isAccessToken) {
                context.getClaims().claim("role", user.getRole().name());
            }
            if (isIdToken) {
                context.getClaims().claim("given_name", user.getFirstName());
            }
                }
            );
        };
}}
