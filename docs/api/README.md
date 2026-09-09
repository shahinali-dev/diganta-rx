# Diganta Rx — API Documentation

Base URL: `/api/v1`

All responses share the same envelope:

```json
{
  "success": "success | error",
  "statusCode": 200,
  "message": "Human readable message",
  "meta": { "...": "present only on paginated list endpoints" },
  "data": { "...": "endpoint-specific payload" }
}
```

> **Identifier note:** every resource exposes a public `uuid` field. The internal
> database `id` is never returned by the API and never accepted as input — always
> use `uuid` in path params, request bodies, and when matching records from a
> response.

## Structure

- **[`ADMIN.md`](./ADMIN.md)** — every admin-only endpoint, across every
  module, in one file, grouped by module with its own Table of Contents. This
  is the one file the admin-panel team needs.
- **One file per module for everything else** — e.g. [`auth.md`](./auth.md),
  [`user.md`](./user.md). Each covers only that module's public/self-service
  endpoints; its admin endpoints (if any) live in `ADMIN.md` instead, with a
  link back from the module file.

## Table of Contents

1. [Admin API](./ADMIN.md) 🔒 — all admin-only endpoints, module-wise
2. [Auth](./auth.md) — sign in/out, OTP, tokens, password reset
3. [User](./user.md) — registration & profile (self-service only)

> As new modules ship (Doctor, Territory, Visit, Sample, Target, Claim, ...):
> add `docs/api/<module>.md` for its public/self-service routes, add a new
> `## <Module>` section to `ADMIN.md` for its admin routes, and list the new
> module file here.

### Auth conventions used across all docs

- **Auth Required: Yes** means a valid `accessToken` must be sent, either as the
  `accessToken` cookie (web clients, `x-client-type: web`) or as an
  `Authorization: Bearer <token>` header (mobile/API clients).
- **Admin Only: ✅ YES** means the route additionally requires `role: ADMIN` on
  the authenticated user (enforced by the `isAdmin` middleware) — a signed-in
  non-admin user will get a `403 Forbidden`.
- The `x-client-type: web` header switches auth from `Authorization` headers to
  `httpOnly` cookies (`accessToken` / `refreshToken` / `verifyToken`).

## Templates for new docs

**New module file** (`docs/api/<module>.md`):

```markdown
# <Module> API

Base path: `/api/v1/<module>`

Self-service endpoints only. Admin-only endpoints (if any) live in
[`ADMIN.md`](./ADMIN.md#<module>) instead.

## Table of Contents

1. [...](#...)

---

### METHOD /path
- **Description:**
- **Auth Required:**
- **Admin Only:** No
- **Request Body:**
- **Response `200 OK`:**
```

**New module section inside `ADMIN.md`:**

```markdown
## <Module>

Base path: `/api/v1/<module>`

### METHOD /api/v1/<module>/path
- **Description:**
- **Auth Required:** Yes
- **Admin Only:** ✅ **YES - ADMIN ONLY**
- ...
```

Also add the new module's admin routes to `ADMIN.md`'s Table of Contents at
the top of the file.
