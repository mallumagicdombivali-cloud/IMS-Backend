# Mallu Magic Backend

A comprehensive, production-ready inventory management system backend built with Node.js, TypeScript, and MongoDB. Designed for serverless deployment on Vercel with full REST API support.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/cloud/atlas)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Mallu Magic Backend is a feature-rich inventory management system designed to handle complex supply chain operations including purchase requisitions, purchase orders, goods receipt notes, stock management, issue requests, returns, consumption tracking, and comprehensive reporting.

### Key Capabilities

- **Complete Inventory Lifecycle**: From purchase requisition to consumption tracking
- **Multi-location Support**: Manage inventory across multiple warehouses and locations
- **Batch Tracking**: FIFO/LIFO inventory management with expiry tracking
- **Role-Based Access Control**: Admin, Storekeeper, HOD, and Accounts roles
- **Comprehensive Reporting**: Stock valuation, consumption analysis, expiry alerts, and more
- **Audit Trail**: Complete audit logging for all operations

## ✨ Features

### Core Features

- 🔐 **JWT Authentication** with HttpOnly cookies and refresh tokens
- 👥 **User Management** with role-based access control (RBAC)
- 📦 **Item Management** with categories, search, and pagination
- 🏷️ **Batch Tracking** with expiry date management
- 📊 **Stock Ledger** for complete transaction history
- 🛒 **Purchase Workflow** (PR → PO → GRN)
- 📤 **Issue & Returns** management
- 📈 **Consumption Tracking** with variance analysis
- 📋 **Comprehensive Reports** (stock, valuation, consumption, expiry, wastage)
- 🔍 **Audit Logging** for all operations
- 🏢 **Master Data** (departments, locations, suppliers)

### Advanced Features

- **FIFO/LIFO/Weighted Average** stock valuation methods
- **Automatic Reorder Alerts** for low stock items
- **Expiry Monitoring** with configurable alert windows
- **Supplier Performance** tracking and analytics
- **Consumption Variance** analysis
- **Multi-currency Support** (ready for extension)

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Database**: MongoDB Atlas (with official Node.js driver)
- **Deployment**: Vercel Serverless Functions
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **HTTP Server**: Express (for local development)

### Development Tools

- **TypeScript**: Type-safe development
- **ts-node-dev**: Hot reloading for development
- **tsconfig-paths**: Path alias resolution
- **dotenv**: Environment variable management

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas)) or local MongoDB instance
- **Git** (optional, for version control)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mallu_magic?retryWrites=true&w=majority
DB_NAME=mallu_magic

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Environment
NODE_ENV=development
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize Database

The database collections and indexes are automatically created on first run. To seed with mock data:

```bash
npm run seed
```

This creates:
- 18 users with Indian names
- 30 items/goods with Indian names
- 5 departments
- 4 locations
- 4 suppliers

**Default Login Credentials:**
- Admin: `admin@mallumagic.com` / `password123`
- Storekeeper: `storekeeper@mallumagic.com` / `password123`
- HOD: `hod@mallumagic.com` / `password123`
- Accounts: `accounts@mallumagic.com` / `password123`

### 5. Start Development Server

```bash
npm run dev
```

The server will:
- ✅ Connect to MongoDB
- ✅ Create all collections and indexes automatically
- ✅ Load all API routes
- ✅ Start on `http://localhost:3000`

### 6. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mallumagic.com","password":"password123"}'
```

## 📁 Project Structure

```
backend/
├── api/                    # Vercel serverless function entry point
│   └── index.ts           # Main router (consolidates all routes)
├── handlers/              # Route handler implementations
│   ├── auth/              # Authentication endpoints
│   ├── users/             # User management
│   ├── items/             # Item management
│   ├── pr/                # Purchase requisitions
│   ├── po/                # Purchase orders
│   ├── grn/               # Goods receipt notes
│   ├── issues/            # Issue requests
│   ├── returns/           # Returns management
│   ├── consumption/       # Consumption tracking
│   ├── reports/           # Report endpoints
│   ├── audit/             # Audit logs
│   ├── suppliers/         # Supplier management
│   ├── departments/       # Department management
│   ├── locations/         # Location management
│   └── system/           # System automation
├── lib/                   # Shared utilities
│   ├── db.ts             # MongoDB connection
│   ├── auth.ts           # Authentication utilities
│   ├── audit.ts          # Audit logging
│   ├── rbac.ts           # Role-based access control
│   ├── validations.ts    # Zod schemas
│   ├── cookies.ts        # Cookie parsing
│   └── init-db.ts        # Database initialization
├── types/                 # TypeScript type definitions
│   ├── index.d.ts        # Main types
│   └── vercel.d.ts       # Vercel-specific types
├── scripts/               # Utility scripts
│   ├── create-admin.js   # Create admin user
│   └── seed-data.ts      # Seed mock data
├── server.ts              # Local development server
├── package.json           # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

## 📚 API Documentation

### Base URL

