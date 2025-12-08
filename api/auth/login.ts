import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { generateToken, generateRefreshToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import bcrypt from 'bcrypt';
import { getCollection } from '@/lib/db';
import { User } from '@/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const validated = loginSchema.parse(req.body);
    const db = await connectDB();
    const users = await getCollection<User>('users');

    const user = await users.findOne({ email: validated.email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(validated.password, user.hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user._id!,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id!,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token, refreshToken);

    const { hash, ...userWithoutHash } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutHash,
        token,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

