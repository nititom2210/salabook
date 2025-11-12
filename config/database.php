<?php
/**
 * Database Configuration
 * Update these values according to your MySQL setup
 */

return [
    'host' => 'localhost',
    'dbname' => 'salabook-demo',
    'username' => 'root',
    'password' => 'root', // Default MAMP password, change if needed
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];

