# Cafe API Routes Documentation

**Base URL:** `http://your-domain.com/api/v1`

**Auth header for protected routes**
```http
Authorization: Bearer <sanctum_token>
Accept: application/json
```

**Roles & Permissions (Spatie)**
- `super_admin`: all permissions + bypasses all checks via Gate
- `admin`: `manage-categories`, `manage-menu-items`, `manage-orders`, `view-dashboard`
- customer user: no admin permissions; can use public routes and authenticated cafe routes

**Middleware mapping**
| Old custom middleware | Replaced with |
|---|---|
| `SuperAdminMiddleware` | `permission:manage-users` / `permission:manage-roles` / etc. |
| `AdminMiddleware` | `permission:manage-categories` / `permission:manage-menu-items` / etc. |
| `CheckCafeOpenMiddleware` | `cafe_open` (kept) |

**Request body types**
- Most routes accept `application/json`
- Routes that upload images must use `multipart/form-data`
- For `multipart/form-data`, frontend should create a `FormData` object and append each field manually

Example frontend setup for `multipart/form-data`:
```js
const formData = new FormData();
formData.append('category_id', '1');
formData.append('name', 'Latte');
formData.append('description', 'Double shot');
formData.append('price', '120000');
formData.append('is_available', '1');
formData.append('image', fileInput.files[0]);

fetch('/api/v1/Dashboard/admin/menu-items', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});
```

---

## Auth Routes

### POST `/register`
- **Auth:** none
- **Throttle:** `5 requests / 1 minute`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | Yes | max 255 |
| `phone_number` | string | Yes | max 11, unique |
| `password` | string | Yes | min 8, confirmed |
| `password_confirmation` | string | Yes | must match `password` |

**Example request**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone_number": "09123456789",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

**Example response `200`**
```json
{
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "09123456789",
    "last_login": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z"
  },
  "token": "2|example_token"
}
```

**Example validation error `422`**
```json
{
  "success": false,
  "errors": "خطا در اعتبارسنجی",
  "message": {
    "email": [
      "این ایمیل قبلاً ثبت شده است"
    ]
  }
}
```

---

### POST `/login`
- **Auth:** none
- **Throttle:** `5 requests / 1 minute`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `phone_number` | string | Yes | max 11 |
| `password` | string | Yes | min 8 |

**Example request**
```json
{
  "phone_number": "09123456789",
  "password": "secret123"
}
```

**Example response `200`**
```json
{
  "message": "successfully logged in",
  "token": "2|example_token",
  "name": "Jane Doe",
  "roles": ["admin"]
}
```

**Example error `401`**
```json
{
  "message": "Invalid credentials"
}
```

---

### POST `/auth/sanctum/user`
- **Auth:** `auth:sanctum`
- **Content-Type:** no body required

**Example request**
```json
{}
```

**Example response `200`**
```json
{
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "09123456789",
    "last_login": "2025-01-01T12:00:00.000000Z",
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T12:00:00.000000Z"
  }
}
```

---

### POST `/auth/resetPassword`
- **Auth:** `auth:sanctum`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `password` | string | Yes | current password |
| `newPassword` | string | Yes | min 8 |
| `newPassword_confirmation` | string | Yes | must match `newPassword` |

**Example request**
```json
{
  "password": "secret123",
  "newPassword": "newsecret123",
  "newPassword_confirmation": "newsecret123"
}
```

**Example response `200`**
```json
{
  "message": "password updated successfully"
}
```

**Example error `422`**
```json
{
  "message": "current password is incorrect"
}
```

---

### POST `/auth/logout`
- **Auth:** `auth:sanctum`
- **Content-Type:** no body required

**Example request**
```json
{}
```

**Example response `200`**
```json
{
  "message": "Successfully logged out",
  "result": true
}
```

---

## OTP Routes

### POST `/auth/send-otp`
- **Auth:** none
- **Throttle:** `3 requests / 60 seconds`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `phone_number` | string | Yes | 10-11 digits |

