import { VercelRequest, VercelResponse } from '../../types/vercel';
import { getCollection } from '../../lib/db';

export default async function seedHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const poCollection = await getCollection('purchase_orders');
    const grnCollection = await getCollection('grns');

    // Clear existing data (Optional - uncomment if you want a fresh start)
    // await poCollection.deleteMany({});
    // await grnCollection.deleteMany({});

    const posToInsert = [];
    const grnsToInsert = [];
    
    const today = new Date();

    // Loop back 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i); // Go back 'i' days

      // 1. Generate Random POs (1 to 5 per day)
      const dailyPOCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < dailyPOCount; j++) {
        posToInsert.push({
          poNumber: `PO-${1000 + i}${j}`,
          status: 'approved',
          supplierId: 'SUP-GENERIC',
          totalAmount: Math.floor(Math.random() * 5000) + 1000,
          createdAt: new Date(date.setHours(Math.random() * 23, Math.random() * 59)), // Random time
          updatedAt: new Date()
        });
      }

      // 2. Generate Random GRNs (0 to 4 per day)
      const dailyGRNCount = Math.floor(Math.random() * 5);
      
      for (let k = 0; k < dailyGRNCount; k++) {
        grnsToInsert.push({
          grnNumber: `GRN-${2000 + i}${k}`,
          poId: `PO-${1000 + i}${k}`, // loosely link to a PO
          supplierId: 'SUP-GENERIC',
          createdAt: new Date(date.setHours(Math.random() * 23, Math.random() * 59)),
          updatedAt: new Date()
        });
      }
    }

    // Bulk Insert
    if (posToInsert.length > 0) await poCollection.insertMany(posToInsert);
    if (grnsToInsert.length > 0) await grnCollection.insertMany(grnsToInsert);

    return res.status(200).json({
      success: true,
      message: `Seeded ${posToInsert.length} POs and ${grnsToInsert.length} GRNs over the last 7 days.`,
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return res.status(500).json({ success: false, error: 'Seeding failed' });
  }
}