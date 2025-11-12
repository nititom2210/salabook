<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['hall_id']);
    
    $pricing = new Pricing();
    $rules = $pricing->getRules($data['hall_id']);
    
    jsonSuccess($rules);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

