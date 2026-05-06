import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, resolveTenant } from '../middleware/auth';
import { generateId } from '../lib/auth';
import { toFrontend, normalizeUnit } from '../lib/mappings';

export const catalogRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

catalogRoutes.use('/*', authMiddleware, resolveTenant);

// ============ MATERIALS ============

catalogRoutes.get('/materials', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM material_catalog WHERE tenant_id = ? ORDER BY name'
  ).bind(tenantId).all();

  return c.json({ materials: results });
});

catalogRoutes.post('/materials', async (c) => {
  const tenantId = c.get('tenantId');
  const items = await c.req.json();

  if (!Array.isArray(items)) {
    return c.json({ error: 'Expected array of items' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM material_catalog WHERE tenant_id = ?').bind(tenantId).run();

  if (items.length > 0) {
    const stmt = c.env.DB.prepare(
      `INSERT INTO material_catalog (id, code, name, unit, default_cost, default_merma, category, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const batch = items.map((item: any) =>
      stmt.bind(
        generateId(),
        item.code || `${tenantId}-${item.number || 0}-${Date.now()}`,
        item.name,
        item.unidad || item.unit || 'pz',
        item.defaultCost || item.default_cost || 0,
        item.defaultMermaPct || item.default_merma || 0,
        item.category || null,
        tenantId
      )
    );

    await c.env.DB.batch(batch);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM material_catalog WHERE tenant_id = ? ORDER BY name'
  ).bind(tenantId).all();

  return c.json({ materials: results });
});

// ============ EQUIPMENT ============

catalogRoutes.get('/equipment', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM equipment_catalog WHERE tenant_id = ? ORDER BY name'
  ).bind(tenantId).all();

  const equipment = results.map((row: any) => ({ ...row, unit: toFrontend.unit(row.unit) }));
  return c.json({ equipment });
});

catalogRoutes.post('/equipment', async (c) => {
  const tenantId = c.get('tenantId');
  const items = await c.req.json();

  if (!Array.isArray(items)) {
    return c.json({ error: 'Expected array of items' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM equipment_catalog WHERE tenant_id = ?').bind(tenantId).run();

  if (items.length > 0) {
    const stmt = c.env.DB.prepare(
      `INSERT INTO equipment_catalog (id, code, name, unit, default_rate, category, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const batch = items.map((item: any) =>
      stmt.bind(
        generateId(),
        item.number?.toString() || item.code || null,
        item.name,
        normalizeUnit(item.unit),
        item.defaultRate || item.default_rate || 0,
        item.category || null,
        tenantId
      )
    );

    await c.env.DB.batch(batch);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM equipment_catalog WHERE tenant_id = ? ORDER BY name'
  ).bind(tenantId).all();

  const equipment = results.map((row: any) => ({ ...row, unit: toFrontend.unit(row.unit) }));
  return c.json({ equipment });
});