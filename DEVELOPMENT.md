# Development Guide

This guide explains how to set up and run the Mallu Magic backend for local development.

## Prerequisites

- **Node.js** version 18.x or higher
- **npm** or **yarn** package manager
- **Vercel CLI** (for local development)
- **MongoDB Atlas** account or local MongoDB instance
- **Git** (optional, for version control)

### Check Prerequisites

```bash
# Check Node.js version
node --version
# Should be v18.x or higher

# Check npm version
npm --version

# Check if Vercel CLI is installed
vercel --version
```

---

## Step 1: Install Dependencies

### Install Node.js (if not installed)

**Required:** Node.js 18.x or higher

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Linux:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Windows:**
- Download Node.js from [nodejs.org](https://nodejs.org/)
- Install the LTS version (18.x or higher)

### Install Project Dependencies

Navigate to the project directory and install dependencies:

```bash
cd /Users/bala/Mallu\ Magic/backend
npm install
```

This will install all dependencies listed in `package.json`:
- `mongodb` - MongoDB driver
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `zod` - Schema validation
- `dotenv` - Environment variable loading (dev dependency)
- TypeScript and type definitions

---

## Step 2: Install Dependencies

**Note:** Vercel CLI is optional now! The new dev server runs locally without Vercel.

### Install Project Dependencies

All required dependencies will be installed with `npm install`, including:
- `express` - Web server framework
- `ts-node-dev` - TypeScript development server with hot reload
- All other project dependencies

---

## Step 3: Install Vercel CLI (Optional)

Vercel CLI is only needed if you want to test the actual Vercel serverless environment:

```bash
# Install globally (optional)
npm install -g vercel

# Verify installation
vercel --version
```

**Note:** This is optional! The default `npm run dev` doesn't require Vercel CLI.

---

## Step 4: Set Up Environment Variables

### Create `.env` File

Create a `.env` file in the project root directory:

```bash
touch .env
```

### Add Environment Variables

Open `.env` and add the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
DB_NAME=mallu_magic

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Environment
NODE_ENV=development
```

### Generate JWT Secrets

Generate secure random strings for JWT secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (run again to get a different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the outputs and paste them into your `.env` file.

**Example `.env` file:**
```env
MONGODB_URI=mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
DB_NAME=mallu_magic
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b9a8
NODE_ENV=development
```

**Important:** The `.env` file is already in `.gitignore`, so it won't be committed to version control.

---

## Step 5: Verify MongoDB Connection

Before starting the server, verify your MongoDB connection:

### Create Test Script

Create `test-connection.js` in the project root:

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = client.db(process.env.DB_NAME || 'mallu_magic');
    const collections = await db.listCollections().toArray();
    console.log('📦 Existing collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Connection test completed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

### Run Connection Test

```bash
# Run test (dotenv is already installed)
node test-connection.js
```

**Expected Output:**
```
✅ Connected to MongoDB successfully!
📦 Existing collections: []
✅ Connection test completed
```

---

## Step 6: Run Development Server

### Start the Development Server

```bash
npm run dev
```

This command:
- ✅ Starts a local Express server (no Vercel CLI needed!)
- ✅ Automatically initializes MongoDB collections and indexes
- ✅ Enables hot reloading with ts-node-dev
- ✅ Loads environment variables from `.env`
- ✅ Registers all API routes automatically

### Default Development URL

The server will start at:
```
http://localhost:3000
```

### First Run Behavior

On first run, the server will:
1. ✅ Connect to MongoDB
2. ✅ Create all collections if they don't exist
3. ✅ Create all indexes for optimal performance
4. ✅ Load and register all API routes
5. ✅ Start the Express server

**Expected Output:**
```
🚀 Starting development server...

🔧 Initializing database...
Connected to MongoDB
  ✅ Created collection: users
    ✓ Index created: users.email
  ✅ Created collection: items
    ✓ Index created: items.code
  ...
✅ Database initialization completed!

📁 Loading API routes...
  ✓ Registered route: /api/auth/login
  ✓ Registered route: /api/auth/logout
  ...

✅ Server is running!
📍 Local:   http://localhost:3000
📍 API:     http://localhost:3000/api
📍 Health:  http://localhost:3000/health

Press Ctrl+C to stop the server
```

### Alternative: Vercel Dev (Optional)

If you want to use Vercel's dev server instead:

```bash
npm run dev:vercel
```

This uses `vercel dev` for testing the actual Vercel serverless environment.

---

## Step 7: Test the API

### Test Health Check (if you have one)

```bash
# Using curl
curl http://localhost:3000/api/auth/me

# Using httpie (if installed)
http GET http://localhost:3000/api/auth/me
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Using Postman

1. Import the API endpoints from `TEST.md`
2. Set base URL to `http://localhost:3000`
3. Test endpoints as documented

---

## Development Workflow

### File Structure

```
backend/
├── api/              # API route handlers
├── lib/              # Shared utilities
├── types/            # TypeScript type definitions
├── .env              # Environment variables (not in git)
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── vercel.json       # Vercel configuration
```

### Making Changes

1. **Edit files** in your IDE
2. **Save changes** - Vercel dev will auto-reload
3. **Test endpoints** using Postman or curl
4. **Check console** for errors

### Type Checking

Run TypeScript type checking without building:

```bash
npm run type-check
```

This will show any TypeScript errors without creating output files.

### Building for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript (though Vercel handles this automatically on deploy).

---

## Common Development Tasks

### Seed Mock Data

Populate your database with mock data including users with Indian names and goods/items:

```bash
npm run seed
```

This will create:
- **18 Users** with Indian names (admins, storekeepers, HODs, accounts, regular users)
- **30 Items/Goods** with Indian names (rice, dal, spices, oils, vegetables, etc.)
- **5 Departments** (Kitchen, Housekeeping, Maintenance, Administration, Security)
- **4 Locations** (Main Store, Kitchen Store, Cold Storage, Dry Store)
- **4 Suppliers** with Indian business names

**Default Login Credentials:**
- Admin: `admin@mallumagic.com` / `password123`
- Storekeeper: `storekeeper@mallumagic.com` / `password123`
- HOD: `hod@mallumagic.com` / `password123`
- Accounts: `accounts@mallumagic.com` / `password123`

**Note:** The seed script will skip creating data if it already exists to avoid duplicates.

### Create First Admin User (Alternative)

If you only want to create a single admin user:

```bash
npm run create-admin
```

This will create an admin user with:
- **Email:** `admin@mallumagic.com` (default)
- **Password:** `admin123` (default)
- **Name:** `Admin User` (default)

**Customize Admin Credentials:**

You can set custom credentials via environment variables in your `.env` file:

```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Admin Name
```

Then run:
```bash
npm run create-admin
```

### View Logs

Vercel dev shows logs in the terminal. Watch for:
- Connection errors
- API request logs
- Error stack traces

### Debugging

1. **Add console.log statements** in your code
2. **Check terminal output** when making requests
3. **Use Postman** to test endpoints with detailed error responses
4. **Check MongoDB Atlas** logs for database issues

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Use a different port
vercel dev --listen 3001

# Or kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed

**Error:** `MongoServerError: bad auth` or connection timeout

**Solutions:**
1. Check `.env` file has correct `MONGODB_URI`
2. Verify MongoDB Atlas Network Access allows your IP
3. Check username/password in connection string
4. Ensure database name is included in connection string

### Module Not Found Errors

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Error:** Type errors in IDE or build

**Solution:**
```bash
# Check for type errors
npm run type-check

# Fix any issues shown
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Environment Variables Not Loading

**Error:** `process.env.MONGODB_URI is undefined`

**Solutions:**
1. Ensure `.env` file exists in project root
2. Check `.env` file has correct variable names
3. Restart the dev server after changing `.env`
4. For Vercel dev, variables should load automatically

---

## Development Tips

### 1. Use Postman Collections

Import endpoints from `TEST.md` into Postman for easy testing.

### 2. Enable TypeScript Strict Mode

Already enabled in `tsconfig.json` - helps catch errors early.

### 3. Use Git for Version Control

```bash
# Initialize git (if not already)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit"
```

### 4. Hot Reloading

Vercel dev automatically reloads when you save files. No need to restart manually.

### 5. API Testing

Keep Postman or another API client open while developing to quickly test changes.

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up environment variables
3. ✅ Test MongoDB connection
4. ✅ Start development server
5. ✅ Create first admin user
6. ✅ Test API endpoints
7. ✅ Start developing!

---

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Postman Documentation](https://learning.postman.com/)

---

## Quick Reference

```bash
# Install dependencies (first time)
npm install

# Start dev server (auto-creates MongoDB collections)
npm run dev

# Seed mock data (users, items, departments, locations, suppliers)
npm run seed

# Type check
npm run type-check

# Build for production
npm run build

# Create admin user (alternative to seed)
npm run create-admin

# Test MongoDB connection
node test-connection.js

# Use Vercel dev (optional)
npm run dev:vercel
```

**Development URL:** `http://localhost:3000`

**API Base Path:** `http://localhost:3000/api`

**Health Check:** `http://localhost:3000/health`

---

## What Happens on `npm run dev`?

1. ✅ **Connects to MongoDB** using your connection string from `.env`
2. ✅ **Creates all collections** if they don't exist (users, items, batches, etc.)
3. ✅ **Creates all indexes** for optimal query performance
4. ✅ **Loads all API routes** from the `/api` directory
5. ✅ **Starts Express server** on port 3000
6. ✅ **Enables hot reload** - changes to code automatically restart the server

**No Vercel CLI needed!** Everything runs locally with Node.js and Express.

