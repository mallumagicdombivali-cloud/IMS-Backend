import { VercelRequest, VercelResponse } from '../../types/vercel';
import { getCollection } from '../../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    try {
      const itemCollection = await getCollection('items');
      const batchCollection = await getCollection('batches');

      const totalSkus = await itemCollection.countDocuments();

      const lowStockCount = await itemCollection.countDocuments({
        $expr: { $lte: ['$currentStock', '$minStock'] },
      });

      const expiredCount = await batchCollection.countDocuments({
        expiryDate: { $lt: new Date() },
        quantity: { $gt: 0 },
      });

      const healthyCount = totalSkus - lowStockCount;

      res.status(200).json({
        success: true,
        data: {
          totalSkus,
          distribution: [
            { name: 'In Stock', value: healthyCount, color: '#10b981' },
            { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
            { name: 'Expired', value: expiredCount, color: '#ef4444' },
          ],
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}