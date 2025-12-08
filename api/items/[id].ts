import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { updateItemSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Item } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }

    const db = await connectDB();
    const items = await getCollection<Item>('items');
    const itemId = new ObjectId(id);

    if (req.method === 'GET') {
      const item = await items.findOne({ _id: itemId });
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.status(200).json({ success: true, data: item });
    }

    if (req.method === 'PATCH') {
      const existingItem = await items.findOne({ _id: itemId });
      if (!existingItem) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      const validated = updateItemSchema.parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      Object.keys(validated).forEach((key) => {
        if (validated[key as keyof typeof validated] !== undefined) {
          updateData[key] = validated[key as keyof typeof validated];
        }
      });

      await items.updateOne({ _id: itemId }, { $set: updateData });
      const updatedItem = await items.findOne({ _id: itemId });

      await logAudit(
        user._id!,
        'UPDATE',
        'item',
        id,
        existingItem,
        updatedItem
      );

      return res.status(200).json({ success: true, data: updatedItem });
    }

    if (req.method === 'DELETE') {
      const existingItem = await items.findOne({ _id: itemId });
      if (!existingItem) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      await items.deleteOne({ _id: itemId });

      await logAudit(
        user._id!,
        'DELETE',
        'item',
        id,
        existingItem,
        undefined
      );

      return res.status(200).json({ success: true, data: { message: 'Item deleted' } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Item error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