**Example request**
```json
{
  "phone_number": "09123456789"
}
```

**Example response `200`**
```json
{
  "success": true,
  "message": "کد تأیید با موفقیت ارسال شد"
}
```

---

### POST `/auth/verify-otp`
- **Auth:** none
- **Throttle:** `5 requests / 300 seconds`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `phone_number` | string | Yes | 10-11 digits |
| `otp` | string | Yes | 4 digits |

**Example request**
```json
{
  "phone_number": "09123456789",
  "otp": "1234"
}
```

**Example response `200`**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

---

### POST `/auth/resend-otp`
- **Auth:** none
- **Throttle:** `2 requests / 60 seconds`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `phone_number` | string | Yes | 10-11 digits |

**Example request**
```json
{
  "phone_number": "09123456789"
}
```

**Example response `200`**
```json
{
  "success": true,
  "message": "کد تأیید مجدداً ارسال شد"
}
```

---

## Super Admin Dashboard Routes

Base prefix: `/Dashboard`

All routes in this section require `auth:sanctum`.
Access is controlled via Spatie permissions (requires `permission:manage-users` for user management, `permission:toggle-cafe` for cafe toggle, `permission:manage-menu-items` for menu item delete).

### GET `/Dashboard/users`
- **Required permission:** `manage-users`

**Input:** none

Returns all users with their assigned roles.

**Example response `200`**
```json
{
  "id": 1,
  "name": "Super Admin",
  "email": "super@example.com",
  "phone_number": "09120000000",
  "last_login": "2025-01-01T12:00:00.000000Z",
  "created_at": "2025-01-01T10:00:00.000000Z",
  "updated_at": "2025-01-01T12:00:00.000000Z",
  "roles": [
    {
      "id": 1,
      "name": "super_admin",
      "guard_name": "web"
    }
  ]
}
```

---

### POST `/Dashboard/users`
- **Required permission:** `manage-users`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | Yes | max 255 |
| `email` | string | Yes | valid email, unique |
| `phone_number` | string | Yes | max 11, unique |
| `password` | string | Yes | min 8, confirmed |
| `password_confirmation` | string | Yes | must match `password` |

**Example request**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "phone_number": "09121112222",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

**Example response `200`**
```json
{
  "user": {
    "id": 3,
    "name": "Admin User",
    "email": "admin@example.com",
    "phone_number": "09121112222",
    "last_login": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z"
  },
  "token": "3|example_token"
}
```

---

### PUT `/Dashboard/users/{id}`
- **Required permission:** `manage-users`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | No | max 255 |
| `email` | string | No | valid email, unique except current user |
| `phone_number` | string | No | max 11 |
| `password` | string | No | min 8 |

**Example request**
```json
{
  "name": "Updated Admin",
  "email": "updated-admin@example.com",
  "phone_number": "09123334444"
}
```

**Example response `200`**
```json
{
  "id": 3,
  "name": "Updated Admin",
  "email": "updated-admin@example.com",
  "phone_number": "09123334444",
  "last_login": null,
  "created_at": "2025-01-01T10:00:00.000000Z",
  "updated_at": "2025-01-01T11:00:00.000000Z"
}
```

---

### DELETE `/Dashboard/users/{id}`
- **Required permission:** `manage-users`

**Input:** route param `id`

**Example response `200`**
```json
{
  "message": "user successfully deleted",
  "result": "user deleted successfully"
}
```

---

### PATCH `/Dashboard/users/{user}/roles`
- **Required permission:** `manage-users`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---|
| `roles` | array | No | Array of role name strings (e.g., `["admin"]`) |

