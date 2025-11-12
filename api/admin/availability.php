<?php
require_once '../helpers.php';

try {
    $admin = requireAdmin();
    $data = getRequestData();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Get availability
        validateRequired($data, ['hall_id']);
        $startDate = $data['start'] ?? date('Y-m-d');
        $endDate = $data['end'] ?? date('Y-m-d', strtotime('+60 days'));
        
        $availability = new Availability();
        $map = $availability->getByDateRange($data['hall_id'], $startDate, $endDate);
        
        jsonSuccess($map);
        
    } elseif ($method === 'POST') {
        // Set availability
        validateRequired($data, ['hall_id', 'date', 'is_available']);
        
        $availability = new Availability();
        $availability->setDate($data['hall_id'], $data['date'], $data['is_available'] == 1 || $data['is_available'] === true);
        
        jsonSuccess(null, 'Availability updated');
        
    } elseif ($method === 'PUT') {
        // Bulk update or seed
        validateRequired($data, ['hall_id']);
        
        $availability = new Availability();
        
        if (isset($data['seed']) && $data['seed']) {
            $days = $data['days'] ?? 60;
            $availability->seedAvailability($data['hall_id'], $days);
            jsonSuccess(null, 'Availability seeded');
        } elseif (isset($data['start']) && isset($data['end'])) {
            $isAvailable = $data['is_available'] ?? true;
            $availability->setDateRange($data['hall_id'], $data['start'], $data['end'], $isAvailable);
            jsonSuccess(null, 'Availability updated for date range');
        } else {
            jsonError('Invalid request');
        }
    }
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

