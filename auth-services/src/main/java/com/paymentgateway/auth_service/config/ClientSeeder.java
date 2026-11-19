package com.paymentgateway.auth_service.config;

import java.time.Duration;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.stereotype.Component;

@Component
public class ClientSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ClientSeeder.class);

    private final RegisteredClientRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String redirectUri;
    private final String webSecret;

    public ClientSeeder(RegisteredClientRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.client.web-redirect-uri:http://localhost:3000/auth/callback}") String redirectUri,
            @Value("${app.client.web-secret}") String webSecret) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.redirectUri = redirectUri;
        this.webSecret = webSecret;
    }

    @Override
    public void run(String... args) {
        RegisteredClient existing = repository.findByClientId("pesapay-web");
        String id = (existing != null) ? existing.getId() : UUID.randomUUID().toString();

        RegisteredClient web = RegisteredClient.withId(id)
                .clientId("pesapay-web")
                .clientName("PesaPay Website")
                .clientSecret(passwordEncoder.encode(webSecret))                      // stored as a hash
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri(redirectUri)                                             // the callback address
                .scope(OidcScopes.OPENID)
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .requireAuthorizationConsent(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(10))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .reuseRefreshTokens(false)
                        .build())
                .build();

        repository.save(web);
        log.info(existing == null ? "Registered client pesapay-web" : "Updated client pesapay-web");
    }
}