**Example request**
```json
{
  "roles": ["admin"]
}
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Admin User",
    "email": "admin@example.com",
    "phone_number": "09121112222",
    "last_login": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "roles": [
      {
        "id": 2,
        "name": "admin",
        "guard_name": "web",
        "created_at": "2025-01-01T10:00:00.000000Z",
        "updated_at": "2025-01-01T10:00:00.000000Z",
        "pivot": {
          "model_type": "App\\Models\\User",
          "model_id": 3,
          "role_id": 2
        }
      }
    ]
  },
  "message": "Roles updated successfully"
}
```

**Example error `403` (self-modification)**
```json
{
  "success": false,
  "message": "You cannot modify your own roles"
}
```

**Example validation error `422`**
```json
{
  "message": "The roles.0 field must exist in roles table.",
  "errors": {
    "roles.0": ["The selected roles.0 is invalid."]
  }
}
```

---

### POST `/Dashboard/cafe/toggle`
- **Required permission:** `toggle-cafe`

**Input:** none

**Example response `200` when closing**
```json
{
  "message": "cafe is closed"
}
```

**Example response `200` when opening**
```json
{
  "message": "cafe is open"
}
```

---

### DELETE `/Dashboard/menu-items/{menu_item}`
- **Required permission:** `manage-menu-items`

**Input:** route param `menu_item`

**Example response `200`**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

## Admin Dashboard Routes

Base prefix: `/Dashboard/admin`

All routes in this section require `auth:sanctum`.
Access is controlled via Spatie permissions (see each route).

### GET `/Dashboard/admin/CategoryStatus`
- **Required permission:** `view-dashboard`

**Input:** none

**Example response `200`**
```json
{
  "category_count": 5
}
```

---

### GET `/Dashboard/admin/MenuStatus`
- **Required permission:** `view-dashboard`

**Input:** none

**Example response `200`**
```json
{
  "menu_items_count": 24
}
```

---

### GET `/Dashboard/admin/category`
- **Required permission:** `manage-categories`

**Input:** none

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Coffee",
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "menu_items": [
        {
          "id": 10,
          "category_id": 1,
          "name": "Latte",
          "description": "Hot latte",
          "price": "120000.00",
          "image_url": null,
          "is_available": true,
          "created_at": "2025-01-01T10:00:00.000000Z",
          "updated_at": "2025-01-01T10:00:00.000000Z"
        }
      ]
    }
  ]
}
```

---

### POST `/Dashboard/admin/category`
- **Required permission:** `manage-categories`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | Yes | min 3 |
| `is_active` | boolean | No | defaults to `true` |
| `display_order` | integer | No | defaults to `0` |

**Example request**
```json
{
  "name": "Desserts",
  "is_active": true,
  "display_order": 3
}
```

**Example response `201`**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "Desserts",
    "is_active": true,
    "display_order": 3,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z"
  }
}
```

---

### GET `/Dashboard/admin/category/{category}`
- **Required permission:** `manage-categories`

**Input:** route param `category`

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Coffee",
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z"
  }
}
```

---

### PUT `/Dashboard/admin/category/{category}`
- **Required permission:** `manage-categories`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | No | if sent, min 3 |
| `is_active` | boolean | No |  |
| `display_order` | integer | No | min 1 |

**Example request**
```json
{
  "name": "Hot Drinks",
  "is_active": true,
  "display_order": 1
}
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Hot Drinks",
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z"
  },
  "message": "updated successfully"
}
```

---

### DELETE `/Dashboard/admin/category/{category}`
- **Required permission:** `manage-categories`

**Input:** route param `category`

**Example response `200`**
```json
{
  "success": true,
  "message": "deleted the category"
}
```

---

### POST `/Dashboard/admin/menu-items`
- **Required permission:** `manage-menu-items`
- **Content-Type:** `multipart/form-data`

**Frontend guidance**
- Use `FormData`
- Do not send JSON if you are uploading `image`
- Send booleans as `1` / `0` or `true` / `false`
- `image` must be a real file object

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `category_id` | integer | Yes | must exist in `categories` |
| `name` | string | Yes | max 255 |
| `description` | string | No | nullable |
| `price` | number | Yes | min 0 |
| `image` | file | No | `jpg`, `jpeg`, `png`, `webp`, max 5 MB |
| `is_available` | boolean | No | optional |

**Example form-data**
```text
category_id: 1
name: Iced Americano
description: Cold coffee
price: 90000
is_available: 1
image: [binary file]
```

**Example response `201`**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "category_id": 1,
    "name": "Iced Americano",
    "description": "Cold coffee",
    "price": "90000.00",
    "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
    "is_available": true,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z",
    "category": {
      "id": 1,
      "name": "Coffee",
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    }
  },
  "message": "Menu item created successfully"
}
```

