package com.paymentgateway.wallet_service.common;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, String>> handleApi(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getCode()));
    }
        
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class})
    ResponseEntity<Map<String, String>> handleBadInput(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION_FAILED"));
    }
}
