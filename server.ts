// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Register TypeScript path aliases
import 'tsconfig-paths/register';

// Register module aliases for runtime require() calls
import moduleAlias from 'module-alias';
import * as path from 'path';

moduleAlias.addAliases({
  '@': path.join(__dirname),
});

import express, { Request, Response, NextFunction } from 'express';
import { initializeDatabase } from './lib/init-db';
import { connectDB } from './lib/db';
import { parseCookies } from './lib/cookies';
import * as fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = parseCookies(cookieHeader);
  next();
});

// Helper to convert Vercel-style request to our handler format
function createVercelRequest(req: express.Request): any {
  // Merge params into query for compatibility with Vercel-style handlers
  const query = { ...req.params, ...req.query };
  
  // Ensure headers object includes authorization (Express normalizes to lowercase)
  const headers = { ...req.headers };
  if (req.headers.authorization && !headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  
  return {
    method: req.method,
    url: req.url,
    query: query,
    body: req.body,
    headers: headers,
    cookies: (req as any).cookies || {},
  };
}

function createVercelResponse(res: express.Response): any {
  return {
    status: (code: number) => {
      res.status(code);
      return createVercelResponse(res);
    },
    json: (body: any) => {
      res.json(body);
      return createVercelResponse(res);
    },
    setHeader: (name: string, value: string | string[]) => {
      res.setHeader(name, value);
      return createVercelResponse(res);
    },
  };
}

// Load and register API routes
async function loadRoutes() {
  const apiDir = path.join(__dirname, 'api');
  
  // Recursively find all route files (both .ts and .js)
  function findRouteFiles(dir: string, basePath: string = ''): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        files.push(...findRouteFiles(fullPath, relativePath));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
        entry.name !== 'index.ts' &&
        entry.name !== 'index.js'
      ) {
        files.push(relativePath);
      } else if (entry.name === 'index.ts' || entry.name === 'index.js') {
        files.push(relativePath);
      }
    }

    return files;
  }

  const routeFiles = findRouteFiles(apiDir);

  for (const file of routeFiles) {
    try {
      // Use absolute path for import
      const filePath = path.join(apiDir, file);
      const filePathWithoutExt = filePath.replace(/\.(ts|js)$/, '');
      
      // Use dynamic import which respects TypeScript path aliases
      const routeModule = await import(filePathWithoutExt);
      const handler = routeModule.default;

      if (typeof handler === 'function') {
        // Convert file path to route path
        let routePath = file
          .replace(/\\/g, '/')
          .replace(/\/index\.(ts|js)$/, '')
          .replace(/\.(ts|js)$/, '')
          .replace(/\[(\w+)\]/g, ':$1');

        // Ensure route starts with /api
        if (!routePath.startsWith('/api')) {
          routePath = '/api' + (routePath.startsWith('/') ? routePath : '/' + routePath);
        }

        // Register route for all HTTP methods
        app.all(routePath, async (req: express.Request, res: express.Response) => {
          try {
            const vercelReq = createVercelRequest(req);
            const vercelRes = createVercelResponse(res);
            
            // Debug: Log headers for auth routes
            if (routePath.includes('/auth/')) {
              console.log(`\n[${req.method}] ${routePath}`);
              console.log('Authorization header:', req.headers.authorization);
              console.log('All headers keys:', Object.keys(req.headers).filter(k => k.toLowerCase().includes('auth')));
            }
            
            await handler(vercelReq, vercelRes);
          } catch (error: any) {
            console.error(`Error in route ${routePath}:`, error);
            if (!res.headersSent) {
              res.status(500).json({ success: false, error: 'Internal server error' });
            }
          }
        });

        console.log(`  Registered route: ${routePath}`);
      }
    } catch (error: any) {
      console.error(`Error loading route ${file}:`, error.message);
    }
  }
}

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check headers
app.get('/debug/headers', (req: express.Request, res: express.Response) => {
  res.json({
    authorization: req.headers.authorization,
    'authorization-lower': req.headers['authorization'],
    allHeaders: Object.keys(req.headers).filter(k => k.toLowerCase().includes('auth')),
    cookies: (req as any).cookies,
  });
});

// Start server
async function startServer() {
  try {
    console.log('Starting development server...\n');

    // Initialize database
    await initializeDatabase();

    // Load API routes
    console.log('\nLoading API routes...');
    await loadRoutes();

    // Start Express server
    app.listen(PORT, () => {
      console.log('\nServer is running!');
      console.log(`📍 Local:   http://localhost:${PORT}`);
      console.log(`API:     http://localhost:${PORT}/api`);
      console.log(`Health:  http://localhost:${PORT}/health\n`);
      console.log('Press Ctrl+C to stop the server\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down server...');
  const { closeDB } = require('./lib/db');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down server...');
  const { closeDB } = require('./lib/db');
  await closeDB();
  process.exit(0);
});

// Start the server
startServer();

