# Cafe API Routes Documentation

**Base URL:** `http://your-domain.com/api/v1`

**Auth header for protected routes**
```http
Authorization: Bearer <sanctum_token>
Accept: application/json
```

**Roles**
- `super_admin`: full dashboard access
- `admin`: admin dashboard access
- customer user: can use public routes and authenticated cafe routes

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
|---|---|---:|---|
| `name` | string | Yes | max 255 |
| `email` | string | Yes | valid email, unique |
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
    "role": null,
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
|---|---|---:|---|
| `email` | string | Conditional | required if `phone_number` is missing |
| `phone_number` | string | Conditional | required if `email` is missing, max 11 |
| `password` | string | Yes | min 8 |

**Example request with email**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Example request with phone number**
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
  "role": "admin"
}
```

**Example error `401`**
```json
{
  "message": "Invalid credentials"
}
```

**Important note**
- Current backend login service checks user by `email` only. Sending only `phone_number` passes validation but will not log the user in unless backend logic is changed.

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
    "role": "admin",
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
|---|---|---:|---|
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

## Super Admin Dashboard Routes

Base prefix: `/Dashboard`

All routes in this section require:
- `auth:sanctum`
- `super_admin`

### GET `/Dashboard/userLoginStatus`

**Input:** none

**Example response `200`**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "super@example.com",
      "role": "super_admin",
      "last_login": "2025-01-01T12:00:00.000000Z",
      "is_active": 1,
      "created_at": "2025-01-01T10:00:00.000000Z"
    }
  ]
}
```

---

### GET `/Dashboard/users`

**Input:** none

**Example response `200`**
```json
[
  {
    "id": 1,
    "name": "Super Admin",
    "email": "super@example.com",
    "phone_number": "09120000000",
    "role": "super_admin",
    "last_login": "2025-01-01T12:00:00.000000Z",
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T12:00:00.000000Z"
  }
]
```

---

### POST `/Dashboard/users`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
    "role": null,
    "last_login": null,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-01T10:00:00.000000Z"
  },
  "token": "3|example_token"
}
```

---

### PUT `/Dashboard/users/{id}`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
  "role": null,
  "last_login": null,
  "created_at": "2025-01-01T10:00:00.000000Z",
  "updated_at": "2025-01-01T11:00:00.000000Z"
}
```

---

### DELETE `/Dashboard/users/{id}`

**Input:** route param `id`

**Example response `200`**
```json
{
  "message": "user successfully deleted",
  "result": "user deleted successfully"
}
```

---

### POST `/Dashboard/cafe/toggle`

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

All routes in this section require:
- `auth:sanctum`
- `admin`

### GET `/Dashboard/admin/CategoryStatus`

**Input:** none

**Example response `200`**
```json
{
  "category_count": 5
}
```

---

### GET `/Dashboard/admin/MenuStatus`

**Input:** none

**Example response `200`**
```json
{
  "menu_items_count": 24
}
```

---

### GET `/Dashboard/admin/category`

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
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
- **Content-Type:** `multipart/form-data`

**Frontend guidance**
- Use `FormData`
- Do not send JSON if you are uploading `image`
- Send booleans as `1` / `0` or `true` / `false`
- `image` must be a real file object

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
- **Content-Type:** `multipart/form-data` if sending `image`, otherwise `application/json`

**Frontend guidance**
- If you update the image, use `FormData`
- If no file is sent, JSON is fine
- For `PUT` with `FormData`, some frontends use `POST` plus `_method=PUT` depending on the HTTP client/backend setup

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
- **Query params:** `status`, `table_number`, `paginate`, `per_page`

**Input**

| Query Param | Type | Required | Notes |
|---|---|---:|---|
| `status` | string | No | `pending`, `ready`, `delivered` |
| `table_number` | integer | No | exact match |
| `paginate` | boolean | No | when `true`, response becomes paginated |
| `per_page` | integer | No | default `15` |

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
      "table_number": 4,
      "status": "pending",
      "total_amount": "210000.00",
      "notes": "Less sugar",
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

### PATCH `/Dashboard/admin/orders/{id}/status`
- **Content-Type:** `application/json`
- **Important:** route parameter is named `{id}` in routes file, but controller uses route model binding as `Order $order`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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
    "table_number": 4,
    "status": "ready",
    "total_amount": "210000.00",
    "notes": "Less sugar",
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
|---|---|---:|---|
| `table_number` | integer | Yes | min 1 |
| `notes` | string | No | nullable |
| `items` | array | Yes | min 1 item |
| `items[].menu_item_id` | integer | Yes | must exist |
| `items[].quantity` | integer | Yes | min 1 |
| `items[].notes` | string | No | accepted by validation but not stored in `order_items` currently |

**Example request**
```json
{
  "table_number": 4,
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

**Example response `201` with payment URL**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": 4,
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon",
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
    "table_number": 4,
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon"
  },
  "payment_url": null,
  "message": "سفارش ایجاد شد اما درگاه پرداخت در دسترس نیست."
}
```

---

### GET `/cafe/orders/{id}`
- **Auth:** `auth:sanctum`

**Input:** route param `id`

**Example response `200`**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "user_id": 2,
    "table_number": 4,
    "status": "pending",
    "total_amount": "210000.00",
    "notes": "No cinnamon",
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

### POST `/cafe/payments/request`
- **Auth:** `auth:sanctum`
- **Content-Type:** `application/json`

**Input**

| Field | Type | Required | Notes |
|---|---|---:|---|
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

**Example error `500`**
```json
{
  "success": false,
  "message": "خطا در اتصال به درگاه پرداخت: example error"
}
```

---

### GET `/cafe/payments/verify`
- **Auth:** `auth:sanctum`
- **Input source:** query string from payment gateway callback
- **Response type:** redirect, not JSON

**Expected query params**

| Query Param | Type | Required | Notes |
|---|---|---:|---|
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

## Notes For Frontend

- Use `application/json` for all non-file routes
- Use `multipart/form-data` only for menu item create/update when sending `image`
- Do not manually set `Content-Type` when using `FormData`; browser/client will set the correct boundary
- For booleans in `FormData`, prefer `1` and `0`
- Order creation accepts `items[].notes`, but backend currently does not save that field in `order_items`
- Login validation accepts `phone_number`, but current auth service actually logs in by `email` only
