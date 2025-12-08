import { VercelRequest, VercelResponse } from '../../types/vercel';
import { clearAuthCookie } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

