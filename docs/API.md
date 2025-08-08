# 📄 OSINT Dashboard API Documentation

## 🔐 Authentication

All API endpoints require authentication except for login and registration. Authentication is done via JWT tokens stored in cookies.

### Login

```
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Register

```
POST /auth/register
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password",
  "confirmPassword": "password"
}
```

### Google OAuth

```
GET /auth/google
```
Redirects to Google for authentication.

```
GET /auth/google/callback
```
Callback endpoint after Google authentication.

### Logout

```
GET /auth/logout
```
Clears authentication cookies.

## 🕵️ OSINT Operations

### Start Initial Scan

```
POST /recon/start
Content-Type: application/json
```

```json
{
  "username": "target_username"
}
```

### Run Targeted Scrape

```
POST /recon/scrape
Content-Type: application/json
```

```json
{
  "profileId": "profile_id",
  "platforms": ["github", "twitter", "instagram"]
}
```

### Get Profile

```
GET /profile/:id
```
Returns complete profile data including scraped information and analysis.

### Export Profile as JSON

```
GET /profile/:id/export/json
```
Returns profile data in JSON format.

### Export Profile as PDF

```
GET /profile/:id/export/pdf
```
Returns profile data as a PDF file.

### Analyze Image

```
POST /recon/analyze-image
Content-Type: application/json
```

```json
{
  "profileId": "profile_id",
  "imageUrl": "https://example.com/image.jpg"
}
```

### Analyze Domain

```
POST /recon/analyze-domain
Content-Type: application/json
```

```json
{
  "profileId": "profile_id",
  "websiteUrl": "https://example.com"
}
```

### Toggle Monitoring

```
POST /recon/profile/:id/monitor
```
Enables or disables continuous monitoring for a profile.

### Get Profile History

```
GET /recon/profile/:id/history
```
Returns change history for a monitored profile.

### Hunt for Leaks

```
POST /recon/hunt-for-leaks
Content-Type: application/json
```

```json
{
  "profileId": "profile_id"
}
```

## 📦 Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

## ❗ Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Authentication required |
| INVALID_CREDENTIALS | Invalid username or password |
| PROFILE_NOT_FOUND | Profile not found |
| SCRAPING_FAILED | Scraping operation failed |
| ANALYSIS_FAILED | Analysis operation failed |
| INVALID_INPUT | Invalid input parameters |

## ⏳ Rate Limiting

API endpoints are rate-limited to prevent abuse:

- 100 requests per minute per authenticated user
- 10 requests per minute for unauthenticated users