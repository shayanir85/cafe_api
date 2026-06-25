# Cafe API Routes Documentation

**Base URL:** `http://your-domain.com/api/v1`

**Auth:** All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <sanctum_token>
```

**Roles:**
- `super_admin` — full access
- `admin` — can access admin routes
- No role (customer) — can only access public routes

---

## 1. Auth Routes (`/api/v1/auth`)

### POST `/auth/login`
**Auth:** None (throttled: 5 requests per minute)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No* | User email (required if `phone_number` is not provided) |
| `phone_number` | string | No* | 11 digits max (required if `email` is not provided) |
| `password` | string | Yes | Min 8 characters |

**Response (200):**
```json
{
  "message": "successfully logged in",
  "token": "1|abc123...",
  "name": "user name",
  "role": "admin"
}
```
**Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### POST `/auth/logout`
**Auth:** `auth:sanctum`

No body required.

**Response (200):**
```json
{
  "message": "Successfully logged out",
  "result": true
}
```

---

### POST `/auth/sanctum/user`
**Auth:** `auth:sanctum`

No body required. Returns the authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John",
    "email": "john@example.com",
    "phone_number": "09123456789",
    "role": "admin",
    "last_login": "2026-06-17T10:00:00.000000Z",
    "created_at": "2026-06-01T10:00:00.000000Z",
    "updated_at": "2026-06-17T10:00:00.000000Z"
  }
}
```

---

### POST `/auth/register`
**Auth:** `auth:sanctum`, `super_admin`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Max 255 |
| `email` | string | Yes | Must be unique |
| `phone_number` | string | Yes | Max 11, must be unique |
| `password` | string | Yes | Min 8, must be confirmed |
| `password_confirmation` | string | Yes | Must match `password` |

**Response (200):**
```json
{
  "user": {
    "id": 2,
    "name": "Jane",
    "email": "jane@example.com",
    "phone_number": "09123456788",
    "role": "admin",
    "created_at": "2026-06-17T10:00:00.000000Z",
    "updated_at": "2026-06-17T10:00:00.000000Z"
  },
  "token": "2|def456..."
}
```

---

### POST `/auth/resetPassword`
**Auth:** `auth:sanctum`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current password |
| `newPassword` | string | Yes | Min 8 characters |
| `newPassword_confirmation` | string | Yes | Must match `newPassword` |

**Response (200):**
```json
{
  "message": "password updated successfully"
}
```
**Response (422):**
```json
{
  "message": "current password is incorrect"
}
```

---

## 2. Super Admin Dashboard Routes (`/api/v1/Dashboard`)
**Auth:** `auth:sanctum`, `super_admin`

### GET `/Dashboard/userLoginStatus`
Returns all users with their login status.

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com",
      "role": "super_admin",
      "last_login": "2026-06-17T10:00:00.000000Z",
      "is_active": 1,
      "created_at": "2026-06-01T...Z"
    }
  ]
}
```

---

### GET `/Dashboard/users`
List all users.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John",
    "email": "john@example.com",
    "phone_number": "09123456789",
    "role": "admin",
    "last_login": "...",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### POST `/Dashboard/users`
Same as `/auth/register` (creates a new user). See above for payload.

---

### PUT `/Dashboard/users/{id}`
Update a user by ID.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Max 255 |
| `email` | string | No | Must be unique (excludes current user's email) |
| `phone_number` | string | No | Max 11 |
| `password` | string | No | Min 8 |

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone_number": "09123456789",
  "role": "admin",
  "updated_at": "2026-06-17T10:00:00.000000Z"
}
```

---

### DELETE `/Dashboard/users/{id}`
Delete a user by ID.

**Response (200):**
```json
{
  "message": "user successfully deleted",
  "result": "user deleted successfully"
}
```

---

### DELETE `/Dashboard/menu-items/{menu_item}`
Delete a menu item by ID.

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

## 3. Admin Dashboard Routes (`/api/v1/Dashboard/admin`)
**Auth:** `auth:sanctum`, `admin` (also accessible by `super_admin`)

### GET `/Dashboard/admin/CategoryStatus`
**Response (200):**
```json
{
  "category_count": 5
}
```

---

### GET `/Dashboard/admin/MenuStatus`
**Response (200):**
```json
{
  "menu_items_count": 20
}
```

---

