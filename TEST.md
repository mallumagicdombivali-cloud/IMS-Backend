### 1. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
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
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "..."
  }
}
```

**Postman Setup:**
- **IMPORTANT:** Add this to the **Tests** tab of your login request:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        console.log("✅ Token saved!");
    }
}
```
- Then use `{{token}}` in Authorization → Bearer Token for all other requests
- See [POSTMAN_SETUP.md](./POSTMAN_SETUP.md) for detailed instructions

---

### 2. Get Current User
**GET** `/api/auth/me`

**Headers:**
- `Cookie: token=...` (or use Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

---

### 3. Refresh Token
**POST** `/api/auth/refresh`

**Headers:**
- `Cookie: refreshToken=...` (or send in body)

**Request Body (optional):**
```json
{
  "refreshToken": "..."
}
```

---

### 4. Logout
**POST** `/api/auth/logout`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Management (Admin Only)

### 1. Create User
**POST** `/api/users`

**Headers:**
- `Authorization: Bearer {{token}}`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "storekeeper",
  "departmentId": "department_id_here"
}
```

---

### 2. List Users
**GET** `/api/users?page=1&limit=50&role=storekeeper&departmentId=...`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role
- `departmentId` (optional): Filter by department

---

### 3. Get User by ID
**GET** `/api/users/[id]`

**Example:** `/api/users/507f1f77bcf86cd799439011`

---

### 4. Update User
**PATCH** `/api/users/[id]`

**Request Body:**
```json
{
  "name": "John Updated",
  "role": "hod",
  "departmentId": "new_department_id"
}
```

---

### 5. Delete User
**DELETE** `/api/users/[id]`

---

## Item Management

### 1. Create Item
**POST** `/api/items`

**Request Body:**
```json
{
  "code": "ITEM001",
  "name": "Laptop",
  "category": "Electronics",
  "unit": "piece",
  "description": "High-performance laptop",
  "minStock": 10,
  "reorderLevel": 20
}
```

---

### 2. List Items
**GET** `/api/items?page=1&limit=50&category=Electronics&search=laptop`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Filter by category
- `search` (optional): Search by name or code

---

### 3. Get Item by ID
**GET** `/api/items/[id]`

---

### 4. Update Item
**PATCH** `/api/items/[id]`

**Request Body:**
```json
{
  "name": "Updated Laptop",
  "minStock": 15
}
```

---

### 5. Delete Item
**DELETE** `/api/items/[id]`

---

### 6. Get Item Batches
**GET** `/api/items/[itemId]/batches?locationId=...`

---

## Batch & Stock Management

### 1. Get Batch by ID
**GET** `/api/batches/[id]`

---

### 2. Stock Adjustment
**POST** `/api/stock/adjust`

**Request Body:**
```json
{
  "itemId": "item_id_here",
  "batchId": "batch_id_here",
  "locationId": "location_id_here",
  "quantity": 5,
  "reason": "Physical count adjustment",
  "notes": "Found extra items during inventory"
}
```

**Note:** Positive quantity adds stock, negative deducts stock.

---

## Purchase Requisition (PR)

### 1. Create PR
**POST** `/api/pr`

**Request Body:**
```json
{
  "departmentId": "department_id_here",
  "items": [
    {
      "itemId": "item_id_here",
      "quantity": 10,
      "unit": "piece",
      "purpose": "Office supplies",
      "priority": "high"
    }
  ]
}
```

---

### 2. List PRs
**GET** `/api/pr?page=1&limit=50&status=pending&departmentId=...`

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (pending, approved, rejected, converted)
- `departmentId`: Filter by department
- `requestedBy`: Filter by requester

---

### 3. Get PR by ID
**GET** `/api/pr/[id]`

---

### 4. Approve PR
**POST** `/api/pr/[id]/approve`

**Required Roles:** admin, hod, accounts

**Request Body (optional):**
```json
{
  "rejectionReason": ""
}
```

---

### 5. Reject PR
**POST** `/api/pr/[id]/reject`

**Request Body:**
```json
{
  "rejectionReason": "Budget constraints"
}
```

---

## Purchase Order (PO)

### 1. Create PO
**POST** `/api/po`

**Required Roles:** admin, accounts

**Request Body:**
```json
{
  "prId": "pr_id_here",
  "supplierId": "supplier_id_here",
  "items": [
    {
      "itemId": "item_id_here",
      "quantity": 10,
      "unitPrice": 100.50,
      "unit": "piece"
    }
  ],
  "expectedDeliveryDate": "2024-12-31T00:00:00Z"
}
```

---

### 2. List POs
**GET** `/api/po?page=1&limit=50&status=approved&supplierId=...`

**Query Parameters:**
- `status`: Filter by status (draft, approved, sent, partial, completed, cancelled)
- `supplierId`: Filter by supplier
- `prId`: Filter by PR

---

### 3. Get PO by ID
**GET** `/api/po/[id]`

---

### 4. Approve PO
**POST** `/api/po/[id]/approve`

**Required Roles:** admin, accounts

---

### 5. Send PO
**POST** `/api/po/[id]/send`

**Required Roles:** admin, accounts

**Note:** Updates PO status to 'sent'. Email notification placeholder.

---

### 6. Cancel PO
**POST** `/api/po/[id]/cancel`

**Request Body:**
```json
{
  "cancellationReason": "Supplier unavailable"
}
```

---

## GRN (Goods Receipt Note)

### 1. Create GRN
**POST** `/api/grn`

**Required Roles:** admin, storekeeper, accounts

**Request Body:**
```json
{
  "poId": "po_id_here",
  "items": [
    {
      "itemId": "item_id_here",
      "batchNumber": "BATCH001",
      "quantity": 10,
      "unitPrice": 100.50,
      "expiryDate": "2025-12-31T00:00:00Z",
      "locationId": "location_id_here"
    }
  ],
  "notes": "All items received in good condition"
}
```

**Note:** This automatically:
- Creates batches
- Updates stock ledger (IN entries)
- Updates PO status (partial/completed)

---

### 2. List GRNs
**GET** `/api/grn?page=1&limit=50&poId=...&supplierId=...&status=...`

---

### 3. Get GRN by ID
**GET** `/api/grn/[id]`

---

## Issue Requests

### 1. Create Issue Request
**POST** `/api/issues`

**Request Body:**
```json
{
  "departmentId": "department_id_here",
  "items": [
    {
      "itemId": "item_id_here",
      "quantity": 5,
      "unit": "piece"
    }
  ],
  "purpose": "Department usage"
}
```

---

### 2. List Issue Requests
**GET** `/api/issues?page=1&limit=50&status=pending&departmentId=...`

**Query Parameters:**
- `status`: pending, approved, rejected, issued
- `departmentId`: Filter by department
- `requestedBy`: Filter by requester

---

### 3. Get Issue Request by ID
**GET** `/api/issues/[id]`

---

### 4. Approve Issue Request
**POST** `/api/issues/[id]/approve`

**Required Roles:** admin, hod, storekeeper

---

### 5. Reject Issue Request
**POST** `/api/issues/[id]/reject`

**Request Body:**
```json
{
  "rejectionReason": "Insufficient stock"
}
```

---

### 6. Issue Items
**POST** `/api/issues/[id]/issue`

**Required Roles:** admin, storekeeper

**Note:** This:
- Deducts stock from batches (FIFO)
- Creates stock ledger OUT entries
- Updates issue request status to 'issued'

---

## Returns

### 1. Create Return
**POST** `/api/returns`

**Request Body:**
```json
{
  "issueId": "issue_id_here",
  "departmentId": "department_id_here",
  "items": [
    {
      "itemId": "item_id_here",
      "batchId": "batch_id_here",
      "quantity": 2,
      "unit": "piece"
    }
  ],
  "reason": "Items not needed"
}
```

---

### 2. List Returns
**GET** `/api/returns?page=1&limit=50&status=pending&departmentId=...`

---

### 3. Get Return by ID
**GET** `/api/returns/[id]`

---

### 4. Approve Return
**POST** `/api/returns/[id]/approve`

**Required Roles:** admin, storekeeper

**Note:** This:
- Adds quantity back to batch
- Creates stock ledger RETURN entry

---

## Consumption Logs

### 1. Create Consumption Log
**POST** `/api/consumption`

**Request Body:**
```json
{
  "itemId": "item_id_here",
  "batchId": "batch_id_here",
  "departmentId": "department_id_here",
  "theoreticalQty": 10,
  "actualQty": 8,
  "notes": "Actual consumption lower than expected"
}
```

**Note:** Variance is calculated automatically (theoretical - actual)

---

### 2. List Consumption Logs
**GET** `/api/consumption?page=1&limit=50&itemId=...&departmentId=...&from=2024-01-01&to=2024-12-31`

**Query Parameters:**
- `itemId`: Filter by item
- `departmentId`: Filter by department
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

---

### 3. Get Consumption Variance Report
**GET** `/api/consumption/variance?itemId=...&departmentId=...&from=...&to=...`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 10,
      "totalTheoretical": 100,
      "totalActual": 95,
      "totalVariance": 5,
      "averageVariance": 0.5
    },
    "details": [...]
  }
}
```

