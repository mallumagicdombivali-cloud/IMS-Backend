import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createReturnSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Return } from '@/types';
import { ObjectId } from 'mongodb';

async function generateReturnNumber(): Promise<string> {
  const returns = await getCollection<Return>('returns');
  const count = await returns.countDocuments();
  const year = new Date().getFullYear();
  return `RET-${year}-${String(count + 1).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const validated = createReturnSchema.parse(req.body);
      const db = await connectDB();
      const returns = await getCollection<Return>('returns');

      const returnNumber = await generateReturnNumber();
      const now = new Date();

      const newReturn: Omit<Return, '_id'> = {
        returnNumber,
        issueId: validated.issueId,
        returnedBy: user._id!,
        departmentId: validated.departmentId,
        items: validated.items,
        status: 'pending',
        reason: validated.reason,
        createdAt: now,
        updatedAt: now,
      };

      const result = await returns.insertOne(newReturn as Return);
      const insertedReturn = await returns.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'return',
        result.insertedId.toString(),
        undefined,
        insertedReturn
      );

      return res.status(201).json({
        success: true,
        data: insertedReturn,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const returns = await getCollection<Return>('returns');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.returnedBy) query.returnedBy = req.query.returnedBy;

      const [data, total] = await Promise.all([
        returns.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        returns.countDocuments(query),
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
    console.error('Return error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

