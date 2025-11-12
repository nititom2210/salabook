<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['hall_id']);
    
    $startDate = $data['start'] ?? date('Y-m-d');
    $endDate = $data['end'] ?? date('Y-m-d', strtotime('+30 days'));
    
    $availability = new Availability();
    $map = $availability->getByDateRange($data['hall_id'], $startDate, $endDate);
    
    jsonSuccess($map);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

