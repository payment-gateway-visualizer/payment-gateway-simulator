package com.paymentgateway.wallet_service.config;

import java.io.IOException;
import java.io.InputStream;
import java.security.interfaces.RSAPublicKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;

@Configuration
public class JwtKeyConfig {

    @Bean
    RSAPublicKey jwtPublicKey(@Value("${app.jwt.public-key-path}") Resource file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            return RsaKeyConverters.x509().convert(in);
        }
    }
}
// This is a Spring configuration class that defines a bean for the RSA public key used to verify JWTs. The public key is read from a file specified in the application properties (app.jwt.public-key-path). The key is converted from its X.509 format to an RSAPublicKey object using Spring Security's RsaKeyConverters.    