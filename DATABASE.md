# MongoDB Database Setup Guide

This document provides step-by-step instructions for setting up the MongoDB database for the Mallu Magic backend.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Or local MongoDB installation

---

## Quick Setup (Your Connection String)

If you already have your MongoDB Atlas connection string, use this configuration:

**Connection String:**
```
mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
```

**Set in Vercel Environment Variables:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   - `MONGODB_URI` = `mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic`
   - `DB_NAME` = `mallu_magic`
   - `JWT_SECRET` = (generate a secure random string)
   - `JWT_REFRESH_SECRET` = (generate a secure random string)

**For Local Development (.env file):**
```env
MONGODB_URI=mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
DB_NAME=mallu_magic
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
NODE_ENV=development
```

**Important Notes:**
- The database name `mallu_magic` has been added to the connection string
- Make sure your IP address is whitelisted in MongoDB Atlas Network Access
- The database will be created automatically on first connection

---

## Option 1: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Choose **"M0 Free"** tier (or paid tier for production)
3. Select your preferred cloud provider and region
4. Click **"Create"**
5. Wait for cluster to be created (2-3 minutes)

### Step 3: Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username and generate a secure password
5. Set user privileges to **"Atlas Admin"** (or custom role)
6. Click **"Add User"**
7. **Save the username and password** - you'll need it for the connection string

### Step 4: Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Add Current IP Address"**
4. For production: Add your Vercel server IPs or use `0.0.0.0/0` (less secure)
5. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `mallu_magic` (or your preferred database name)

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mallu_magic?retryWrites=true&w=majority
```

### Step 6: Set Environment Variables

Add to your Vercel project or `.env` file:

**Important:** Add the database name to your connection string. If your connection string doesn't include the database name, add it after the hostname.

**Your Connection String (with database name):**
```
mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
```

**Environment Variables:**
```env
MONGODB_URI=mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic
DB_NAME=mallu_magic
```

**Note:** The database name `mallu_magic` has been added to the connection string. If you prefer a different database name, replace it in both the connection string and DB_NAME variable.

---

## Option 2: Local MongoDB Installation

### Step 1: Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# Follow official MongoDB installation guide
# https://www.mongodb.com/docs/manual/installation/
```

**Windows:**
- Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
- Run the installer
- MongoDB will start automatically as a service

### Step 2: Create Database

MongoDB creates databases automatically when you first write data. The database will be created when the application connects.

**Connection String:**
```
mongodb://localhost:27017/mallu_magic
```

### Step 3: Set Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/mallu_magic
DB_NAME=mallu_magic
```

---

## Database Collections

The following collections will be created automatically when the application runs:

### Core Collections

1. **users** - User accounts and authentication
2. **items** - Inventory items
3. **item_batches** - Stock batches with expiry dates
4. **stock_ledger** - All stock transactions (IN/OUT/ADJUST/RETURN/CONSUMPTION)
5. **purchase_requisitions** - Purchase requisition requests
6. **purchase_orders** - Purchase orders to suppliers
7. **grns** - Goods receipt notes
8. **issue_requests** - Item issue requests
9. **returns** - Returned items
10. **consumption_logs** - Consumption tracking with variance
11. **suppliers** - Supplier master data
12. **departments** - Department master data
13. **locations** - Location/warehouse master data
14. **audit_logs** - System audit trail
15. **reports_cache** - Cached report data

---

## Recommended Indexes

Create these indexes for optimal performance:

### Users Collection
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ departmentId: 1 })
```

### Items Collection
```javascript
db.items.createIndex({ code: 1 }, { unique: true })
db.items.createIndex({ name: "text", code: "text" })
db.items.createIndex({ category: 1 })
```

### Item Batches Collection
```javascript
db.item_batches.createIndex({ itemId: 1, locationId: 1 })
db.item_batches.createIndex({ batchNumber: 1 })
db.item_batches.createIndex({ expiryDate: 1 })
db.item_batches.createIndex({ grnId: 1 })
db.item_batches.createIndex({ createdAt: 1 }) // For FIFO sorting
```

