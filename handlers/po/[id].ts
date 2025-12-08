import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { PurchaseOrder } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid PO ID' });
    }

    const db = await connectDB();
    const pos = await getCollection<PurchaseOrder>('purchase_orders');
    const poId = new ObjectId(id);

    const po = await pos.findOne({ _id: poId } as any);
    if (!po) {
      return res.status(404).json({ success: false, error: 'PO not found' });
    }

    return res.status(200).json({ success: true, data: po });
  } catch (error) {
    console.error('PO error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

