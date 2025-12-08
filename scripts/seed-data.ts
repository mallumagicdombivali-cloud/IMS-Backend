/**
 * Seed script to populate database with mock data
 * Run: npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'mallu_magic';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Indian names
const INDIAN_NAMES = {
  male: [
    'Rajesh Kumar', 'Amit Sharma', 'Vikram Singh', 'Arjun Patel', 'Rahul Gupta',
    'Suresh Nair', 'Kiran Menon', 'Anil Iyer', 'Manoj Pillai', 'Deepak Joshi',
    'Naveen Reddy', 'Pradeep Nair', 'Sandeep Kumar', 'Ramesh Iyer', 'Gopal Menon'
  ],
  female: [
    'Priya Nair', 'Anjali Menon', 'Kavya Iyer', 'Divya Pillai', 'Sneha Kumar',
    'Meera Nair', 'Lakshmi Iyer', 'Sarita Menon', 'Radha Pillai', 'Geetha Nair',
    'Shruti Iyer', 'Neha Menon', 'Pooja Nair', 'Rekha Pillai', 'Sunita Iyer'
  ]
};

// Indian goods/items
const INDIAN_GOODS = [
  { code: 'RICE001', name: 'Basmati Rice', category: 'Grains', unit: 'kg', minStock: 100, reorderLevel: 200 },
  { code: 'DAL001', name: 'Toor Dal', category: 'Pulses', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'DAL002', name: 'Moong Dal', category: 'Pulses', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'DAL003', name: 'Urad Dal', category: 'Pulses', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'SPICE001', name: 'Turmeric Powder', category: 'Spices', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'SPICE002', name: 'Red Chili Powder', category: 'Spices', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'SPICE003', name: 'Coriander Powder', category: 'Spices', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'SPICE004', name: 'Garam Masala', category: 'Spices', unit: 'kg', minStock: 10, reorderLevel: 25 },
  { code: 'OIL001', name: 'Coconut Oil', category: 'Oils', unit: 'litre', minStock: 50, reorderLevel: 100 },
  { code: 'OIL002', name: 'Sunflower Oil', category: 'Oils', unit: 'litre', minStock: 50, reorderLevel: 100 },
  { code: 'OIL003', name: 'Mustard Oil', category: 'Oils', unit: 'litre', minStock: 30, reorderLevel: 60 },
  { code: 'SUGAR001', name: 'White Sugar', category: 'Sweeteners', unit: 'kg', minStock: 100, reorderLevel: 200 },
  { code: 'SALT001', name: 'Iodized Salt', category: 'Condiments', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'TEA001', name: 'Tea Leaves', category: 'Beverages', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'COFFEE001', name: 'Coffee Powder', category: 'Beverages', unit: 'kg', minStock: 15, reorderLevel: 30 },
  { code: 'WHEAT001', name: 'Wheat Flour', category: 'Grains', unit: 'kg', minStock: 100, reorderLevel: 200 },
  { code: 'RAGI001', name: 'Ragi Flour', category: 'Grains', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'COCONUT001', name: 'Coconut', category: 'Vegetables', unit: 'piece', minStock: 50, reorderLevel: 100 },
  { code: 'ONION001', name: 'Onion', category: 'Vegetables', unit: 'kg', minStock: 100, reorderLevel: 200 },
  { code: 'TOMATO001', name: 'Tomato', category: 'Vegetables', unit: 'kg', minStock: 50, reorderLevel: 100 },
  { code: 'POTATO001', name: 'Potato', category: 'Vegetables', unit: 'kg', minStock: 100, reorderLevel: 200 },
  { code: 'GINGER001', name: 'Ginger', category: 'Vegetables', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'GARLIC001', name: 'Garlic', category: 'Vegetables', unit: 'kg', minStock: 20, reorderLevel: 50 },
  { code: 'CURRY001', name: 'Curry Leaves', category: 'Vegetables', unit: 'bunch', minStock: 20, reorderLevel: 50 },
  { code: 'CUMIN001', name: 'Cumin Seeds', category: 'Spices', unit: 'kg', minStock: 15, reorderLevel: 30 },
  { code: 'MUSTARD001', name: 'Mustard Seeds', category: 'Spices', unit: 'kg', minStock: 15, reorderLevel: 30 },
  { code: 'FENUGREEK001', name: 'Fenugreek Seeds', category: 'Spices', unit: 'kg', minStock: 10, reorderLevel: 25 },
  { code: 'CARDAMOM001', name: 'Cardamom', category: 'Spices', unit: 'kg', minStock: 5, reorderLevel: 10 },
  { code: 'CINNAMON001', name: 'Cinnamon', category: 'Spices', unit: 'kg', minStock: 5, reorderLevel: 10 },
  { code: 'CLOVE001', name: 'Cloves', category: 'Spices', unit: 'kg', minStock: 5, reorderLevel: 10 },
];

// Departments
const DEPARTMENTS = [
  { name: 'Kitchen', code: 'KIT', hodId: null },
  { name: 'Housekeeping', code: 'HK', hodId: null },
  { name: 'Maintenance', code: 'MNT', hodId: null },
  { name: 'Administration', code: 'ADMIN', hodId: null },
  { name: 'Security', code: 'SEC', hodId: null },
];

// Locations
const LOCATIONS = [
  { name: 'Main Store', code: 'STORE-MAIN', address: 'Ground Floor, Building A' },
  { name: 'Kitchen Store', code: 'STORE-KIT', address: 'Kitchen Area, Ground Floor' },
  { name: 'Cold Storage', code: 'STORE-COLD', address: 'Basement, Building A' },
  { name: 'Dry Store', code: 'STORE-DRY', address: 'First Floor, Building A' },
];

// Suppliers
const SUPPLIERS = [
  {
    name: 'Kerala Spices & Grains',
    contactPerson: 'Ramesh Nair',
    email: 'contact@keralaspices.com',
    phone: '+91-484-1234567',
    address: 'MG Road, Kochi, Kerala 682001',
    taxId: 'GST-KL-123456',
    rating: 4.5,
  },
  {
    name: 'South India Provisions',
    contactPerson: 'Suresh Iyer',
    email: 'info@southindiaprovisions.com',
    phone: '+91-44-2345678',
    address: 'T Nagar, Chennai, Tamil Nadu 600017',
    taxId: 'GST-TN-234567',
    rating: 4.3,
  },
  {
    name: 'Mumbai Food Supplies',
    contactPerson: 'Amit Patel',
    email: 'sales@mumbaifoods.com',
    phone: '+91-22-3456789',
    address: 'Andheri East, Mumbai, Maharashtra 400069',
    taxId: 'GST-MH-345678',
    rating: 4.7,
  },
  {
    name: 'Delhi Wholesale Market',
    contactPerson: 'Vikram Singh',
    email: 'orders@delhiwholesale.com',
    phone: '+91-11-4567890',
    address: 'Chandni Chowk, Delhi 110006',
    taxId: 'GST-DL-456789',
    rating: 4.2,
  },
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB\n');

    // Hash password for all users
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Seed Users
    console.log('👥 Seeding users...');
    const usersCollection = db.collection('users');
    
    // Check if users already exist
    const existingUsers = await usersCollection.countDocuments();
    if (existingUsers > 0) {
      console.log(`  ⚠️  ${existingUsers} users already exist. Skipping user creation.`);
    } else {
      const users = [
        // Admin users
        {
          name: 'Rajesh Kumar',
          email: 'admin@mallumagic.com',
          hash: hashedPassword,
          role: 'admin',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Priya Nair',
          email: 'admin2@mallumagic.com',
          hash: hashedPassword,
          role: 'admin',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Storekeepers
        {
          name: 'Amit Sharma',
          email: 'storekeeper@mallumagic.com',
          hash: hashedPassword,
          role: 'storekeeper',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Kavya Iyer',
          email: 'storekeeper2@mallumagic.com',
          hash: hashedPassword,
          role: 'storekeeper',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // HODs
        {
          name: 'Vikram Singh',
          email: 'hod@mallumagic.com',
          hash: hashedPassword,
          role: 'hod',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Anjali Menon',
          email: 'hod2@mallumagic.com',
          hash: hashedPassword,
          role: 'hod',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Accounts
        {
          name: 'Arjun Patel',
          email: 'accounts@mallumagic.com',
          hash: hashedPassword,
          role: 'accounts',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Divya Pillai',
          email: 'accounts2@mallumagic.com',
          hash: hashedPassword,
          role: 'accounts',
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Regular users
        ...INDIAN_NAMES.male.slice(0, 5).map((name, index) => ({
          name,
          email: `user${index + 1}@mallumagic.com`,
          hash: hashedPassword,
          role: 'hod' as const,
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        ...INDIAN_NAMES.female.slice(0, 5).map((name, index) => ({
          name,
          email: `user${index + 6}@mallumagic.com`,
          hash: hashedPassword,
          role: 'hod' as const,
          departmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      ];

      await usersCollection.insertMany(users);
      console.log(`  ✅ Created ${users.length} users`);
      console.log(`  📧 Default password for all users: ${defaultPassword}`);
    }

    // 2. Seed Items (Goods)
    console.log('\n📦 Seeding items (goods)...');
    const itemsCollection = db.collection('items');
    
    const existingItems = await itemsCollection.countDocuments();
    if (existingItems > 0) {
      console.log(`  ⚠️  ${existingItems} items already exist. Skipping item creation.`);
    } else {
      const items = INDIAN_GOODS.map((good) => ({
        ...good,
        description: `${good.name} - Premium quality`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await itemsCollection.insertMany(items);
      console.log(`  ✅ Created ${items.length} items`);
    }

    // 3. Seed Departments
    console.log('\n🏢 Seeding departments...');
    const departmentsCollection = db.collection('departments');
    
    const existingDepts = await departmentsCollection.countDocuments();
    if (existingDepts > 0) {
      console.log(`  ⚠️  ${existingDepts} departments already exist. Skipping department creation.`);
    } else {
      const departments = DEPARTMENTS.map((dept) => ({
        ...dept,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await departmentsCollection.insertMany(departments);
      console.log(`  ✅ Created ${departments.length} departments`);
    }

    // 4. Seed Locations
    console.log('\n📍 Seeding locations...');
    const locationsCollection = db.collection('locations');
    
    const existingLocations = await locationsCollection.countDocuments();
    if (existingLocations > 0) {
      console.log(`  ⚠️  ${existingLocations} locations already exist. Skipping location creation.`);
    } else {
      const locations = LOCATIONS.map((loc) => ({
        ...loc,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await locationsCollection.insertMany(locations);
      console.log(`  ✅ Created ${locations.length} locations`);
    }

    // 5. Seed Suppliers
    console.log('\n🏪 Seeding suppliers...');
    const suppliersCollection = db.collection('suppliers');
    
    const existingSuppliers = await suppliersCollection.countDocuments();
    if (existingSuppliers > 0) {
      console.log(`  ⚠️  ${existingSuppliers} suppliers already exist. Skipping supplier creation.`);
    } else {
      const suppliers = SUPPLIERS.map((supplier) => ({
        ...supplier,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await suppliersCollection.insertMany(suppliers);
      console.log(`  ✅ Created ${suppliers.length} suppliers`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  👥 Users: Check users collection');
    console.log('  📦 Items: Check items collection');
    console.log('  🏢 Departments: Check departments collection');
    console.log('  📍 Locations: Check locations collection');
    console.log('  🏪 Suppliers: Check suppliers collection');
    console.log('\n🔑 Login credentials:');
    console.log('  Admin: admin@mallumagic.com / password123');
    console.log('  Storekeeper: storekeeper@mallumagic.com / password123');
    console.log('  HOD: hod@mallumagic.com / password123');
    console.log('  Accounts: accounts@mallumagic.com / password123');

  } catch (error: any) {
    console.error('\n❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
seedDatabase();

