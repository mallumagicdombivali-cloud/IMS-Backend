import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { updateUserSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcrypt';
import { getCollection } from '@/lib/db';
import { User } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin'])(req, res);
    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const db = await connectDB();
    const users = await getCollection<User>('users');
    const userId = new ObjectId(id);

    if (req.method === 'GET') {
      const foundUser = await users.findOne({ _id: userId } as any);
      if (!foundUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const { hash, ...userWithoutHash } = foundUser;
      return res.status(200).json({ success: true, data: userWithoutHash });
    }

    if (req.method === 'PATCH') {
      const existingUser = await users.findOne({ _id: userId } as any);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const validated = updateUserSchema.parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      if (validated.name) updateData.name = validated.name;
      if (validated.email) updateData.email = validated.email;
      if (validated.role) updateData.role = validated.role;
      if (validated.departmentId !== undefined) updateData.departmentId = validated.departmentId;
      if (validated.password) {
        updateData.hash = await bcrypt.hash(validated.password, 10);
      }

      await users.updateOne({ _id: userId } as any, { $set: updateData });
      const updatedUser = await users.findOne({ _id: userId } as any);

      await logAudit(
        user._id!,
        'UPDATE',
        'user',
        id,
        existingUser,
        updatedUser
      );

      const { hash: _, ...userWithoutHash } = updatedUser!;
      return res.status(200).json({ success: true, data: userWithoutHash });
    }

    if (req.method === 'DELETE') {
      const existingUser = await users.findOne({ _id: userId } as any);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await users.deleteOne({ _id: userId } as any);

      await logAudit(
        user._id!,
        'DELETE',
        'user',
        id,
        existingUser,
        undefined
      );

      return res.status(200).json({ success: true, data: { message: 'User deleted' } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('User error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

