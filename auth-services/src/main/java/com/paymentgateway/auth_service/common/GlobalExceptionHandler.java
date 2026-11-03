package com.paymentgateway.auth_service.common;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, String>> handleApi(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getCode()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, String>> handleBadInput(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION_FAILED"));
    }
}
//this is a global exception handler for a Spring Boot application. It handles exceptions thrown during the processing of HTTP requests and provides appropriate responses. The class defines methods to handle ApiException, MethodArgumentNotValidException, and HttpMessageNotReadableException, returning relevant error messages and HTTP status codes in the response body.
