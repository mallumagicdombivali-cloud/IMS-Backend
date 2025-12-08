import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { requireRole } from '../../lib/rbac';
import { createSupplierSchema } from '../../lib/validations';
import { logAudit } from '../../lib/audit';
import { getCollection } from '../../lib/db';
import { Supplier } from '../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin', 'accounts'])(req, res);
    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid supplier ID' });
    }

    const db = await connectDB();
    const suppliers = await getCollection<Supplier>('suppliers');
    const supplierId = new ObjectId(id);

    if (req.method === 'GET') {
      const supplier = await suppliers.findOne({ _id: supplierId } as any);
      if (!supplier) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
      }

      return res.status(200).json({ success: true, data: supplier });
    }

    if (req.method === 'PATCH') {
      const existingSupplier = await suppliers.findOne({ _id: supplierId } as any);
      if (!existingSupplier) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
      }

      const validated = createSupplierSchema.partial().parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      if (validated.name) updateData.name = validated.name;
      if (validated.contactPerson) updateData.contactPerson = validated.contactPerson;
      if (validated.email) updateData.email = validated.email;
      if (validated.phone) updateData.phone = validated.phone;
      if (validated.address) updateData.address = validated.address;
      if (validated.taxId !== undefined) updateData.taxId = validated.taxId;
      if (validated.rating !== undefined) updateData.rating = validated.rating;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      await suppliers.updateOne({ _id: supplierId } as any, { $set: updateData });
      const updatedSupplier = await suppliers.findOne({ _id: supplierId } as any);

      await logAudit(
        user._id!,
        'UPDATE',
        'supplier',
        id,
        existingSupplier,
        updatedSupplier
      );

      return res.status(200).json({ success: true, data: updatedSupplier });
    }

    if (req.method === 'DELETE') {
      const existingSupplier = await suppliers.findOne({ _id: supplierId } as any);
      if (!existingSupplier) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
      }

      await suppliers.updateOne(
        { _id: supplierId } as any,
        { $set: { isActive: false, updatedAt: new Date() } }
      );

      await logAudit(
        user._id!,
        'DELETE',
        'supplier',
        id,
        existingSupplier,
        undefined
      );

      return res.status(200).json({ success: true, data: { message: 'Supplier deactivated' } });
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

