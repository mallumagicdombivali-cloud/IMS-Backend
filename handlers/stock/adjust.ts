import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { stockAdjustSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { ItemBatch, StockLedger } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validated = stockAdjustSchema.parse(req.body);
    const db = await connectDB();
    const batches = await getCollection<ItemBatch>('item_batches');
    const stockLedger = await getCollection<StockLedger>('stock_ledger');

    let batch: ItemBatch | null = null;
    if (validated.batchId) {
      if (!ObjectId.isValid(validated.batchId)) {
        return res.status(400).json({ success: false, error: 'Invalid batch ID' });
      }
      batch = await batches.findOne({ _id: new ObjectId(validated.batchId) });
      if (!batch) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
    } else {
      // Find the first available batch for the item at the location
      batch = await batches.findOne({
        itemId: validated.itemId,
        locationId: validated.locationId,
        availableQty: { $gt: 0 },
      });
      if (!batch) {
        return res.status(404).json({ success: false, error: 'No batch found for adjustment' });
      }
    }

    const beforeQty = batch.availableQty;
    const newQty = beforeQty + validated.quantity;

    if (newQty < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient stock for adjustment' });
    }

    // Update batch
    await batches.updateOne(
      { _id: batch._id },
      {
        $set: {
          availableQty: newQty,
          updatedAt: new Date(),
        },
      }
    );

    // Write to stock ledger
    const ledgerEntry: Omit<StockLedger, '_id'> = {
      itemId: validated.itemId,
      batchId: batch._id!.toString(),
      transactionType: 'ADJUST',
      quantity: validated.quantity,
      unitPrice: batch.purchasePrice,
      locationId: validated.locationId,
      userId: user._id!,
      notes: validated.notes || validated.reason,
      createdAt: new Date(),
    };

    await stockLedger.insertOne(ledgerEntry as StockLedger);

    // Log audit
    await logAudit(
      user._id!,
      'STOCK_ADJUST',
      'item_batch',
      batch._id!.toString(),
      { availableQty: beforeQty },
      { availableQty: newQty }
    );

    const updatedBatch = await batches.findOne({ _id: batch._id });

    return res.status(200).json({
      success: true,
      data: {
        batch: updatedBatch,
        adjustment: validated.quantity,
        beforeQty,
        afterQty: newQty,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Stock adjust error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