### Stock Ledger Collection
```javascript
db.stock_ledger.createIndex({ itemId: 1, createdAt: -1 })
db.stock_ledger.createIndex({ batchId: 1 })
db.stock_ledger.createIndex({ transactionType: 1 })
db.stock_ledger.createIndex({ referenceId: 1 })
db.stock_ledger.createIndex({ createdAt: -1 })
```

### Purchase Requisitions Collection
```javascript
db.purchase_requisitions.createIndex({ prNumber: 1 }, { unique: true })
db.purchase_requisitions.createIndex({ status: 1 })
db.purchase_requisitions.createIndex({ departmentId: 1 })
db.purchase_requisitions.createIndex({ requestedBy: 1 })
db.purchase_requisitions.createIndex({ createdAt: -1 })
```

### Purchase Orders Collection
```javascript
db.purchase_orders.createIndex({ poNumber: 1 }, { unique: true })
db.purchase_orders.createIndex({ status: 1 })
db.purchase_orders.createIndex({ supplierId: 1 })
db.purchase_orders.createIndex({ prId: 1 })
db.purchase_orders.createIndex({ createdAt: -1 })
```

### GRNs Collection
```javascript
db.grns.createIndex({ grnNumber: 1 }, { unique: true })
db.grns.createIndex({ poId: 1 })
db.grns.createIndex({ supplierId: 1 })
db.grns.createIndex({ createdAt: -1 })
```

### Issue Requests Collection
```javascript
db.issue_requests.createIndex({ issueNumber: 1 }, { unique: true })
db.issue_requests.createIndex({ status: 1 })
db.issue_requests.createIndex({ departmentId: 1 })
db.issue_requests.createIndex({ requestedBy: 1 })
db.issue_requests.createIndex({ createdAt: -1 })
```

### Returns Collection
```javascript
db.returns.createIndex({ returnNumber: 1 }, { unique: true })
db.returns.createIndex({ status: 1 })
db.returns.createIndex({ departmentId: 1 })
db.returns.createIndex({ issueId: 1 })
```

### Consumption Logs Collection
```javascript
db.consumption_logs.createIndex({ itemId: 1, consumedAt: -1 })
db.consumption_logs.createIndex({ departmentId: 1 })
db.consumption_logs.createIndex({ batchId: 1 })
db.consumption_logs.createIndex({ consumedAt: -1 })
```

### Audit Logs Collection
```javascript
db.audit_logs.createIndex({ userId: 1, timestamp: -1 })
db.audit_logs.createIndex({ entity: 1, entityId: 1 })
db.audit_logs.createIndex({ action: 1 })
db.audit_logs.createIndex({ timestamp: -1 })
```

### Suppliers Collection
```javascript
db.suppliers.createIndex({ email: 1 })
db.suppliers.createIndex({ isActive: 1 })
```

### Departments Collection
```javascript
db.departments.createIndex({ code: 1 }, { unique: true })
db.departments.createIndex({ isActive: 1 })
```

### Locations Collection
```javascript
db.locations.createIndex({ code: 1 }, { unique: true })
db.locations.createIndex({ isActive: 1 })
```

---

## Creating Indexes via MongoDB Shell

### Connect to MongoDB Atlas

1. Go to your cluster in MongoDB Atlas
2. Click **"Connect"**
3. Choose **"MongoDB Shell"**
4. Copy the connection command
5. Run it in your terminal

### Run Index Creation Script

Create a file `create-indexes.js`:

