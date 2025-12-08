import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { approveIssueSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { IssueRequest } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin', 'hod', 'storekeeper'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid issue ID' });
    }

    const db = await connectDB();
    const issues = await getCollection<IssueRequest>('issue_requests');
    const issueId = new ObjectId(id);

    const issue = await issues.findOne({ _id: issueId } as any);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue request not found' });
    }

    if (issue.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Issue is not in pending status' });
    }

    await issues.updateOne(
      { _id: issueId } as any,
      {
        $set: {
          status: 'approved',
          approvedBy: user._id!,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedIssue = await issues.findOne({ _id: issueId } as any);

    await logAudit(
      user._id!,
      'APPROVE',
      'issue_request',
      id,
      issue,
      updatedIssue
    );

    return res.status(200).json({ success: true, data: updatedIssue });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Approve issue error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

