# Threads & Gems Admin API Reference

This file describes every backend endpoint the super admin app uses. Keep it in the root of the admin project (`threadsandgems-admin/ADMIN_API.md`) so Claude Code can read it.

## Notes for Claude Code

- **Admin app:** Next.js 16 App Router, **JavaScript** (`.jsx`/`.js`, no TypeScript), Tailwind CSS 4, `lucide-react` icons, Clerk 7 for auth.
- **Backend:** separate Express 5 + MongoDB (Mongoose) project, `threadsandgems-api`. The admin never talks to MongoDB, Stripe or Cloudinary secrets directly; it only calls this API.
- **Calling the API:**
  - In server components/pages, use `tryApi(path, { method, body, searchParams })` from `lib/api-server.js`. It returns `{ data, error }` and attaches the Clerk token.
  - In client components (forms, buttons), use the `useApi()` hook from `lib/api-client.js`: `const api = useApi(); await api(path, { method, body })`. It throws `Error(message)` on failure.
  - After a successful mutation in a client component, call `router.refresh()` so server components reload.
- **Permissions:** checked on both sides. The admin uses `requirePermission('...')` from `lib/auth.js` in pages and `can(role, '...')` from `lib/roles.js` to hide UI. The backend has the same table in `src/lib/roles.js`. If you add a permission, add it in **both** files.
- **Money is always integer pence** (`4500` = £45.00). Use `formatMoney`, `poundsToPence`, `penceToPounds` from `lib/format.js`. Never send pounds or strings like `"£45.00"` to the admin API.
- **IDs** are MongoDB `_id` strings.
- **Brand tokens** (Tailwind theme in `app/globals.css`): `espresso` #2C1810, `gold` #C9A84C, `gold-deep` #9C7F2E, `gold-wash` #F6EFD9. Use sentence case, plain verbs, and specific error messages.

---

## Basics

**Base URL:** `NEXT_PUBLIC_API_URL`
- Local: `http://localhost:4000`
- Production: the Render URL, e.g. `https://threadsandgems-api.onrender.com`

**Authentication:** every `/api/admin/*` request sends

```
Authorization: Bearer <Clerk session token>
```

The backend verifies it with `@clerk/express` and reads the role from `sessionClaims.metadata.role`. This requires the Clerk session token to be customised with:

```json
{ "metadata": "{{user.public_metadata}}" }
```

**Request bodies:** JSON, with `Content-Type: application/json`.

**Errors:** always JSON in this shape, with a message safe to show the user:

```json
{ "error": "Readable message" }
```

| Status | Meaning |
|---|---|
| 400 | Invalid input (the message names the field, e.g. `"pricePence: Enter a price above £0."`) |
| 401 | Not signed in, or the session expired |
| 403 | Signed in but no admin role, or the role lacks this permission; also a blocked CORS origin |
| 404 | Not found (including malformed ids) |
| 409 | Conflict: duplicate slug/email, category still in use, out of stock |
| 402 | Stripe rejected a request (message starts with `Stripe:`) |
| 503 | A service isn't configured on the backend (Stripe or Cloudinary keys missing) |
| 500 | Unexpected server error |

**Paginated lists** accept `page` (default 1) and `limit` (default 20 unless stated, max 100 unless stated) and return:

```json
{ "items": [], "page": 1, "pages": 3, "total": 47 }
```

**Health check** (no auth): `GET /health` returns `{ "status": "ok" }`.

---

## Roles and permissions

Roles live in Clerk `publicMetadata.role`: `super_admin`, `admin`, `staff`.

| Permission | super_admin | admin | staff |
|---|---|---|---|
| `dashboard:view` | yes | yes | yes |
| `orders:view` | yes | yes | yes |
| `orders:update` | yes | yes | yes |
| `orders:refund` | yes | yes | no |
| `products:view` | yes | yes | yes |
| `products:edit` | yes | yes | no |
| `categories:edit` | yes | yes | no |
| `customers:view` | yes | yes | yes |
| `messages:view` | yes | yes | yes |
| `subscribers:view` | yes | yes | no |
| `settings:edit` | yes | no | no |
| `team:manage` | yes | no | no |
| `audit:view` | yes | no | no |

