<?php
require_once '../helpers.php';

try {
    $user = requireAuth();
    $data = getRequestData();
    
    if (!isset($data['id'])) {
        jsonError('Booking ID required');
    }
    
    $booking = new Booking();
    $bookingData = $booking->getById($data['id']);
    
    if (!$bookingData) {
        jsonError('Booking not found', 404);
    }
    
    // Check if user owns this booking or is admin
    if ($bookingData['user_id'] != $user['id'] && $user['role'] !== 'admin') {
        jsonError('Unauthorized', 403);
    }
    
    jsonSuccess($bookingData);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

