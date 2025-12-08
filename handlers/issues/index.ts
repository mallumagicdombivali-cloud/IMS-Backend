import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createIssueSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { IssueRequest } from '@/types';
import { ObjectId } from 'mongodb';

async function generateIssueNumber(): Promise<string> {
  const issues = await getCollection<IssueRequest>('issue_requests');
  const count = await issues.countDocuments();
  const year = new Date().getFullYear();
  return `ISS-${year}-${String(count + 1).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const validated = createIssueSchema.parse(req.body);
      const db = await connectDB();
      const issues = await getCollection<IssueRequest>('issue_requests');

      const issueNumber = await generateIssueNumber();
      const now = new Date();

      const newIssue: Omit<IssueRequest, '_id'> = {
        issueNumber,
        requestedBy: user._id!,
        departmentId: validated.departmentId,
        items: validated.items,
        status: 'pending',
        purpose: validated.purpose,
        createdAt: now,
        updatedAt: now,
      };

      const result = await issues.insertOne(newIssue as IssueRequest);
      const insertedIssue = await issues.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'issue_request',
        result.insertedId.toString(),
        undefined,
        insertedIssue
      );

      return res.status(201).json({
        success: true,
        data: insertedIssue,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const issues = await getCollection<IssueRequest>('issue_requests');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.requestedBy) query.requestedBy = req.query.requestedBy;

      const [data, total] = await Promise.all([
        issues.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        issues.countDocuments(query),
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
    console.error('Issue error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

