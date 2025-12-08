import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { getCollection } from '../../lib/db';
import { PurchaseOrder, GRN } from '../../types';

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
    const pos = await getCollection<PurchaseOrder>('purchase_orders');
    const grns = await getCollection<GRN>('grns');

    const matchStage: any = {};
    if (req.query.supplierId) {
      matchStage.supplierId = req.query.supplierId;
    }
    if (req.query.from || req.query.to) {
      matchStage.createdAt = {};
      if (req.query.from) matchStage.createdAt.$gte = new Date(req.query.from as string);
      if (req.query.to) matchStage.createdAt.$lte = new Date(req.query.to as string);
    }

    const poPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            supplierId: '$supplierId',
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
          pos: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id.supplierId',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          supplierId: '$_id.supplierId',
          supplierName: '$supplier.name',
          month: '$_id.month',
          totalAmount: 1,
          count: 1,
        },
      },
      { $sort: { month: -1 } },
    ];

    const grnPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            supplierId: '$supplierId',
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': -1 } },
    ];

    const [poData, grnData] = await Promise.all([
      pos.aggregate(poPipeline).toArray(),
      grns.aggregate(grnPipeline).toArray(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        purchaseOrders: poData,
        grns: grnData,
      },
    });
  } catch (error) {
    console.error('Purchase report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

