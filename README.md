# Threads & Gems Admin

Super admin dashboard for the Threads & Gems store. Next.js 16 (App Router, JavaScript), Clerk for sign-in and roles, Tailwind CSS 4. All data comes from the Express + MongoDB backend on Render.

## 1. Install and run

```bash
yarn install        # or npm install
cp .env.example .env.local
yarn dev            # runs on http://localhost:3001 so it doesn't clash with the store on 3000
```

## 2. Clerk setup (one time)

Use the **same Clerk application** as the storefront, so staff use one account.

1. **Put the role in the session token.** Clerk dashboard → Sessions → Customize session token, and add:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
   Without this, every admin gets sent to the "no admin access" page.
2. **Make yourself super admin.** Clerk dashboard → Users → your user → Metadata → Public, and set:
   ```json
   { "role": "super_admin" }
   ```
   Sign out and back in so the new token includes the role. After this, add everyone else from the Team page.
3. In production, add the admin domain (for example `admin.threadsandgems.co.uk`) to the Clerk application's allowed origins.

### Roles

| Can | super_admin | admin | staff |
|---|---|---|---|
| Overview, orders, customers, messages | yes | yes | yes |
| Update fulfilment and tracking | yes | yes | yes |
| Products, categories, subscribers | yes | yes | view only* |
| Refunds | yes | yes | no |
| Store settings, team, activity log | yes | no | no |

*Staff can see products and categories but not edit them, and can't see subscribers.

The same rules live in `lib/roles.js`. **The backend must enforce them too**; the admin only hides what a role can't use.

## 3. Deploy

Deploy to Vercel (or Render as a Node web service with `yarn build` and `yarn start`). Set the four variables from `.env.example`.

## 4. What the backend must provide

Base URL: `NEXT_PUBLIC_API_URL`. Every request sends `Authorization: Bearer <Clerk session token>`.

### Backend requirements

- Verify the token with `@clerk/express` (`clerkMiddleware()` + `getAuth(req)`), read `sessionClaims.metadata.role`, and return `401`/`403` with `{ "error": "..." }` when it's missing or not allowed.
- Enable CORS for the admin origin (`http://localhost:3001` and your admin domain), allowing the `Authorization` and `Content-Type` headers and the `GET, POST, PATCH, PUT, DELETE` methods.
- All errors return JSON: `{ "error": "Readable message" }`. The admin shows this text to the user.
- Money is always an integer in **pence** (`4500` = £45.00). IDs are MongoDB `_id` strings.
- Lists return `{ items, page, pages, total }` and accept `page` (20 per page is a good default).
- Record every admin change in the activity log (`AuditLog` collection) with a readable `summary`.
- On Render's free plan the service sleeps after inactivity, and the first request can take up to a minute. The admin shows a loading message for this. A paid instance avoids it.

### Endpoints

