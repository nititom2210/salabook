/**
 * API Client for SalaBook Backend
 * Handles all API communication
 */

const API_BASE = 'api';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // Include cookies for session
        };

        // Handle FormData (for file uploads)
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('auth/login.php', {
            method: 'POST',
            body: { email, password }
        });
    }

    async register(userData) {
        return this.request('auth/register.php', {
            method: 'POST',
            body: userData
        });
    }

    async logout() {
        return this.request('auth/logout.php', {
            method: 'POST'
        });
    }

    async getSession() {
        try {
            return await this.request('auth/session.php', {
                method: 'GET'
            });
        } catch {
            return null;
        }
    }

    // Hall endpoints
    async getHalls() {
        return this.request('halls/list.php');
    }

    async getHall(id) {
        return this.request(`halls/detail.php?id=${id}`);
    }

    async getHallByName(name) {
        return this.request(`halls/detail.php?name=${name}`);
    }

    // Booking endpoints
    async createBooking(bookingData) {
        return this.request('bookings/create.php', {
            method: 'POST',
            body: bookingData
        });
    }

    async getMyBookings() {
        return this.request('bookings/my.php');
    }

    async getBooking(id) {
        return this.request(`bookings/detail.php?id=${id}`);
    }

    async cancelBooking(id, reason) {
        return this.request('bookings/cancel.php', {
            method: 'POST',
            body: { id, reason }
        });
    }

    async deleteBooking(id) {
        return this.request('bookings/delete.php', {
            method: 'POST',
            body: { id }
        });
    }

    // Availability endpoints
    async checkAvailability(hallId, start, end) {
        return this.request(`availability/check.php?hall_id=${hallId}&start=${start}&end=${end}`);
    }

    async getAvailability(hallId, start, end) {
        const startParam = start ? `&start=${start}` : '';
        const endParam = end ? `&end=${end}` : '';
        return this.request(`availability/list.php?hall_id=${hallId}${startParam}${endParam}`);
    }

    // Pricing endpoints
    async calculatePrice(hallId, start, end) {
        return this.request(`pricing/calculate.php?hall_id=${hallId}&start=${start}&end=${end}`);
    }

    async getPricingRules(hallId) {
        return this.request(`pricing/rules.php?hall_id=${hallId}`);
    }

    // Payment endpoints
    async submitPayment(bookingId, slipFile = null) {
        const formData = new FormData();
        formData.append('booking_id', bookingId);
        if (slipFile) {
            formData.append('slip', slipFile);
        }

        return this.request('payment/submit.php', {
            method: 'POST',
            body: formData
        });
    }

    // Admin endpoints
    async getAdminBookings(status = null) {
        const url = status 
            ? `admin/bookings.php?status=${status}`
            : 'admin/bookings.php';
        return this.request(url);
    }

    async verifyPayment(bookingId, action, reason = null) {
        return this.request('admin/verify-payment.php', {
            method: 'POST',
            body: { booking_id: bookingId, action, reason }
        });
    }

    async manageCancellation(bookingId, action, reason = null) {
        return this.request('admin/manage-cancellation.php', {
            method: 'POST',
            body: { booking_id: bookingId, action, reason }
        });
    }

    async getAdminAvailability(hallId, start, end) {
        const startParam = start ? `&start=${start}` : '';
        const endParam = end ? `&end=${end}` : '';
        return this.request(`admin/availability.php?hall_id=${hallId}${startParam}${endParam}`);
    }

    async setAvailability(hallId, date, isAvailable) {
        return this.request('admin/availability.php', {
            method: 'POST',
            body: { hall_id: hallId, date, is_available: isAvailable }
        });
    }

    async seedAvailability(hallId, days = 60) {
        return this.request('admin/availability.php', {
            method: 'PUT',
            body: { hall_id: hallId, seed: true, days }
        });
    }

    async getPricingRulesAdmin(hallId) {
        return this.request(`admin/pricing-rules.php?hall_id=${hallId}`);
    }

    async addPricingRule(hallId, startDate, endDate, pricePerDay) {
        return this.request('admin/pricing-rules.php', {
            method: 'POST',
            body: { hall_id: hallId, start_date: startDate, end_date: endDate, price_per_day: pricePerDay }
        });
    }

    async deletePricingRule(ruleId) {
        return this.request('admin/pricing-rules.php', {
            method: 'DELETE',
            body: { id: ruleId }
        });
    }

    async clearPricingRules(hallId) {
        return this.request('admin/pricing-rules.php', {
            method: 'DELETE',
            body: { hall_id: hallId, clear_all: true }
        });
    }

    async getAdminOverview() {
        return this.request('admin/overview.php');
    }
}

// Create global API client instance
const api = new ApiClient();

