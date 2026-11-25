package com.paymentgateway.auth_service.config;

import java.io.IOException;
import java.io.InputStream;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

@Configuration
public class JwtKeysConfig {

    @Bean
    RSAPrivateKey jwtPrivateKey(@Value("${app.jwt.private-key-path}") Resource file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            return RsaKeyConverters.pkcs8().convert(in);
        }
    }

    @Bean
    RSAPublicKey jwtPublicKey(@Value("${app.jwt.public-key-path}") Resource file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            return RsaKeyConverters.x509().convert(in);
        }
    }

    // The signing keys, in the form the authorization server expects.
    // Same files and same key id on every start and in every copy of auth.
    @Bean
    JWKSource<SecurityContext> jwkSource(RSAPublicKey publicKey, RSAPrivateKey privateKey,
            @Value("${app.jwt.key-id:pesapay-key-1}") String keyId) {
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(keyId)
                .build();
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }
}