import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { createLocationSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Location } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin'])(req, res);

    if (req.method === 'POST') {
      const validated = createLocationSchema.parse(req.body);
      const db = await connectDB();
      const locations = await getCollection<Location>('locations');

      // Check if code already exists
      const existing = await locations.findOne({ code: validated.code });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Location code already exists' });
      }

      const now = new Date();
      const newLocation: Omit<Location, '_id'> = {
        name: validated.name,
        code: validated.code,
        address: validated.address,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const result = await locations.insertOne(newLocation as Location);
      const insertedLocation = await locations.findOne({ _id: result.insertedId });

      await logAudit(
        user._id!,
        'CREATE',
        'location',
        result.insertedId.toString(),
        undefined,
        insertedLocation
      );

      return res.status(201).json({
        success: true,
        data: insertedLocation,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const locations = await getCollection<Location>('locations');

      const query: any = {};
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      const data = await locations.find(query).sort({ name: 1 }).toArray();

      return res.status(200).json({
        success: true,
        data,
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Location error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

