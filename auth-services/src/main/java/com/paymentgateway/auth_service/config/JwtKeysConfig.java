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
}