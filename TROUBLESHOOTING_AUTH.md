# Troubleshooting: "Unauthorized" After Login

If you're getting "Unauthorized" even after successful login, follow these steps:

## Step 1: Verify Token is Saved

1. **Login** using POST `/api/auth/login`
2. Check **Postman Console** (View → Show Postman Console)
   - Should see: `✅ Token saved!`
3. Check **Environment Variables** panel
   - `token` variable should have a long string starting with `eyJ`

## Step 2: Verify Token is Being Sent

### Option A: Check Debug Endpoint

1. Create request: **GET** `http://localhost:3000/debug/headers`
2. Go to **Authorization** tab
3. Select **Bearer Token**
4. Enter: `{{token}}`
5. Send request
6. Check response - should show your Authorization header

### Option B: Check Request Headers

1. In your `/api/auth/me` request
2. Go to **Headers** tab (not Authorization tab)
3. Look for `Authorization` header
4. Should be: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Common Fixes

### Fix 1: Token Not in Environment

**Problem:** Token variable is empty

**Solution:**
1. Go to login request
2. Check **Tests** tab has this script:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
    }
}
```
3. Re-run login request
4. Check environment variables again

### Fix 2: Wrong Authorization Setup

**Problem:** Authorization header not set correctly

**Solution:**
1. Go to your request (e.g., `/api/auth/me`)
2. Go to **Authorization** tab
3. Select **Type: Bearer Token** (NOT "No Auth")
4. In **Token** field, enter: `{{token}}` (with curly braces!)
5. Save request

### Fix 3: Environment Not Selected

**Problem:** Postman not using your environment

**Solution:**
1. Check top-right dropdown in Postman
2. Should show: `Mallu Magic Local` (or your environment name)
3. If not, select it from dropdown

### Fix 4: Token Format Issue

**Problem:** Token has extra characters or spaces

**Solution:**
1. Copy token from environment variable
2. Remove any spaces before/after
3. Should start with `eyJ` and be one continuous string
4. Test at [jwt.io](https://jwt.io) to verify it's valid

## Step 4: Manual Test

If automatic setup isn't working, try manual:

1. **Copy token** from login response
2. In `/api/auth/me` request:
   - Go to **Headers** tab
   - Add header: `Authorization` = `Bearer <paste-token-here>`
3. Send request

If this works, the issue is with environment variable setup.

## Step 5: Verify Server is Receiving Token

Check your server terminal (where `npm run dev` is running). You should see request logs.

If you see errors like "Token verification error", the token might be:
- Expired (tokens last 24 hours)
- Invalid format
- Signed with wrong secret

## Quick Test Script

Add this to your `/api/auth/me` request **Pre-request Script** tab:

```javascript
const token = pm.environment.get("token");
console.log("Token from environment:", token ? token.substring(0, 20) + "..." : "NOT FOUND");

if (!token) {
    console.error("❌ Token not found! Please login first.");
} else {
    console.log("✅ Token found, adding to request...");
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
}
```

This will:
- Check if token exists
- Log it to console
- Manually add Authorization header

## Still Not Working?

1. **Restart Postman** - Sometimes environment variables don't refresh
2. **Check JWT Secret** - Make sure `.env` has `JWT_SECRET` set
3. **Verify User Exists** - Run `npm run seed` to create users
4. **Check Server Logs** - Look for errors in terminal

## Expected Flow

1. ✅ Login → Get token in response
2. ✅ Token saved to environment (check variables panel)
3. ✅ Request uses `{{token}}` in Authorization header
4. ✅ Server receives token and validates it
5. ✅ User data returned

If any step fails, that's where the issue is!

