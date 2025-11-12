<?php
/**
 * Pricing Model Class
 */
class Pricing {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get pricing rules for a hall
     */
    public function getRules($hallId) {
        $stmt = $this->db->prepare("
            SELECT * FROM pricing_rules
            WHERE hall_id = ?
            ORDER BY start_date
        ");
        $stmt->execute([$hallId]);
        return $stmt->fetchAll();
    }

    /**
     * Add a pricing rule
     */
    public function addRule($hallId, $startDate, $endDate, $pricePerDay) {
        $stmt = $this->db->prepare("
            INSERT INTO pricing_rules (hall_id, start_date, end_date, price_per_day)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE price_per_day = ?
        ");
        return $stmt->execute([$hallId, $startDate, $endDate, $pricePerDay, $pricePerDay]);
    }

    /**
     * Delete a pricing rule
     */
    public function deleteRule($id) {
        $stmt = $this->db->prepare("DELETE FROM pricing_rules WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Clear all rules for a hall
     */
    public function clearRules($hallId) {
        $stmt = $this->db->prepare("DELETE FROM pricing_rules WHERE hall_id = ?");
        return $stmt->execute([$hallId]);
    }

    /**
     * Calculate total price for date range
     */
    public function calculateTotal($hallId, $startDate, $endDate, $defaultPrice) {
        $rules = $this->getRules($hallId);
        $dates = $this->getDateRange($startDate, $endDate);
        $total = 0;
        
        foreach ($dates as $date) {
            $price = $this->getPriceForDate($date, $rules, $defaultPrice);
            $total += $price;
        }
        
        return $total;
    }

    /**
     * Get price for a specific date
     */
    public function getPriceForDate($date, $rules, $defaultPrice) {
        $dateObj = new DateTime($date);
        
        foreach ($rules as $rule) {
            $start = new DateTime($rule['start_date']);
            $end = new DateTime($rule['end_date']);
            
            if ($dateObj >= $start && $dateObj <= $end) {
                return (float)$rule['price_per_day'];
            }
        }
        
        return (float)$defaultPrice;
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
}

