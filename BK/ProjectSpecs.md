# Complete Technical Specification: Café Order Management System (Single Instance)

**Version:** 1.0  
**Target Deployment:** Single café per installation  
**Stack:** Laravel 11 API + Vanilla JS Frontend + MySQL  
**Authentication:** JWT for admin, localStorage for customer identity  
**No multi-tenancy, no Blade, no build tools**

---

## 1. Project Overview

### 1.1 Purpose

A lightweight order management system for a single café. Customers scan QR codes at tables, browse menu, place orders. Kitchen staff see incoming orders and mark them ready. Waiters deliver orders. Super admin manages menu, staff, and settings.

### 1.2 Key Features

- Customer self-service ordering via mobile browser
- Real-time order queue for kitchen and waiters
- Role-based admin panel (super admin, chef, waiter)
- Menu management with categories and availability
- Staff management
- Basic analytics dashboard
- QR code generation for tables

### 1.3 Technology Stack

**Backend:**
- Laravel 11
- MySQL 8.0+
- JWT authentication (tymon/jwt-auth)
- CORS enabled

**Frontend:**
- Vanilla JavaScript (ES6+)
- Tailwind CSS (CDN)
- No framework, no build step
- localStorage for state persistence

---

## 2. Database Schema

### 2.1 Tables Overview

```sql
-- Users table (staff only)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'chef', 'waiter') NOT NULL DEFAULT 'waiter',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_role (role),
    INDEX idx_email (email)
);

-- Categories table
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_display_order (display_order)
);

-- Menu items table
CREATE TABLE menu_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500) NULL,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_available (is_available),
    INDEX idx_display_order (display_order)
);

-- Orders table
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    table_number VARCHAR(10) NULL,
    status ENUM('pending', 'ready', 'delivered') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_customer_phone (customer_phone)
);

-- Order items table
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_menu_item (menu_item_id)
);

-- Settings table (key-value store)
CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_key (key)
);
```

### 2.2 Migration Files

**database/migrations/2024_01_01_000001_create_users_table.php**



## 2.2 Migration Files (Laravel)

### create_users_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone_number')->unique();

            $table->enum('role', ['super_admin','chef','waiter', 'user'])->default('user');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
