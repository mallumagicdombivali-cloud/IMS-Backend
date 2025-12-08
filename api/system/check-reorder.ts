import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { getCollection } from '@/lib/db';
import { Item, ItemBatch } from '@/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = await connectDB();
    const items = await getCollection<Item>('items');
    const batches = await getCollection<ItemBatch>('item_batches');

    // Get all active items
    const allItems = await items.find({}).toArray();

    const lowStockItems: any[] = [];

    for (const item of allItems) {
      // Calculate current stock for this item
      const itemBatches = await batches
        .find({ itemId: item._id!.toString() })
        .toArray();

      const totalAvailable = itemBatches.reduce((sum, batch) => sum + batch.availableQty, 0);

      // Check if below reorder level
      if (totalAvailable <= item.reorderLevel) {
        lowStockItems.push({
          itemId: item._id!.toString(),
          itemCode: item.code,
          itemName: item.name,
          currentStock: totalAvailable,
          reorderLevel: item.reorderLevel,
          minStock: item.minStock,
          needsReorder: totalAvailable <= item.reorderLevel,
          needsUrgentReorder: totalAvailable <= item.minStock,
        });
      }
    }

    // TODO: Generate notifications for storekeeper/admin
    // await generateNotifications(lowStockItems);

    return res.status(200).json({
      success: true,
      data: {
        lowStockItems,
        count: lowStockItems.length,
        urgentCount: lowStockItems.filter((item) => item.needsUrgentReorder).length,
      },
    });
  } catch (error) {
    console.error('Check reorder error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