- **Local Development**: `http://localhost:3000`
- **Production**: `https://your-project.vercel.app`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints Overview

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

#### User Management (Admin only)
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user by ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

#### Items
- `POST /api/items` - Create item
- `GET /api/items` - List items (with search/filter)
- `GET /api/items/[id]` - Get item by ID
- `PATCH /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `GET /api/items/[itemId]/batches` - Get item batches

#### Purchase Requisitions
- `POST /api/pr` - Create PR
- `GET /api/pr` - List PRs
- `GET /api/pr/[id]` - Get PR by ID
- `POST /api/pr/[id]/approve` - Approve PR
- `POST /api/pr/[id]/reject` - Reject PR

#### Purchase Orders
- `POST /api/po` - Create PO
- `GET /api/po` - List POs
- `GET /api/po/[id]` - Get PO by ID
- `POST /api/po/[id]/approve` - Approve PO
- `POST /api/po/[id]/send` - Send PO to supplier
- `POST /api/po/[id]/cancel` - Cancel PO

#### Goods Receipt Notes (GRN)
- `POST /api/grn` - Create GRN (auto-creates batches)
- `GET /api/grn` - List GRNs
- `GET /api/grn/[id]` - Get GRN by ID

#### Issue Requests
- `POST /api/issues` - Create issue request
- `GET /api/issues` - List issue requests
- `GET /api/issues/[id]` - Get issue request
- `POST /api/issues/[id]/approve` - Approve issue
- `POST /api/issues/[id]/reject` - Reject issue
- `POST /api/issues/[id]/issue` - Issue items (FIFO deduction)

#### Returns
- `POST /api/returns` - Create return
- `GET /api/returns` - List returns
- `GET /api/returns/[id]` - Get return by ID
- `POST /api/returns/[id]/approve` - Approve return

#### Consumption
- `POST /api/consumption` - Log consumption
- `GET /api/consumption` - List consumption logs
- `GET /api/consumption/variance` - Get variance report

#### Reports
- `GET /api/reports/stock` - Stock balance report
- `GET /api/reports/valuation` - Stock valuation (FIFO/LIFO/WA)
- `GET /api/reports/consumption` - Consumption report
- `GET /api/reports/expiry` - Expiry report
- `GET /api/reports/wastage` - Wastage report
- `GET /api/reports/purchase` - Purchase history
- `GET /api/reports/supplier-performance` - Supplier performance

#### Audit Logs (Admin only)
- `GET /api/audit` - List audit logs
- `GET /api/audit/[id]` - Get audit log by ID

#### Master Data
- Departments: `POST /api/departments`, `GET /api/departments`, etc.
- Locations: `POST /api/locations`, `GET /api/locations`, etc.
- Suppliers: `POST /api/suppliers`, `GET /api/suppliers`, etc.

For complete API documentation with request/response examples, see [TEST.md](./TEST.md).

## 🔐 Authentication

### Login Flow

1. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "admin@mallumagic.com",
     "password": "password123"
   }
   ```

2. **Response**: Returns JWT token and user data
   ```json
   {
     "success": true,
     "data": {
       "user": { ... },
       "token": "eyJhbGciOiJIUzI1NiIs..."
     }
   }
   ```

3. **Use Token**: Include in subsequent requests
   ```
   Authorization: Bearer <token>
   ```

### Token Management

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 7 days
- **HttpOnly Cookies**: Automatically set on login
- **Auto-refresh**: Use `/api/auth/refresh` endpoint

For detailed Postman setup, see [POSTMAN_SETUP.md](./POSTMAN_SETUP.md).

## 🗄️ Database Schema

### Collections

1. **users** - User accounts and authentication
2. **items** - Inventory items
3. **item_batches** - Stock batches with expiry dates
4. **stock_ledger** - All stock transactions
5. **purchase_requisitions** - Purchase requisition requests
6. **purchase_orders** - Purchase orders to suppliers
7. **grns** - Goods receipt notes
8. **issue_requests** - Item issue requests
9. **returns** - Returned items
10. **consumption_logs** - Consumption tracking
11. **suppliers** - Supplier master data
12. **departments** - Department master data
13. **locations** - Location/warehouse master data
14. **audit_logs** - System audit trail
15. **reports_cache** - Cached report data

### Indexes

All collections have optimized indexes for performance. See [DATABASE.md](./DATABASE.md) for complete index definitions.

## 💻 Development

### Available Scripts

```bash
# Start development server (auto-creates DB collections)
npm run dev

# Seed database with mock data
npm run seed

# Create admin user
npm run create-admin

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server (after build)
npm start
```

### Development Workflow

1. **Start Server**: `npm run dev`
2. **Make Changes**: Edit files in `api/` or `lib/`
3. **Auto Reload**: Server automatically restarts on file changes
4. **Test**: Use Postman or curl to test endpoints
5. **Check Logs**: View server logs in terminal

### Code Structure

- **API Routes**: Each endpoint is a separate file in `/api`
- **Shared Logic**: Utilities in `/lib`
- **Type Safety**: All types defined in `/types`
- **Validation**: Zod schemas in `/lib/validations.ts`

