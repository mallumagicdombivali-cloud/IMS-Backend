import { VercelRequest, VercelResponse } from '../../types/vercel';
import { verifyToken } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Debug: Log what we're receiving
    console.log('=== /api/auth/me Debug ===');
    console.log('Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
    });
    console.log('Cookies:', req.cookies);
    
    const user = await verifyToken(req, res);

    if (!user) {
      console.log('❌ User verification failed');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    console.log('✅ User verified:', user.email);
    const { hash, ...userWithoutHash } = user;

    return res.status(200).json({
      success: true,
      data: { user: userWithoutHash },
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

