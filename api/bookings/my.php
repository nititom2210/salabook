<?php
require_once '../helpers.php';

try {
    $user = requireAuth();
    
    $booking = new Booking();
    $bookings = $booking->getByUserId($user['id']);
    
    jsonSuccess($bookings);
} catch (Exception $e) {
    jsonError($e->getMessage());
}

