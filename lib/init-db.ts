import { connectDB } from './db';
import { Db } from 'mongodb';

/**
 * Initialize database: Create collections and indexes
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔧 Initializing database...');
    const db = await connectDB();

    // Define all collections and their indexes
    const collections = [
      {
        name: 'users',
        indexes: [
          { key: { email: 1 }, options: { unique: true } },
          { key: { role: 1 } },
          { key: { departmentId: 1 } },
        ],
      },
      {
        name: 'items',
        indexes: [
          { key: { code: 1 }, options: { unique: true } },
          { key: { name: 'text', code: 'text' } },
          { key: { category: 1 } },
        ],
      },
      {
        name: 'item_batches',
        indexes: [
          { key: { itemId: 1, locationId: 1 } },
          { key: { batchNumber: 1 } },
          { key: { expiryDate: 1 } },
          { key: { grnId: 1 } },
          { key: { createdAt: 1 } },
        ],
      },
      {
        name: 'stock_ledger',
        indexes: [
          { key: { itemId: 1, createdAt: -1 } },
          { key: { batchId: 1 } },
          { key: { transactionType: 1 } },
          { key: { referenceId: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        name: 'purchase_requisitions',
        indexes: [
          { key: { prNumber: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { departmentId: 1 } },
          { key: { requestedBy: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        name: 'purchase_orders',
        indexes: [
          { key: { poNumber: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { supplierId: 1 } },
          { key: { prId: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        name: 'grns',
        indexes: [
          { key: { grnNumber: 1 }, options: { unique: true } },
          { key: { poId: 1 } },
          { key: { supplierId: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        name: 'issue_requests',
        indexes: [
          { key: { issueNumber: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { departmentId: 1 } },
          { key: { requestedBy: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        name: 'returns',
        indexes: [
          { key: { returnNumber: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { departmentId: 1 } },
          { key: { issueId: 1 } },
        ],
      },
      {
        name: 'consumption_logs',
        indexes: [
          { key: { itemId: 1, consumedAt: -1 } },
          { key: { departmentId: 1 } },
          { key: { batchId: 1 } },
          { key: { consumedAt: -1 } },
        ],
      },
      {
        name: 'suppliers',
        indexes: [
          { key: { email: 1 } },
          { key: { isActive: 1 } },
        ],
      },
      {
        name: 'departments',
        indexes: [
          { key: { code: 1 }, options: { unique: true } },
          { key: { isActive: 1 } },
        ],
      },
      {
        name: 'locations',
        indexes: [
          { key: { code: 1 }, options: { unique: true } },
          { key: { isActive: 1 } },
        ],
      },
      {
        name: 'audit_logs',
        indexes: [
          { key: { userId: 1, timestamp: -1 } },
          { key: { entity: 1, entityId: 1 } },
          { key: { action: 1 } },
          { key: { timestamp: -1 } },
        ],
      },
      {
        name: 'reports_cache',
        indexes: [
          { key: { reportType: 1 } },
          { key: { generatedAt: -1 } },
          { key: { expiresAt: 1 } },
        ],
      },
    ];

    // Create collections and indexes
    for (const collectionConfig of collections) {
      try {
        // Check if collection exists, if not create it
        const collectionsList = await db.listCollections({ name: collectionConfig.name }).toArray();
        
        if (collectionsList.length === 0) {
          await db.createCollection(collectionConfig.name);
          console.log(`  ✅ Created collection: ${collectionConfig.name}`);
        } else {
          console.log(`  ✓ Collection exists: ${collectionConfig.name}`);
        }

        // Create indexes
        const collection = db.collection(collectionConfig.name);
        for (const index of collectionConfig.indexes) {
          try {
            await collection.createIndex(index.key as any, (index as any).options || {});
          console.log(`    ✓ Index created: ${collectionConfig.name}.${Object.keys(index.key).join(',')}`);
          // Small delay to avoid overwhelming MongoDB
          await new Promise(resolve => setTimeout(resolve, 50));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            // Index might already exist, which is fine
            if (error.code !== 85 && error.code !== 86) {
              // 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict (index already exists)
              console.log(`    ⚠️  Index warning for ${collectionConfig.name}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Error initializing ${collectionConfig.name}:`, error);
      }
    }

    console.log('✅ Database initialization completed!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