---

## Reports

### 1. Stock Balance Report
**GET** `/api/reports/stock?locationId=...&itemId=...`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "itemId": "...",
      "itemCode": "ITEM001",
      "itemName": "Laptop",
      "totalQty": 50,
      "availableQty": 45,
      "reservedQty": 5,
      "batches": [...]
    }
  ]
}
```

---

### 2. Stock Valuation Report
**GET** `/api/reports/valuation?method=fifo&itemId=...&locationId=...`

**Query Parameters:**
- `method`: fifo, lifo, or wa (weighted average)
- `itemId` (optional): Filter by item
- `locationId` (optional): Filter by location

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "method": "fifo",
    "totalValuation": 50000,
    "itemValuations": [...]
  }
}
```

---

### 3. Consumption Report
**GET** `/api/reports/consumption?from=2024-01-01&to=2024-12-31&departmentId=...&itemId=...`

---

### 4. Expiry Report
**GET** `/api/reports/expiry?days=30`

**Query Parameters:**
- `days` (optional): Days ahead to check (default: 30)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "expiringWithinDays": 30,
    "expiring": [...],
    "expired": [...],
    "summary": {
      "expiringCount": 5,
      "expiredCount": 2,
      "expiringValue": 1000,
      "expiredValue": 500
    }
  }
}
```

---

### 5. Wastage Report
**GET** `/api/reports/wastage?from=2024-01-01&to=2024-12-31`

---

### 6. Purchase History Report
**GET** `/api/reports/purchase?from=2024-01-01&to=2024-12-31&supplierId=...`

---

### 7. Supplier Performance Report
**GET** `/api/reports/supplier-performance?from=2024-01-01&to=2024-12-31`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "supplierId": "...",
      "name": "Supplier Name",
      "totalPOs": 10,
      "totalGRNs": 8,
      "totalPOAmount": 50000,
      "totalGRNAmount": 40000,
      "completedPOs": 8,
      "onTimeDeliveries": 7,
      "onTimeDeliveryRate": 87.5,
      "completionRate": 80
    }
  ]
}
```

