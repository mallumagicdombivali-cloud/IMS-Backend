import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { ItemBatch, Item } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');
    const items = await getCollection<Item>('items');

    const matchStage: any = {};
    if (req.query.locationId) {
      matchStage.locationId = req.query.locationId;
    }
    if (req.query.itemId) {
      matchStage.itemId = req.query.itemId;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$itemId',
          totalQty: { $sum: '$totalQty' },
          availableQty: { $sum: '$availableQty' },
          reservedQty: { $sum: '$reservedQty' },
          batches: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: '$item' },
      {
        $project: {
          itemId: '$_id',
          itemCode: '$item.code',
          itemName: '$item.name',
          itemCategory: '$item.category',
          itemUnit: '$item.unit',
          totalQty: 1,
          availableQty: 1,
          reservedQty: 1,
          batches: 1,
        },
      },
    ];

    const stockData = await batches.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      data: stockData,
    });
  } catch (error) {
    console.error('Stock report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

