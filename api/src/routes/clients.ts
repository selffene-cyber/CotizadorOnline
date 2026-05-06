import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, resolveTenant } from '../middleware/auth';
import { generateId } from '../lib/auth';

export const clientRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

clientRoutes.use('/*', authMiddleware, resolveTenant);

clientRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(tenantId).all();

  return c.json({ clients: results });
});

clientRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const clientId = c.req.param('id');

  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ? AND tenant_id = ?'
  ).bind(clientId, tenantId).first();

  if (!client) return c.json({ error: 'Client not found' }, 404);

  return c.json({ client });
});

clientRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.name || !body.rut) {
    return c.json({ error: 'Name and RUT are required' }, 400);
  }

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO clients (id, name, rut, contact, email, phone, region, city, address, tenant_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, body.rut, body.contact || null, body.email || null, body.phone || null, body.region || null, body.city || null, body.address || null, tenantId, userId).run();

  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();

  return c.json({ client }, 201);
});

clientRoutes.put('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const clientId = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT id FROM clients WHERE id = ? AND tenant_id = ?'
  ).bind(clientId, tenantId).first();

  if (!existing) return c.json({ error: 'Client not found' }, 404);

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (['name', 'rut', 'contact', 'email', 'phone', 'region', 'city', 'address'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(clientId);
    await c.env.DB.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
  return c.json({ client });
});

clientRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const clientId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM clients WHERE id = ? AND tenant_id = ?'
  ).bind(clientId, tenantId).first();

  if (!existing) return c.json({ error: 'Client not found' }, 404);

  await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(clientId).run();
  return c.json({ success: true });
});

clientRoutes.get('/rut/:rut', async (c) => {
  const tenantId = c.get('tenantId');
  const rut = c.req.param('rut');

  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE rut = ? AND tenant_id = ?'
  ).bind(rut, tenantId).first();

  if (!client) return c.json({ client: null });

  return c.json({ client });
});