# Quick Fix: Authorization Not Working

## The Problem
Token is being found and added, but server returns 401 Unauthorized.

## Immediate Solution

### Step 1: Check Server Logs
Look at your terminal where `npm run dev` is running. You should now see debug output like:
```
[GET] /api/auth/me
Authorization header: Bearer eyJhbGciOiJIUzI1NiIs...
Token check: { hasCookies: false, hasAuthHeader: true, ... }
```

### Step 2: Verify Token Format in Postman

In your `/api/auth/me` request:

1. **Remove the Pre-request Script** (it might be adding the header incorrectly)
2. Go to **Authorization** tab
3. Select **Type: Bearer Token**
4. In **Token** field, enter: `{{token}}`
5. **Save** the request
6. Send it again

### Step 3: Alternative - Use Headers Tab Directly

If Authorization tab doesn't work:

1. Go to **Headers** tab (not Authorization)
2. Add a new header:
   - **Key:** `Authorization`
   - **Value:** `Bearer {{token}}`
3. Make sure there's a space between "Bearer" and the token
4. Send request

### Step 4: Test with Debug Endpoint

1. Create request: **GET** `http://localhost:3000/debug/headers`
2. Add header: `Authorization` = `Bearer {{token}}`
3. Send request
4. Check response - it should show your Authorization header

## Common Issues

### Issue 1: Pre-request Script Adding Header Twice

**Problem:** If you have both Pre-request Script AND Authorization tab set, headers might conflict.

**Solution:** Use ONLY ONE method:
- Either use **Authorization tab** with Bearer Token
- OR use **Pre-request Script** to add header manually
- Don't use both!

### Issue 2: Token Variable Not Resolved

**Problem:** `{{token}}` is being sent literally instead of the token value.

**Solution:**
1. Check environment is selected (top-right dropdown)
2. Verify token variable exists and has value
3. Try typing `{{token}}` again - Postman should show a dropdown with available variables

### Issue 3: Token Has Extra Characters

**Problem:** Token might have newlines or extra spaces.

**Solution:**
1. Copy token from environment variable
2. Paste into a text editor
3. Remove any spaces/newlines
4. Use that cleaned token

## Manual Test (Bypass Environment Variables)

1. **Login** and copy the token from response
2. In `/api/auth/me` request:
   - Go to **Headers** tab
   - Add: `Authorization` = `Bearer <paste-actual-token-here>`
3. Send request

If this works, the issue is with environment variable resolution.

## Check Server Terminal Output

After sending the request, check your server terminal. You should see:

```
[GET] /api/auth/me
Authorization header: Bearer eyJhbGciOiJIUzI1NiIs...
=== /api/auth/me Debug ===
Headers: { authorization: 'Bearer eyJ...', ... }
Token check: { hasCookies: false, hasAuthHeader: true, tokenFromHeader: 'eyJ...', finalToken: 'eyJ...' }
✅ Token verified, userId: 6935a8e5eb8b9a75fe520e7f
✅ User found: admin@mallumagic.com
✅ User verified: admin@mallumagic.com
```

If you see "❌ No token found" or "❌ Token verification error", that tells us what's wrong.

## Still Not Working?

1. **Restart server**: Stop `npm run dev` and start again
2. **Clear Postman cache**: File → Settings → Clear cache
3. **Try different request**: Test with `/debug/headers` endpoint first
4. **Check JWT Secret**: Make sure `.env` has `JWT_SECRET` set (restart server after changing)

