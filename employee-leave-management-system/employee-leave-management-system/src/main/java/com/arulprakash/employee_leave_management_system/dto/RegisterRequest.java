package com.arulprakash.employee_leave_management_system.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String employeeId;
    private String branch;
}
