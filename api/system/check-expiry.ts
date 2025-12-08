import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { getCollection } from '@/lib/db';
import { ItemBatch } from '@/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const days = parseInt(req.query.days as string) || 30;
    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    // Find batches expiring within the specified days
    const expiringBatches = await batches
      .find({
        expiryDate: { $exists: true, $lte: cutoffDate, $gte: new Date() },
        availableQty: { $gt: 0 },
      })
      .sort({ expiryDate: 1 })
      .toArray();

    // Find already expired batches
    const expiredBatches = await batches
      .find({
        expiryDate: { $exists: true, $lt: new Date() },
        availableQty: { $gt: 0 },
      })
      .sort({ expiryDate: 1 })
      .toArray();

    // TODO: Generate notifications for storekeeper
    // await generateExpiryNotifications(expiringBatches, expiredBatches);

    return res.status(200).json({
      success: true,
      data: {
        days,
        expiring: expiringBatches.map((batch) => ({
          batchId: batch._id!.toString(),
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          expiryDate: batch.expiryDate,
          availableQty: batch.availableQty,
          daysUntilExpiry: batch.expiryDate
            ? Math.ceil(
                (batch.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
            : null,
        })),
        expired: expiredBatches.map((batch) => ({
          batchId: batch._id!.toString(),
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          expiryDate: batch.expiryDate,
          availableQty: batch.availableQty,
          daysExpired: batch.expiryDate
            ? Math.ceil(
                (new Date().getTime() - batch.expiryDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null,
        })),
        summary: {
          expiringCount: expiringBatches.length,
          expiredCount: expiredBatches.length,
        },
      },
    });
  } catch (error) {
    console.error('Check expiry error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

