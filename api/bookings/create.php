<?php
require_once '../helpers.php';

try {
    $user = requireAuth();
    $data = getRequestData();
    
    validateRequired($data, ['hall_id', 'start_date', 'end_date', 'event_name', 'contact_name', 'contact_phone']);
    
    // Validate dates
    $startDate = $data['start_date'];
    $endDate = $data['end_date'];
    
    if ($endDate < $startDate) {
        jsonError('End date must be after start date');
    }
    
    // Calculate days
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $days = $start->diff($end)->days + 1;
    
    // Check availability
    $availability = new Availability();
    if (!$availability->checkDatesAvailable($data['hall_id'], $startDate, $endDate)) {
        jsonError('Selected dates include unavailable days');
    }
    
    $booking = new Booking();
    if (!$booking->checkAvailability($data['hall_id'], $startDate, $endDate)) {
        jsonError('Hall is already booked for selected dates');
    }
    
    // Calculate total price
    $hallModel = new Hall();
    $hall = $hallModel->getById($data['hall_id']);
    if (!$hall) {
        jsonError('Hall not found', 404);
    }
    
    $pricing = new Pricing();
    $total = $pricing->calculateTotal($data['hall_id'], $startDate, $endDate, $hall['cost_per_day']);
    
    // Create booking
    $bookingData = [
        'user_id' => $user['id'],
        'hall_id' => $data['hall_id'],
        'start_date' => $startDate,
        'end_date' => $endDate,
        'days' => $days,
        'event_name' => $data['event_name'],
        'contact_name' => $data['contact_name'],
        'contact_phone' => $data['contact_phone'],
        'contact_email' => $data['contact_email'] ?? null,
        'notes' => $data['notes'] ?? null,
        'total' => $total
    ];
    
    $bookingId = $booking->create($bookingData);
    $newBooking = $booking->getById($bookingId);
    
    jsonSuccess($newBooking, 'Booking created successfully');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

