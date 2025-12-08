import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { getAuditLogs } from '@/lib/audit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin'])(req, res);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters: any = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.entity) filters.entity = req.query.entity;
    if (req.query.entityId) filters.entityId = req.query.entityId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.from) filters.from = new Date(req.query.from as string);
    if (req.query.to) filters.to = new Date(req.query.to as string);

    const result = await getAuditLogs(filters, page, limit);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Audit error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

