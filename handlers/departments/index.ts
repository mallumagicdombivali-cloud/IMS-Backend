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

    if (req.method === 'POST') {
      const validated = createDepartmentSchema.parse(req.body);
      const db = await connectDB();
      const departments = await getCollection<Department>('departments');

      // Check if code already exists
      const existing = await departments.findOne({ code: validated.code });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Department code already exists' });
      }

      const now = new Date();
      const newDept: Omit<Department, '_id'> = {
        name: validated.name,
        code: validated.code,
        hodId: validated.hodId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const result = await departments.insertOne(newDept as Department);
      const insertedDept = await departments.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'department',
        result.insertedId.toString(),
        undefined,
        insertedDept
      );

      return res.status(201).json({
        success: true,
        data: insertedDept,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const departments = await getCollection<Department>('departments');

      const query: any = {};
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      const data = await departments.find(query).sort({ name: 1 }).toArray();

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
    console.error('Department error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

