import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { ConsumptionLog } from '@/types';

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
    const consumptionLogs = await getCollection<ConsumptionLog>('consumption_logs');

    const matchStage: any = {};
    if (req.query.departmentId) {
      matchStage.departmentId = req.query.departmentId;
    }
    if (req.query.itemId) {
      matchStage.itemId = req.query.itemId;
    }
    if (req.query.from || req.query.to) {
      matchStage.consumedAt = {};
      if (req.query.from) matchStage.consumedAt.$gte = new Date(req.query.from as string);
      if (req.query.to) matchStage.consumedAt.$lte = new Date(req.query.to as string);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            itemId: '$itemId',
            departmentId: '$departmentId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$consumedAt' } },
          },
          totalTheoretical: { $sum: '$theoreticalQty' },
          totalActual: { $sum: '$actualQty' },
          totalVariance: { $sum: '$variance' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id.itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          itemId: '$_id.itemId',
          itemName: '$item.name',
          itemCode: '$item.code',
          departmentId: '$_id.departmentId',
          date: '$_id.date',
          totalTheoretical: 1,
          totalActual: 1,
          totalVariance: 1,
          count: 1,
        },
      },
      { $sort: { date: -1 } },
    ];

    const reportData = await consumptionLogs.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Consumption report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

