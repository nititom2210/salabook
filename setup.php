<?php
/**
 * Setup Verification Script
 * Run this file in your browser to verify the installation
 * URL: http://localhost/salabook-demo/setup.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html>
<head>
    <title>SalaBook Setup Verification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        h1 { color: #333; }
        .check { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>SalaBook Setup Verification</h1>
    
    <?php
    $checks = [];
    
    // Check PHP version
    $phpVersion = phpversion();
    $phpOk = version_compare($phpVersion, '7.4.0', '>=');
    $checks[] = [
        'name' => 'PHP Version',
        'status' => $phpOk,
        'message' => $phpOk ? "PHP {$phpVersion} (OK)" : "PHP {$phpVersion} (Requires 7.4+)"
    ];
    
    // Check PDO extension
    $pdoOk = extension_loaded('pdo') && extension_loaded('pdo_mysql');
    $checks[] = [
        'name' => 'PDO MySQL Extension',
        'status' => $pdoOk,
        'message' => $pdoOk ? 'PDO MySQL extension loaded' : 'PDO MySQL extension not found'
    ];
    
    // Check database config file
    $configExists = file_exists(__DIR__ . '/config/database.php');
    $checks[] = [
        'name' => 'Database Config',
        'status' => $configExists,
        'message' => $configExists ? 'config/database.php exists' : 'config/database.php not found'
    ];
    
    // Check database connection
    $dbConnected = false;
    $dbError = '';
    if ($configExists) {
        try {
            $config = require __DIR__ . '/config/database.php';
            $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
            $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            $dbConnected = true;
        } catch (Exception $e) {
            $dbError = $e->getMessage();
        }
    }
    $checks[] = [
        'name' => 'Database Connection',
        'status' => $dbConnected,
        'message' => $dbConnected ? 'Successfully connected to database' : "Connection failed: {$dbError}"
    ];
    
    // Check required directories
    $dirs = [
        'api' => 'API directory',
        'classes' => 'Classes directory',
        'config' => 'Config directory',
        'script' => 'Script directory',
        'api/uploads/payment_slips' => 'Uploads directory'
    ];
    
    foreach ($dirs as $dir => $name) {
        $exists = is_dir(__DIR__ . '/' . $dir);
        $writable = $exists && is_writable(__DIR__ . '/' . $dir);
        $checks[] = [
            'name' => $name,
            'status' => $exists,
            'message' => $exists 
                ? ($writable ? "{$dir} exists and is writable" : "{$dir} exists but is not writable")
                : "{$dir} not found"
        ];
    }
    
    // Check required files
    $files = [
        'classes/Database.php' => 'Database class',
        'classes/User.php' => 'User class',
        'classes/Hall.php' => 'Hall class',
        'classes/Booking.php' => 'Booking class',
        'api/helpers.php' => 'API helpers',
        'script/api.js' => 'API client'
    ];
    
    foreach ($files as $file => $name) {
        $exists = file_exists(__DIR__ . '/' . $file);
        $checks[] = [
            'name' => $name,
            'status' => $exists,
            'message' => $exists ? "{$file} exists" : "{$file} not found"
        ];
    }
    
    // Check database tables
    $tablesOk = false;
    if ($dbConnected) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
            $tablesOk = $stmt->rowCount() > 0;
        } catch (Exception $e) {
            $tablesOk = false;
        }
    }
    $checks[] = [
        'name' => 'Database Tables',
        'status' => $tablesOk,
        'message' => $tablesOk ? 'Database tables exist' : 'Database tables not found. Run database/schema.sql'
    ];
    
    // Display results
    $allOk = true;
    foreach ($checks as $check) {
        $class = $check['status'] ? 'success' : 'error';
        if (!$check['status']) $allOk = false;
        echo "<div class='check'>";
        echo "<strong class='{$class}'>" . ($check['status'] ? '✓' : '✗') . " {$check['name']}</strong><br>";
        echo "<span class='{$class}'>{$check['message']}</span>";
        echo "</div>";
    }
    
    if ($allOk) {
        echo "<h2 class='success'>✓ All checks passed! Your setup looks good.</h2>";
        echo "<p><a href='salabook_landing.html'>Go to SalaBook</a></p>";
    } else {
        echo "<h2 class='error'>✗ Some checks failed. Please fix the issues above.</h2>";
        echo "<p>See README.md for setup instructions.</p>";
    }
    ?>
    
    <hr>
    <p><small>Remove this file (setup.php) after verification for security.</small></p>
</body>
</html>