---

### PUT `/Dashboard/admin/menu-items/{menu_item}`
- **Required permission:** `manage-menu-items`
- **Content-Type:** `multipart/form-data` if sending `image`, otherwise `application/json`

**Frontend guidance**
- If you update the image, use `FormData`
- If no file is sent, JSON is fine
- For `PUT` with `FormData`, some frontends use `POST` plus `_method=PUT` depending on the HTTP client/backend setup

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `category_id` | integer | No | must exist in `categories` |
| `name` | string | No | max 255 |
| `description` | string | No | nullable |
| `price` | number | No | min 0 |
| `image` | file | No | `jpg`, `jpeg`, `png`, `webp`, max 5 MB |
| `is_available` | boolean | No | optional |

**Example form-data**
```text
name: Iced Latte
price: 110000
is_available: 1
image: [binary file]
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "category_id": 1,
    "name": "Iced Latte",
    "description": "Cold coffee",
    "price": "110000.00",
    "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
    "is_available": true,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "category": {
      "id": 1,
      "name": "Coffee",
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    }
  },
  "message": "Menu item updated successfully"
}
```

---

### PUT `/Dashboard/admin/menu-items/{menu_item}/toggle`
- **Required permission:** `manage-menu-items`

**Input:** none

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "category_id": 1,
    "name": "Iced Latte",
    "description": "Cold coffee",
    "price": "110000.00",
    "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
    "is_available": false,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "category": {
      "id": 1,
      "name": "Coffee"
    }
  },
  "message": "Menu item updated successfully"
}
```

---

### GET `/Dashboard/admin/orders`
- **Required permission:** `manage-orders`
- **Query params:** `status`, `table_number`, `date`, `is_out`, `user_id`, `min_amount`, `max_amount`, `search`, `paginate`, `per_page`

**Input**

| Query Param | Type | Required | Notes |
|---|---|---|---:|---:|
| `status` | string | No | `pending`, `ready`, `delivered` |
| `table_number` | string | No | exact match |
| `date` | string | No | date string (parsed by Carbon); defaults to today if omitted |
| `is_out` | boolean | No | filter delivery vs dine-in |
| `user_id` | integer | No | filter by staff who took the order |
| `min_amount` | number | No | minimum total amount |
| `max_amount` | number | No | maximum total amount |
| `search` | string | No | searches id, table_number, and notes |
| `paginate` | boolean | No | when `true`, response becomes paginated |
| `per_page` | integer | No | default `20` |

**Example request**
```http
GET /api/v1/Dashboard/admin/orders?status=pending&paginate=true&per_page=10
```

**Example response `200` without pagination**
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "user_id": 2,
      "table_number": "4",
      "status": "pending",
      "total_amount": "210000.00",
      "notes": "Less sugar",
      "is_out": false,
      "address": null,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "order_items": [
        {
          "id": 15,
          "order_id": 8,
          "menu_item_id": 12,
          "quantity": 2,
          "unit_price": "90000.00",
          "subtotal": "180000.00",
          "created_at": "2025-01-01T10:00:00.000000Z",
          "updated_at": "2025-01-01T10:00:00.000000Z",
          "menu_item": {
            "id": 12,
            "name": "Iced Latte"
          }
        }
      ]
    }
  ]
}
```

---

