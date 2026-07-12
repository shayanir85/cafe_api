# AGENTS.md

## Project overview

Cafe order management system — a monorepo with three components:

| Dir | Stack | Purpose |
|-----|-------|---------|
| `BK/` | Laravel 13, PHP 8.3, MySQL | REST API backend |
| `FE/` | Vanilla JS, Tailwind CSS 4 | Original frontend (HTML pages, vanilla JS) |
| `cafe-api(Vue)/` | Vue 3, Pinia, Vite | Primary frontend (Vue rewrite) |

All API routes are prefixed `/api/v1`. Auth is Laravel Sanctum (token-based).

## Key commands

### Backend (`BK/`)

```bash
cd BK
composer dev          # Start full dev stack (php artisan serve + queue:listen + vite)
composer test         # Clear config + run Pest tests
composer setup        # Fresh install: composer install, .env copy, key:generate, migrate, npm build
```

Tests use SQLite in-memory (`phpunit.xml` overrides DB config). No MySQL needed to run tests.

### Frontend (`FE/`)

```bash
cd FE
npm install
npm run build:css     # Build Tailwind: Css/input.css -> Css/output.css
npm run watch:css     # Watch mode
```

No dev server — FE is static HTML served by Laravel or opened directly.

### Vue frontend (`cafe-api(Vue)/`)

```bash
cd cafe-api(Vue)
npm install
npm run dev           # Vite dev server
npm run build         # Production build
npm run lint          # oxlint + eslint (auto-fix)
npm run format        # Prettier
```

Node requirement: `^22.18.0 || >=24.12.0` (engines field).

## Architecture

### Backend (`BK/`)

- **Controllers**: `app/Http/Controllers/Api/` — AuthController, CategoryController, MenuItemsController, OrdersController, DashboardController, CafeController, ZarinpalController
- **Services**: `app/Services/` — AuthService, OrderService, MenuService (business logic extracted from controllers)
- **Models**: `app/Models/` — User, Order, Category, MenuItem, OrderItem, Payment, MonthlyIncome, IsClosed
- **Middleware**: `app/Http/Middleware/` — AdminMiddleware (admin|super_admin), SuperAdminMiddleware (super_admin only), CheckCafeOpenMiddleware (blocks orders when cafe is closed, cached 5min)
- **Routes**: `routes/api.php` — all API routes. Dashboard routes split by role: SuperAdminMiddleware for user mgmt, AdminMiddleware for order/menu mgmt
- **Seeds**: `database/seeders/` — creates sample data (users, categories, menu items, orders). Default password: `password123`
- **Payment**: Zarinpal gateway via `pishran/zarinpal` package

### Roles

DB enum: `super_admin`, `admin`, `chef`, `waiter`, `user`. Note: customers use role `user`, not `customer`.

### Auth flow

1. `POST /api/v1/login` returns `{ token, id, name, email, role }`
2. Frontend stores token in `sessionStorage` as `access_token`
3. All protected requests send `Authorization: Bearer <token>`
4. Token validated via `POST /api/v1/auth/sanctum/user`
5. Logout: `POST /api/v1/auth/logout` (clears Sanctum token)

### Frontend (`FE/`)

- `FE/SRC/Js/api.js` — centralized API client (axios instance, interceptors, all API functions)
- Auth state in `sessionStorage` (token + user JSON)
- Pages: `index.html` (public menu), `login.html`, `dashboard.html`, `ordersManagement.html`, `menuManagement.html`, `adminsManagement.html`, `checkout.html`, `addToMenu.html`, `newPassword.html`, `Error404.html`
- Persian (RTL) interface

### Vue frontend (`cafe-api(Vue)/`)

- `src/router/index.js` — all routes with auth guards (admin/super_admin/guest)
- `src/stores/auth.js` — Pinia auth store (login, logout, user, token)
- `src/stores/cart.js` — Pinia cart store (shared between MenuPage and CheckoutPage)
- `src/services/` — API layer split by domain (api, auth, users, categories, menuItems, orders, payments, cafe)
- `src/components/` — AdminSidebar, BackgroundBlobs, LogoCup
- `src/views/` — all page components (MenuPage, CheckoutPage, LoginPage, DashboardPage, OrdersPage, MenuManagementPage, AddMenuPage, AdminsPage, NewPasswordPage, NotFoundPage)
- Uses `@` alias for `./src`

## Code style

- **PHP**: Laravel Pint (Laravel default). 4 spaces, LF endings, UTF-8 (`.editorconfig`)
- **JS/Vue**: Prettier (`semi: false`, `singleQuote: true`, `printWidth: 100`). Linting: oxlint (correctness errors) + eslint (vue + recommended)
- **CSS**: Tailwind CSS 4 via `@tailwindcss/vite` plugin (BK) or `@tailwindcss/cli` (FE)

## Gotchas

- `.env` **and** `.env.example` are both gitignored in `BK/` — copy from a teammate or create manually (unusual for Laravel repos)
- `BK/.npmrc` has `ignore-scripts=true` — npm install won't run postinstall scripts
- FE uses a bundled copy of axios at `FE/SRC/Js/axios/` — not the npm `node_modules` version
- Menu item images use `multipart/form-data` upload; the `getImageUrl()` helper in `src/services/api.js` (Vue) or `FE/SRC/Js/api.js` (FE) handles storage path resolution
- `CheckCafeOpenMiddleware` caches cafe open/close status for 5 minutes — toggling cafe status won't take effect instantly
- The Vue frontend (`cafe-api(Vue)/`) is the primary frontend — all pages have been converted from `FE/`
- Model file names are inconsistent: `Order.php`, `Category.php`, `OrderItem.php` use lowercase filenames but PascalCase class names — PHP PSR-4 handles this, but don't expect filename to match class name
