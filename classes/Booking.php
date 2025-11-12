<?php
/**
 * Booking Model Class
 */
class Booking {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new booking
     */
    public function create($data) {
        $stmt = $this->db->prepare("
            INSERT INTO bookings (user_id, hall_id, start_date, end_date, days, event_name,
                                contact_name, contact_phone, contact_email, notes, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['hall_id'],
            $data['start_date'],
            $data['end_date'],
            $data['days'],
            $data['event_name'],
            $data['contact_name'],
            $data['contact_phone'],
            $data['contact_email'] ?? null,
            $data['notes'] ?? null,
            $data['total']
        ]);
        
        return $this->db->lastInsertId();
    }

    /**
     * Get booking by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("
            SELECT b.*, u.name as user_name, u.email as user_email, h.name as hall_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN halls h ON b.hall_id = h.id
            WHERE b.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get bookings by user ID
     */
    public function getByUserId($userId) {
        $stmt = $this->db->prepare("
            SELECT b.*, h.name as hall_name
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    /**
     * Get all bookings (for admin)
     */
    public function getAll($status = null) {
        $sql = "
            SELECT b.*, u.name as user_name, u.email as user_email, h.name as hall_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN halls h ON b.hall_id = h.id
        ";
        
        if ($status) {
            $sql .= " WHERE b.status = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$status]);
        } else {
            $stmt = $this->db->query($sql);
        }
        
        return $stmt->fetchAll();
    }

    /**
     * Update booking status
     */
    public function updateStatus($id, $status, $additionalData = []) {
        $updates = ["status = ?"];
        $values = [$status];
        
        if ($status === 'confirmed' && !isset($additionalData['verified_at'])) {
            $updates[] = "verified_at = NOW()";
        } elseif ($status === 'paid_pending_review' && !isset($additionalData['paid_at'])) {
            $updates[] = "paid_at = NOW()";
        } elseif ($status === 'cancelled' && !isset($additionalData['cancelled_at'])) {
            $updates[] = "cancelled_at = NOW()";
        }
        
        if (isset($additionalData['slip_name'])) {
            $updates[] = "slip_name = ?";
            $values[] = $additionalData['slip_name'];
        }
        
        if (isset($additionalData['slip_path'])) {
            $updates[] = "slip_path = ?";
            $values[] = $additionalData['slip_path'];
        }
        
        if (isset($additionalData['cancel_reason'])) {
            $updates[] = "cancel_reason = ?";
            $values[] = $additionalData['cancel_reason'];
        }
        
        if (isset($additionalData['cancel_requested_at'])) {
            $updates[] = "cancel_requested_at = NOW()";
        }
        
        if (isset($additionalData['reject_reason'])) {
            $updates[] = "reject_reason = ?";
            $updates[] = "rejected_at = NOW()";
            $values[] = $additionalData['reject_reason'];
        }
        
        $values[] = $id;
        $sql = "UPDATE bookings SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }

    /**
     * Delete booking (soft delete or hard delete)
     */
    public function delete($id, $userId = null) {
        if ($userId) {
            // Only allow users to delete their own cancelled bookings
            $stmt = $this->db->prepare("
                DELETE FROM bookings 
                WHERE id = ? AND user_id = ? 
                AND status IN ('cancelled', 'cancel_rejected')
            ");
            return $stmt->execute([$id, $userId]);
        } else {
            // Admin can delete any booking
            $stmt = $this->db->prepare("DELETE FROM bookings WHERE id = ?");
            return $stmt->execute([$id]);
        }
    }

    /**
     * Check if dates are available for a hall
     */
    public function checkAvailability($hallId, $startDate, $endDate, $excludeBookingId = null) {
        $sql = "
            SELECT COUNT(*) as count
            FROM bookings b
            WHERE b.hall_id = ?
            AND b.status IN ('confirmed', 'paid_pending_review')
            AND (
                (b.start_date <= ? AND b.end_date >= ?)
                OR (b.start_date <= ? AND b.end_date >= ?)
                OR (b.start_date >= ? AND b.end_date <= ?)
            )
        ";
        
        $params = [$hallId, $startDate, $startDate, $endDate, $endDate, $startDate, $endDate];
        
        if ($excludeBookingId) {
            $sql .= " AND b.id != ?";
            $params[] = $excludeBookingId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        return $result['count'] == 0;
    }
}

