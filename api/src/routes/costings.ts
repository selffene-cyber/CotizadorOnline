import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, resolveTenant } from '../middleware/auth';
import { generateId } from '../lib/auth';
import { toDB, toFrontend } from '../lib/mappings';

const safeParse = (value: any, fallback: any): any => {
  if (!value) return fallback;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return fallback; } }
  return value;
};

function normalizeItemsEquipment(items: any): any[] {
  if (!items) return [];
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item: any) => ({
    ...item,
    unit: toDB.unit(item.unit),
  }));
}

export const costingRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

costingRoutes.use('/*', authMiddleware, resolveTenant);

costingRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM costings WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(tenantId).all();

  const costings = results.map((row: any) => parseCostingRow(row));
  return c.json({ costings });
});

costingRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const costingId = c.req.param('id');

  const row = await c.env.DB.prepare(
    'SELECT * FROM costings WHERE id = ? AND tenant_id = ?'
  ).bind(costingId, tenantId).first();

  if (!row) return c.json({ error: 'Costing not found' }, 404);

  return c.json({ costing: parseCostingRow(row) });
});

costingRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.name || !body.type || !body.modality) {
    return c.json({ error: 'name, type, and modality are required' }, 400);
  }

  const id = generateId();

  const maxResult = await c.env.DB.prepare(
    'SELECT MAX(costing_number) as max_num FROM costings WHERE tenant_id = ?'
  ).bind(tenantId).first();

  const costingNumber = (maxResult?.max_num as number || 0) + 1;

  const itemsEquipment = body.items_equipment ? normalizeItemsEquipment(body.items_equipment) : [];

  await c.env.DB.prepare(
    `INSERT INTO costings (id, costing_number, name, description, type, modality, client_id, tenant_id,
      items_mo, items_materials, items_equipment, items_logistics, items_indirects,
      gg_percentage, contingency_items, utility_percentage, totals, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, costingNumber, body.name, body.description || null, toDB.type(body.type), body.modality,
    body.client_id || null, tenantId,
    JSON.stringify(body.items_mo || []),
    JSON.stringify(body.items_materials || []),
    JSON.stringify(itemsEquipment),
    JSON.stringify(body.items_logistics || {}),
    JSON.stringify(body.items_indirects || []),
    body.gg_percentage ?? 12,
    JSON.stringify(body.contingency_items || []),
    body.utility_percentage ?? 55,
    body.totals ? JSON.stringify(body.totals) : null,
    userId
  ).run();

  const costing = await c.env.DB.prepare('SELECT * FROM costings WHERE id = ?').bind(id).first();
  return c.json({ costing: parseCostingRow(costing) }, 201);
});

costingRoutes.put('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const costingId = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT id FROM costings WHERE id = ? AND tenant_id = ?'
  ).bind(costingId, tenantId).first();

  if (!existing) return c.json({ error: 'Costing not found' }, 404);

  const jsonFields = ['items_mo', 'items_materials', 'items_equipment', 'items_logistics', 'items_indirects', 'contingency_items', 'totals'];
  const scalarFields = ['name', 'description', 'type', 'modality', 'client_id', 'gg_percentage', 'utility_percentage', 'costing_number'];

  const fields: string[] = [];
  const values: any[] = [];

  for (const key of scalarFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === 'type') values.push(toDB.type(body[key]));
      else values.push(body[key]);
    }
  }

  for (const key of jsonFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === 'items_equipment') {
        values.push(JSON.stringify(normalizeItemsEquipment(body[key])));
      } else {
        values.push(JSON.stringify(body[key]));
      }
    }
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(costingId);
    await c.env.DB.prepare(`UPDATE costings SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  const costing = await c.env.DB.prepare('SELECT * FROM costings WHERE id = ?').bind(costingId).first();
  return c.json({ costing: parseCostingRow(costing) });
});

costingRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const costingId = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM costings WHERE id = ? AND tenant_id = ?'
  ).bind(costingId, tenantId).run();

  return c.json({ success: true });
});

function parseCostingRow(row: any): any {
  if (!row) return null;
  const rawEquipment = safeParse(row.items_equipment, []);
  const itemsEquipment = Array.isArray(rawEquipment)
    ? rawEquipment.map((item: any) => ({ ...item, unit: toFrontend.unit(item.unit) }))
    : [];
  return {
    ...row,
    type: toFrontend.type(row.type),
    items_mo: safeParse(row.items_mo, []),
    items_materials: safeParse(row.items_materials, []),
    items_equipment: itemsEquipment,
    items_logistics: safeParse(row.items_logistics, {}),
    items_indirects: safeParse(row.items_indirects, []),
    contingency_items: safeParse(row.contingency_items, []),
    totals: safeParse(row.totals, null),
  };
}