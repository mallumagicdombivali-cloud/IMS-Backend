import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { createPRSchema } from '../../lib/validations';
import { logAudit } from '../../lib/audit';
import { getCollection } from '../../lib/db';
import { PurchaseRequisition } from '../../types';
import { ObjectId } from 'mongodb';

async function generatePRNumber(): Promise<string> {
  const prs = await getCollection<PurchaseRequisition>('purchase_requisitions');
  const count = await prs.countDocuments();
  const year = new Date().getFullYear();
  return `PR-${year}-${String(count + 1).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const validated = createPRSchema.parse(req.body);
      const db = await connectDB();
      const prs = await getCollection<PurchaseRequisition>('purchase_requisitions');

      const prNumber = await generatePRNumber();
      const now = new Date();

      const newPR: Omit<PurchaseRequisition, '_id'> = {
        prNumber,
        requestedBy: user._id!,
        departmentId: validated.departmentId,
        items: validated.items,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const result = await prs.insertOne(newPR as PurchaseRequisition);
      const insertedPR = await prs.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'purchase_requisition',
        result.insertedId.toString(),
        undefined,
        insertedPR
      );

      return res.status(201).json({
        success: true,
        data: insertedPR,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const prs = await getCollection<PurchaseRequisition>('purchase_requisitions');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.requestedBy) query.requestedBy = req.query.requestedBy;

      const [data, total] = await Promise.all([
        prs.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        prs.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('PR error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