```javascript
// Connect to your database
use mallu_magic;

// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ departmentId: 1 });

// Items
db.items.createIndex({ code: 1 }, { unique: true });
db.items.createIndex({ name: "text", code: "text" });
db.items.createIndex({ category: 1 });

// Item Batches
db.item_batches.createIndex({ itemId: 1, locationId: 1 });
db.item_batches.createIndex({ batchNumber: 1 });
db.item_batches.createIndex({ expiryDate: 1 });
db.item_batches.createIndex({ grnId: 1 });
db.item_batches.createIndex({ createdAt: 1 });

// Stock Ledger
db.stock_ledger.createIndex({ itemId: 1, createdAt: -1 });
db.stock_ledger.createIndex({ batchId: 1 });
db.stock_ledger.createIndex({ transactionType: 1 });
db.stock_ledger.createIndex({ referenceId: 1 });
db.stock_ledger.createIndex({ createdAt: -1 });

// Purchase Requisitions
db.purchase_requisitions.createIndex({ prNumber: 1 }, { unique: true });
db.purchase_requisitions.createIndex({ status: 1 });
db.purchase_requisitions.createIndex({ departmentId: 1 });
db.purchase_requisitions.createIndex({ requestedBy: 1 });
db.purchase_requisitions.createIndex({ createdAt: -1 });

// Purchase Orders
db.purchase_orders.createIndex({ poNumber: 1 }, { unique: true });
db.purchase_orders.createIndex({ status: 1 });
db.purchase_orders.createIndex({ supplierId: 1 });
db.purchase_orders.createIndex({ prId: 1 });
db.purchase_orders.createIndex({ createdAt: -1 });

// GRNs
db.grns.createIndex({ grnNumber: 1 }, { unique: true });
db.grns.createIndex({ poId: 1 });
db.grns.createIndex({ supplierId: 1 });
db.grns.createIndex({ createdAt: -1 });

// Issue Requests
db.issue_requests.createIndex({ issueNumber: 1 }, { unique: true });
db.issue_requests.createIndex({ status: 1 });
db.issue_requests.createIndex({ departmentId: 1 });
db.issue_requests.createIndex({ requestedBy: 1 });
db.issue_requests.createIndex({ createdAt: -1 });

// Returns
db.returns.createIndex({ returnNumber: 1 }, { unique: true });
db.returns.createIndex({ status: 1 });
db.returns.createIndex({ departmentId: 1 });
db.returns.createIndex({ issueId: 1 });

// Consumption Logs
db.consumption_logs.createIndex({ itemId: 1, consumedAt: -1 });
db.consumption_logs.createIndex({ departmentId: 1 });
db.consumption_logs.createIndex({ batchId: 1 });
db.consumption_logs.createIndex({ consumedAt: -1 });

// Audit Logs
db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
db.audit_logs.createIndex({ entity: 1, entityId: 1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ timestamp: -1 });

// Suppliers
db.suppliers.createIndex({ email: 1 });
db.suppliers.createIndex({ isActive: 1 });

// Departments
db.departments.createIndex({ code: 1 }, { unique: true });
db.departments.createIndex({ isActive: 1 });

// Locations
db.locations.createIndex({ code: 1 }, { unique: true });
db.locations.createIndex({ isActive: 1 });

print("All indexes created successfully!");
```

Run the script:
```bash
mongo <connection-string> create-indexes.js
```

Or via MongoDB Compass:
1. Connect to your database
2. Go to each collection
3. Click "Indexes" tab
4. Click "Create Index"
5. Add the index fields

---

## Initial Data Seeding (Optional)

### Create Admin User

You can create an admin user via MongoDB shell or API:

**Via MongoDB Shell:**
```javascript
use mallu_magic;

// Note: Password should be hashed with bcrypt
// Use the API endpoint POST /api/users to create users properly
// Or use this script with bcrypt (requires Node.js)

// Example (password: admin123 - hash this first!)
db.users.insertOne({
  name: "Admin User",
  email: "admin@mallumagic.com",
  hash: "$2b$10$...", // bcrypt hash of password
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Recommended: Use API Endpoint**

1. First, manually create one admin user in MongoDB (or use MongoDB Atlas UI)
2. Then use the API to create other users

**Via API (after creating first admin):**
```bash
POST /api/users
Authorization: Bearer <admin-token>

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

### Create Sample Master Data

