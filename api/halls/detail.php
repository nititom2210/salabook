<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    
    if (!isset($data['id']) && !isset($data['name'])) {
        jsonError('Hall ID or name required');
    }
    
    $hallModel = new Hall();
    
    if (isset($data['id'])) {
        $hall = $hallModel->getById($data['id']);
    } else {
        $hall = $hallModel->getByName($data['name']);
    }
    
    if (!$hall) {
        jsonError('Hall not found', 404);
    }
    
    jsonSuccess($hall);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

