<?php
require_once '../helpers.php';

try {
    $user = requireAuth();
    $data = getRequestData();
    
    validateRequired($data, ['id']);
    
    $booking = new Booking();
    $bookingData = $booking->getById($data['id']);
    
    if (!$bookingData) {
        jsonError('Booking not found', 404);
    }
    
    // Check ownership
    if ($bookingData['user_id'] != $user['id']) {
        jsonError('Unauthorized', 403);
    }
    
    // Only confirmed bookings can be cancelled
    if ($bookingData['status'] !== 'confirmed') {
        jsonError('Only confirmed bookings can be cancelled');
    }
    
    $booking->updateStatus($data['id'], 'cancel_requested', [
        'cancel_reason' => $data['reason'] ?? null,
        'cancel_requested_at' => true
    ]);
    
    $updated = $booking->getById($data['id']);
    jsonSuccess($updated, 'Cancellation requested');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

