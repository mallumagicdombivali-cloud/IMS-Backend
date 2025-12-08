import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { createGRNSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getCollection } from '@/lib/db';
import { GRN, ItemBatch, StockLedger, PurchaseOrder } from '@/types';
import { ObjectId } from 'mongodb';

async function generateGRNNumber(): Promise<string> {
  const grns = await getCollection<GRN>('grns');
  const count = await grns.countDocuments();
  const year = new Date().getFullYear();
  return `GRN-${year}-${String(count + 1).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireRole(['admin', 'storekeeper', 'accounts'])(req, res);

    if (req.method === 'POST') {
      const validated = createGRNSchema.parse(req.body);
      const db = await connectDB();
      const grns = await getCollection<GRN>('grns');
      const pos = await getCollection<PurchaseOrder>('purchase_orders');
      const batches = await getCollection<ItemBatch>('item_batches');
      const stockLedger = await getCollection<StockLedger>('stock_ledger');

      // Verify PO exists
      const poId = new ObjectId(validated.poId);
      const po = await pos.findOne({ _id: poId } as any);
      if (!po) {
        return res.status(404).json({ success: false, error: 'PO not found' });
      }

      if (!['sent', 'partial'].includes(po.status)) {
        return res.status(400).json({ success: false, error: 'PO is not in valid status for GRN' });
      }

      const grnNumber = await generateGRNNumber();
      const now = new Date();

      let totalAmount = 0;
      const createdBatches: string[] = [];

      // Process each item
      for (const item of validated.items) {
        totalAmount += item.quantity * item.unitPrice;

        // Create batch
        const batch: Omit<ItemBatch, '_id'> = {
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          locationId: item.locationId,
          purchasePrice: item.unitPrice,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          totalQty: item.quantity,
          availableQty: item.quantity,
          reservedQty: 0,
          grnId: '', // Will be set after GRN creation
          createdAt: now,
          updatedAt: now,
        };

        const batchResult = await batches.insertOne(batch as ItemBatch);
        createdBatches.push(batchResult.insertedId.toString());

        // Update batch with GRN ID (will be set after GRN creation)
        // Create stock ledger entry
        const ledgerEntry: Omit<StockLedger, '_id'> = {
          itemId: item.itemId,
          batchId: batchResult.insertedId.toString(),
          transactionType: 'IN',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          locationId: item.locationId,
          referenceId: '', // Will be set after GRN creation
          referenceType: 'GRN',
          userId: user._id!,
          notes: `GRN: ${grnNumber}`,
          createdAt: now,
        };

        await stockLedger.insertOne(ledgerEntry as StockLedger);
      }

      // Create GRN
      const newGRN: Omit<GRN, '_id'> = {
        grnNumber,
        poId: validated.poId,
        supplierId: po.supplierId,
        receivedBy: user._id!,
        items: validated.items.map(item => ({
          ...item,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        })),
        status: 'completed',
        totalAmount,
        receivedAt: now,
        notes: validated.notes,
        createdAt: now,
        updatedAt: now,
      };

      const grnResult = await grns.insertOne(newGRN as GRN);
      const grnId = grnResult.insertedId.toString();

      // Update batches with GRN ID
      for (const batchId of createdBatches) {
        await batches.updateOne(
          { _id: new ObjectId(batchId) } as any,
          { $set: { grnId } }
        );
      }

      // Update stock ledger entries with reference ID
      await stockLedger.updateMany(
        { notes: { $regex: `GRN: ${grnNumber}` } },
        { $set: { referenceId: grnId } }
      );

      // Update PO status
      const allItemsReceived = validated.items.length >= po.items.length;
      await pos.updateOne(
        { _id: poId } as any,
        {
          $set: {
            status: allItemsReceived ? 'completed' : 'partial',
            updatedAt: now,
          },
        }
      );

      const insertedGRN = await grns.findOne({ _id: grnResult.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'grn',
        grnId,
        undefined,
        insertedGRN
      );

      return res.status(201).json({
        success: true,
        data: insertedGRN,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const grns = await getCollection<GRN>('grns');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.poId) query.poId = req.query.poId;
      if (req.query.supplierId) query.supplierId = req.query.supplierId;
      if (req.query.status) query.status = req.query.status;

      const [data, total] = await Promise.all([
        grns.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        grns.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
    console.error('GRN error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

