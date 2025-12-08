# Postman Setup Guide for Authentication

This guide will help you set up Postman to work with the JWT authentication system.

## Quick Setup

### Step 1: Create Postman Environment

1. Open Postman
2. Click on **"Environments"** in the left sidebar (or press `Cmd/Ctrl + E`)
3. Click **"+"** to create a new environment
4. Name it: `Mallu Magic Local`
5. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `token` | (leave empty) | (will be auto-set) |
| `refresh_token` | (leave empty) | (will be auto-set) |

6. Click **"Save"**
7. Select this environment from the dropdown at the top right

---

## Step 2: Set Up Login Request

### Create Login Request

1. Create a new request: **POST** `/api/auth/login`
2. Set URL: `{{base_url}}/api/auth/login`
3. Go to **Body** tab → Select **raw** → Select **JSON**
4. Add this body:

```json
{
  "email": "admin@mallumagic.com",
  "password": "password123"
}
```

### Add Script to Auto-Save Token

1. Go to **Tests** tab in the login request
2. Add this script:

```javascript
// Check if login was successful
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    
    if (jsonData.success && jsonData.data.token) {
        // Save token to environment variable
        pm.environment.set("token", jsonData.data.token);
        
        // If refresh token is in response, save it too
        if (jsonData.data.refreshToken) {
            pm.environment.set("refresh_token", jsonData.data.refreshToken);
        }
        
        console.log("✅ Token saved successfully!");
    }
} else {
    console.log("❌ Login failed:", pm.response.text());
}
```

3. Click **Save**

---

## Step 3: Set Up Authorization for All Requests

### Option A: Use Authorization Header (Recommended)

1. Create a new request (or edit existing ones)
2. Go to **Authorization** tab
3. Select **Type: Bearer Token**
4. In the **Token** field, enter: `{{token}}`
5. This will automatically use the token from your environment

**Or use Pre-request Script (Alternative):**

1. Go to **Pre-request Script** tab
2. Add this script:

```javascript
// Get token from environment
const token = pm.environment.get("token");

if (token) {
    // Set Authorization header
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
} else {
    console.log("⚠️ No token found. Please login first.");
}
```

### Option B: Use Cookies (Alternative)

If you want to use HttpOnly cookies instead:

1. Go to **Settings** (gear icon) → **General**
2. Enable **"Send cookies"**
3. After login, cookies will be automatically saved by Postman
4. Subsequent requests will automatically include cookies

---

## Step 4: Test the Setup

### 1. Login First

1. Select your environment: `Mallu Magic Local`
2. Send the login request: **POST** `/api/auth/login`
3. Check the **Console** (bottom of Postman) - you should see: `✅ Token saved successfully!`
4. Check your environment variables - `token` should now have a value

### 2. Test Authenticated Request

1. Create a new request: **GET** `/api/auth/me`
2. Set URL: `{{base_url}}/api/auth/me`
3. Go to **Authorization** tab → Select **Bearer Token** → Enter `{{token}}`
4. Send the request
5. You should get your user data back!

---

## Complete Postman Collection Setup

### Create a Collection

1. Click **"New"** → **"Collection"**
2. Name it: `Mallu Magic API`
3. Go to collection **Settings** (three dots → Edit)
4. Go to **Variables** tab and add:
   - `base_url`: `http://localhost:3000`

### Add Collection-Level Authorization

1. In your collection, go to **Authorization** tab
2. Select **Type: Bearer Token**
3. Enter: `{{token}}`
4. This will apply to all requests in the collection!

### Add Collection-Level Pre-request Script

1. Go to **Pre-request Script** tab in collection
2. Add:

```javascript
// Auto-add Authorization header if token exists
const token = pm.environment.get("token");
if (token && !pm.request.headers.has("Authorization")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
}
```

### Add Collection-Level Test Script

1. Go to **Tests** tab in collection
2. Add:

```javascript
// Auto-save token from login response
if (pm.request.url.toString().includes("/auth/login") && pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        console.log("✅ Token auto-saved from login!");
    }
}
```

---

## Step-by-Step: Testing Your First Request

### 1. Login

**Request:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@mallumagic.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Rajesh Kumar",
      "email": "admin@mallumagic.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**After this request:**
- Check your environment - `token` variable should be set
- Check Postman Console - should show "✅ Token saved successfully!"

### 2. Get Current User

**Request:**
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{token}}
```

**Or manually:**
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Rajesh Kumar",
      "email": "admin@mallumagic.com",
      "role": "admin"
    }
  }
}
```

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Possible Causes:**

