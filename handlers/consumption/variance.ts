import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { getCollection } from '../../lib/db';
import { ConsumptionLog } from '../../types';

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

    const query: any = {};
    if (req.query.itemId) query.itemId = req.query.itemId;
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.from || req.query.to) {
      query.consumedAt = {};
      if (req.query.from) query.consumedAt.$gte = new Date(req.query.from as string);
      if (req.query.to) query.consumedAt.$lte = new Date(req.query.to as string);
    }

    const logs = await consumptionLogs.find(query).toArray();

    const varianceReport = logs.map((log) => ({
      itemId: log.itemId,
      batchId: log.batchId,
      departmentId: log.departmentId,
      theoreticalQty: log.theoreticalQty,
      actualQty: log.actualQty,
      variance: log.variance,
      variancePercentage: log.theoreticalQty > 0
        ? ((log.variance / log.theoreticalQty) * 100).toFixed(2)
        : '0.00',
      consumedAt: log.consumedAt,
    }));

    const summary = {
      totalRecords: logs.length,
      totalTheoretical: logs.reduce((sum, log) => sum + log.theoreticalQty, 0),
      totalActual: logs.reduce((sum, log) => sum + log.actualQty, 0),
      totalVariance: logs.reduce((sum, log) => sum + log.variance, 0),
      averageVariance: logs.length > 0
        ? logs.reduce((sum, log) => sum + log.variance, 0) / logs.length
        : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        summary,
        details: varianceReport,
      },
    });
  } catch (error) {
    console.error('Variance error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

