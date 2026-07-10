# ☕ Cafe Order Management System

A web-based ordering system for cafés and restaurants. Customers browse the menu, place orders, and pay online — all from their phone. Staff manage orders in real-time from a dashboard.

## How It Works

**For customers:**
- Open the menu on your phone (via QR code at your table)
- Browse items by category (hot drinks, cold drinks, desserts, etc.)
- Add items to your cart and place an order
- Pay online through the payment gateway
- Staff gets notified and prepares your order

**For staff:**
- **Chef** sees incoming orders and marks them as ready
- **Waiter** sees ready orders and marks them as delivered
- **Admin** manages the menu, categories, staff accounts, and cafe settings
- **Super Admin** has full access to everything

## Features

- Menu management with categories, images, and availability toggle
- Order workflow: pending → ready → delivered
- Online payment integration (Zarinpal)
- Staff management with role-based access
- Admin dashboard with order statistics
- Cafe open/close toggle
- Monthly income reports (auto-generated)
- Persian (RTL) interface

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Laravel 13 + PHP 8.3 |
| Frontend | Vanilla JS + Tailwind CSS |
| Database | MySQL |
| Auth | Laravel Sanctum (token-based) |
| Payment | Zarinpal |

## Quick Start

### Requirements
- PHP 8.3+, MySQL 8.0+, Composer, Node.js

### Setup

```bash
# Backend
cd BK
cp .env.example .env        # Configure your database
composer install
php artisan key:generate
php artisan migrate --seed   # Creates tables + sample data
php artisan serve

# Frontend (optional, for custom CSS)
cd FE
npm install
npm run build:css
```

Open `http://127.0.0.1:8000` to see the menu.  
Admin panel: `login.html` in the frontend directory.

### Default Login (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@cafe.com | password123 |
| Admin | admin@cafe.com | password123 |
| Customer | customer@cafe.com | password123 |

## Project Structure

```
BK/          → Laravel backend (API)
FE/          → Frontend (HTML + JS + CSS)
  SRC/       → Source files
    index.html       → Public menu page
    login.html       → Admin login
    dashboard.html   → Admin dashboard
    ordersManagement.html → Order queue
    menuManagement.html   → Menu editor
    adminsManagement.html → Staff management
    checkout.html    → Shopping cart
```

## API Endpoints

All API routes are prefixed with `/api/v1`. See `routes.md` for full documentation.

**Public:** `GET /category`, `GET /menu-items`, `POST /register`, `POST /login`

**Protected (auth required):**
- `POST /cafe/orders` — Create order
- `GET /cafe/orders/{id}` — View order
- `POST /cafe/payments/request` — Request payment
- `GET /Dashboard/admin/orders` — List orders (admin)
- `PATCH /Dashboard/admin/orders/{id}/status` — Update status
- `POST/DELETE/PUT /Dashboard/admin/category` — Category CRUD
- `POST/DELETE/PUT /Dashboard/admin/menu-items` — Menu item CRUD
- `GET/POST/PUT/DELETE /Dashboard/users` — Staff management
- `POST /Dashboard/cafe/toggle` — Open/close cafe