### PATCH `/Dashboard/admin/orders/{order}/status`
- **Required permission:** `manage-orders`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `status` | string | Yes | one of `pending`, `ready`, `delivered` |

**Example request**
```json
{
  "status": "ready"
}
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": "4",
    "status": "ready",
    "total_amount": "210000.00",
    "notes": "Less sugar",
    "is_out": false,
    "address": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "order_items": [
      {
        "id": 15,
        "menu_item_id": 12,
        "quantity": 2,
        "unit_price": "90000.00",
        "subtotal": "180000.00",
        "menu_item": {
          "id": 12,
          "name": "Iced Latte",
          "category": {
            "id": 1,
            "name": "Coffee"
          }
        }
      }
    ]
  },
  "message": "وضعیت سفارش با موفقیت به‌روزرسانی شد."
}
```

---

## Role Management Routes (Owner / Super Admin)

All routes in this section require:
- `auth:sanctum`
- `permission:manage-roles`

### GET `/permissions`

List all available permissions (read-only).

**Input:** none

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "manage-users",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 2,
      "name": "manage-roles",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 3,
      "name": "manage-categories",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 4,
      "name": "manage-menu-items",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 5,
      "name": "manage-orders",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 6,
      "name": "view-dashboard",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    },
    {
      "id": 7,
      "name": "toggle-cafe",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    }
  ]
}
```

---

### GET `/roles`

List all roles with their assigned permissions.

**Input:** none

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "super_admin",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "permissions": [
        {
          "id": 1,
          "name": "manage-users",
          "guard_name": "web"
        },
        {
          "id": 2,
          "name": "manage-roles",
          "guard_name": "web"
        },
        {
          "id": 3,
          "name": "manage-categories",
          "guard_name": "web"
        },
        {
          "id": 4,
          "name": "manage-menu-items",
          "guard_name": "web"
        },
        {
          "id": 5,
          "name": "manage-orders",
          "guard_name": "web"
        },
        {
          "id": 6,
          "name": "view-dashboard",
          "guard_name": "web"
        },
        {
          "id": 7,
          "name": "toggle-cafe",
          "guard_name": "web"
        }
      ]
    },
    {
      "id": 2,
      "name": "admin",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "permissions": [
        {
          "id": 3,
          "name": "manage-categories",
          "guard_name": "web"
        },
        {
          "id": 4,
          "name": "manage-menu-items",
          "guard_name": "web"
        },
        {
          "id": 5,
          "name": "manage-orders",
          "guard_name": "web"
        },
        {
          "id": 6,
          "name": "view-dashboard",
          "guard_name": "web"
        }
      ]
    },
    {
      "id": 3,
      "name": "user",
      "guard_name": "web",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "permissions": []
    }
  ]
}
```

---

### POST `/roles`

Create a new role with optional permissions.

- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | Yes | unique |
| `permissions` | array | No | array of permission name strings |

**Example request**
```json
{
  "name": "manager",
  "permissions": ["manage-categories", "manage-orders"]
}
```

**Example response `201`**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "manager",
    "guard_name": "web",
    "created_at": "2025-01-01T11:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "permissions": [
      {
        "id": 3,
        "name": "manage-categories",
        "guard_name": "web"
      },
      {
        "id": 5,
        "name": "manage-orders",
        "guard_name": "web"
      }
    ]
  },
  "message": "Role created successfully"
}
```

**Example validation error `422`**
```json
{
  "message": "The name field is required. (and 1 more error)",
  "errors": {
    "name": ["The name has already been taken."]
  }
}
```

---

### GET `/roles/{role}`

Show a specific role with its permissions.

**Input:** route param `role` (role ID)

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "admin",
    "guard_name": "web",
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z",
    "permissions": [
      {
        "id": 3,
        "name": "manage-categories",
        "guard_name": "web"
      },
      {
        "id": 4,
        "name": "manage-menu-items",
        "guard_name": "web"
      },
      {
        "id": 5,
        "name": "manage-orders",
        "guard_name": "web"
      },
      {
        "id": 6,
        "name": "view-dashboard",
        "guard_name": "web"
      }
    ]
  }
}
```

