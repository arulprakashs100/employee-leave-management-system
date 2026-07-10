package com.arulprakash.employee_leave_management_system.controller;

import com.arulprakash.employee_leave_management_system.dto.ApiResponse;
import com.arulprakash.employee_leave_management_system.entity.User;
import com.arulprakash.employee_leave_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(new ApiResponse(true, "Users fetched successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable String id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(new ApiResponse(true, "User fetched successfully", user.get()));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(false, "User not found", null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateUserProfile(@PathVariable String id, @RequestBody Map<String, String> updates) {
        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "User not found", null));
        }

        User user = userOpt.get();
        if (updates.containsKey("name")) user.setName(updates.get("name"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        if (updates.containsKey("avatar")) user.setAvatar(updates.get("avatar"));

        userRepository.save(user);
        return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", user));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse> updatePassword(@PathVariable String id, @RequestBody Map<String, String> passData) {
        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "User not found", null));
        }

        User user = userOpt.get();
        String currentPassword = passData.get("currentPassword");
        String newPassword = passData.get("newPassword");

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Incorrect current password", null));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "Password updated successfully", null));
    }
}