For detailed development guide, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## 🚢 Deployment

### Deploy to Vercel

**Important:** This project uses a consolidated router (`api/index.ts`) to stay within Vercel's Hobby plan limit of 12 serverless functions. All API routes are handled through a single function.

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `DB_NAME` (optional)

### Vercel Function Limit

The project is optimized for Vercel's Hobby plan (12 function limit) by using a single consolidated router (`api/index.ts`) that handles all routes internally. This means:
- ✅ Only **1 serverless function** is created (stays within limit)
- ✅ All API endpoints still work exactly the same
- ✅ No changes needed to your API calls
- ✅ Local development unchanged (uses Express server)

### Environment Variables

Required environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | (64-char hex string) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (64-char hex string) |
| `DB_NAME` | Database name | `mallu_magic` |
| `NODE_ENV` | Environment | `production` |

For detailed deployment instructions, see [DATABASE.md](./DATABASE.md).

## 🧪 Testing

### Manual Testing

1. **Postman Collection**: Import endpoints from [TEST.md](./TEST.md)
2. **Setup**: Follow [POSTMAN_SETUP.md](./POSTMAN_SETUP.md)
3. **Test Flow**: Login → Test endpoints → Verify responses

### API Testing Checklist

- [ ] Authentication (login, logout, refresh, me)
- [ ] User management (CRUD operations)
- [ ] Item management (CRUD, search, filter)
- [ ] Purchase workflow (PR → PO → GRN)
- [ ] Issue & returns
- [ ] Consumption tracking
- [ ] Reports (all types)
- [ ] Audit logs
- [ ] Master data (departments, locations, suppliers)

## 🔒 Security

### Implemented Security Measures

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **HttpOnly Cookies**: Prevents XSS attacks
- ✅ **Input Validation**: Zod schema validation
- ✅ **Role-Based Access Control**: RBAC middleware
- ✅ **Audit Logging**: Complete operation tracking
- ✅ **Environment Variables**: Secrets not in code
- ✅ **Type Safety**: TypeScript for compile-time checks

### Security Best Practices

- Use strong JWT secrets (64+ characters)
- Enable HTTPS in production
- Regularly rotate secrets
- Monitor audit logs
- Implement rate limiting (recommended)
- Use MongoDB Atlas IP whitelisting

## 📊 Role-Based Access Control

### Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all endpoints |
| **Storekeeper** | Store operations, GRN, issues, returns |
| **HOD** | PR creation, issue requests, consumption |
| **Accounts** | PO management, GRN validation, purchase reports |

### Access Control

- Middleware: `requireRole(['admin', 'storekeeper'])`
- Automatic: All endpoints check user roles
- Audit: All access attempts are logged

## 📈 Performance

### Optimizations

- **Database Indexes**: All collections have optimized indexes
- **Connection Pooling**: MongoDB connection caching
- **Serverless**: Auto-scaling on Vercel
- **Lazy Loading**: Routes loaded on demand
- **Efficient Queries**: MongoDB aggregation pipelines

### Monitoring

- Check MongoDB Atlas metrics
- Monitor Vercel function logs
- Review audit logs for performance issues
- Use aggregation pipelines for complex reports

## 🐛 Troubleshooting

### Common Issues

**"Unauthorized" Error**
- Check token is in Authorization header
- Verify token hasn't expired
- See [TROUBLESHOOTING_AUTH.md](./TROUBLESHOOTING_AUTH.md)

**Database Connection Failed**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist
- See [DATABASE.md](./DATABASE.md)

**Port Already in Use**
- Kill process: `lsof -ti:3000 | xargs kill -9`
- Or use different port: `PORT=3001 npm run dev`

**Module Not Found**
- Run `npm install`
- Check TypeScript path aliases
- Verify `tsconfig.json` configuration

For more troubleshooting, see:
- [TROUBLESHOOTING_AUTH.md](./TROUBLESHOOTING_AUTH.md)
- [QUICK_FIX_AUTH.md](./QUICK_FIX_AUTH.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)

## 📖 Additional Documentation

- **[TEST.md](./TEST.md)** - Complete API testing guide
- **[DATABASE.md](./DATABASE.md)** - MongoDB setup and configuration
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup and workflow
- **[POSTMAN_SETUP.md](./POSTMAN_SETUP.md)** - Postman configuration guide
- **[TROUBLESHOOTING_AUTH.md](./TROUBLESHOOTING_AUTH.md)** - Authentication troubleshooting

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow existing code style
4. **Add tests**: Ensure all tests pass
5. **Commit changes**: Use clear commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Ensure type safety (no `any` types)
- Validate all inputs with Zod

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- MongoDB for excellent documentation
- Vercel for serverless platform
- TypeScript team for type safety
- All open-source contributors

## 📞 Support

For support, please:
1. Check the documentation files
2. Review troubleshooting guides
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ for efficient inventory management**

