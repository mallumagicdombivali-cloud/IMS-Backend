import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { PurchaseOrder } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin', 'accounts'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid PO ID' });
    }

    const db = await connectDB();
    const pos = await getCollection<PurchaseOrder>('purchase_orders');
    const poId = new ObjectId(id);

    const po = await pos.findOne({ _id: poId });
    if (!po) {
      return res.status(404).json({ success: false, error: 'PO not found' });
    }

    if (po.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'PO is not in draft status' });
    }

    await pos.updateOne(
      { _id: poId },
      {
        $set: {
          status: 'approved',
          approvedBy: user._id!,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedPO = await pos.findOne({ _id: poId });

    await logAudit(
      user._id!,
      'APPROVE',
      'purchase_order',
      id,
      po,
      updatedPO
    );

    return res.status(200).json({ success: true, data: updatedPO });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Approve PO error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

