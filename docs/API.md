# AVISHKAR-v2 — REST API Specification

This document provides a comprehensive technical reference for all public and administrative API endpoints in **AVISHKAR-v2**.

---

## 1. Authentication & Security Headers

- **Public Endpoints**: Accessible without bearer tokens. Rate-limited and validated using Zod schemas.
- **Administrative Endpoints (`/api/admin/*`)**: Require authenticated session cookies or administrative credentials. In production, requests without a valid session return `401 Unauthorized`.
- **Content-Type**:
  - JSON APIs: `Content-Type: application/json`
  - Form/Upload APIs: `Content-Type: multipart/form-data`

---

## 2. Public Student Endpoints

### 1. Submit Student Registration
Submits a complete student registration application with personal details, academic information, startup track preferences, and uploaded verification documents.

- **Endpoint**: `POST /api/register`
- **Content-Type**: `multipart/form-data`

#### Request Parameters
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `fullName` | `string` | **Yes** | Legal name of student (min 2 chars) |
| `email` | `string` | **Yes** | Valid university or personal email |
| `phone` | `string` | **Yes** | 10-digit mobile phone number |
| `school` | `string` | **Yes** | GD Goenka University School (e.g., `SOET`) |
| `course` | `string` | **Yes** | Academic degree program (e.g., `B.Tech CSE`) |
| `year` | `string` | **Yes** | Current academic year (e.g., `1st Year`) |
| `rollNumber` | `string` | **Yes** | University roll number |
| `admissionNumber` | `string` | No | University admission number |
| `utr` | `string` | **Yes** | 12-digit UPI transaction reference (UTR) |
| `paymentDate` | `string` | **Yes** | Date when fee was paid (YYYY-MM-DD) |
| `idCardFile` | `File / Blob` | **Yes** | Image or PDF of official student ID card (max 5 MB) |
| `receiptFile` | `File / Blob` | **Yes** | Image or PDF of payment transaction receipt (max 5 MB) |
| `startupDetails` | `JSON string` | No | Serialized startup pitch, stage, and team information |

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Registration submitted successfully",
  "data": {
    "id": "AVISHKAR-2026-849201",
    "fullName": "Aarav Sharma",
    "email": "aarav.sharma@gdgoenka.ac.in",
    "status": "pending_approval",
    "createdAt": "2026-10-30T10:15:30.000Z"
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "utr", "message": "UTR must be a valid 12-digit transaction number" }
  ]
}
```

---

### 2. Live Registration Status Lookup
Allows applicants to check their verification status in real time using their Registration ID, Roll Number, or Admission Number.

- **Endpoint**: `GET /api/register/status`
- **Query Parameters**:
  - `query` (string, required): Registration ID (e.g., `AVISHKAR-2026-849201`), Roll Number, or Admission Number.

#### Response (`200 OK`)
```json
{
  "success": true,
  "found": true,
  "record": {
    "id": "AVISHKAR-2026-849201",
    "fullName": "Aarav Sharma",
    "school": "School of Engineering & Sciences",
    "course": "B.Tech Computer Science & Engineering",
    "status": "pending_approval",
    "idCardVerified": true,
    "paymentVerified": false,
    "submittedAt": "2026-10-30T10:15:30.000Z"
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "found": false,
  "message": "No registration record matches the provided identifier"
}
```

---

## 3. Administrative Document Previews

### 1. Preview Student ID Card
Generates a secure, temporary signed URL to view a student's ID card from the private `student-id-cards` storage bucket.

- **Endpoint**: `GET /api/admin/id-card`
- **Query Parameters**:
  - `path` (string, required): Storage file path (e.g., `id-cards/AVISHKAR-2026-849201.pdf`).

#### Response (`200 OK`)
```json
{
  "success": true,
  "url": "https://<supabase-project>.supabase.co/storage/v1/object/sign/student-id-cards/id-cards/AVISHKAR-2026-849201.pdf?token=ey...",
  "expiresIn": 900
}
```

---

### 2. Preview Payment Receipt
Generates a secure, temporary signed URL to view a student's payment receipt from the private `payment-receipts` storage bucket.

- **Endpoint**: `GET /api/admin/receipt`
- **Query Parameters**:
  - `path` (string, required): Storage file path (e.g., `receipts/AVISHKAR-2026-849201.png`).

#### Response (`200 OK`)
```json
{
  "success": true,
  "url": "https://<supabase-project>.supabase.co/storage/v1/object/sign/payment-receipts/receipts/AVISHKAR-2026-849201.png?token=ey...",
  "expiresIn": 900
}
```

---

## 4. Administrative Verification & State Transitions

### 1. Verify Student Identity
Toggles the student identity verification status for a registration record.

- **Endpoint**: `POST /api/admin/students/verify`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "id": "AVISHKAR-2026-849201",
  "verified": true
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "id": "AVISHKAR-2026-849201",
  "idCardVerified": true,
  "verifiedAt": "2026-10-30T10:30:00.000Z"
}
```

---

### 2. Verify Student Payment
Toggles the payment receipt verification status for a registration record.

- **Endpoint**: `POST /api/admin/payments/verify`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "id": "AVISHKAR-2026-849201",
  "verified": true
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "id": "AVISHKAR-2026-849201",
  "paymentVerified": true,
  "verifiedAt": "2026-10-30T10:32:00.000Z"
}
```

---

### 3. Final Registration Approval
Executes the final registration approval. **Prerequisite**: Both `id_card_verified` and `payment_verified` must be `true`.

- **Endpoint**: `POST /api/admin/registrations/approve`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "id": "AVISHKAR-2026-849201"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "record": {
    "id": "AVISHKAR-2026-849201",
    "status": "approved",
    "verified": true,
    "approvedAt": "2026-10-30T10:35:00.000Z"
  }
}
```