**Example error `404`**
```json
{
  "message": "No query results for model [Spatie\\Permission\\Models\\Role] 999"
}
```

---

### PUT `/roles/{role}`

Update a role name.

- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `name` | string | No | unique except current role |

**Example request**
```json
{
  "name": "supervisor"
}
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "supervisor",
    "guard_name": "web",
    "created_at": "2025-01-01T11:00:00.000000Z",
    "updated_at": "2025-01-01T11:30:00.000000Z"
  },
  "message": "Role updated successfully"
}
```

---

### DELETE `/roles/{role}`

Delete a role.

**Input:** route param `role` (role ID)

**Example response `200`**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

### GET `/roles/{role}/permissions`

Get all permissions assigned to a specific role.

**Input:** route param `role` (role ID)

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "manage-categories",
      "guard_name": "web"
    },
    {
      "id": 4,
      "name": "manage-menu-items",
      "guard_name": "web"
    },
    {
      "id": 5,
      "name": "manage-orders",
      "guard_name": "web"
    },
    {
      "id": 6,
      "name": "view-dashboard",
      "guard_name": "web"
    }
  ]
}
```

---

### PUT `/roles/{role}/permissions`

Sync permissions for a role (replaces all existing permissions with the given list).

- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `permissions` | array | Yes | array of permission name strings |

**Example request**
```json
{
  "permissions": ["manage-categories", "manage-menu-items", "manage-orders", "view-dashboard", "toggle-cafe"]
}
```

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "supervisor",
    "guard_name": "web",
    "created_at": "2025-01-01T11:00:00.000000Z",
    "updated_at": "2025-01-01T11:30:00.000000Z",
    "permissions": [
      {
        "id": 3,
        "name": "manage-categories",
        "guard_name": "web"
      },
      {
        "id": 4,
        "name": "manage-menu-items",
        "guard_name": "web"
      },
      {
        "id": 5,
        "name": "manage-orders",
        "guard_name": "web"
      },
      {
        "id": 6,
        "name": "view-dashboard",
        "guard_name": "web"
      },
      {
        "id": 7,
        "name": "toggle-cafe",
        "guard_name": "web"
      }
    ]
  },
  "message": "Permissions updated successfully"
}
```

---

## Public Routes

### GET `/category`

Returns active categories only, with related menu items.

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Coffee",
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "menu_items": [
        {
          "id": 12,
          "category_id": 1,
          "name": "Iced Latte",
          "description": "Cold coffee",
          "price": "110000.00",
          "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
          "is_available": true,
          "created_at": "2025-01-01T10:00:00.000000Z",
          "updated_at": "2025-01-01T11:00:00.000000Z"
        }
      ]
    }
  ]
}
```

---

### GET `/menu-items`

Returns only available menu items.

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "category_id": 1,
      "name": "Iced Latte",
      "description": "Cold coffee",
      "price": "110000.00",
      "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
      "is_available": true,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T11:00:00.000000Z"
    }
  ]
}
```

---

### GET `/menu-items/{id}`

