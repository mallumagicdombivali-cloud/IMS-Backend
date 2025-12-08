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
    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid location ID' });
    }

    const db = await connectDB();
    const locations = await getCollection<Location>('locations');
    const locationId = new ObjectId(id);

    if (req.method === 'PATCH') {
      const existingLocation = await locations.findOne({ _id: locationId });
      if (!existingLocation) {
        return res.status(404).json({ success: false, error: 'Location not found' });
      }

      const validated = createLocationSchema.partial().parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      if (validated.name) updateData.name = validated.name;
      if (validated.code) updateData.code = validated.code;
      if (validated.address !== undefined) updateData.address = validated.address;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      await locations.updateOne({ _id: locationId }, { $set: updateData });
      const updatedLocation = await locations.findOne({ _id: locationId });

      await logAudit(
        user._id!,
        'UPDATE',
        'location',
        id,
        existingLocation,
        updatedLocation
      );

      return res.status(200).json({ success: true, data: updatedLocation });
    }

    if (req.method === 'DELETE') {
      const existingLocation = await locations.findOne({ _id: locationId });
      if (!existingLocation) {
        return res.status(404).json({ success: false, error: 'Location not found' });
      }

      await locations.updateOne(
        { _id: locationId },
        { $set: { isActive: false, updatedAt: new Date() } }
      );

      await logAudit(
        user._id!,
        'DELETE',
        'location',
        id,
        existingLocation,
        undefined
      );

      return res.status(200).json({ success: true, data: { message: 'Location deactivated' } });
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