---

## Audit Logs (Admin Only)

### 1. List Audit Logs
**GET** `/api/audit?page=1&limit=50&userId=...&entity=user&entityId=...&action=CREATE&from=...&to=...`

**Query Parameters:**
- `userId`: Filter by user
- `entity`: Filter by entity type (user, item, pr, po, etc.)
- `entityId`: Filter by specific entity ID
- `action`: Filter by action (CREATE, UPDATE, DELETE, etc.)
- `from`, `to`: Date range

---

### 2. Get Audit Log by ID
**GET** `/api/audit/[id]`

---

## Departments (Admin Only)

### 1. Create Department
**POST** `/api/departments`

**Request Body:**
```json
{
  "name": "IT Department",
  "code": "IT",
  "hodId": "user_id_here"
}
```

---

### 2. List Departments
**GET** `/api/departments?isActive=true`

---

### 3. Update Department
**PATCH** `/api/departments/[id]`

**Request Body:**
```json
{
  "name": "Updated Department Name",
  "hodId": "new_hod_id",
  "isActive": true
}
```

---

### 4. Delete/Deactivate Department
**DELETE** `/api/departments/[id]`

**Note:** Soft delete - sets isActive to false

---

## Locations (Admin Only)

### 1. Create Location
**POST** `/api/locations`

