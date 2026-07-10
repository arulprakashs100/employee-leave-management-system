package com.arulprakash.employee_leave_management_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "leave_requests")
@Data
public class LeaveRequest {
    @Id
    private String id = UUID.randomUUID().toString(); // e.g. LV-504

    @Column(nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String employeeName;

    @Column(nullable = false)
    private String leaveType;

    @Column(nullable = false)
    private String fromDate;

    @Column(nullable = false)
    private String toDate;

    private int days;

    @Column(length = 1000)
    private String reason;

    private String status = "Pending";

    @Temporal(TemporalType.TIMESTAMP)
    private Date appliedDate = new Date();

    @Column(length = 500000)
    private String attachment; // Base64 if needed

    private String approvedBy;
    private String approvedDate;

    private String rejectedBy;
    private String rejectedDate;
    
    @Column(length = 1000)
    private String rejectionReason;
}
