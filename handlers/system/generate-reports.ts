import { VercelRequest, VercelResponse } from '@/types/vercel';
import { connectDB } from '@/lib/db';
import { getCollection } from '@/lib/db';
import { ReportsCache } from '@/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = await connectDB();
    const reportsCache = await getCollection<ReportsCache>('reports_cache');

    const reportTypes = [
      'stock',
      'valuation',
      'consumption',
      'expiry',
      'wastage',
      'purchase',
      'supplier-performance',
    ];

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Cache for 1 day

    const generatedReports: any[] = [];

    for (const reportType of reportTypes) {
      try {
        // Generate report data (simplified - in production, call actual report logic)
        const reportData = {
          type: reportType,
          generatedAt: now,
          data: {}, // Placeholder - would contain actual report data
        };

        // Store in cache
        await reportsCache.updateOne(
          { reportType, 'parameters._date': { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          {
            $set: {
              reportType,
              parameters: { _date: now },
              data: reportData,
              generatedAt: now,
              expiresAt,
            },
          },
          { upsert: true }
        );

        generatedReports.push({
          reportType,
          status: 'success',
          generatedAt: now,
        });
      } catch (error) {
        console.error(`Error generating ${reportType} report:`, error);
        generatedReports.push({
          reportType,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        generatedReports,
        total: generatedReports.length,
        successful: generatedReports.filter((r) => r.status === 'success').length,
        failed: generatedReports.filter((r) => r.status === 'error').length,
      },
    });
  } catch (error) {
    console.error('Generate reports error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