**Departments:**
```javascript
db.departments.insertMany([
  {
    name: "IT Department",
    code: "IT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Finance Department",
    code: "FIN",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

**Locations:**
```javascript
db.locations.insertMany([
  {
    name: "Main Warehouse",
    code: "WH-MAIN",
    address: "123 Warehouse St",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Store Room A",
    code: "STORE-A",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

**Suppliers:**
```javascript
db.suppliers.insertMany([
  {
    name: "ABC Suppliers",
    contactPerson: "John Doe",
    email: "contact@abcsuppliers.com",
    phone: "+1234567890",
    address: "456 Supplier St",
    isActive: true,
    rating: 4.5,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

---

## Database Connection Testing

### Test Connection via Node.js

Create `test-connection.js`:

```javascript
const { MongoClient } = require('mongodb');

// Your connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic';

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = client.db('mallu_magic');
    const collections = await db.listCollections().toArray();
    console.log('📦 Collections:', collections.map(c => c.name));
    
    // Test write operation (creates database if it doesn't exist)
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Test write successful');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('✅ Test cleanup successful');
    
    await client.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.error('Error details:', error.message);
  }
}

testConnection();
```

Run:
```bash
node test-connection.js
```

**Expected Output:**
```
✅ Connected to MongoDB successfully!
📦 Collections: []
✅ Test write successful
✅ Test cleanup successful
✅ Connection closed
```

---

## Vercel Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://bala010706_db_user:Bala010706@mallumagic.rwkjsvn.mongodb.net/mallu_magic?retryWrites=true&w=majority&appName=MalluMagic` | Production, Preview, Development |
| `DB_NAME` | `mallu_magic` | Production, Preview, Development |
| `JWT_SECRET` | A secure random string | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | A secure random string | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**Generate Secure JWT Secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example JWT Secrets (generate your own!):**
```bash
# Run this command twice to get two different secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy the output and use:**
- First output → `JWT_SECRET`
- Second output → `JWT_REFRESH_SECRET`

---

## Database Backup & Maintenance

### Backup (MongoDB Atlas)

1. Go to **"Backups"** in MongoDB Atlas
2. Enable **"Cloud Backup"** (available on M10+ clusters)
3. Configure backup schedule

### Backup (Local MongoDB)

```bash
# Export database
mongodump --uri="mongodb://localhost:27017/mallu_magic" --out=/backup/path

# Import database
mongorestore --uri="mongodb://localhost:27017/mallu_magic" /backup/path
```

### Maintenance Tasks

1. **Regular Index Optimization**: Monitor slow queries and add indexes
2. **Data Archiving**: Archive old audit logs and stock ledger entries
3. **Connection Pooling**: Already handled by the MongoDB driver
4. **Monitoring**: Use MongoDB Atlas monitoring or local monitoring tools

---

## Troubleshooting

### Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username and password in connection string
- Verify database user has proper permissions

**Error: "MongoServerError: IP not whitelisted"**
- Add your IP address to MongoDB Atlas Network Access
- For Vercel, you may need to allow all IPs (0.0.0.0/0) or use Vercel IP ranges

**Error: "Connection timeout"**
- Check network connectivity
- Verify firewall settings
- Check MongoDB Atlas cluster status

### Performance Issues

- Ensure indexes are created
- Monitor slow queries in MongoDB Atlas
- Consider upgrading cluster tier for production
- Use connection pooling (already implemented)

### Data Issues

- Verify data types match TypeScript interfaces
- Check ObjectId format (24-character hex string)
- Ensure required fields are present

---

## Security Best Practices

1. **Use Strong Passwords**: For database users
2. **IP Whitelisting**: Restrict network access to known IPs
3. **Encryption**: Use TLS/SSL (enabled by default in Atlas)
4. **Regular Backups**: Enable automated backups
5. **Access Control**: Use role-based access in MongoDB
6. **Environment Variables**: Never commit secrets to git
7. **Connection String**: Store securely, never expose in client-side code

---

## Next Steps

1. ✅ Set up MongoDB Atlas or local MongoDB
2. ✅ Create database user and get connection string
3. ✅ Set environment variables in Vercel
4. ✅ Create recommended indexes
5. ✅ Create initial admin user
6. ✅ Test database connection
7. ✅ Deploy application to Vercel
8. ✅ Test API endpoints (see TEST.md)

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)
- [MongoDB Indexes Guide](https://docs.mongodb.com/manual/indexes/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

