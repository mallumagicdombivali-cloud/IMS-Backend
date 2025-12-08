import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { requireRole } from '../../lib/rbac';
import { createPOSchema } from '../../lib/validations';
import { logAudit } from '../../lib/audit';
import { getCollection } from '../../lib/db';
import { PurchaseOrder } from '../../types';
import { ObjectId } from 'mongodb';

async function generatePONumber(): Promise<string> {
  const pos = await getCollection<PurchaseOrder>('purchase_orders');
  const count = await pos.countDocuments();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin', 'accounts'])(req, res);

    if (req.method === 'POST') {
      const validated = createPOSchema.parse(req.body);
      const db = await connectDB();
      const pos = await getCollection<PurchaseOrder>('purchase_orders');

      const poNumber = await generatePONumber();
      const now = new Date();

      const items = validated.items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

      const newPO: Omit<PurchaseOrder, '_id'> = {
        poNumber,
        prId: validated.prId,
        supplierId: validated.supplierId,
        items,
        status: 'draft',
        totalAmount,
        currency: 'INR',
        expectedDeliveryDate: validated.expectedDeliveryDate
          ? new Date(validated.expectedDeliveryDate)
          : undefined,
        createdAt: now,
        updatedAt: now,
      };

      const result = await pos.insertOne(newPO as PurchaseOrder);
      const insertedPO = await pos.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'purchase_order',
        result.insertedId.toString(),
        undefined,
        insertedPO
      );

      return res.status(201).json({
        success: true,
        data: insertedPO,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const pos = await getCollection<PurchaseOrder>('purchase_orders');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.supplierId) query.supplierId = req.query.supplierId;
      if (req.query.prId) query.prId = req.query.prId;

      const [data, total] = await Promise.all([
        pos.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        pos.countDocuments(query),
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
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('PO error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

