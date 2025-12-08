import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { ConsumptionLog, StockLedger } from '@/types';

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
    const stockLedger = await getCollection<StockLedger>('stock_ledger');

    const matchStage: any = {};
    if (req.query.from || req.query.to) {
      matchStage.consumedAt = {};
      if (req.query.from) matchStage.consumedAt.$gte = new Date(req.query.from as string);
      if (req.query.to) matchStage.consumedAt.$lte = new Date(req.query.to as string);
    }

    // Calculate wastage from consumption variance (positive variance = wastage)
    const pipeline = [
      { $match: matchStage },
      {
        $match: {
          variance: { $gt: 0 }, // Positive variance means actual < theoretical (wastage)
        },
      },
      {
        $group: {
          _id: '$itemId',
          totalWastage: { $sum: '$variance' },
          totalTheoretical: { $sum: '$theoreticalQty' },
          totalActual: { $sum: '$actualQty' },
          count: { $sum: 1 },
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
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          itemId: '$_id',
          itemName: '$item.name',
          itemCode: '$item.code',
          totalWastage: 1,
          totalTheoretical: 1,
          totalActual: 1,
          wastagePercentage: {
            $cond: [
              { $gt: ['$totalTheoretical', 0] },
              { $multiply: [{ $divide: ['$totalWastage', '$totalTheoretical'] }, 100] },
              0,
            ],
          },
          count: 1,
        },
      },
      { $sort: { totalWastage: -1 } },
    ];

    const wastageData = await consumptionLogs.aggregate(pipeline).toArray();

    const totalWastage = wastageData.reduce((sum, item) => sum + item.totalWastage, 0);
    const totalTheoretical = wastageData.reduce((sum, item) => sum + item.totalTheoretical, 0);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalWastage,
          totalTheoretical,
          overallWastagePercentage:
            totalTheoretical > 0 ? ((totalWastage / totalTheoretical) * 100).toFixed(2) : '0.00',
        },
        details: wastageData,
      },
    });
  } catch (error) {
    console.error('Wastage report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

