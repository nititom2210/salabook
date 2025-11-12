<?php
require_once '../helpers.php';

try {
    $admin = requireAdmin();
    $data = getRequestData();
    
    $status = $data['status'] ?? null;
    
    $booking = new Booking();
    $bookings = $booking->getAll($status);
    
    jsonSuccess($bookings);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

