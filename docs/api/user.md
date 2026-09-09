# User API

Base path: `/api/v1/user`

Self-service endpoints only. Admin-only user-management endpoints
(`GET /users`, `PATCH /migrate/:uuid`, `GET /:uuid`) live in
[`ADMIN.md`](./ADMIN.md#user) instead.

## Table of Contents

1. [Register](#post-register)
2. [Update Profile Info](#patch-update-info)

---

### POST /register

- **Description:** Register a new user. Creates an unverified account and
  emails a 6-digit OTP; also returns a short-lived `verifyToken` used to call
  `/api/v1/auth/verify-otp`.
- **Auth Required:** No
- **Admin Only:** No
- **Headers:** `x-client-type: web | mobile` (web also gets `verifyToken` set
  as an `httpOnly` cookie)
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "role": "REP",
    "avatar": "https://.../optional-avatar-url"
  }
  ```
  - `name`, `email`, `password` (min 6 chars) are required.
  - `role` and `avatar` are optional (`role` defaults to `REP`).
- **Response `201 Created`:**
  ```json
  {
    "success": "success",
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "user": {
        "uuid": "b6d1c9b0-....",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "REP",
        "avatar": null,
        "isVerified": false,
        "provider": "LOCAL",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      },
      "verifyToken": "jwt..."
    }
  }
  ```

---

### PATCH /update-info

- **Description:** Update the signed-in user's own profile (name and/or
  avatar image). `email`, `role`, `isVerified`, and both identifier fields
  (`id`, `uuid`) are always ignored even if sent, so a user can never
  self-promote or change their own identifiers this way.
- **Auth Required:** Yes
- **Admin Only:** No
- **Request Body:** (`multipart/form-data`)
  ```json
  {
    "name": "John Doe",
    "avatar": "<file>"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "User info updated successfully",
    "data": {
      "uuid": "b6d1c9b0-....",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "REP",
      "avatar": "https://.../uploads/images/xxxx.jpg",
      "isVerified": true,
      "provider": "LOCAL",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  }
  ```
