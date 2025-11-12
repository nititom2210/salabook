<?php
require_once '../helpers.php';

try {
    $user = requireAuth();
    $data = getRequestData();
    
    validateRequired($data, ['booking_id']);
    
    $booking = new Booking();
    $bookingData = $booking->getById($data['booking_id']);
    
    if (!$bookingData) {
        jsonError('Booking not found', 404);
    }
    
    if ($bookingData['user_id'] != $user['id']) {
        jsonError('Unauthorized', 403);
    }
    
    if ($bookingData['status'] !== 'pending_payment') {
        jsonError('Booking is not in pending payment status');
    }
    
    // Handle file upload if provided
    $slipName = null;
    $slipPath = null;
    
    if (isset($_FILES['slip']) && $_FILES['slip']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/payment_slips/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $extension = pathinfo($_FILES['slip']['name'], PATHINFO_EXTENSION);
        $slipName = 'slip_' . $data['booking_id'] . '_' . time() . '.' . $extension;
        $slipPath = $uploadDir . $slipName;
        
        if (!move_uploaded_file($_FILES['slip']['tmp_name'], $slipPath)) {
            jsonError('Failed to upload payment slip');
        }
        
        $slipPath = 'uploads/payment_slips/' . $slipName;
    } elseif (isset($data['slip_name'])) {
        $slipName = $data['slip_name'];
    }
    
    $booking->updateStatus($data['booking_id'], 'paid_pending_review', [
        'slip_name' => $slipName,
        'slip_path' => $slipPath,
        'paid_at' => true
    ]);
    
    $updated = $booking->getById($data['booking_id']);
    jsonSuccess($updated, 'Payment submitted successfully');
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

