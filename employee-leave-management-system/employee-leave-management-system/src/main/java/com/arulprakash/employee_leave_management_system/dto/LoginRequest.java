package com.arulprakash.employee_leave_management_system.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
