import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createItemSchema } from '@/lib/validations';
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

    if (req.method === 'POST') {
      const validated = createItemSchema.parse(req.body);
      const db = await connectDB();
      const items = await getCollection<Item>('items');

      // Check if code already exists
      const existing = await items.findOne({ code: validated.code });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Item code already exists' });
      }

      const now = new Date();
      const newItem: Omit<Item, '_id'> = {
        ...validated,
        createdAt: now,
        updatedAt: now,
      };

      const result = await items.insertOne(newItem as Item);
      const insertedItem = await items.findOne({ _id: result.insertedId });

      await logAudit(
        user._id!,
        'CREATE',
        'item',
        result.insertedId.toString(),
        undefined,
        insertedItem
      );

      return res.status(201).json({
        success: true,
        data: insertedItem,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const items = await getCollection<Item>('items');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.category) query.category = req.query.category;
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search as string, $options: 'i' } },
          { code: { $regex: req.query.search as string, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        items.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        items.countDocuments(query),
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
    console.error('Items error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