1. **Token not set in environment**
   - Solution: Run login request first and check if token is saved
   - Check environment variables panel

2. **Token expired**
   - Solution: Login again to get a new token
   - Tokens expire after 24 hours

3. **Authorization header not set**
   - Solution: Use Bearer Token in Authorization tab
   - Or add Pre-request Script (see above)

4. **Wrong token format**
   - Make sure it's: `Bearer <token>`
   - Not just: `<token>`

### Issue: Token Not Saving

**Check:**
1. Login response is 200 OK
2. Response has `success: true` and `data.token`
3. Test script is in the **Tests** tab (not Pre-request Script)
4. Environment is selected in dropdown

**Debug Script:**
Add this to your login request **Tests** tab:

```javascript
console.log("Response code:", pm.response.code);
console.log("Response body:", pm.response.text());

const jsonData = pm.response.json();
console.log("Parsed JSON:", JSON.stringify(jsonData, null, 2));

if (jsonData.data && jsonData.data.token) {
    console.log("Token found:", jsonData.data.token.substring(0, 20) + "...");
    pm.environment.set("token", jsonData.data.token);
} else {
    console.log("❌ No token in response!");
}
```

### Issue: Cookies Not Working

**If using cookies:**
1. Make sure **"Send cookies"** is enabled in Settings
2. Check **Cookies** tab in Postman (after login)
3. You should see `token` and `refreshToken` cookies

**Note:** HttpOnly cookies work automatically in browsers but may need special setup in Postman.

---

## Quick Reference: All Login Credentials

After running `npm run seed`, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@mallumagic.com` | `password123` |
| Admin | `admin2@mallumagic.com` | `password123` |
| Storekeeper | `storekeeper@mallumagic.com` | `password123` |
| Storekeeper | `storekeeper2@mallumagic.com` | `password123` |
| HOD | `hod@mallumagic.com` | `password123` |
| HOD | `hod2@mallumagic.com` | `password123` |
| Accounts | `accounts@mallumagic.com` | `password123` |
| Accounts | `accounts2@mallumagic.com` | `password123` |

---

## Example: Complete Request Flow

### 1. Login Request

**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Body:**
```json
{
  "email": "admin@mallumagic.com",
  "password": "password123"
}
```
**Tests Script:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
    }
}
```

### 2. Authenticated Request (e.g., Get Users)

**Method:** `GET`  
**URL:** `{{base_url}}/api/users`  
**Authorization:** Bearer Token → `{{token}}`  
**Headers:** (auto-added by Postman)

That's it! The token will be automatically included.

---

## Pro Tips

1. **Use Collection Variables**: Set `base_url` at collection level so all requests use it
2. **Auto-save Token**: Use Tests script to automatically save token after login
3. **Token Refresh**: Create a refresh token request that auto-updates the token
4. **Environment Switching**: Create separate environments for local, staging, production
5. **Pre-request Scripts**: Use collection-level scripts to auto-add headers

---

## Debugging: Check What Server Receives

If you're still getting "Unauthorized", test what the server is receiving:

1. **Create a debug request:**
   - **GET** `{{base_url}}/debug/headers`
   - Add **Authorization** header: `Bearer {{token}}`
   - Send request
   - Check response to see if header is being received

2. **Check Server Logs**: Look at your terminal where `npm run dev` is running for any errors

3. **Verify Token Format**: 
   - Make sure token doesn't have extra spaces
   - Token should start with `eyJ` (base64 encoded JWT)
   - Test token at [jwt.io](https://jwt.io) to verify it's valid

4. **Test with curl**: 
   ```bash
   # First login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mallumagic.com","password":"password123"}'
   
   # Then use the token (replace YOUR_TOKEN_HERE)
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Common Issues

### Issue: Token in response but still unauthorized

**Check:**
1. Is the token being saved to environment? (Check environment variables panel)
2. Is `{{token}}` being used in Authorization header? (Not the actual token string)
3. Is "Bearer " prefix included? (Postman adds this automatically with Bearer Token type)

### Issue: Header not being sent

**Solution:**
1. Go to request → **Headers** tab
2. Manually add: `Authorization` = `Bearer {{token}}`
3. Or use **Authorization** tab → **Bearer Token** → `{{token}}`

---

## Next Steps

Once authentication is working:
1. ✅ Test all endpoints from `TEST.md`
2. ✅ Create a Postman Collection with all endpoints
3. ✅ Export your collection to share with team
4. ✅ Set up different environments (local, staging, production)
