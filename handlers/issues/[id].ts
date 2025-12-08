import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { getCollection } from '../../lib/db';
import { IssueRequest } from '../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

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

    return res.status(200).json({ success: true, data: issue });
  } catch (error) {
    console.error('Issue error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

