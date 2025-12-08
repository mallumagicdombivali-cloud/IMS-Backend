import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { requireRole } from '../../lib/rbac';
import { getCollection } from '../../lib/db';
import { AuditLog } from '../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid audit log ID' });
    }

    const db = await connectDB();
    const auditLogs = await getCollection<AuditLog>('audit_logs');
    const logId = new ObjectId(id);

    const log = await auditLogs.findOne({ _id: logId } as any);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Audit log not found' });
    }

    return res.status(200).json({ success: true, data: log });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Audit error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

