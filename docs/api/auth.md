# Auth API

Base path: `/api/v1/auth`

None of these routes require the `ADMIN` role. A few require the caller to
already hold a short-lived `accessToken` or `verifyToken` (see the **Auth
Required** field on each endpoint) — but none require admin privileges.

## Table of Contents

1. [Sign In](#post-signin)
2. [Get Current User Info](#get-user-info)
3. [Verify OTP](#post-verify-otp)
4. [Resend OTP](#post-resend-otp)
5. [Refresh Access Token](#post-refresh-token)
6. [Forgot Password](#post-forgot-password)
7. [Reset Password](#post-reset-password)
8. [Sign Out](#post-signout)

---

### POST /signin

- **Description:** Sign in with email and password. Unverified accounts are
  rejected and automatically sent a fresh OTP instead of being logged in.
- **Auth Required:** No
- **Admin Only:** No
- **Headers:** `x-client-type: web | mobile` (optional — controls whether
  tokens are set as cookies or returned in the JSON body)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response `200 OK`** (mobile / `x-client-type` not `web`):
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "User logged in successfully",
    "data": {
      "user": {
        "uuid": "b6d1c9b0-....",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "REP",
        "avatar": null,
        "isVerified": true,
        "provider": "LOCAL",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      },
      "accessToken": "jwt...",
      "refreshToken": "jwt..."
    }
  }
  ```
  Web clients (`x-client-type: web`) get the same `data.user` object, with
  `accessToken`/`refreshToken` set as `httpOnly` cookies instead.
- **Response `403 Forbidden`** — account not verified yet:
  ```json
  {
    "success": "error",
    "statusCode": 403,
    "message": "Email not verified. A new OTP has been sent to your email.",
    "data": { "verifyToken": "jwt..." }
  }
  ```
  (`verifyToken` is set as a cookie instead for `x-client-type: web`.)

---

### GET /user-info

- **Description:** Get the currently authenticated user's profile.
- **Auth Required:** Yes
- **Admin Only:** No
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

---

### POST /verify-otp

- **Description:** Verify the 6-digit OTP sent during registration/login to
  activate the account.
- **Auth Required:** Yes — a `verifyToken` (cookie or `Authorization: Bearer`)
  issued by `/register` or `/signin` is required, not a normal `accessToken`.
- **Admin Only:** No
- **Request Body:**
  ```json
  {
    "otp": "123456"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "Email verified successfully",
    "data": { "email": "user@example.com", "isVerified": true }
  }
  ```

---

### POST /resend-otp

- **Description:** Resend a fresh OTP (subject to a cooldown and a max
  failed-attempt lockout).
- **Auth Required:** Yes — same `verifyToken` as `/verify-otp`.
- **Admin Only:** No
- **Request Body:** _None_
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "OTP sent successfully",
    "data": { "email": "user@example.com" }
  }
  ```

---

### POST /refresh-token

- **Description:** Exchange a valid `refreshToken` for a new `accessToken`.
- **Auth Required:** No access token needed, but a valid `refreshToken` must be
  supplied.
- **Admin Only:** No
- **Headers:** `x-client-type: web | mobile`
- **Request Body (mobile only):**
  ```json
  { "refreshToken": "jwt..." }
  ```
  Web clients send the `refreshToken` cookie instead — no body needed.
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "Access token refreshed",
    "data": { "accessToken": "jwt..." }
  }
  ```

---

### POST /forgot-password

- **Description:** Request a password-reset OTP by email. Always returns a
  generic success message to avoid leaking whether the email exists.
- **Auth Required:** No
- **Admin Only:** No
- **Request Body:**
  ```json
  { "email": "example@gmail.com" }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "If an account with this email exists, an OTP will be sent",
    "data": { "email": "example@gmail.com" }
  }
  ```

---

### POST /reset-password

- **Description:** Reset the account password using the OTP from
  `/forgot-password`.
- **Auth Required:** No
- **Admin Only:** No
- **Request Body:**
  ```json
  {
    "email": "example@gmail.com",
    "otp": "123456",
    "newPassword": "Test@123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "Password reset successfully",
    "data": { "email": "example@gmail.com" }
  }
  ```

---

### POST /signout

- **Description:** Clear auth cookies.
- **Auth Required:** No
- **Admin Only:** No
- **Response `200 OK`:**
  ```json
  {
    "success": "success",
    "statusCode": 200,
    "message": "User logged out successfully"
  }
  ```
