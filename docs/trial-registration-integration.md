# Trial registration integration

The public form belongs to `https://longtua.com/apartment/register`. The
Apartment application remains the system of record for authentication, review,
organization creation, and subscription limits.

## Server-to-server request

The marketing website must submit from its server, never directly from browser
JavaScript, because the shared secret is confidential.

```http
POST https://apartment.longtua.com/api/public/trial-requests
Authorization: Bearer <TRIAL_REQUEST_API_SECRET>
Content-Type: application/json
```

```json
{
  "operatorName": "สมชาย ใจดี",
  "propertyName": "สมชาย อพาร์ตเมนต์",
  "contactEmail": "owner@example.com",
  "phone": "0812345678",
  "requestedRoomCount": 30,
  "username": "somchai.owner",
  "password": "Longtua123",
  "confirmPassword": "Longtua123",
  "accepted": true
}
```

A successful response has HTTP `201`, status `pending`, and a `loginUrl`.
Redirect the applicant to that URL. After login, pending accounts are confined
to `/registration/pending` until a platform administrator approves the request.

## Required environment variables

Configure the same strong random `TRIAL_REQUEST_API_SECRET` on both servers.
The marketing website must keep it server-only.

```dotenv
MARKETING_REGISTRATION_URL=https://longtua.com/apartment/register
APARTMENT_APP_URL=https://apartment.longtua.com
LONGTUA_SUPPORT_URL=https://longtua.com/contact
TRIAL_REQUEST_API_SECRET=<server-only-secret>
```

The marketing website is responsible for CAPTCHA and its own edge/IP rate
limit. The Apartment API additionally validates all fields, reserves username,
email, and phone identifiers, and never creates an organization before approval.