---

## Status values

| Field | Values |
|---|---|
| `paymentStatus` | `pending` (awaiting payment), `paid`, `failed`, `refunded`, `partially_refunded` |
| `fulfilmentStatus` | `unfulfilled` (to pack), `processing` (packing), `shipped`, `delivered`, `cancelled`, `returned` |
| Product `status` | `active` (live), `draft`, `archived` |
| Message `status` | `new`, `replied`, `archived` |

Labels for display are in `lib/format.js` (`PAYMENT_STATUSES`, `FULFILMENT_STATUSES`, `PRODUCT_STATUSES`).

---

## Data shapes

### Order

```js
{
  _id: "66f...",
  orderNumber: "TG-10001",
  clerkUserId: "user_...",          // absent for guests
  email: "ada@example.com",
  customerName: "Ada Obi",
  phone: "07...",
  shippingAddress: { line1, line2, city, postalCode, country },   // country is ISO code, e.g. "GB"
  items: [
    { productId, legacyId, name, image, size, unitPricePence, quantity }
  ],                                 // snapshot at time of purchase
  subtotalPence: 7500,
  shippingPence: 0,
  vatPence: 1250,                    // included in total when prices include VAT
  totalPence: 7500,
  refundedPence: 0,
  currency: "gbp",
  paymentStatus: "paid",
  fulfilmentStatus: "unfulfilled",
  carrier: "Royal Mail",
  trackingNumber: "AB123456789GB",
  adminNotes: "Customer asked for gift wrap",
  stripePaymentIntentId: "pi_...",
  paidAt: "2026-09-25T12:00:00.000Z",
  restocked: false,                  // true once stock was returned after cancel/return
  events: [
    { type: "paid", message: "Payment of £75.00 received", by: "admin@email", createdAt }
  ],                                 // order timeline, oldest first
  createdAt, updatedAt
}
```

### Product (admin shape)

```js
{
  _id: "66f...",
  legacyId: 1,                       // old storefront id, may be null for new products
  name: "Brocade Senator Set",
  slug: "brocade-senator-set",
  shortDescription: "One line for shop cards",
  details: "Longer text for the product page",
  pricePence: 3000,
  compareAtPricePence: null,         // original price when on sale; must be > pricePence
  categoryId: "66f...",              // or null
  category: { _id, name, slug },     // populated, or null
  images: [{ url: "https://res.cloudinary.com/...", alt: "..." }],   // first is the main photo
  stock: 10,                         // can be briefly negative if oversold
  status: "active",
  featured: true,                    // shown on the homepage
  createdAt, updatedAt
}
```

### Category

```js
{ _id, name: "Ankara", slug: "ankara", position: 0, productCount: 12, createdAt, updatedAt }
```

### Settings

```js
{
  vatRatePercent: 20,
  pricesIncludeVat: true,
  freeShippingThresholdPence: null,  // null = never free; 6000 = free from £60
  flatShippingPence: 0,
  shippingCountries: ["GB", "IE", "FR", "DE"],
  contactEmail: "hello@threadsandgems.co.uk",
  contactPhone: ""
}
```

---

## Endpoints

### Overview

#### `GET /api/admin/stats`
Permission: `dashboard:view`

Figures cover the last 30 days, counting orders with payment status `paid`, `partially_refunded` or `refunded`.

```js
{
  revenue30dPence: 125000,           // totals minus refunds
  orders30d: 18,
  toFulfilCount: 4,                  // paid AND unfulfilled (all time)
  lowStockCount: 2,                  // active products with stock <= 3
  lowStock: [{ _id, name, stock }],  // up to 8, lowest first
  recentOrders: [                    // latest 5 paid-type orders
    { _id, orderNumber, customerName, email, totalPence, currency, paymentStatus, fulfilmentStatus, createdAt }
  ],
  topProducts: [{ productId, name, quantity, revenuePence }]   // top 5 by quantity
}
```

---

### Orders

#### `GET /api/admin/orders`
Permission: `orders:view`

