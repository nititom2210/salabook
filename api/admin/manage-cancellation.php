<?php
require_once '../helpers.php';

try {
    $admin = requireAdmin();
    $data = getRequestData();
    
    validateRequired($data, ['booking_id', 'action']);
    
    $booking = new Booking();
    $bookingData = $booking->getById($data['booking_id']);
    
    if (!$bookingData) {
        jsonError('Booking not found', 404);
    }
    
    if ($data['action'] === 'approve') {
        $booking->updateStatus($data['booking_id'], 'cancelled', ['cancelled_at' => true]);
        
        // Make dates available again
        $availability = new Availability();
        $start = new DateTime($bookingData['start_date']);
        $end = new DateTime($bookingData['end_date']);
        while ($start <= $end) {
            $availability->setDate($bookingData['hall_id'], $start->format('Y-m-d'), true);
            $start->modify('+1 day');
        }
        
        $updated = $booking->getById($data['booking_id']);
        jsonSuccess($updated, 'Cancellation approved');
        
    } elseif ($data['action'] === 'reject') {
        $booking->updateStatus($data['booking_id'], 'cancel_rejected', [
            'cancel_reject_reason' => $data['reason'] ?? null
        ]);
        
        $updated = $booking->getById($data['booking_id']);
        jsonSuccess($updated, 'Cancellation rejected');
    } else {
        jsonError('Invalid action');
    }
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

