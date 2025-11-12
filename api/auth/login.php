<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['email', 'password']);
    
    $userModel = new User();
    $user = $userModel->login($data['email'], $data['password']);
    
    if (!$user) {
        jsonError('Invalid email or password', 401);
    }
    
    // Start session
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    
    jsonSuccess([
        'user' => $user,
        'session_id' => session_id()
    ], 'Login successful');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