‍‍‍```
### create_categories_table.php

```<?php
return new class extends Migration {

    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {

            $table->id();
            $table->string('name');

            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('display_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
```

### create_menu_items_table.php

```php
return new class extends Migration {

    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {

            $table->id();

            $table->foreignId('category_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();

            $table->decimal('price',10,2);

            $table->string('image_url')->nullable();

            $table->boolean('is_available')->default(true);

            $table->integer('display_order')->default(0);

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
```

### create_orders_table.php

```php
return new class extends Migration {

    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            $table->string('customer_name');
            $table->string('customer_phone');

            $table->string('table_number')->nullable();

            $table->enum('status',['pending','ready','delivered'])
                  ->default('pending');

            $table->decimal('total_amount',10,2);

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
```

### create_order_items_table.php

```php
return new class extends Migration {

    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {

            $table->id();

            $table->foreignId('order_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('menu_item_id')
                  ->constrained()
                  ->restrictOnDelete();

            $table->string('menu_item_name');

            $table->integer('quantity');

            $table->decimal('unit_price',10,2);

            $table->decimal('subtotal',10,2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
```

### create_settings_table.php

```php
return new class extends Migration {

    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {

            $table->id();

            $table->string('key')->unique();

            $table->text('value')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
```

---

# 3. API Architecture

Base URL example:

https://cafe-domain.com/api


Responses follow a standard JSON structure.

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# 4. API Endpoints

## 4.1 Authentication

| Method | Endpoint | Description |
|------|------|------|
POST | /auth/login | Staff login |
POST | /auth/logout | Logout |

### POST /auth/login

Request:

```json
{
 "email":"admin@cafe.com",
 "password":"password"
}
```

Response:

```json
{
 "token":"JWT_TOKEN",
 "user":{
   "name":"Admin",
   "role":"super_admin"
 }
}
```

Controller Example:

```php
class AuthController extends Controller
{

    public function login(Request $request)
    {

        $credentials = $request->only('email','password');

        if (!$token = auth()->attempt($credentials)) {
            return response()->json([
                'success'=>false,
                'message'=>'Invalid credentials'
            ],401);
        }

        return response()->json([
            'success'=>true,
            'token'=>$token,
            'user'=>[
                'name'=>auth()->user()->name,
                'role'=>auth()->user()->role
            ]
        ]);

    }

    public function logout()
    {
        auth()->logout();

        return response()->json([
            'success'=>true
        ]);
    }
}
```

---

# 5. Customer API

Customer APIs **do not require authentication**.

## 5.1 Get Menu

GET

/menu


Response:

```json
{
 "categories":[
  {
   "id":1,
   "name":"Coffee",
   "items":[
     {
       "id":1,
       "name":"Latte",
       "price":4.5,
       "image_url":"/images/latte.jpg"
     }
   ]
  }
 ]
}
```

Controller:

```php
public function menu()
{

    $categories = Category::where('is_active',true)
        ->with(['items'=>function($q){
            $q->where('is_available',true)
              ->orderBy('display_order');
        }])
        ->orderBy('display_order')
        ->get();

    return response()->json([
        'success'=>true,
        'data'=>$categories
    ]);
}
```

---

## 5.2 Create Order

POST

/orders


Request:

```json
{
 "customer_name":"John",
 "customer_phone":"123456",
 "table_number":"5",
 "items":[
   {
     "menu_item_id":1,
     "quantity":2
   }
 ],
 "notes":"Less sugar"
}
```

Controller logic:

```php
public function store(Request $request)
{

    DB::beginTransaction();

    $order = Order::create([
        'customer_name'=>$request->customer_name,
        'customer_phone'=>$request->customer_phone,
        'table_number'=>$request->table_number,
        'status'=>'pending',
        'total_amount'=>0
    ]);

    $total = 0;

    foreach($request->items as $item){

        $menuItem = MenuItem::findOrFail($item['menu_item_id']);

        $subtotal = $menuItem->price * $item['quantity'];

        OrderItem::create([
            'order_id'=>$order->id,
            'menu_item_id'=>$menuItem->id,
            'menu_item_name'=>$menuItem->name,
            'quantity'=>$item['quantity'],
            'unit_price'=>$menuItem->price,
            'subtotal'=>$subtotal
        ]);

        $total += $subtotal;
    }

    $order->update([
        'total_amount'=>$total
    ]);

    DB::commit();

    return response()->json([
        'success'=>true,
        'order_id'=>$order->id
    ]);
}
```

---

# 6. Admin API

Protected by JWT middleware.

---

## 6.1 Dashboard

GET

/admin/dashboard/stats


Response:

```json
{
 "today_orders":50,
 "pending_orders":5,
 "today_revenue":350,
 "popular_items":[]
}
```

Example Query:

```php
$todayOrders = Order::whereDate('created_at',today())->count();

$pendingOrders = Order::where('status','pending')->count();

$todayRevenue = Order::whereDate('created_at',today())
                     ->sum('total_amount');
```

---

## 6.2 Menu Management

### GET /admin/menu

Returns all menu items.

### POST /admin/menu

Create menu item.

### PUT /admin/menu/{id}

Update menu item.

### DELETE /admin/menu/{id}

Delete item.

---

## 6.3 Staff Management

Only **super_admin** allowed.

Middleware example:

```php
class SuperAdminMiddleware
{
    public function handle($request, Closure $next)
    {

        if(auth()->user()->role !== 'super_admin'){
            return response()->json([
                'message'=>'Forbidden'
            ],403);
        }

        return $next($request);
    }
}
```

---

## 6.4 Order Queue

GET

/admin/orders?status=pending


Response:

```json
{
 "orders":[
  {
   "id":101,
   "table":"5",
   "items":[]
  }
 ]
}
```

### Update Status

Chef:

POST /admin/orders/{id}/ready


Waiter:

POST /admin/orders/{id}/delivered


---

# 7. Frontend Structure

/public
   index.html
   identify.html
   menu.html
   cart.html
   success.html

/admin
   login.html
   dashboard.html
   menu.html
   queue.html
   staff.html
   reports.html
   settings.html
   profile.html

/js
   api.js
   utils.js
   customer/
      identify.js
      menu.js
      cart.js
      order.js
   admin/
      auth.js
      dashboard.js
      menu.js
      queue.js
      staff.js
      reports.js
      profile.js
      settings.js


---

# 8. Admin JavaScript Modules

## 8.1 auth.js

Handles authentication and token storage.

```javascript
const API_URL = "/api";

export function login(email,password){

    return fetch(API_URL + "/auth/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            email,
            password
        })
    })
    .then(r=>r.json())
    .then(data=>{

        if(data.success){

            localStorage.setItem(
                "cafe_admin_token",
                data.token
            );

            localStorage.setItem(
                "cafe_admin_role",
                data.user.role
            );

            localStorage.setItem(
                "cafe_admin_name",
                data.user.name
            );
        }

        return data;

    });

}

export function logout(){

    localStorage.removeItem("cafe_admin_token");
    localStorage.removeItem("cafe_admin_role");
    localStorage.removeItem("cafe_admin_name");

    window.location.href = "/admin/login.html";
}

export function getToken(){
    return localStorage.getItem("cafe_admin_token");
}

export function getUserRole(){
    return localStorage.getItem("cafe_admin_role");
}

export function isAuthenticated(){
    return !!getToken();
}

export function redirectIfNotAuthenticated(){

    if(!isAuthenticated()){
        window.location.href="/admin/login.html";
    }

}
```

---

## 8.2 dashboard.js

```javascript
import {getToken} from './auth.js'

export async function loadStats(){

    const res = await fetch('/api/admin/dashboard/stats',{
        headers:{
            "Authorization":"Bearer "+getToken()
        }
    });

    const data = await res.json();

    renderStatsCards(data);

}

export function renderStatsCards(stats){

    document.getElementById("todayOrders").innerText =
        stats.today_orders;

    document.getElementById("pendingOrders").innerText =
        stats.pending_orders;

    document.getElementById("todayRevenue").innerText =
        "$"+stats.today_revenue;

}
```

---

## 8.3 menu.js

Functions:

- loadMenuTable()
- deleteItem()
- openEditModal()
- submitForm()

Example:

```javascript
export async function loadMenuTable(){

    const res = await fetch('/api/admin/menu',{
        headers:{
            "Authorization":"Bearer "+getToken()
        }
    });

    const data = await res.json();

    const tbody = document.querySelector("#menuTable tbody");

    tbody.innerHTML="";

    data.data.forEach(item=>{

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td>
               <button onclick="openEditModal(${item.id})">Edit</button>
               <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

}
```

---

## 8.4 queue.js

```javascript
export async function loadNotes(statusFilter="pending"){

    const res = await fetch(
        `/api/admin/orders?status=${statusFilter}`,{
        headers:{
            "Authorization":"Bearer "+getToken()
        }
    });

    const data = await res.json();

    renderCards(data.orders);

}
```

Render cards example:

```javascript
function renderCards(orders){

    const container = document.getElementById("orders");

    container.innerHTML="";

    orders.forEach(order=>{

        const card = document.createElement("div");

        card.className="order-card";

        card.innerHTML = `
           <h3>Table ${order.table_number}</h3>
           <p>Order #${order.id}</p>
        `;

        container.appendChild(card);

    });

}
```

### Role-based buttons

```javascript
const role = getUserRole();

if(role === "chef"){
    showReadyButton();
}

if(role === "waiter"){
    showDeliveredButton();
}

if(role === "super_admin"){
    showReadyButton();
    showDeliveredButton();
}
```

---

## 8.5 staff.js

```javascript
export async function loadStaffTable(){

    const res = await fetch("/api/admin/staff",{
        headers:{
            "Authorization":"Bearer "+getToken()
        }
    });

    if(res.status === 403){
        alert("Access denied");
        return;
    }

    const data = await res.json();

    renderTable(data);

}
```

---

## 8.6 reports.js

```javascript
export async function loadPopularItems(range){

    const res = await fetch(
        `/api/admin/reports/popular?range=${range}`,{
        headers:{
            "Authorization":"Bearer "+getToken()
        }
    });

    const data = await res.json();

    renderChart(data);

}
```

---

## 8.7 profile.js

```javascript
export async function changePassword(oldPassword,newPassword){

    const res = await fetch("/api/admin/profile/password",{
        method:"POST",
        headers:{
            "Authorization":"Bearer "+getToken(),
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            old_password:oldPassword,
            new_password:newPassword
        })
    });

}
```

---

## 8.8 settings.js

```javascript
export async function generateQRCode(tableNumber){

    const url = `${location.origin}/identify.html?table=${tableNumber}`;

    const qr = new QRCode(
        document.getElementById("qr"),
        url
    );

}
```

---

# 9. localStorage Schema

Customer:

cafe_customer_name
cafe_customer_phone
cafe_customer_table


Admin:

cafe_admin_token
cafe_admin_role
cafe_admin_name


---

# 10. Authentication Flow

## Customer

1. Visit `identify.html`
2. Enter **name + phone**
3. Save to localStorage
4. Redirect to `menu.html`
5. menu.html checks localStorage
6. If missing → redirect back
7. Orders send name + phone to API

---

## Staff

1. Visit `/admin/login.html`
2. Submit email/password
3. Receive **JWT token**
4. Store in localStorage
5. Redirect to dashboard
6. All requests include:

Authorization: Bearer TOKEN


---

# 11. Role‑Based UI

Example sidebar control:

```javascript
const role = getUserRole();

if(role === 'super_admin'){
    document.querySelectorAll('.admin-only')
      .forEach(el => el.style.display='block');
}

if(role === 'chef'){
    document.querySelectorAll('.chef-only')
      .forEach(el => el.style.display='block');
}

if(role === 'waiter'){
    document.querySelectorAll('.waiter-only')
      .forEach(el => el.style.display='block');
}
```

---

# 12. Deployment Guide (Single Instance)

### Step 1 — Create Server

Provider options:

- DigitalOcean
- Linode
- Vultr

Recommended:

Ubuntu 22.04
2GB RAM


---

### Step 2 — Install Stack

```bash
sudo apt update
sudo apt install nginx
sudo apt install mysql-server
sudo apt install php8.2 php8.2-fpm php8.2-mysql
```

Install Composer:

```bash
sudo apt install composer
```

---

### Step 3 — Clone Project

```bash
git clone https://repo-url/cafe-system.git
cd cafe-system
```

---

### Step 4 — Configure Environment

```bash
cp .env.example .env
```

Edit:

DB_DATABASE=cafe_db
DB_USERNAME=root
DB_PASSWORD=password


Generate key:

php artisan key:generate


---

### Step 5 — Run Migrations

php artisan migrate


---

### Step 6 — Seed Default Admin

Seeder example:

```php
User::create([
'name'=>'Admin',
'email'=>'admin@cafe.com',
'password'=>bcrypt('password'),
'role'=>'super_admin'
]);
```

Run:

php artisan db:seed


---

### Step 7 — Configure Nginx

Example:

```nginx
server {

    listen 80;

    server_name cafe-domain.com;

    root /var/www/cafe/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {

        include snippets/fastcgi-php.conf;

        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

}
```

Restart:

sudo systemctl restart nginx


---

### Step 8 — CORS (Optional)

In `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => ['*'],
```

---

### Step 9 — Upload Assets

Upload:

- Café logo
- Menu images

---

### Step 10 — Configure Settings

Admin panel → Settings page.

Configure:

- café name
- opening hours
- currency
- table QR codes

---

# 13. MVP Delivery Checklist

## Backend Setup

- Install Laravel
- Configure JWT auth
- Create migrations
- Create models
- Create API routes
- Add middleware
- Implement order logic

## Database

- Users table
- Categories
- Menu items
- Orders
- Order items
- Settings

## API

- Auth endpoints
- Menu endpoint
- Create order
- Admin dashboard
- Order queue
- Menu CRUD
- Staff CRUD
- Reports endpoint

## Middleware

- JWT authentication
- Role middleware
- Super admin guard

## Customer Frontend

- Identify page
- Menu page
- Cart
- Checkout
- Success page

## Admin Frontend

- Login
- Dashboard
- Menu manager
- Order queue
- Staff manager
- Reports
- Settings
- Profile

## Testing

- Order creation
- Queue updates
- Role permissions
- Admin login
- Menu loading

## Deployment

- Server setup
- Database migration
- Seed admin
- Configure nginx
- Test QR ordering

---

# 14. Future Features (v2)

Possible improvements:

### Real‑Time Orders

Use:

- Laravel WebSockets
- Pusher

Kitchen sees orders instantly.

---

### Payment Integration

Add:

- Stripe
- Square
- Apple Pay
- Google Pay

---

### SMS Notifications

Notify customer:

Your order is ready.


Using:

- Twilio
- local SMS gateway

---

### Multi‑Language

Add translations for:

- English
- Arabic
- Persian

---

### Printable QR Codes

Admin page generates **PDF sheet of table QR codes**.

---

### Advanced Reports

Add analytics:

- best selling items
- revenue by day
- hourly demand

---

### Inventory Tracking

Track ingredients and stock alerts.

---

### Multi‑Location (Enterprise Upgrade)

Each café runs separate instance currently.

Future version could support:

- multiple branches
- central reporting
- branch-level staff.

---

**End of Specification**