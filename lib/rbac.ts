import { Role, User } from '@/types';
import { VercelRequest, VercelResponse } from '@/types/vercel';
import { verifyToken } from './auth';

export function roleGuard(requiredRoles: Role[]) {
  return async (req: VercelRequest, res: VercelResponse): Promise<User | null> => {
    const user = await verifyToken(req, res);

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return null;
    }

    if (!requiredRoles.includes(user.role as Role)) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return null;
    }

    return user;
  };
}

export function requireRole(requiredRoles: Role[]) {
  return async (req: VercelRequest, res: VercelResponse): Promise<User> => {
    const user = await roleGuard(requiredRoles)(req, res);
    if (!user) {
      throw new Error('Access denied');
    }
    return user;
  };
}

