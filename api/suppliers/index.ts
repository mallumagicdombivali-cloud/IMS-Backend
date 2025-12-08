import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { createSupplierSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Supplier } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin', 'accounts'])(req, res);

    if (req.method === 'POST') {
      const validated = createSupplierSchema.parse(req.body);
      const db = await connectDB();
      const suppliers = await getCollection<Supplier>('suppliers');

      const now = new Date();
      const newSupplier: Omit<Supplier, '_id'> = {
        name: validated.name,
        contactPerson: validated.contactPerson,
        email: validated.email,
        phone: validated.phone,
        address: validated.address,
        taxId: validated.taxId,
        rating: validated.rating || 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const result = await suppliers.insertOne(newSupplier as Supplier);
      const insertedSupplier = await suppliers.findOne({ _id: result.insertedId });

      await logAudit(
        user._id!,
        'CREATE',
        'supplier',
        result.insertedId.toString(),
        undefined,
        insertedSupplier
      );

      return res.status(201).json({
        success: true,
        data: insertedSupplier,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const suppliers = await getCollection<Supplier>('suppliers');

      const query: any = {};
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      const data = await suppliers.find(query).sort({ name: 1 }).toArray();

      return res.status(200).json({
        success: true,
        data,
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
    console.error('Supplier error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