Returns one menu item with its category.

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "category_id": 1,
    "name": "Iced Latte",
    "description": "Cold coffee",
    "price": "110000.00",
    "image_url": "http://your-domain.com/images/menu-items/avatar_12.jpg",
    "is_available": true,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T11:00:00.000000Z",
    "category": {
      "id": 1,
      "name": "Coffee",
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z"
    }
  }
}
```

---

## Cafe Routes

Base prefix: `/cafe`

All routes in this section also pass through `cafe_open` middleware.

### POST `/cafe/orders`
- **Auth:** `auth:sanctum`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---:|
| `table_number` | string | No (see is_out) | required for dine-in (`is_out: false`) |
| `is_out` | boolean | Yes | `true` = delivery, `false` = dine-in |
| `address` | string | No (see is_out) | required for delivery (`is_out: true`), max 255 |
| `notes` | string | No | nullable |
| `items` | array | Yes | min 1 item |
| `items[].menu_item_id` | integer | Yes | must exist |
| `items[].quantity` | integer | Yes | min 1 |
| `items[].notes` | string | No | accepted by validation but not stored in `order_items` currently |

**Example request (dine-in)**
```json
{
  "table_number": "A5",
  "is_out": false,
  "notes": "No cinnamon",
  "items": [
    {
      "menu_item_id": 12,
      "quantity": 2,
      "notes": "Extra ice"
    },
    {
      "menu_item_id": 15,
      "quantity": 1
    }
  ]
}
```

**Example request (delivery)**
```json
{
  "is_out": true,
  "address": "123 Main St, Apt 4B",
  "notes": "Ring the bell",
  "items": [
    {
      "menu_item_id": 12,
      "quantity": 2
    }
  ]
}
```

**Example response `201` with payment URL**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": "A5",
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon",
    "is_out": false,
    "address": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z",
    "order_items": [
      {
        "id": 15,
        "order_id": 8,
        "menu_item_id": 12,
        "quantity": 2,
        "unit_price": "90000.00",
        "subtotal": "180000.00",
        "created_at": "2025-01-01T10:00:00.000000Z",
        "updated_at": "2025-01-01T10:00:00.000000Z",
        "menu_item": {
          "id": 12,
          "name": "Iced Latte",
          "category": {
            "id": 1,
            "name": "Coffee"
          }
        }
      }
    ]
  },
  "payment_url": "https://payment-gateway.example/start/authority-code",
  "authority": "A00000000000000000000000000123456789",
  "message": "سفارش ایجاد شد. لطفاً پرداخت را انجام دهید."
}
```

**Example response `201` when gateway is unavailable**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": "A5",
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon",
    "is_out": false,
    "address": null
  },
  "payment_url": null,
  "authority": null,
  "message": "سفارش ایجاد شد اما درگاه پرداخت در دسترس نیست."
}
```

---

### GET `/cafe/orders/{order}`
- **Auth:** `auth:sanctum`

**Input:** route param `order` (route model binding)

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": "A5",
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon",
    "is_out": false,
    "address": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z",
    "order_items": [
      {
        "id": 15,
        "menu_item_id": 12,
        "quantity": 2,
        "unit_price": "90000.00",
        "subtotal": "180000.00",
        "menu_item": {
          "id": 12,
          "name": "Iced Latte",
          "category": {
            "id": 1,
            "name": "Coffee"
          }
        }
      }
    ]
  }
}
```

---

### GET `/cafe/my-orders`
- **Auth:** `auth:sanctum`
- **Description:** Returns all orders belonging to the authenticated customer, ordered by newest first.

**Input:** none

