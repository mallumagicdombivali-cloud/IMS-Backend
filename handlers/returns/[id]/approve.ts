import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { Return, ItemBatch, StockLedger } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin', 'storekeeper'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid return ID' });
    }

    const db = await connectDB();
    const returns = await getCollection<Return>('returns');
    const batches = await getCollection<ItemBatch>('item_batches');
    const stockLedger = await getCollection<StockLedger>('stock_ledger');
    const returnId = new ObjectId(id);

    const returnDoc = await returns.findOne({ _id: returnId } as any);
    if (!returnDoc) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }

    if (returnDoc.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Return is not in pending status' });
    }

    const now = new Date();

    // Process each item - add quantity back to batch
    for (const item of returnDoc.items) {
      if (!ObjectId.isValid(item.batchId)) {
        return res.status(400).json({ success: false, error: `Invalid batch ID: ${item.batchId}` });
      }

      const batch = await batches.findOne({ _id: new ObjectId(item.batchId) } as any);
      if (!batch) {
        return res.status(404).json({ success: false, error: `Batch not found: ${item.batchId}` });
      }

      // Add quantity back to batch
      const newAvailableQty = batch.availableQty + item.quantity;
      const newTotalQty = batch.totalQty + item.quantity;

      await batches.updateOne(
        { _id: batch._id },
        {
          $set: {
            availableQty: newAvailableQty,
            totalQty: newTotalQty,
            updatedAt: now,
          },
        }
      );

      // Write stock ledger entry
      const ledgerEntry: Omit<StockLedger, '_id'> = {
        itemId: item.itemId,
        batchId: item.batchId,
        transactionType: 'RETURN',
        quantity: item.quantity,
        unitPrice: batch.purchasePrice,
        locationId: batch.locationId,
        referenceId: id,
        referenceType: 'RETURN',
        userId: user._id!,
        notes: `Return: ${returnDoc.returnNumber}`,
        createdAt: now,
      };

      await stockLedger.insertOne(ledgerEntry as StockLedger);
    }

    // Update return status
    await returns.updateOne(
      { _id: returnId } as any,
      {
        $set: {
          status: 'approved',
          approvedBy: user._id!,
          approvedAt: now,
          updatedAt: now,
        },
      }
    );

    const updatedReturn = await returns.findOne({ _id: returnId } as any);

    await logAudit(
      user._id!,
      'APPROVE',
      'return',
      id,
      returnDoc,
      updatedReturn
    );

    return res.status(200).json({ success: true, data: updatedReturn });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Approve return error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

