# SalaBook - Hall Booking System

A complete hall booking system with PHP backend and MySQL database, supporting user authentication, hall booking, payment processing, and admin management.

## Features

- **User Authentication**: Registration, login, logout with role-based access (user/admin)
- **Hall Management**: View hall details, availability, and pricing
- **Booking System**: Create bookings with date validation and availability checking
- **Payment Processing**: Submit payment slips for admin review
- **Admin Dashboard**: Manage bookings, verify payments, handle cancellations, manage availability and pricing rules
- **RESTful API**: Clean API endpoints for all operations

## Technology Stack

- **Backend**: PHP (OOP style with PDO)
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Architecture**: RESTful API

## Project Structure

```
salabook-demo/
├── api/                    # API endpoints
│   ├── auth/              # Authentication endpoints
│   ├── halls/             # Hall endpoints
│   ├── bookings/          # Booking endpoints
│   ├── availability/      # Availability endpoints
│   ├── pricing/           # Pricing endpoints
│   ├── payment/           # Payment endpoints
│   └── admin/             # Admin endpoints
├── classes/               # PHP model classes
│   ├── Database.php
│   ├── User.php
│   ├── Hall.php
│   ├── Booking.php
│   ├── Availability.php
│   └── Pricing.php
├── config/                # Configuration files
│   └── database.php
├── database/              # Database schema
│   └── schema.sql
├── script/                # JavaScript files
│   ├── api.js            # API client
│   ├── auth_api.js       # Auth with API
│   ├── booking_api.js    # Booking with API
│   ├── payment_api.js    # Payment with API
│   ├── my_bookings_api.js
│   ├── view_detail_api.js
│   └── admin_rules_api.js
└── uploads/               # Upload directory (created automatically)
    └── payment_slips/
```

## Installation & Setup

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- MAMP/XAMPP/WAMP or similar local server
- Web server (Apache/Nginx)

### Step 1: Database Setup

1. Open phpMyAdmin or MySQL command line
2. Import the database schema:
   ```sql
   source database/schema.sql
   ```
   Or copy and paste the contents of `database/schema.sql` into phpMyAdmin SQL tab

3. The schema will create:
   - Database: `salabook`
   - Tables: `users`, `halls`, `bookings`, `availability`, `pricing_rules`
   - Default admin user: `admin@salabook.com` / `admin123`
   - Three default halls (Sala A, B, C)

### Step 2: Configure Database Connection

Edit `config/database.php` and update the database credentials:

```php
return [
    'host' => 'localhost',
    'dbname' => 'salabook',
    'username' => 'root',      // Your MySQL username
    'password' => 'root',      // Your MySQL password (default MAMP: 'root')
    // ...
];
```

### Step 3: Set Up Web Server

1. **MAMP/XAMPP**: Place the project in `htdocs` folder
2. **Apache**: Configure virtual host or use document root
3. Ensure PHP sessions are enabled (usually enabled by default)

### Step 4: Update Frontend Files

Replace the old JavaScript includes with the API versions in your HTML files:

**In `salabook_landing.html`** (and other pages):
```html
<!-- Replace old script includes with: -->
<script src="script/api.js"></script>
<script src="script/auth_api.js"></script>
```

**In `booking.html`**:
```html
<script src="script/api.js"></script>
<script src="script/booking_api.js"></script>
```

**In `payment.html`**:
```html
<script src="script/api.js"></script>
<script src="script/payment_api.js"></script>
```

**In `my_bookings.html`**:
```html
<script src="script/api.js"></script>
<script src="script/my_bookings_api.js"></script>
```

**In `view_detail.html`**:
```html
<script src="script/api.js"></script>
<script src="script/view_detail_api.js"></script>
```

**In `admin_rules.html`**:
```html
<script src="script/api.js"></script>
<script src="script/admin_rules_api.js"></script>
```

### Step 5: Create Upload Directory

Create the uploads directory for payment slips:

```bash
mkdir -p api/uploads/payment_slips
chmod 755 api/uploads/payment_slips
```

Or create it manually:
- Create folder: `api/uploads/payment_slips/`
- Set permissions to 755 (read/write/execute for owner, read/execute for others)

### Step 6: Test the Installation

1. Start your web server (MAMP/XAMPP)
2. Navigate to: `http://localhost/salabook-demo/`
3. Try registering a new user
4. Login with admin account: `admin@salabook.com` / `admin123`
5. Test booking a hall

## API Endpoints

### Authentication
- `POST /api/auth/register.php` - Register new user
- `POST /api/auth/login.php` - Login user
- `POST /api/auth/logout.php` - Logout user
- `GET /api/auth/session.php` - Get current session

### Halls
- `GET /api/halls/list.php` - Get all halls
- `GET /api/halls/detail.php?id=X` - Get hall by ID
- `GET /api/halls/detail.php?name=X` - Get hall by name

### Bookings
- `POST /api/bookings/create.php` - Create new booking
- `GET /api/bookings/my.php` - Get user's bookings
- `GET /api/bookings/detail.php?id=X` - Get booking details
- `POST /api/bookings/cancel.php` - Request cancellation
- `POST /api/bookings/delete.php` - Delete booking

### Availability
- `GET /api/availability/check.php?hall_id=X&start=Y&end=Z` - Check availability
- `GET /api/availability/list.php?hall_id=X` - Get availability map

### Pricing
- `GET /api/pricing/calculate.php?hall_id=X&start=Y&end=Z` - Calculate price
- `GET /api/pricing/rules.php?hall_id=X` - Get pricing rules

### Payment
- `POST /api/payment/submit.php` - Submit payment slip

### Admin
- `GET /api/admin/bookings.php?status=X` - Get all bookings
- `POST /api/admin/verify-payment.php` - Verify/reject payment
- `POST /api/admin/manage-cancellation.php` - Approve/reject cancellation
- `GET /api/admin/availability.php?hall_id=X` - Get availability
- `POST /api/admin/availability.php` - Set availability
- `PUT /api/admin/availability.php` - Seed availability
- `GET /api/admin/pricing-rules.php?hall_id=X` - Get pricing rules
- `POST /api/admin/pricing-rules.php` - Add pricing rule
- `DELETE /api/admin/pricing-rules.php` - Delete pricing rule
- `GET /api/admin/overview.php` - Get admin overview stats

## Default Credentials

**Admin Account:**
- Email: `admin@salabook.com`
- Password: `admin123`

**Note**: Change the admin password in production!

## Security Notes

1. **Change Admin Password**: Update the default admin password in the database
2. **Admin Code**: Change the admin registration code in `api/auth/register.php` (currently: `ADMIN123`)
3. **File Uploads**: Ensure upload directory has proper permissions and validate file types in production
4. **SQL Injection**: All queries use PDO prepared statements (protected)
5. **Password Hashing**: Uses PHP `password_hash()` with bcrypt
6. **Session Security**: Consider adding CSRF protection in production

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in `config/database.php`
- Ensure database `salabook` exists

### API Returns 500 Error
- Check PHP error logs
- Verify all class files are in `classes/` directory
- Check file permissions

### Session Not Working
- Ensure PHP sessions are enabled
- Check `session.save_path` in php.ini
- Clear browser cookies and try again

### File Upload Not Working
- Check `api/uploads/payment_slips/` directory exists
- Verify directory permissions (755)
- Check PHP `upload_max_filesize` and `post_max_size` settings

## Development

### Adding New Features

1. Create model class in `classes/`
2. Create API endpoint in `api/`
3. Add method to `script/api.js`
4. Update frontend JavaScript files

### Database Migrations

For schema changes, update `database/schema.sql` and run migrations manually or create a migration system.

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions, check:
1. PHP error logs
2. Browser console for JavaScript errors
3. Network tab for API request/response details

