import { VercelRequest, VercelResponse } from '../../types/vercel';
import { verifyRefreshToken, generateToken, generateRefreshToken, setAuthCookie } from '../../lib/auth';
import { parseCookies } from '../../lib/cookies';
import { getCollection } from '../../lib/db';
import { User } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const cookies = req.cookies || parseCookies(req.headers.cookie);
    const refreshToken = cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const users = await getCollection<User>('users');
    const user = await users.findOne({ _id: payload.userId } as any);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const newToken = generateToken({
      userId: user._id!,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id!,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, newToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
}