| Method | Path | Role | Body / query | Returns |
|---|---|---|---|---|
| GET | `/api/admin/stats` | all | | `{ revenue30dPence, orders30d, toFulfilCount, lowStockCount, recentOrders: Order[5], lowStock: [{_id,name,stock}], topProducts: [{productId,name,quantity,revenuePence}] }` |
| GET | `/api/admin/orders` | all | `q, payment, fulfilment, page` | list of Order |
| GET | `/api/admin/orders/:id` | all | | Order |
| PATCH | `/api/admin/orders/:id` | all | `{ fulfilmentStatus, carrier, trackingNumber, adminNotes }` | Order |
| POST | `/api/admin/orders/:id/refund` | admin+ | `{ amountPence }` | Order (refund via Stripe, add event, update `refundedPence` and `paymentStatus`) |
| GET | `/api/admin/products` | all | `q, status, category, page` | list of Product (with `category` populated) |
| GET | `/api/admin/products/:id` | all | | Product |
| POST | `/api/admin/products` | admin+ | Product fields | created Product |
| PATCH | `/api/admin/products/:id` | admin+ | Product fields | Product |
| DELETE | `/api/admin/products/:id` | admin+ | | `{ ok: true }` |
| POST | `/api/admin/uploads/sign` | admin+ | | `{ timestamp, signature, apiKey, cloudName, folder }` (Cloudinary signed upload) |
| GET | `/api/admin/categories` | all | | `{ items: [{_id,name,slug,position,productCount}] }` sorted by `position` |
| POST | `/api/admin/categories` | admin+ | `{ name, slug }` | Category |
| PATCH | `/api/admin/categories/:id` | admin+ | `{ name, slug }` | Category |
| PUT | `/api/admin/categories/order` | admin+ | `{ ids: [] }` | `{ ok: true }` |
| DELETE | `/api/admin/categories/:id` | admin+ | | `{ ok: true }` (refuse if it has products) |
| GET | `/api/admin/customers` | all | `q, page` | list of `{ email, name, imageUrl, clerkUserId, ordersCount, totalSpentPence, lastOrderAt }` (aggregate paid orders by email) |
| GET | `/api/admin/messages` | all | `status, page` | list of `{ _id, name, email, subject, message, status, createdAt }` |
| PATCH | `/api/admin/messages/:id` | all | `{ status: 'new' \| 'replied' \| 'archived' }` | Message |
| GET | `/api/admin/subscribers` | admin+ | `limit` | `{ items: [{_id,email,source,createdAt}], total }` |
| GET | `/api/admin/settings` | super_admin | | Settings |
| PATCH | `/api/admin/settings` | super_admin | Settings fields | Settings |
| GET | `/api/admin/team` | super_admin | | `{ items: [{ userId, name, email, role }] }` (Clerk users whose publicMetadata.role is set) |
| POST | `/api/admin/team` | super_admin | `{ email, role }` | find the Clerk user by email and set `publicMetadata.role` |
| PATCH | `/api/admin/team/:userId` | super_admin | `{ role }` (`null` removes access) | `{ ok: true }` (refuse to change your own role) |
| GET | `/api/admin/audit-log` | super_admin | `page` | list of `{ _id, adminEmail, summary, action, entity, entityId, createdAt }` |

### Shapes

**Order**
```js
{
  _id, orderNumber /* "TG-10001" */, clerkUserId, email, customerName, phone,
  shippingAddress: { line1, line2, city, postalCode, country /* "GB" */ },
  items: [{ productId, name, image, size, unitPricePence, quantity }],
  subtotalPence, shippingPence, vatPence, totalPence, refundedPence, currency /* "gbp" */,
  paymentStatus,     // pending | paid | failed | refunded | partially_refunded
  fulfilmentStatus,  // unfulfilled | processing | shipped | delivered | cancelled | returned
  carrier, trackingNumber, adminNotes, stripePaymentIntentId,
  events: [{ type, message, by, createdAt }],
  createdAt, updatedAt
}
```

**Product**
```js
{
  _id, legacyId /* old 1-27 ids so /product/1 still works */, name, slug,
  shortDescription, details, pricePence, compareAtPricePence,
  categoryId, category: { _id, name }, // populated in responses
  images: [{ url, alt }], stock, status /* active | draft | archived */, featured,
  createdAt, updatedAt
}
```

**Settings**
```js
{ vatRatePercent, pricesIncludeVat, freeShippingThresholdPence /* null = never */,
  flatShippingPence, shippingCountries: ['GB'], contactEmail, contactPhone }
```

## Project structure

```
app/
  (dashboard)/          every page here needs an admin role
    page.jsx            overview
    orders/             list + [id] detail with fulfilment and refunds
    products/           list, new, [id] edit
    categories/  customers/  messages/  subscribers/
    settings/  team/  audit-log/   super admin only
  sign-in/  unauthorized/
components/             shell, tables, forms, uploader
lib/
  roles.js              roles and permissions
  auth.js               server-side role checks for pages
  api-server.js         backend calls from server components
  api-client.js         backend calls from forms and buttons
  format.js             money, dates, status labels
proxy.js                blocks signed-out and non-admin users (Next 16 name for middleware)
```
# threadsandgemsadmin
