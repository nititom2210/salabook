<?php
require_once '../helpers.php';

try {
    $data = getRequestData();
    validateRequired($data, ['hall_id', 'start', 'end']);
    
    $availability = new Availability();
    $isAvailable = $availability->checkDatesAvailable($data['hall_id'], $data['start'], $data['end']);
    
    // Also check bookings
    $booking = new Booking();
    $bookingAvailable = $booking->checkAvailability($data['hall_id'], $data['start'], $data['end']);
    
    jsonSuccess([
        'available' => $isAvailable && $bookingAvailable,
        'availability_check' => $isAvailable,
        'booking_check' => $bookingAvailable
    ]);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

