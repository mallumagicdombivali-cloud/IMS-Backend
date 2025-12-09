import { VercelRequest, VercelResponse } from '../types/vercel';
import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors'; // Make sure to import cors
import seedHandler from '../handlers/system/seed';

// --- 1. Define Helper to run Middleware in Vercel ---
function runMiddleware(req: VercelRequest, res: VercelResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// --- 2. Configure CORS Options ---
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-production-domain.com'], // Add your prod domain here
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS is required for preflight
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

// Import all route handlers
import loginHandler from '../handlers/auth/login';
import logoutHandler from '../handlers/auth/logout';
import meHandler from '../handlers/auth/me';
import refreshHandler from '../handlers/auth/refresh';

import usersIndexHandler from '../handlers/users/index';
import usersIdHandler from '../handlers/users/[id]';

import itemsIndexHandler from '../handlers/items/index';
import itemsIdHandler from '../handlers/items/[id]';
import itemsBatchesHandler from '../handlers/items/[itemId]/batches';

import batchesIdHandler from '../handlers/batches/[id]';
import stockAdjustHandler from '../handlers/stock/adjust';

import prIndexHandler from '../handlers/pr/index';
import prIdHandler from '../handlers/pr/[id]';
import prApproveHandler from '../handlers/pr/[id]/approve';
import prRejectHandler from '../handlers/pr/[id]/reject';

import poIndexHandler from '../handlers/po/index';
import poIdHandler from '../handlers/po/[id]';
import poApproveHandler from '../handlers/po/[id]/approve';
import poSendHandler from '../handlers/po/[id]/send';
import poCancelHandler from '../handlers/po/[id]/cancel';

import grnIndexHandler from '../handlers/grn/index';
import grnIdHandler from '../handlers/grn/[id]';

import issuesIndexHandler from '../handlers/issues/index';
import issuesIdHandler from '../handlers/issues/[id]';
import issuesApproveHandler from '../handlers/issues/[id]/approve';
import issuesRejectHandler from '../handlers/issues/[id]/reject';
import issuesIssueHandler from '../handlers/issues/[id]/issue';

import returnsIndexHandler from '../handlers/returns/index';
import returnsIdHandler from '../handlers/returns/[id]';
import returnsApproveHandler from '../handlers/returns/[id]/approve';

import consumptionIndexHandler from '../handlers/consumption/index';
import consumptionVarianceHandler from '../handlers/consumption/variance';

import reportsStockHandler from '../handlers/reports/stock';
import reportsValuationHandler from '../handlers/reports/valuation';
import reportsConsumptionHandler from '../handlers/reports/consumption';
import reportsExpiryHandler from '../handlers/reports/expiry';
import reportsWastageHandler from '../handlers/reports/wastage';
import reportsPurchaseHandler from '../handlers/reports/purchase';
import reportsSupplierPerformanceHandler from '../handlers/reports/supplier-performance';
import reportsActivityHistoryHandler from '../handlers/reports/activity-history';
import reportsStockHealthHandler from '../handlers/reports/stock-health';

import auditIndexHandler from '../handlers/audit/index';
import auditIdHandler from '../handlers/audit/[id]';

import departmentsIndexHandler from '../handlers/departments/index';
import departmentsIdHandler from '../handlers/departments/[id]';

import locationsIndexHandler from '../handlers/locations/index';
import locationsIdHandler from '../handlers/locations/[id]';

import suppliersIndexHandler from '../handlers/suppliers/index';
import suppliersIdHandler from '../handlers/suppliers/[id]';

import systemCheckReorderHandler from '../handlers/system/check-reorder';
import systemCheckExpiryHandler from '../handlers/system/check-expiry';
import systemGenerateReportsHandler from '../handlers/system/generate-reports';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- 3. APPLY CORS HERE ---
  // This executes the cors middleware against the Vercel request/response objects
  await runMiddleware(req, res, cors(corsOptions));

  const path = req.url || '';
  const method = req.method || 'GET';
  
  // Extract route path (remove query string)
  let routePath = path.split('?')[0];
  
  // Extract ID from path for dynamic routes
  function extractId(path: string, pattern: RegExp): string | null {
    const match = path.match(pattern);
    return match ? match[1] : null;
  }
  
  // Create enhanced request with extracted IDs
  const enhancedReq = { ...req };
  
  // Route mapping
  const routes: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<any>> = {
    // Auth routes
    '/api/auth/login': loginHandler,
    '/api/auth/logout': logoutHandler,
    '/api/auth/me': meHandler,
    '/api/auth/refresh': refreshHandler,
    
    // Users
    '/api/users': usersIndexHandler,
    
    // Items
    '/api/items': itemsIndexHandler,
    
    // Reports
    '/api/reports/stock': reportsStockHandler,
    '/api/reports/valuation': reportsValuationHandler,
    '/api/reports/consumption': reportsConsumptionHandler,
    '/api/reports/expiry': reportsExpiryHandler,
    '/api/reports/wastage': reportsWastageHandler,
    '/api/reports/purchase': reportsPurchaseHandler,
    '/api/reports/supplier-performance': reportsSupplierPerformanceHandler,
    '/api/reports/activity-history': reportsActivityHistoryHandler,
    '/api/reports/stock-health': reportsStockHealthHandler,
    
    // Consumption
    '/api/consumption': consumptionIndexHandler,
    '/api/consumption/variance': consumptionVarianceHandler,
    
    // System
    '/api/system/check-reorder': systemCheckReorderHandler,
    '/api/system/check-expiry': systemCheckExpiryHandler,
    '/api/system/generate-reports': systemGenerateReportsHandler,
    '/api/system/seed': seedHandler,
    
    // Stock
    '/api/stock/adjust': stockAdjustHandler,
  };

  // Handle dynamic routes with IDs - extract ID and add to query
  const userIdMatch = routePath.match(/^\/api\/users\/([^/]+)$/);
  if (userIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: userIdMatch[1] };
    return usersIdHandler(enhancedReq as VercelRequest, res);
  }
  
  const itemIdMatch = routePath.match(/^\/api\/items\/([^/]+)$/);
  if (itemIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: itemIdMatch[1] };
    return itemsIdHandler(enhancedReq as VercelRequest, res);
  }
  
  const itemBatchesMatch = routePath.match(/^\/api\/items\/([^/]+)\/batches$/);
  if (itemBatchesMatch) {
    (enhancedReq as any).query = { ...req.query, itemId: itemBatchesMatch[1] };
    return itemsBatchesHandler(enhancedReq as VercelRequest, res);
  }
  
  const batchIdMatch = routePath.match(/^\/api\/batches\/([^/]+)$/);
  if (batchIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: batchIdMatch[1] };
    return batchesIdHandler(enhancedReq as VercelRequest, res);
  }
  
  const prIdMatch = routePath.match(/^\/api\/pr\/([^/]+)$/);
  if (prIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: prIdMatch[1] };
    return prIdHandler(enhancedReq as VercelRequest, res);
  }
  
  const prApproveMatch = routePath.match(/^\/api\/pr\/([^/]+)\/approve$/);
  if (prApproveMatch) {
    (enhancedReq as any).query = { ...req.query, id: prApproveMatch[1] };
    return prApproveHandler(enhancedReq as VercelRequest, res);
  }
  
  const prRejectMatch = routePath.match(/^\/api\/pr\/([^/]+)\/reject$/);
  if (prRejectMatch) {
    (enhancedReq as any).query = { ...req.query, id: prRejectMatch[1] };
    return prRejectHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/pr') {
    return prIndexHandler(req, res);
  }
  
  const poApproveMatch = routePath.match(/^\/api\/po\/([^/]+)\/approve$/);
  if (poApproveMatch) {
    (enhancedReq as any).query = { ...req.query, id: poApproveMatch[1] };
    return poApproveHandler(enhancedReq as VercelRequest, res);
  }
  
  const poSendMatch = routePath.match(/^\/api\/po\/([^/]+)\/send$/);
  if (poSendMatch) {
    (enhancedReq as any).query = { ...req.query, id: poSendMatch[1] };
    return poSendHandler(enhancedReq as VercelRequest, res);
  }
  
  const poCancelMatch = routePath.match(/^\/api\/po\/([^/]+)\/cancel$/);
  if (poCancelMatch) {
    (enhancedReq as any).query = { ...req.query, id: poCancelMatch[1] };
    return poCancelHandler(enhancedReq as VercelRequest, res);
  }
  
  const poIdMatch = routePath.match(/^\/api\/po\/([^/]+)$/);
  if (poIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: poIdMatch[1] };
    return poIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/po') {
    return poIndexHandler(req, res);
  }
  
  const grnIdMatch = routePath.match(/^\/api\/grn\/([^/]+)$/);
  if (grnIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: grnIdMatch[1] };
    return grnIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/grn') {
    return grnIndexHandler(req, res);
  }
  
  const issuesApproveMatch = routePath.match(/^\/api\/issues\/([^/]+)\/approve$/);
  if (issuesApproveMatch) {
    (enhancedReq as any).query = { ...req.query, id: issuesApproveMatch[1] };
    return issuesApproveHandler(enhancedReq as VercelRequest, res);
  }
  
  const issuesRejectMatch = routePath.match(/^\/api\/issues\/([^/]+)\/reject$/);
  if (issuesRejectMatch) {
    (enhancedReq as any).query = { ...req.query, id: issuesRejectMatch[1] };
    return issuesRejectHandler(enhancedReq as VercelRequest, res);
  }
  
  const issuesIssueMatch = routePath.match(/^\/api\/issues\/([^/]+)\/issue$/);
  if (issuesIssueMatch) {
    (enhancedReq as any).query = { ...req.query, id: issuesIssueMatch[1] };
    return issuesIssueHandler(enhancedReq as VercelRequest, res);
  }
  
  const issuesIdMatch = routePath.match(/^\/api\/issues\/([^/]+)$/);
  if (issuesIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: issuesIdMatch[1] };
    return issuesIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/issues') {
    return issuesIndexHandler(req, res);
  }
  
  const returnsApproveMatch = routePath.match(/^\/api\/returns\/([^/]+)\/approve$/);
  if (returnsApproveMatch) {
    (enhancedReq as any).query = { ...req.query, id: returnsApproveMatch[1] };
    return returnsApproveHandler(enhancedReq as VercelRequest, res);
  }
  
  const returnsIdMatch = routePath.match(/^\/api\/returns\/([^/]+)$/);
  if (returnsIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: returnsIdMatch[1] };
    return returnsIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/returns') {
    return returnsIndexHandler(req, res);
  }
  
  const auditIdMatch = routePath.match(/^\/api\/audit\/([^/]+)$/);
  if (auditIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: auditIdMatch[1] };
    return auditIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/audit') {
    return auditIndexHandler(req, res);
  }
  
  const departmentsIdMatch = routePath.match(/^\/api\/departments\/([^/]+)$/);
  if (departmentsIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: departmentsIdMatch[1] };
    return departmentsIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/departments') {
    return departmentsIndexHandler(req, res);
  }
  
  const locationsIdMatch = routePath.match(/^\/api\/locations\/([^/]+)$/);
  if (locationsIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: locationsIdMatch[1] };
    return locationsIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/locations') {
    return locationsIndexHandler(req, res);
  }
  
  const suppliersIdMatch = routePath.match(/^\/api\/suppliers\/([^/]+)$/);
  if (suppliersIdMatch) {
    (enhancedReq as any).query = { ...req.query, id: suppliersIdMatch[1] };
    return suppliersIdHandler(enhancedReq as VercelRequest, res);
  }
  
  if (routePath === '/api/suppliers') {
    return suppliersIndexHandler(req, res);
  }
  
  // Try exact route match
  if (routes[routePath]) {
    return routes[routePath](req, res);
  }
  
  // 404 Not Found
  return res.status(404).json({ success: false, error: 'Route not found' });
}