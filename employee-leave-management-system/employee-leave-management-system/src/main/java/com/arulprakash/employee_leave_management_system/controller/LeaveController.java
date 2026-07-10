package com.arulprakash.employee_leave_management_system.controller;

import com.arulprakash.employee_leave_management_system.dto.ApiResponse;
import com.arulprakash.employee_leave_management_system.entity.LeaveRequest;
import com.arulprakash.employee_leave_management_system.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    @Autowired
    private LeaveRequestRepository leaveRepository;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllLeaves() {
        List<LeaveRequest> leaves = leaveRepository.findAll();
        return ResponseEntity.ok(new ApiResponse(true, "All leaves fetched successfully", leaves));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse> getLeavesByEmployee(@PathVariable String employeeId) {
        List<LeaveRequest> leaves = leaveRepository.findByEmployeeId(employeeId);
        return ResponseEntity.ok(new ApiResponse(true, "Employee leaves fetched successfully", leaves));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> applyLeave(@RequestBody LeaveRequest request) {
        request.setStatus("Pending");
        request.setAppliedDate(new Date());
        
        LeaveRequest savedLeave = leaveRepository.save(request);
        return ResponseEntity.ok(new ApiResponse(true, "Leave requested successfully", savedLeave));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveLeave(@PathVariable String id, @RequestBody Map<String, String> data) {
        Optional<LeaveRequest> leaveOpt = leaveRepository.findById(id);
        if (!leaveOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Leave request not found", null));
        }

        LeaveRequest leave = leaveOpt.get();
        leave.setStatus("Approved");
        leave.setApprovedBy(data.get("adminName"));
        leave.setApprovedDate(new Date().toString());
        
        leaveRepository.save(leave);
        return ResponseEntity.ok(new ApiResponse(true, "Leave approved successfully", leave));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectLeave(@PathVariable String id, @RequestBody Map<String, String> data) {
        Optional<LeaveRequest> leaveOpt = leaveRepository.findById(id);
        if (!leaveOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Leave request not found", null));
        }

        LeaveRequest leave = leaveOpt.get();
        leave.setStatus("Rejected");
        leave.setRejectedBy(data.get("adminName"));
        leave.setRejectedDate(new Date().toString());
        leave.setRejectionReason(data.get("reason"));
        
        leaveRepository.save(leave);
        return ResponseEntity.ok(new ApiResponse(true, "Leave rejected successfully", leave));
    }
}
