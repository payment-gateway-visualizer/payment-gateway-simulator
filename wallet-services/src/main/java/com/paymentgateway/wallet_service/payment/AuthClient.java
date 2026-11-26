package com.paymentgateway.wallet_service.payment;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.paymentgateway.wallet_service.common.ApiException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthClient {

    private final RestClient authRestClient;

    // Forwards the merchant's own token, so the auth service decides who may ask.
    public CustomerInfo findCustomer(String identifier, String callerToken) {
        try {
            CustomerInfo customer = authRestClient.post()
                    .uri("/api/v1/users/lookup")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + callerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("identifier", identifier))
                    .retrieve()
                    .body(CustomerInfo.class);

            if (customer == null) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "USER_DIRECTORY_UNAVAILABLE");
            }
            return customer;
        } catch (HttpClientErrorException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND");
        } catch (RestClientException e) {
            log.error("Customer lookup against the auth service failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "USER_DIRECTORY_UNAVAILABLE");
        }
    }
}