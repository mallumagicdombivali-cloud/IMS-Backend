import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { requireRole } from '../../lib/rbac';
import { createUserSchema } from '../../lib/validations';
import { logAudit } from '../../lib/audit';
import bcrypt from 'bcrypt';
import { getCollection } from '../../lib/db';
import { User } from '../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin'])(req, res);

    if (req.method === 'POST') {
      const validated = createUserSchema.parse(req.body);
      const db = await connectDB();
      const users = await getCollection<User>('users');

      // Check if email already exists
      const existing = await users.findOne({ email: validated.email });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }

      const hash = await bcrypt.hash(validated.password, 10);
      const now = new Date();

      const newUser: Omit<User, '_id'> = {
        name: validated.name,
        email: validated.email,
        hash,
        role: validated.role,
        departmentId: validated.departmentId,
        createdAt: now,
        updatedAt: now,
      };

      const result = await users.insertOne(newUser as User);
      const insertedUser = await users.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'user',
        result.insertedId.toString(),
        undefined,
        insertedUser
      );

      const { hash: _, ...userWithoutHash } = insertedUser!;

      return res.status(201).json({
        success: true,
        data: userWithoutHash,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const users = await getCollection<User>('users');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.role) query.role = req.query.role;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;

      const [data, total] = await Promise.all([
        users.find(query).skip(skip).limit(limit).toArray(),
        users.countDocuments(query),
      ]);

      const usersWithoutHash = data.map(({ hash, ...rest }) => rest);

      return res.status(200).json({
        success: true,
        data: usersWithoutHash,
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
    console.error('Users error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

