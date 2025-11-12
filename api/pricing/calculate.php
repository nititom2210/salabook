<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['hall_id', 'start', 'end']);
    
    $hallModel = new Hall();
    $hall = $hallModel->getById($data['hall_id']);
    
    if (!$hall) {
        jsonError('Hall not found', 404);
    }
    
    $pricing = new Pricing();
    $total = $pricing->calculateTotal($data['hall_id'], $data['start'], $data['end'], $hall['cost_per_day']);
    
    // Calculate days
    $start = new DateTime($data['start']);
    $end = new DateTime($data['end']);
    $days = $start->diff($end)->days + 1;
    
    jsonSuccess([
        'total' => $total,
        'days' => $days,
        'default_price' => $hall['cost_per_day']
    ]);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

