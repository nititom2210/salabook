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
    
    // Users can only delete their own cancelled bookings
    // Admins can delete any booking
    if ($user['role'] !== 'admin') {
        if ($bookingData['user_id'] != $user['id']) {
            jsonError('Unauthorized', 403);
        }
        if (!in_array($bookingData['status'], ['cancelled', 'cancel_rejected'])) {
            jsonError('You can only delete cancelled bookings');
        }
    }
    
    $booking->delete($data['id'], $user['role'] !== 'admin' ? $user['id'] : null);
    
    jsonSuccess(null, 'Booking deleted');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

