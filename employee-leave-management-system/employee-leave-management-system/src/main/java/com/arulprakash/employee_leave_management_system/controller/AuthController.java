package com.arulprakash.employee_leave_management_system.controller;

import com.arulprakash.employee_leave_management_system.dto.ApiResponse;
import com.arulprakash.employee_leave_management_system.dto.LoginRequest;
import com.arulprakash.employee_leave_management_system.dto.RegisterRequest;
import com.arulprakash.employee_leave_management_system.entity.User;
import com.arulprakash.employee_leave_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.ok(new ApiResponse(true, "Login successful", user));
            }
        }
        
        // Check for static admin login (from your previous mock logic)
        if ("admin@vortex.com".equals(request.getEmail()) && "admin123".equals(request.getPassword())) {
            User admin = new User();
            admin.setId("ADMIN001");
            admin.setName("Administrator");
            admin.setEmail("admin@vortex.com");
            admin.setRole("admin");
            admin.setBranch("HR");
            return ResponseEntity.ok(new ApiResponse(true, "Login successful", admin));
        }

        return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid credentials", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Email is already registered", null));
        }
        if (userRepository.findById(request.getEmployeeId()).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Employee ID already exists", null));
        }

        User user = new User();
        user.setId(request.getEmployeeId());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("employee"); // Default role
        user.setBranch(request.getBranch());
        user.setPhone("");

        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "Registration successful", user));
    }
}
