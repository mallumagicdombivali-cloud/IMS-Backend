import { User } from '@/types';
import { getCollection } from './db';
import { AuditLog } from '@/types';

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  before?: any,
  after?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const auditLogs = await getCollection<AuditLog>('audit_logs');
    await auditLogs.insertOne({
      userId,
      action,
      entity,
      entityId,
      before,
      after,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export async function getAuditLogs(
  filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  },
  page: number = 1,
  limit: number = 50
) {
  const auditLogs = await getCollection<AuditLog>('audit_logs');
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.userId) query.userId = filters.userId;
  if (filters.entity) query.entity = filters.entity;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.action) query.action = filters.action;
  if (filters.from || filters.to) {
    query.timestamp = {};
    if (filters.from) query.timestamp.$gte = filters.from;
    if (filters.to) query.timestamp.$lte = filters.to;
  }

  const [data, total] = await Promise.all([
    auditLogs
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    auditLogs.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

