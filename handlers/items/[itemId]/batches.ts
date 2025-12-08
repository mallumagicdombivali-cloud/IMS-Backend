import { VercelRequest, VercelResponse } from '../../../types/vercel';
import { connectDB } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { getCollection } from '../../../lib/db';
import { ItemBatch } from '../../../types';
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

    const itemId = (req.query.itemId as string) || (req.query as any).itemId;

    if (!itemId || !ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }

    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');

    const query: any = { itemId };
    if (req.query.locationId) {
      query.locationId = req.query.locationId;
    }

    const data = await batches
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Batches error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

