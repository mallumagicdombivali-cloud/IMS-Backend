import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { createDepartmentSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Department } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin'])(req, res);
    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid department ID' });
    }

    const db = await connectDB();
    const departments = await getCollection<Department>('departments');
    const deptId = new ObjectId(id);

    if (req.method === 'PATCH') {
      const existingDept = await departments.findOne({ _id: deptId } as any);
      if (!existingDept) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }

      const validated = createDepartmentSchema.partial().parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      if (validated.name) updateData.name = validated.name;
      if (validated.code) updateData.code = validated.code;
      if (validated.hodId !== undefined) updateData.hodId = validated.hodId;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      await departments.updateOne({ _id: deptId } as any, { $set: updateData });
      const updatedDept = await departments.findOne({ _id: deptId } as any);

      await logAudit(
        user._id!,
        'UPDATE',
        'department',
        id,
        existingDept,
        updatedDept
      );

      return res.status(200).json({ success: true, data: updatedDept });
    }

    if (req.method === 'DELETE') {
      const existingDept = await departments.findOne({ _id: deptId } as any);
      if (!existingDept) {
        return res.status(404).json({ success: false, error: 'Department not found' });
      }

      await departments.updateOne(
        { _id: deptId } as any,
        { $set: { isActive: false, updatedAt: new Date() } }
      );

      await logAudit(
        user._id!,
        'DELETE',
        'department',
        id,
        existingDept,
        undefined
      );

      return res.status(200).json({ success: true, data: { message: 'Department deactivated' } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Department error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

