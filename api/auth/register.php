<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['name', 'email', 'phone', 'password']);
    
    $role = $data['role'] ?? 'user';
    
    // If admin role, verify admin code
    if ($role === 'admin') {
        $adminCode = $data['admin_code'] ?? '';
        // In production, store this in config or database
        $validAdminCode = 'ADMIN123'; // Change this!
        if ($adminCode !== $validAdminCode) {
            jsonError('Invalid admin access code', 403);
        }
    }
    
    $userModel = new User();
    $userId = $userModel->register(
        $data['name'],
        $data['email'],
        $data['phone'],
        $data['password'],
        $role
    );
    
    // Auto-login after registration
    session_start();
    $user = $userModel->getById($userId);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    
    jsonSuccess([
        'user' => $user,
        'session_id' => session_id()
    ], 'Registration successful');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

