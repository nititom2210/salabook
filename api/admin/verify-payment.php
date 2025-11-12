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
    
    if ($data['action'] === 'verify') {
        $booking->updateStatus($data['booking_id'], 'confirmed', ['verified_at' => true]);
        
        // Mark dates as unavailable in availability table
        $availability = new Availability();
        $dates = [];
        $start = new DateTime($bookingData['start_date']);
        $end = new DateTime($bookingData['end_date']);
        while ($start <= $end) {
            $availability->setDate($bookingData['hall_id'], $start->format('Y-m-d'), false);
            $start->modify('+1 day');
        }
        
        $updated = $booking->getById($data['booking_id']);
        jsonSuccess($updated, 'Payment verified and booking confirmed');
        
    } elseif ($data['action'] === 'reject') {
        $booking->updateStatus($data['booking_id'], 'payment_rejected', [
            'reject_reason' => $data['reason'] ?? null
        ]);
        
        $updated = $booking->getById($data['booking_id']);
        jsonSuccess($updated, 'Payment rejected');
    } else {
        jsonError('Invalid action');
    }
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

