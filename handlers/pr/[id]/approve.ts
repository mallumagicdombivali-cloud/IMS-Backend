import { VercelRequest, VercelResponse } from '../../../types/vercel';
import { connectDB } from '../../../lib/db';
import { requireRole } from '../../../lib/rbac';
import { approvePRSchema } from '../../../lib/validations';
import { logAudit } from '../../../lib/audit';
import { getCollection } from '../../../lib/db';
import { PurchaseRequisition } from '../../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin', 'hod', 'accounts'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid PR ID' });
    }

    const db = await connectDB();
    const prs = await getCollection<PurchaseRequisition>('purchase_requisitions');
    const prId = new ObjectId(id);

    const pr = await prs.findOne({ _id: prId } as any);
    if (!pr) {
      return res.status(404).json({ success: false, error: 'PR not found' });
    }

    if (pr.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'PR is not in pending status' });
    }

    await prs.updateOne(
      { _id: prId } as any,
      {
        $set: {
          status: 'approved',
          approvedBy: user._id!,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedPR = await prs.findOne({ _id: prId } as any);

    await logAudit(
      user._id!,
      'APPROVE',
      'purchase_requisition',
      id,
      pr,
      updatedPR
    );

    return res.status(200).json({ success: true, data: updatedPR });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Approve PR error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