| Query | Description |
|---|---|
| `q` | Case-insensitive search on order number, email or customer name |
| `payment` | One payment status. **If omitted, `pending` orders are excluded** (abandoned checkouts) |
| `fulfilment` | One fulfilment status |
| `page`, `limit` | Pagination |

Returns a paginated list of Orders, newest first, **without** `events` and `adminNotes`.

#### `GET /api/admin/orders/:id`
Permission: `orders:view`

Returns the full Order, including `events` and `adminNotes`. `404` if not found.

#### `PATCH /api/admin/orders/:id`
Permission: `orders:update`

```json
{
  "fulfilmentStatus": "shipped",
  "carrier": "Royal Mail",
  "trackingNumber": "AB123456789GB",
  "adminNotes": "Left with neighbour"
}
```

All fields optional. Limits: carrier 60 chars, tracking 100, notes 2000.

Side effects:
- A status change adds a timeline event, e.g. "Status changed from To pack to Shipped".
- Setting carrier/tracking adds a "Tracking set: ..." event.
- Moving a paid order to `cancelled` or `returned` (from any other status) puts every item's quantity back into stock once, sets `restocked: true`, and adds an event.
- Writes to the activity log.

Returns the updated Order.

#### `POST /api/admin/orders/:id/refund`
Permission: `orders:refund`

```json
{ "amountPence": 1500 }
```

- Order must be `paid` or `partially_refunded` and have a Stripe payment.
- `amountPence` must be a positive integer, at most `totalPence - refundedPence`.
- Refunds through Stripe, increases `refundedPence`, sets `paymentStatus` to `refunded` (fully) or `partially_refunded`, adds an event, writes to the activity log.
- Does **not** change stock. Set the fulfilment status to `returned` for that.

Returns the updated Order. Errors: `400` (not refundable, amount too high), `402` (Stripe declined), `503` (Stripe not configured).

---

### Products

#### `GET /api/admin/products`
Permission: `products:view`

| Query | Description |
|---|---|
| `q` | Case-insensitive search on name |
| `status` | `active`, `draft` or `archived` (all if omitted) |
| `category` | Category `_id` |
| `page`, `limit` | Pagination |

Returns a paginated list of Products (admin shape), newest first.

#### `GET /api/admin/products/:id`
Permission: `products:view`

Returns one Product. `404` if not found.

#### `POST /api/admin/products`
Permission: `products:edit`

```json
{
  "name": "Brocade Senator Set",
  "slug": "brocade-senator-set",
  "shortDescription": "",
  "details": "",
  "pricePence": 3000,
  "compareAtPricePence": null,
  "categoryId": "66f...",
  "stock": 10,
  "status": "draft",
  "featured": false,
  "images": [{ "url": "https://res.cloudinary.com/...", "alt": "Front view" }],
  "legacyId": null
}
```

Required: `name`, `slug`, `pricePence`. Rules:
- `slug`: lowercase letters, numbers and single dashes (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), unique (`409` if taken).
- `pricePence`: positive integer. `compareAtPricePence`: positive integer greater than `pricePence`, or `null`.
- `stock`: integer 0 or more.
- `images`: up to 12, each with a valid `url`.
- `categoryId`: a valid category `_id` or `null`.
- Defaults: `status: "draft"`, `stock: 0`, `featured: false`.

Returns `201` with the created Product.

#### `PATCH /api/admin/products/:id`
Permission: `products:edit`

Any subset of the POST fields. Same validation. Returns the updated Product. Logs which fields changed.

#### `DELETE /api/admin/products/:id`
Permission: `products:edit`

Permanently deletes. Past orders keep their item snapshots. Returns `{ "ok": true }`.

---

### Photo uploads (Cloudinary)

#### `POST /api/admin/uploads/sign`
Permission: `products:edit`. No body.

```json
{
  "timestamp": 1790000000,
  "signature": "abc123...",
  "folder": "threadsandgems/products",
  "apiKey": "123456789",
  "cloudName": "ytf0fvdd"
}
```

The browser then uploads the file **directly to Cloudinary** (not through the backend):

```
POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
multipart/form-data:
  file       = <the image file>
  api_key    = {apiKey}
  timestamp  = {timestamp}
  signature  = {signature}
  folder     = {folder}
```

