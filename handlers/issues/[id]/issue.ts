import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { IssueRequest, ItemBatch, StockLedger } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = await requireRole(['admin', 'storekeeper'])(req, res);

    const id = (req.query.id as string) || (req.query as any).id;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid issue ID' });
    }

    const db = await connectDB();
    const issues = await getCollection<IssueRequest>('issue_requests');
    const batches = await getCollection<ItemBatch>('item_batches');
    const stockLedger = await getCollection<StockLedger>('stock_ledger');
    const issueId = new ObjectId(id);

    const issue = await issues.findOne({ _id: issueId } as any);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue request not found' });
    }

    if (issue.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Issue must be approved before issuing' });
    }

    const now = new Date();

    // Process each item - FIFO
    for (const item of issue.items) {
      let remainingQty = item.quantity;

      // Get batches sorted by creation date (FIFO)
      const availableBatches = await batches
        .find({
          itemId: item.itemId,
          availableQty: { $gt: 0 },
        })
        .sort({ createdAt: 1 })
        .toArray();

      if (availableBatches.length === 0) {
        return res.status(400).json({
          success: false,
          error: `No stock available for item ${item.itemId}`,
        });
      }

      // Calculate total available
      const totalAvailable = availableBatches.reduce((sum, b) => sum + b.availableQty, 0);
      if (totalAvailable < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for item ${item.itemId}. Available: ${totalAvailable}, Requested: ${item.quantity}`,
        });
      }

      // Deduct from batches FIFO
      for (const batch of availableBatches) {
        if (remainingQty <= 0) break;

        const deductQty = Math.min(remainingQty, batch.availableQty);
        const newAvailableQty = batch.availableQty - deductQty;

        await batches.updateOne(
          { _id: batch._id },
          {
            $set: {
              availableQty: newAvailableQty,
              updatedAt: now,
            },
          }
        );

        // Write stock ledger entry
        const ledgerEntry: Omit<StockLedger, '_id'> = {
          itemId: item.itemId,
          batchId: batch._id!.toString(),
          transactionType: 'OUT',
          quantity: -deductQty,
          unitPrice: batch.purchasePrice,
          locationId: batch.locationId,
          referenceId: id,
          referenceType: 'ISSUE',
          userId: user._id!,
          notes: `Issue: ${issue.issueNumber}`,
          createdAt: now,
        };

        await stockLedger.insertOne(ledgerEntry as StockLedger);

        remainingQty -= deductQty;
      }
    }

    // Update issue status
    await issues.updateOne(
      { _id: issueId } as any,
      {
        $set: {
          status: 'issued',
          issuedBy: user._id!,
          issuedAt: now,
          updatedAt: now,
        },
      }
    );

    const updatedIssue = await issues.findOne({ _id: issueId } as any);

    await logAudit(
      user._id!,
      'ISSUE',
      'issue_request',
      id,
      issue,
      updatedIssue
    );

    return res.status(200).json({ success: true, data: updatedIssue });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return; // Already handled by requireRole
    }
    console.error('Issue items error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

