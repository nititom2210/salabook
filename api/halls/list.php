<?php
require_once '../helpers.php';

try {
    $hallModel = new Hall();
    $halls = $hallModel->getAll();
    
    jsonSuccess($halls);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

