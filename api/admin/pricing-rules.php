<?php
require_once '../helpers.php';

try {
    $admin = requireAdmin();
    $data = getRequestData();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $pricing = new Pricing();
    
    if ($method === 'GET') {
        // Get rules
        validateRequired($data, ['hall_id']);
        $rules = $pricing->getRules($data['hall_id']);
        jsonSuccess($rules);
        
    } elseif ($method === 'POST') {
        // Add rule
        validateRequired($data, ['hall_id', 'start_date', 'end_date', 'price_per_day']);
        
        if ($data['end_date'] < $data['start_date']) {
            jsonError('End date must be after or equal to start date');
        }
        
        $pricing->addRule(
            $data['hall_id'],
            $data['start_date'],
            $data['end_date'],
            $data['price_per_day']
        );
        
        jsonSuccess(null, 'Pricing rule added');
        
    } elseif ($method === 'DELETE') {
        // Delete rule
        if (isset($data['id'])) {
            $pricing->deleteRule($data['id']);
            jsonSuccess(null, 'Pricing rule deleted');
        } elseif (isset($data['hall_id']) && isset($data['clear_all'])) {
            $pricing->clearRules($data['hall_id']);
            jsonSuccess(null, 'All pricing rules cleared');
        } else {
            jsonError('Rule ID or hall_id with clear_all required');
        }
    }
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

