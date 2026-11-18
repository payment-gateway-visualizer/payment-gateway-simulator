package com.paymentgateway.auth_service.config;

import java.time.Duration;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
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
    private final String redirectUri;

    public ClientSeeder(RegisteredClientRepository repository,
            @Value("${app.client.web-redirect-uri:http://localhost:3000/auth/callback}") String redirectUri) {
        this.repository = repository;
        this.redirectUri = redirectUri;
    }

    @Override
    public void run(String... args) {
        if (repository.findByClientId("pesapay-web") != null) {
            log.info("Client pesapay-web already exists: nothing to do");
            return;
        }

        RegisteredClient web = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("pesapay-web")
                .clientName("PesaPay Website")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)   // public client: no secret
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri(redirectUri)
                .scope(OidcScopes.OPENID)
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)                // PKCE is mandatory
                        .requireAuthorizationConsent(false)   // our own website: no consent screen
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(10))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .reuseRefreshTokens(false)            // each refresh token works once (rotation)
                        .build())
                .build();

        repository.save(web);
        log.info("Registered client pesapay-web");
    }
}