**Request Body:**
```json
{
  "name": "Warehouse A",
  "code": "WH-A",
  "address": "123 Main St, City"
}
```

---

### 2. List Locations
**GET** `/api/locations?isActive=true`

---

### 3. Update Location
**PATCH** `/api/locations/[id]`

---

### 4. Delete/Deactivate Location
**DELETE** `/api/locations/[id]`

---

## Suppliers (Admin, Accounts)

### 1. Create Supplier
**POST** `/api/suppliers`

**Request Body:**
```json
{
  "name": "ABC Suppliers",
  "contactPerson": "John Smith",
  "email": "contact@abcsuppliers.com",
  "phone": "+1234567890",
  "address": "456 Supplier St",
  "taxId": "TAX123456",
  "rating": 4.5
}
```

---

### 2. List Suppliers
**GET** `/api/suppliers?isActive=true`

---

### 3. Get Supplier by ID
**GET** `/api/suppliers/[id]`

---

### 4. Update Supplier
**PATCH** `/api/suppliers/[id]`

---

### 5. Delete/Deactivate Supplier
**DELETE** `/api/suppliers/[id]`

---

## System Automation

### 1. Check Reorder Levels
**GET** or **POST** `/api/system/check-reorder`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "lowStockItems": [...],
    "count": 5,
    "urgentCount": 2
  }
}
```

---

### 2. Check Expiry
**GET** or **POST** `/api/system/check-expiry?days=30`

**Query Parameters:**
- `days` (optional): Days ahead to check (default: 30)

---

### 3. Generate Reports Cache
**POST** `/api/system/generate-reports`

**Note:** Pre-calculates and caches all report data

---

## Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Get current user info
- [ ] Refresh token
- [ ] Logout

### User Management
- [ ] Create user (admin only)
- [ ] List users with filters
- [ ] Get user by ID
- [ ] Update user
- [ ] Delete user
- [ ] Test unauthorized access (non-admin)

### Items & Stock
- [ ] Create item
- [ ] List items with search/filter
- [ ] Update item
- [ ] Delete item
- [ ] Get item batches
- [ ] Stock adjustment (add)
- [ ] Stock adjustment (deduct)

### Purchase Workflow
- [ ] Create PR
- [ ] Approve PR
- [ ] Reject PR
- [ ] Create PO from PR
- [ ] Approve PO
- [ ] Send PO
- [ ] Create GRN (should create batches and update stock)
- [ ] Verify stock updated after GRN

### Issue & Returns
- [ ] Create issue request
- [ ] Approve issue request
- [ ] Issue items (should deduct stock FIFO)
- [ ] Create return
- [ ] Approve return (should add stock back)

### Consumption
- [ ] Create consumption log
- [ ] List consumption logs
- [ ] Get variance report

### Reports
- [ ] Stock balance report
- [ ] Valuation report (FIFO, LIFO, WA)
- [ ] Consumption report
- [ ] Expiry report
- [ ] Wastage report
- [ ] Purchase history
- [ ] Supplier performance

### Master Data
- [ ] Create/List/Update/Delete departments
- [ ] Create/List/Update/Delete locations
- [ ] Create/List/Update/Delete suppliers

### System
- [ ] Check reorder levels
- [ ] Check expiry
- [ ] Generate reports cache




