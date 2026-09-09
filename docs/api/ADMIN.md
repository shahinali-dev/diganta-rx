# Admin API

Every endpoint on this page requires **both** a valid `accessToken` **and**
`role: ADMIN` on the authenticated user (`isAuth` + `isAdmin` middleware). A
signed-in non-admin user gets `403 Forbidden` on all of these.

This file gathers every admin-only endpoint across every module in one place,
so anyone building the admin panel only needs to read one file. For a
module's public/self-service endpoints, see its own file in `docs/api/`
(e.g. [`user.md`](./user.md)).

## Table of Contents

1. [User](#user)
   - [Get All Users](#get-apiv1userusers)
   - [Migrate User Role](#patch-apiv1usermigrateuuid)
   - [Get User By UUID](#get-apiv1useruuid)

> As new modules ship (Doctor, Territory, Visit, Sample, Target, Claim, ...),
> add a new `## <Module>` section here with its admin routes, and add its
> non-admin routes to `docs/api/<module>.md` as usual.

---

## User

Base path: `/api/v1/user`

### GET /api/v1/user/users

- **Description:** List all users, with search/filter/sort/pagination.
- **Auth Required:** Yes
- **Admin Only:** ✅ **YES - ADMIN ONLY**
- **Query Parameters:**
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `sort` (string): Field to sort by
  - `sortBy` (string): `asc` | `desc`
  - `search` (string): Matches against `name` and `email`
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "Users fetched successfully",
    "meta": { "page": 1, "limit": 10, "total": 42 },
    "data": [
      {
        "uuid": "b6d1c9b0-....",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "REP",
        "avatar": null,
        "isVerified": true,
        "provider": "LOCAL",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

---

### PATCH /api/v1/user/migrate/:uuid

- **Description:** Change a user's role (e.g. promote a `REP` to `MANAGER`).
- **Auth Required:** Yes
- **Admin Only:** ✅ **YES - ADMIN ONLY**
- **Path Parameters:**
  - `uuid` — the target user's public `uuid` (**not** the internal DB `id`)
- **Request Body:**
  ```json
  { "role": "MANAGER" }
  ```
  - `role` must be one of `ADMIN`, `MANAGER`, `REP`.
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "User role updated successfully",
    "data": {
      "uuid": "b6d1c9b0-....",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "MANAGER",
      "avatar": null,
      "isVerified": true,
      "provider": "LOCAL",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  }
  ```

---

### GET /api/v1/user/:uuid

- **Description:** Get any single user's profile by their public `uuid`.
- **Auth Required:** Yes
- **Admin Only:** ✅ **YES - ADMIN ONLY**
- **Path Parameters:**
  - `uuid` — the target user's public `uuid` (**not** the internal DB `id`)
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "User info fetched successfully",
    "data": {
      "uuid": "b6d1c9b0-....",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "REP",
      "avatar": null,
      "isVerified": true,
      "provider": "LOCAL",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
  ```
- **Response `404 Not Found`** — no user with that `uuid`:
  ```json
  {
    "success": "error",
    "statusCode": 404,
    "message": "User Not Found"
  }
  ```
