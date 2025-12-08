/**
 * Script to create the first admin user
 * Run: node scripts/create-admin.js
 */

const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'mallu_magic';

// Default admin credentials (change these!)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mallumagic.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

async function createAdmin() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('   Please set MONGODB_URI in your .env file');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const users = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log('   Use a different email or delete the existing user first');
      await client.close();
      process.exit(0);
    }

    console.log('🔐 Hashing password...');
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      hash: hash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('👤 Creating admin user...');
    const result = await users.insertOne(admin);

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('👤 Name:', ADMIN_NAME);
    console.log('🆔 User ID:', result.insertedId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('   You can update it via: PATCH /api/users/[id]');

    await client.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    if (error.message.includes('bad auth')) {
      console.error('\n💡 Tip: Check your MongoDB connection string and credentials');
    }
    process.exit(1);
  }
}

// Run the script
createAdmin();

