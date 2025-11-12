<?php
require_once '../helpers.php';

try {
    $admin = requireAdmin();
    
    $booking = new Booking();
    $allBookings = $booking->getAll();
    
    $confirmed = array_filter($allBookings, function($b) {
        return $b['status'] === 'confirmed';
    });
    
    $thisMonth = date('Y-m');
    $confirmedThisMonth = array_filter($confirmed, function($b) {
        $date = $b['verified_at'] ?? $b['created_at'];
        return strpos($date, date('Y-m')) === 0;
    });
    
    $pendingPayments = count(array_filter($allBookings, function($b) {
        return $b['status'] === 'paid_pending_review';
    }));
    
    $cancelRequests = count(array_filter($allBookings, function($b) {
        return $b['status'] === 'cancel_requested';
    }));
    
    $totalIncome = array_sum(array_column($confirmed, 'total'));
    $monthIncome = array_sum(array_column($confirmedThisMonth, 'total'));
    
    jsonSuccess([
        'total_income' => $totalIncome,
        'month_income' => $monthIncome,
        'pending_payments' => $pendingPayments,
        'cancel_requests' => $cancelRequests,
        'confirmed_count' => count($confirmed),
        'confirmed_this_month' => count($confirmedThisMonth)
    ]);
    
} catch (Exception $e) {
    jsonError($e->getMessage());
}

