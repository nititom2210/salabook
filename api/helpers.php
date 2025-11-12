<?php
/**
 * API Helper Functions
 */

// Set CORS headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload classes
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../classes/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Load database config
require_once __DIR__ . '/../config/database.php';

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function jsonError($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Send success response
 */
function jsonSuccess($data = null, $message = null) {
    $response = ['success' => true];
    if ($message) $response['message'] = $message;
    if ($data !== null) $response['data'] = $data;
    jsonResponse($response);
}

/**
 * Get request data (JSON or form data)
 */
function getRequestData() {
    $data = [];
    
    if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];
    } else {
        $data = $_POST;
    }
    
    return array_merge($data, $_GET);
}

/**
 * Get authenticated user from session
 */
function getAuthenticatedUser() {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    $user = new User();
    return $user->getById($_SESSION['user_id']);
}

/**
 * Require authentication
 */
function requireAuth() {
    $user = getAuthenticatedUser();
    if (!$user) {
        jsonError('Authentication required', 401);
    }
    return $user;
}

/**
 * Require admin role
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonError('Admin access required', 403);
    }
    return $user;
}

/**
 * Validate required fields
 */
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        jsonError('Missing required fields: ' . implode(', ', $missing));
    }
}

