package com.paymentgateway.auth_service.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
//this is a custom exception class that extends RuntimeException. It represents an API exception with an associated HTTP status and error code. The class provides constructors to initialize the exception with the status and code, as well as getter methods to retrieve these values.   
