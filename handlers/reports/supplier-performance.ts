import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { getCollection } from '../../lib/db';
import { PurchaseOrder, GRN, Supplier } from '../../types';

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
    const suppliers = await getCollection<Supplier>('suppliers');

    const matchStage: any = {};
    if (req.query.from || req.query.to) {
      matchStage.createdAt = {};
      if (req.query.from) matchStage.createdAt.$gte = new Date(req.query.from as string);
      if (req.query.to) matchStage.createdAt.$lte = new Date(req.query.to as string);
    }

    const supplierPipeline = [
      {
        $lookup: {
          from: 'purchase_orders',
          localField: '_id',
          foreignField: 'supplierId',
          as: 'pos',
        },
      },
      {
        $lookup: {
          from: 'grns',
          localField: '_id',
          foreignField: 'supplierId',
          as: 'grns',
        },
      },
      {
        $project: {
          supplierId: '$_id',
          name: 1,
          email: 1,
          phone: 1,
          rating: 1,
          totalPOs: { $size: '$pos' },
          totalGRNs: { $size: '$grns' },
          totalPOAmount: {
            $sum: {
              $map: {
                input: '$pos',
                as: 'po',
                in: '$$po.totalAmount',
              },
            },
          },
          totalGRNAmount: {
            $sum: {
              $map: {
                input: '$grns',
                as: 'grn',
                in: '$$grn.totalAmount',
              },
            },
          },
          completedPOs: {
            $size: {
              $filter: {
                input: '$pos',
                as: 'po',
                cond: { $eq: ['$$po.status', 'completed'] },
              },
            },
          },
          onTimeDeliveries: {
            $size: {
              $filter: {
                input: '$grns',
                as: 'grn',
                cond: {
                  $lte: [
                    '$$grn.receivedAt',
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$pos',
                                as: 'po',
                                cond: { $eq: ['$$po._id', '$$grn.poId'] },
                              },
                            },
                            as: 'po',
                            in: '$$po.expectedDeliveryDate',
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          onTimeDeliveryRate: {
            $cond: [
              { $gt: ['$totalGRNs', 0] },
              { $multiply: [{ $divide: ['$onTimeDeliveries', '$totalGRNs'] }, 100] },
              0,
            ],
          },
          completionRate: {
            $cond: [
              { $gt: ['$totalPOs', 0] },
              { $multiply: [{ $divide: ['$completedPOs', '$totalPOs'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalPOAmount: -1 } },
    ];

    const performanceData = await suppliers.aggregate(supplierPipeline).toArray();

    return res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    console.error('Supplier performance report error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

