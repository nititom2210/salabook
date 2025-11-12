<?php
/**
 * Availability Model Class
 */
class Availability {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get availability for a hall and date range
     */
    public function getByDateRange($hallId, $startDate, $endDate) {
        $stmt = $this->db->prepare("
            SELECT date, is_available
            FROM availability
            WHERE hall_id = ? AND date >= ? AND date <= ?
            ORDER BY date
        ");
        $stmt->execute([$hallId, $startDate, $endDate]);
        $results = $stmt->fetchAll();
        
        $map = [];
        foreach ($results as $row) {
            $map[$row['date']] = (bool)$row['is_available'];
        }
        
        return $map;
    }

    /**
     * Set availability for a specific date
     */
    public function setDate($hallId, $date, $isAvailable) {
        $stmt = $this->db->prepare("
            INSERT INTO availability (hall_id, date, is_available)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_available = ?
        ");
        return $stmt->execute([$hallId, $date, $isAvailable ? 1 : 0, $isAvailable ? 1 : 0]);
    }

    /**
     * Bulk set availability for date range
     */
    public function setDateRange($hallId, $startDate, $endDate, $isAvailable) {
        $dates = $this->getDateRange($startDate, $endDate);
        $this->db->beginTransaction();
        
        try {
            foreach ($dates as $date) {
                $this->setDate($hallId, $date, $isAvailable);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Seed availability for next N days
     */
    public function seedAvailability($hallId, $days = 60) {
        $today = new DateTime();
        $this->db->beginTransaction();
        
        try {
            for ($i = 0; $i < $days; $i++) {
                $date = clone $today;
                $date->modify("+{$i} days");
                $dateStr = $date->format('Y-m-d');
                
                // Default: available unless weekend or random block
                $dayOfWeek = $date->format('w');
                $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
                $randomBlock = (rand(1, 100) <= 12);
                $isAvailable = !($isWeekend || $randomBlock);
                
                $this->setDate($hallId, $dateStr, $isAvailable);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Get all dates in range
     */
    private function getDateRange($start, $end) {
        $dates = [];
        $startDate = new DateTime($start);
        $endDate = new DateTime($end);
        
        while ($startDate <= $endDate) {
            $dates[] = $startDate->format('Y-m-d');
            $startDate->modify('+1 day');
        }
        
        return $dates;
    }

    /**
     * Check if dates are available (considering both availability table and bookings)
     */
    public function checkDatesAvailable($hallId, $startDate, $endDate) {
        $dates = $this->getDateRange($startDate, $endDate);
        $availability = $this->getByDateRange($hallId, $startDate, $endDate);
        
        foreach ($dates as $date) {
            // If date is explicitly set to unavailable, return false
            if (isset($availability[$date]) && !$availability[$date]) {
                return false;
            }
        }
        
        return true;
    }
}