#### Error Response (`400 Bad Request` — Incomplete Verification)
```json
{
  "success": false,
  "error": "Both student identity card and payment receipt must be verified prior to approval."
}
```

---

### 4. Registration Rejection
Rejects a registration application with a mandatory recorded explanation.

- **Endpoint**: `POST /api/admin/registrations/reject`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "id": "AVISHKAR-2026-849201",
  "reason": "Payment receipt UTR mismatch. Amount remitted does not match registration fee."
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Registration rejected",
  "record": {
    "id": "AVISHKAR-2026-849201",
    "status": "rejected",
    "rejectionReason": "Payment receipt UTR mismatch. Amount remitted does not match registration fee."
  }
}
```

---

## 5. Administrative Roster & System Metrics

### 1. List Registrations (Roster)
Retrieves a paginated, filterable list of student registrations.

- **Endpoint**: `GET /api/admin/registrations`
- **Query Parameters**:
  - `page` (integer, default: 1): Current page index
  - `limit` (integer, default: 20): Items per page
  - `search` (string, optional): Text filter matching Name, Email, Roll, or Reg ID
  - `status` (string, optional): Filter by `all`, `pending_approval`, `approved`, or `rejected`
  - `school` (string, optional): Filter by university school acronym

---

### 2. Dashboard Analytics Summary
Retrieves aggregate metrics for administrative dashboards and KPI panels.

- **Endpoint**: `GET /api/admin/stats`

#### Response (`200 OK`)
```json
{
  "totalRegistrations": 248,
  "pendingApproval": 34,
  "approvedRegistrations": 204,
  "rejectedRegistrations": 10,
  "identityVerifiedCount": 218,
  "paymentVerifiedCount": 212,
  "totalRevenue": 102000,
  "lastUpdated": "2026-10-30T10:40:00.000Z"
}
```

---

### 3. Immutable Audit Logs
Retrieves the immutable audit trail of system events, logins, and executive decisions.

- **Endpoint**: `GET /api/admin/audit-logs`
- **Response**: Array of log events ordered chronologically descending.
