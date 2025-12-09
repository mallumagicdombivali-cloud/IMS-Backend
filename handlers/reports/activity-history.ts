import { VercelRequest, VercelResponse } from '../../types/vercel';
import { getCollection } from '../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate } = getSevenDayDateRange();
      const [poData, grnData] = await Promise.all([
        fetchPurchaseOrderData(startDate, endDate),
        fetchGrnData(startDate, endDate),
      ]);
      const mergedData = mergeAndFillData(poData, grnData, startDate, endDate);

      res.status(200).json({
        success: true,
        data: mergedData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

const getSevenDayDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  return { startDate, endDate };
};

const fetchPurchaseOrderData = async (startDate: Date, endDate: Date) => {
  const poCollection = await getCollection('purchase_orders');
  return poCollection
    .aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          orders: 1,
        },
      },
    ])
    .toArray();
};

const fetchGrnData = async (startDate: Date, endDate: Date) => {
  const grnCollection = await getCollection('grns');
  return grnCollection
    .aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          received: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          received: 1,
        },
      },
    ])
    .toArray();
};

const mergeAndFillData = (
  poData: any[],
  grnData: any[],
  startDate: Date,
  endDate: Date
) => {
  const merged: { [key: string]: { orders: number; received: number } } = {};

  poData.forEach((item) => {
    if (!merged[item.date]) {
      merged[item.date] = { orders: 0, received: 0 };
    }
    merged[item.date].orders = item.orders;
  });

  grnData.forEach((item) => {
    if (!merged[item.date]) {
      merged[item.date] = { orders: 0, received: 0 };
    }
    merged[item.date].received = item.received;
  });

  const result: any[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayName = currentDate.toLocaleDateString('en-US', {
      weekday: 'short',
    });
    const data = merged[dateStr] || { orders: 0, received: 0 };

    result.push({
      date: dateStr,
      dayName,
      ...data,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
};
