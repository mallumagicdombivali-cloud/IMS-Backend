import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { getCollection } from '../../lib/db';
import { ItemBatch } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const expiringBatches = await batches
      .find({
        expiryDate: { $exists: true, $lte: cutoffDate },
        availableQty: { $gt: 0 },
      })
      .sort({ expiryDate: 1 })
      .toArray();

    const expiredBatches = await batches
      .find({
        expiryDate: { $exists: true, $lt: new Date() },
        availableQty: { $gt: 0 },
      })
      .sort({ expiryDate: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data: {
        expiringWithinDays: days,
        expiring: expiringBatches,
        expired: expiredBatches,
        summary: {
          expiringCount: expiringBatches.length,
          expiredCount: expiredBatches.length,
          expiringValue: expiringBatches.reduce(
            (sum, b) => sum + b.availableQty * b.purchasePrice,
            0
          ),
          expiredValue: expiredBatches.reduce(
            (sum, b) => sum + b.availableQty * b.purchasePrice,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error('Expiry report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