**Example response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "user_id": 2,
      "table_number": "A5",
      "status": "pending",
      "total_amount": "210000.00",
      "notes": "No cinnamon",
      "is_out": false,
      "address": null,
      "jalali_created_at": "1403/10/11 13:30:00",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-01T10:00:00.000000Z",
      "order_items": [
        {
          "id": 15,
          "order_id": 8,
          "menu_item_id": 12,
          "quantity": 2,
          "unit_price": "90000.00",
          "subtotal": "180000.00",
          "menu_item": {
            "id": 12,
            "name": "Iced Latte"
          }
        }
      ]
    }
  ]
}
```

---

### POST `/cafe/payments/request`
- **Auth:** `auth:sanctum`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---|---:|---|
| `order_id` | integer | Yes | must exist in `orders` |

**Example request**
```json
{
  "order_id": 8
}
```

**Example response `200`**
```json
{
  "success": true,
  "Authority": "A00000000000000000000000000123456789",
  "payment_url": "https://payment-gateway.example/start/authority-code"
}
```

**Example error `400`**
```json
{
  "success": false,
  "message": "این سفارش قبلاً پرداخت شده است."
}
```

**Example error `400` (gateway error)**
```json
{
  "success": false,
  "message": "خطا در اتصال به درگاه پرداخت"
}
```

---

### GET `/cafe/payments/verify`
- **Auth:** none (public callback from payment gateway)
- **Input source:** query string from payment gateway callback
- **Response type:** redirect, not JSON

**Expected query params**

| Query Param | Type | Required | Notes |
|---|---|---|---:|---|
| `Authority` | string | Yes | gateway authority code |
| `Status` | string | Yes | must be `OK` for successful verification attempt |

**Example callback URL**
```http
GET /api/v1/cafe/payments/verify?Authority=A00000000000000000000000000123456789&Status=OK
```

**Example success redirect**
```text
{FRONTEND_URL}/order/8?payment=success&ref=123456789
```

**Example failed redirect**
```text
{FRONTEND_URL}?payment=failed&message=پرداخت+لغو+شد
```

---

## Real-time WebSockets & Laravel Reverb

Laravel Reverb provides a WebSocket backend for real-time events.

### 1. Connecting with Laravel Echo

Install and configure `laravel-echo` and `pusher-js` on the frontend:

```bash
npm install laravel-echo pusher-js
```

```javascript
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'my-cafe-app-key-2024',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${API_BASE}/api/v1/broadcasting/auth`,
  auth: {
    headers: {
      get Authorization() {
        const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('customer_token')
        return token ? `Bearer ${token}` : ''
      },
      Accept: 'application/json',
    },
  },
})
```

---

### 2. Channels and Events

#### **A. Admin / Staff Orders (`private('admin.orders')`)**
- **Authorization:** Authenticated users with the `manage-orders` permission (e.g. `super_admin`, `admin`, `waiter`, `chef`).
- **Events:**
  - **`OrderCreated`**: Dispatched when a customer creates a new order.
    ```javascript
    echo.private('admin.orders').listen('OrderCreated', (event) => {
      console.log('New Order:', event.order)
      console.log('Payment details:', event.payment)
    })
    ```
  - **`OrderStatusUpdated`**: Dispatched when an order's status changes (`pending`, `ready`, `delivered`).
    ```javascript
    echo.private('admin.orders').listen('OrderStatusUpdated', (event) => {
      console.log('Updated Order:', event.order)
    })
    ```

#### **B. Customer Order Tracking (`private('user.orders.{userId}')`)**
- **Authorization:** The authenticated customer matching `userId`.
- **Events:**
  - **`OrderStatusUpdated`**: Dispatched when their specific order status changes.
    ```javascript
    echo.private(`user.orders.${userId}`).listen('OrderStatusUpdated', (event) => {
      console.log('Your order status updated:', event.order.status)
    })
    ```

---

## Notes For Frontend

- Use `application/json` for all non-file routes
- Use `multipart/form-data` only for menu item create/update when sending `image`
- Do not manually set `Content-Type` when using `FormData`; browser/client will set the correct boundary
- For booleans in `FormData`, prefer `1` and `0`
- Order creation accepts `items[].notes`, but backend currently does not save that field in `order_items`
- `table_number` is a string (e.g. `"A5"`, `"B12"`), not an integer
- Order creation now requires `is_out` (boolean) and conditionally requires `table_number` or `address`
- Order responses include `is_out`, `address`, and order creation responses include `authority`
- Login returns `roles` as an array (e.g. `["admin"]`) instead of a single `role` string
- The `role` column has been removed from the `users` table; roles are now managed via Spatie's pivot tables
- To assign a role to a user, use the Role Management API (owner only) or assign via the dashboard user management flow (requires manual extension)
- Super admin bypasses all permission checks automatically via `Gate::before`
- Deleting a role does NOT delete users assigned to that role — users simply become roleless
