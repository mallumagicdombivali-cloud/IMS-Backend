import { VercelRequest, VercelResponse } from '../../types/vercel';
import { connectDB } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { createConsumptionSchema } from '../../lib/validations';
import { logAudit } from '../../lib/audit';
import { getCollection } from '../../lib/db';
import { ConsumptionLog, ItemBatch, StockLedger } from '../../types';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyToken(req, res);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const validated = createConsumptionSchema.parse(req.body);
      const db = await connectDB();
      const consumptionLogs = await getCollection<ConsumptionLog>('consumption_logs');
      const batches = await getCollection<ItemBatch>('item_batches');
      const stockLedger = await getCollection<StockLedger>('stock_ledger');

      if (!ObjectId.isValid(validated.batchId)) {
        return res.status(400).json({ success: false, error: 'Invalid batch ID' });
      }

      const batch = await batches.findOne({ _id: new ObjectId(validated.batchId) } as any);
      if (!batch) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }

      const variance = validated.theoreticalQty - validated.actualQty;
      const now = new Date();

      // Create consumption log
      const consumptionLog: Omit<ConsumptionLog, '_id'> = {
        itemId: validated.itemId,
        batchId: validated.batchId,
        departmentId: validated.departmentId,
        theoreticalQty: validated.theoreticalQty,
        actualQty: validated.actualQty,
        variance,
        consumedBy: user._id!,
        consumedAt: now,
        notes: validated.notes,
        createdAt: now,
      };

      const result = await consumptionLogs.insertOne(consumptionLog as ConsumptionLog);

      // Deduct actual quantity from batch
      const newAvailableQty = batch.availableQty - validated.actualQty;
      if (newAvailableQty < 0) {
        return res.status(400).json({ success: false, error: 'Insufficient stock' });
      }

      await batches.updateOne(
        { _id: batch._id },
        {
          $set: {
            availableQty: newAvailableQty,
            updatedAt: now,
          },
        }
      );

      // Write to stock ledger
      const ledgerEntry: Omit<StockLedger, '_id'> = {
        itemId: validated.itemId,
        batchId: validated.batchId,
        transactionType: 'CONSUMPTION',
        quantity: -validated.actualQty,
        unitPrice: batch.purchasePrice,
        locationId: batch.locationId,
        referenceId: result.insertedId.toString(),
        referenceType: 'CONSUMPTION',
        userId: user._id!,
        notes: validated.notes || `Consumption: Theoretical=${validated.theoreticalQty}, Actual=${validated.actualQty}`,
        createdAt: now,
      };

      await stockLedger.insertOne(ledgerEntry as StockLedger);

      const insertedLog = await consumptionLogs.findOne({ _id: result.insertedId } as any);

      await logAudit(
        user._id!,
        'CREATE',
        'consumption_log',
        result.insertedId.toString(),
        undefined,
        insertedLog
      );

      return res.status(201).json({
        success: true,
        data: insertedLog,
      });
    }

    if (req.method === 'GET') {
      const db = await connectDB();
      const consumptionLogs = await getCollection<ConsumptionLog>('consumption_logs');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (req.query.itemId) query.itemId = req.query.itemId;
      if (req.query.departmentId) query.departmentId = req.query.departmentId;
      if (req.query.from || req.query.to) {
        query.consumedAt = {};
        if (req.query.from) query.consumedAt.$gte = new Date(req.query.from as string);
        if (req.query.to) query.consumedAt.$lte = new Date(req.query.to as string);
      }

      const [data, total] = await Promise.all([
        consumptionLogs.find(query).skip(skip).limit(limit).sort({ consumedAt: -1 }).toArray(),
        consumptionLogs.countDocuments(query),
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
    console.error('Consumption error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

