<?php
/**
 * User Model Class
 */
class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Register a new user
     */
    public function register($name, $email, $phone, $password, $role = 'user') {
        // Check if email already exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new Exception("Email already registered");
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, phone, password, role, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$name, $email, $phone, $hashedPassword, $role]);


        return $this->db->lastInsertId();
    }

    /**
     * Authenticate user
     */
    public function login($email, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            return false;
        }

        // Remove password from response
        unset($user['password']);
        return $user;
    }

    /**
     * Get user by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get user by email
     */
    public function getByEmail($email) {
        $stmt = $this->db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    /**
     * Update user profile
     */
    public function update($id, $name, $phone) {
        $stmt = $this->db->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
        return $stmt->execute([$name, $phone, $id]);
    }
}

