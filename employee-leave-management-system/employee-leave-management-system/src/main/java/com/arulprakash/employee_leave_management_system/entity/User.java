package com.arulprakash.employee_leave_management_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @Column(unique = true, nullable = false)
    private String id; // e.g. EMP222

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // "employee" or "admin"

    private String branch;
    private String phone;
    
    @Column(length = 500000) // For base64 strings
    private String avatar;

    private String status = "Active";

    @Temporal(TemporalType.TIMESTAMP)
    private Date registeredDate = new Date();
}
