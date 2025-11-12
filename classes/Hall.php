<?php
/**
 * Hall Model Class
 */
class Hall {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all halls
     */
    public function getAll() {
        $stmt = $this->db->query("SELECT * FROM halls ORDER BY id");
        return $stmt->fetchAll();
    }

    /**
     * Get hall by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM halls WHERE id = ?");
        $stmt->execute([$id]);
        $hall = $stmt->fetch();
        
        if ($hall && $hall['amenities']) {
            $hall['amenities'] = json_decode($hall['amenities'], true);
        }
        
        return $hall;
    }

    /**
     * Get hall by name (A, B, C)
     */
    public function getByName($name) {
        $stmt = $this->db->prepare("SELECT * FROM halls WHERE name LIKE ?");
        $stmt->execute(["%{$name}%"]);
        $hall = $stmt->fetch();
        
        if ($hall && $hall['amenities']) {
            $hall['amenities'] = json_decode($hall['amenities'], true);
        }
        
        return $hall;
    }

    /**
     * Create a new hall
     */
    public function create($data) {
        $amenities = isset($data['amenities']) ? json_encode($data['amenities']) : '[]';
        
        $stmt = $this->db->prepare("
            INSERT INTO halls (name, location, address, capacity, cost_per_day, description, 
                              overview, suitable_for, facilities, terms, amenities, image, 
                              latitude, longitude) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $data['name'],
            $data['location'] ?? null,
            $data['address'] ?? null,
            $data['capacity'],
            $data['cost_per_day'],
            $data['description'] ?? null,
            $data['overview'] ?? null,
            $data['suitable_for'] ?? null,
            $data['facilities'] ?? null,
            $data['terms'] ?? null,
            $amenities,
            $data['image'] ?? null,
            $data['latitude'] ?? null,
            $data['longitude'] ?? null
        ]);
    }

    /**
     * Update hall
     */
    public function update($id, $data) {
        $amenities = isset($data['amenities']) ? json_encode($data['amenities']) : null;
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'location', 'address', 'capacity', 'cost_per_day', 
                         'description', 'overview', 'suitable_for', 'facilities', 
                         'terms', 'amenities', 'image', 'latitude', 'longitude'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $field === 'amenities' ? $amenities : $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE halls SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
}