Use `secure_url` from Cloudinary's response as the image `url`. Get a new signature for each file. `503` if Cloudinary isn't configured. See `components/ImageUploader.jsx`.

---

### Categories

#### `GET /api/admin/categories`
Permission: `products:view`

```json
{ "items": [{ "_id": "...", "name": "Ankara", "slug": "ankara", "position": 0, "productCount": 12 }] }
```

Sorted by `position`. Not paginated. `productCount` counts products of any status.

#### `POST /api/admin/categories`
Permission: `categories:edit`

```json
{ "name": "Aso-Oke", "slug": "aso-oke" }
```

Both required; slug rules as for products, unique. Added at the end. Returns `201` with the Category.

#### `PUT /api/admin/categories/order`
Permission: `categories:edit`

```json
{ "ids": ["id-first", "id-second", "id-third"] }
```

Sets `position` to each id's index. Returns `{ "ok": true }`.

#### `PATCH /api/admin/categories/:id`
Permission: `categories:edit`

`{ "name"?, "slug"? }`. Returns the Category.

#### `DELETE /api/admin/categories/:id`
Permission: `categories:edit`

`409` if any product uses it ("Move them to another category first"). Returns `{ "ok": true }`.

---

### Customers

#### `GET /api/admin/customers`
Permission: `customers:view`

| Query | Description |
|---|---|
| `q` | Search on email or name |
| `page`, `limit` | Pagination |

Built from paid-type orders, grouped by email (covers guests and signed-in shoppers). Sorted by most recent order.

```json
{
  "items": [
    {
      "email": "ada@example.com",
      "name": "Ada Obi",
      "clerkUserId": "user_...",
      "ordersCount": 3,
      "totalSpentPence": 12500,
      "lastOrderAt": "2026-09-25T12:00:00.000Z"
    }
  ],
  "page": 1, "pages": 1, "total": 1
}
```

No `imageUrl` is returned; the admin shows an initial instead. For a customer's orders, use `GET /api/admin/orders?q=<email>`.

---

### Messages (contact form)

#### `GET /api/admin/messages`
Permission: `messages:view`

| Query | Description |
|---|---|
| `status` | `new` (default), `replied` or `archived` |
| `page`, `limit` | Pagination |

Items: `{ _id, name, email, subject, message, status, createdAt, updatedAt }`, newest first.

#### `PATCH /api/admin/messages/:id`
Permission: `messages:view`

```json
{ "status": "replied" }
```

Returns the Message.

---

### Newsletter subscribers

#### `GET /api/admin/subscribers`
Permission: `subscribers:view`

`page`, `limit` (default **100**, max **5000**). Items: `{ _id, email, source, createdAt }`, where `source` is `home`, `shop`, `contact` or `footer`. CSV export is done in the browser (`components/ExportCsvButton.jsx`).

---

### Store settings

#### `GET /api/admin/settings`
Permission: `settings:edit`

Returns Settings (created with defaults on first call).

#### `PATCH /api/admin/settings`
Permission: `settings:edit`

Any subset of Settings fields:
- `vatRatePercent`: 0 to 100
- `pricesIncludeVat`: boolean
- `freeShippingThresholdPence`: integer 0 or more, or `null`
- `flatShippingPence`: integer 0 or more
- `shippingCountries`: at least one 2-letter code
- `contactEmail`: valid email or `""`
- `contactPhone`: up to 50 chars

Returns the updated Settings. Checkout uses them from the next order.

---

### Team (admin users)

#### `GET /api/admin/team`
Permission: `team:manage`

```json
{ "items": [{ "userId": "user_...", "name": "Peter FreeMann", "email": "...", "imageUrl": "...", "role": "super_admin" }] }
```

Clerk users with an admin role, super admins first.

#### `POST /api/admin/team`
Permission: `team:manage`

```json
{ "email": "staff@example.com", "role": "staff" }
```

The person must already have an account (signed up on the store). `404` if no account uses that email. Sets their Clerk `publicMetadata.role`. Returns `201` `{ "ok": true }`.

#### `PATCH /api/admin/team/:userId`
Permission: `team:manage`

