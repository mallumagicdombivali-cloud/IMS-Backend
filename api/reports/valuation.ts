import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { ItemBatch, StockLedger } from '@/types';
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

    const method = (req.query.method as string) || 'fifo';
    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');
    const stockLedger = await getCollection<StockLedger>('stock_ledger');

    const matchStage: any = { availableQty: { $gt: 0 } };
    if (req.query.itemId) {
      matchStage.itemId = req.query.itemId;
    }
    if (req.query.locationId) {
      matchStage.locationId = req.query.locationId;
    }

    let valuation = 0;
    const itemValuations: any[] = [];

    if (method === 'fifo' || method === 'lifo') {
      const sortOrder = method === 'fifo' ? 1 : -1;
      const availableBatches = await batches
        .find(matchStage)
        .sort({ createdAt: sortOrder })
        .toArray();

      for (const batch of availableBatches) {
        const itemValue = batch.availableQty * batch.purchasePrice;
        valuation += itemValue;

        itemValuations.push({
          itemId: batch.itemId,
          batchId: batch._id!.toString(),
          batchNumber: batch.batchNumber,
          quantity: batch.availableQty,
          unitPrice: batch.purchasePrice,
          totalValue: itemValue,
        });
      }
    } else if (method === 'wa') {
      // Weighted Average
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$itemId',
            totalQty: { $sum: '$availableQty' },
            totalValue: { $sum: { $multiply: ['$availableQty', '$purchasePrice'] } },
            batches: { $push: '$$ROOT' },
          },
        },
      ];

      const waData = await batches.aggregate(pipeline).toArray();

      for (const item of waData) {
        const avgPrice = item.totalValue / item.totalQty;
        const itemValue = item.totalQty * avgPrice;
        valuation += itemValue;

        itemValuations.push({
          itemId: item._id,
          quantity: item.totalQty,
          weightedAvgPrice: avgPrice,
          totalValue: itemValue,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        method,
        totalValuation: valuation,
        itemValuations,
      },
    });
  } catch (error) {
    console.error('Valuation report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

