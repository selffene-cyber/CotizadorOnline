import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { clientRoutes } from './routes/clients';
import { costingRoutes } from './routes/costings';
import { quoteRoutes } from './routes/quotes';
import { catalogRoutes } from './routes/catalogs';
import { settingsRoutes } from './routes/settings';
import { tenantRoutes } from './routes/tenants';
import { invitationRoutes } from './routes/invitations';
import { storageRoutes } from './routes/storage';

type AppBindings = {
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
    userRole: string;
    tenantId: string;
    tenantRole: string;
  };
};

const app = new Hono<AppBindings>();

app.use('*', cors({
  origin: (origin) => origin || 'https://cot.piwisuite.cl',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  credentials: true,
}));

app.get('/', (c) => c.json({ 
  name: 'CotizadorMIC API',
  version: '1.0.0',
  status: 'ok' 
}));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/clients', clientRoutes);
app.route('/api/costings', costingRoutes);
app.route('/api/quotes', quoteRoutes);
app.route('/api/catalogs', catalogRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/tenants', tenantRoutes);
app.route('/api/invitations', invitationRoutes);
app.route('/api/storage', storageRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;