```json
{ "role": "admin" }
```

`role: null` removes admin access (their shopping account stays). `400` if you try to change your own role. Returns `{ "ok": true }`.

Role changes take effect the next time that person's Clerk session token refreshes (within about a minute) or when they sign in again.

---

### Activity log

#### `GET /api/admin/audit-log`
Permission: `audit:view`

`page`, `limit` (default **50**). Items, newest first:

```js
{
  _id,
  adminUserId: "user_...",
  adminEmail: "peter@example.com",
  action: "order.update",            // see list below
  entity: "order",
  entityId: "66f...",
  summary: "Updated order TG-10001: status changed from to pack to shipped",
  changes: {},                       // only for some actions (e.g. settings)
  createdAt
}
```

Actions: `order.update`, `order.refund`, `product.create`, `product.update`, `product.delete`, `category.create`, `category.update`, `category.reorder`, `category.delete`, `message.update`, `settings.update`, `team.add`, `team.role`, `team.remove`.

---

## Admin page to endpoint map

| Admin page | File | Endpoints |
|---|---|---|
| Overview | `app/(dashboard)/page.jsx` | `GET /stats` |
| Orders list | `app/(dashboard)/orders/page.jsx` | `GET /orders` |
| Order detail | `app/(dashboard)/orders/[id]/page.jsx`, `components/OrderActions.jsx` | `GET /orders/:id`, `PATCH /orders/:id`, `POST /orders/:id/refund` |
| Products list | `app/(dashboard)/products/page.jsx` | `GET /products`, `GET /categories` |
| New product | `app/(dashboard)/products/new/page.jsx`, `components/ProductForm.jsx` | `GET /categories`, `POST /products`, `POST /uploads/sign` |
| Edit product | `app/(dashboard)/products/[id]/page.jsx`, `components/ProductForm.jsx` | `GET /products/:id`, `GET /categories`, `PATCH /products/:id`, `DELETE /products/:id`, `POST /uploads/sign` |
| Categories | `app/(dashboard)/categories/page.jsx`, `components/CategoryManager.jsx` | `GET`, `POST`, `PATCH`, `DELETE /categories`, `PUT /categories/order` |
| Customers | `app/(dashboard)/customers/page.jsx` | `GET /customers` |
| Messages | `app/(dashboard)/messages/page.jsx`, `components/MessageActions.jsx` | `GET /messages`, `PATCH /messages/:id` |
| Subscribers | `app/(dashboard)/subscribers/page.jsx` | `GET /subscribers` |
| Store settings | `app/(dashboard)/settings/page.jsx`, `components/SettingsForm.jsx` | `GET`, `PATCH /settings` |
| Team | `app/(dashboard)/team/page.jsx`, `components/TeamManager.jsx` | `GET`, `POST /team`, `PATCH /team/:userId` |
| Activity log | `app/(dashboard)/audit-log/page.jsx` | `GET /audit-log` |

(All paths above are under `/api/admin`.)

---

## Storefront endpoints (for reference; not used by the admin)

These are public (no admin role) and are called by the storefront:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products?category=<slug>&featured=true&q=&page=&limit=` | none | Live products only; default limit 12 |
| GET | `/api/products/:key` | none | `key` = legacy number, `_id` or slug; includes `related` |
| GET | `/api/categories` | none | With count of live products |
| GET | `/api/settings/public` | none | VAT, shipping, countries, contact details |
| POST | `/api/checkout` | optional Clerk token | Creates pending order + Stripe PaymentIntent from product ids and quantities; returns `clientSecret`, `orderId`, `orderNumber` and totals |
| GET | `/api/orders/me` | Clerk token required | Shopper's own orders |
| GET | `/api/orders/confirmation/:paymentIntentId` | none | Order for the confirmation page |
| POST | `/api/contact` | none | `{ name, email, subject, message, website }` (`website` is a spam trap) |
| POST | `/api/newsletter` | none | `{ email, source }` |
| POST | `/api/webhooks/stripe` | Stripe signature | Stripe events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |

Public product responses include `pricePence` plus `price` as `"£45.00"` and `id` as the legacy number, for compatibility with the current cart code.