### GET `/Dashboard/admin/category`
List all categories (with admin context — includes inactive).

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Beverages",
    "is_active": true,
    "display_order": 1,
    "created_at": "...",
    "updated_at": "...",
    "menu_items": [
      {
        "id": 1,
        "category_id": 1,
        "name": "Tea",
        ...
      }
    ]
  }
]
```

---

### POST `/Dashboard/admin/category`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Min 3 characters |
| `is_active` | boolean | No | Default: true |
| `display_order` | integer | No | Default: 0 |

**Response (201):**
```json
{
  "success": 1,
  "data": {
    "id": 3,
    "name": "Snacks",
    "is_active": true,
    "display_order": 2,
    "updated_at": "...",
    "created_at": "..."
  }
}
```

---

### GET `/Dashboard/admin/category/{category}`
**Response (200):**
```json
{
  "category": {
    "id": 1,
    "name": "Beverages",
    "is_active": true,
    "display_order": 1,
    "created_at": "...",
    "updated_at": "...",
    "menu_items": [...]
  }
}
```

---

### PUT `/Dashboard/admin/category/{category}`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Min 3 |
| `is_active` | boolean | No | — |
| `display_order` | integer | No | Min 1 |

**Response (200):**
```json
{
  "message": "updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Name",
    ...
  }
}
```

---

### DELETE `/Dashboard/admin/category/{category}`
**Response (200):**
```json
{
  "message": "deleted the category"
}
```

---

### POST `/Dashboard/admin/menu-items`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | integer | Yes | Must exist in `categories` table |
| `name` | string | Yes | Max 255 |
| `description` | string | No | — |
| `price` | numeric | Yes | Min 0 |
| `image` | file | No | jpg, jpeg, png, webp — Max 5MB |
| `is_available` | boolean | No | Default: true |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "category_id": 1,
    "name": "Espresso",
    "description": "Strong coffee",
    "price": "5.00",
    "image_url": "http://domain.com/images/menu-items/avatar_10.jpg",
    "is_available": true,
    "category": { "id": 1, "name": "Beverages", ... }
  },
  "message": "Menu item created successfully"
}
```

---

### PUT `/Dashboard/admin/menu-items/{menu_item}`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | integer | No | Must exist in `categories` |
| `name` | string | No | Max 255 |
| `description` | string | No | — |
| `price` | numeric | No | Min 0 |
| `image` | file | No | jpg, jpeg, png, webp — Max 5MB |
| `is_available` | boolean | No | — |

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Menu item updated successfully"
}
```

---

### PUT `/Dashboard/admin/menu-items/{menu_item}/toggle`
Toggles `is_available` on a menu item.

**Response (200):**
```json
{
  "success": true,
  "data": { "...", "is_available": false },
  "message": "Menu item updated successfully"
}
```

---

## 4. Public Routes (`/api/v1`)
**Auth:** None

### GET `/category`
Returns active categories with their menu items, ordered by `display_order`.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Beverages",
    "is_active": true,
    "display_order": 1,
    "created_at": "...",
    "updated_at": "...",
    "menu_items": [
      {
        "id": 1,
        "category_id": 1,
        "name": "Tea",
        "description": "Hot tea",
        "price": "2.50",
        "image_url": null,
        "is_available": true,
        "display_order": 0,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
]
```

---

### GET `/menu-items`
Returns available menu items only (`is_available = 1`).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "name": "Tea",
      "description": "Hot tea",
      "price": "2.50",
      "image_url": null,
      "is_available": true,
      "display_order": 0,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### GET `/menu-items/{id}`
Get a single menu item by ID (returns 404 if not found).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category_id": 1,
    "name": "Tea",
    "description": "Hot tea",
    "price": "2.50",
    "image_url": "http://domain.com/images/menu-items/avatar_1.jpg",
    "is_available": true,
    "display_order": 0,
    "created_at": "...",
    "updated_at": "...",
    "category": {
      "id": 1,
      "name": "Beverages",
      "is_active": true,
      "display_order": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

---

## 5. Commented-Out / Inactive Routes (Not Yet Available)

These routes exist in the controller but are **not registered** in `api.php`:

### POST `/orders`
Create a new order (no auth).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `table_number` | integer | Yes | Min 1 |
| `customer_name` | string | Yes | Max 255 |
| `customer_phone` | string | Yes | Exactly 11 digits |
| `notes` | string | No | — |
| `items` | array | Yes | Min 1 item |
| `items.*.menu_item_id` | integer | Yes | Must exist in `menu_items` |
| `items.*.quantity` | integer | Yes | Min 1 |
| `items.*.notes` | string | No | — |

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Order created successfully"
}
```

---

### GET `/admin/orders`
List today's orders with optional filters.

**Auth:** `auth:sanctum`, `admin`

Query parameters: `status`, `table_number`, `paginate`, `per_page` (default 15).

---

### GET `/orders/{id}`
**Auth:** `auth:sanctum`, `admin`

Get a single order with items.

---

### PATCH `/admin/orders/{id}/status`
**Auth:** `auth:sanctum`, `admin`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | One of: `pending`, `ready`, `delivered` |

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Order status updated successfully"
}
```

---

### DELETE `/orders/{order}`
**Auth:** `auth:sanctum`, `admin`

Deletes an order and its items.

---

## Error Response Format (Validation Errors)

On validation failure, the API returns:
```json
{
  "success": false,
  "errors": "خطا در اعتبارسنجی",
  "message": {
    "field_name": ["Error message in Persian"]
  }
}
```

Status: **422**

---

## Access Denied

When a user lacks the required role:
```json
{
  "message": "Access denied - Admin only"
}
```

Status: **403**
