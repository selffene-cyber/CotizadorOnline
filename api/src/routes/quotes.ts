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

export const quoteRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

quoteRoutes.use('/*', authMiddleware, resolveTenant);

quoteRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const status = c.req.query('status');
  const clientId = c.req.query('client_id');

  let query = 'SELECT * FROM quotes WHERE tenant_id = ?';
  const params: any[] = [tenantId];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (clientId) { query += ' AND client_id = ?'; params.push(clientId); }

  query += ' ORDER BY created_at DESC';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ quotes: results.map(parseQuoteRow) });
});

quoteRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const quoteId = c.req.param('id');

  const row = await c.env.DB.prepare(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?'
  ).bind(quoteId, tenantId).first();

  if (!row) return c.json({ error: 'Quote not found' }, 404);

  return c.json({ quote: parseQuoteRow(row) });
});

quoteRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.project_name || !body.client_id) {
    return c.json({ error: 'project_name and client_id are required' }, 400);
  }

  const id = generateId();

  const maxResult = await c.env.DB.prepare(
    'SELECT MAX(quote_number) as max_num FROM quotes WHERE tenant_id = ?'
  ).bind(tenantId).first();

  const quoteNumber = body.quote_number || ((maxResult?.max_num as number || 0) + 1);

  await c.env.DB.prepare(
    `INSERT INTO quotes (id, client_id, tenant_id, status, version, parent_quote_id, quote_number,
      project_name, location, region, city, type, modality, scope, exclusions, assumptions,
      execution_deadline, validity, payment_terms, warranties, quote_items, costing_references,
      utility_percentage, totals, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.client_id, tenantId, body.status || 'Borrador', body.version || 1,
    body.parent_quote_id || null, quoteNumber,
    body.project_name, body.location || null, body.region || null, body.city || null,
    toDB.type(body.type) || null, body.modality || null, body.scope || '', body.exclusions || '',
    body.assumptions || '', body.execution_deadline || 30, body.validity || 30,
    body.payment_terms || '', body.warranties || '',
    JSON.stringify(body.quote_items || []),
    JSON.stringify(body.costing_references || []),
    body.utility_percentage ?? null,
    body.totals ? JSON.stringify(body.totals) : null,
    userId
  ).run();

  const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first();
  return c.json({ quote: parseQuoteRow(quote) }, 201);
});

quoteRoutes.put('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const quoteId = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT id FROM quotes WHERE id = ? AND tenant_id = ?'
  ).bind(quoteId, tenantId).first();

  if (!existing) return c.json({ error: 'Quote not found' }, 404);

  const jsonFields = ['quote_items', 'costing_references', 'totals'];
  const scalarFields = [
    'client_id', 'status', 'version', 'parent_quote_id', 'quote_number',
    'project_name', 'location', 'region', 'city', 'type', 'modality',
    'scope', 'exclusions', 'assumptions', 'execution_deadline', 'validity',
    'payment_terms', 'warranties', 'utility_percentage'
  ];

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
    if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(JSON.stringify(body[key])); }
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(quoteId);
    await c.env.DB.prepare(`UPDATE quotes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteId).first();
  return c.json({ quote: parseQuoteRow(quote) });
});

quoteRoutes.post('/:id/duplicate', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const quoteId = c.req.param('id');

  const original = await c.env.DB.prepare(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?'
  ).bind(quoteId, tenantId).first();

  if (!original) return c.json({ error: 'Quote not found' }, 404);

  const versions = await c.env.DB.prepare(
    'SELECT MAX(version) as max_ver FROM quotes WHERE parent_quote_id = ?'
  ).bind(quoteId).first();

  const nextVersion = ((versions?.max_ver as number) || original.version) + 1;
  const maxNum = await c.env.DB.prepare(
    'SELECT MAX(quote_number) as max_num FROM quotes WHERE tenant_id = ?'
  ).bind(tenantId).first();
  const newQuoteNumber = (maxNum?.max_num as number || 0) + 1;

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO quotes (id, client_id, tenant_id, status, version, parent_quote_id, quote_number,
      project_name, location, region, city, type, modality, scope, exclusions, assumptions,
      execution_deadline, validity, payment_terms, warranties, quote_items, costing_references,
      utility_percentage, totals, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, original.client_id, tenantId, 'Borrador', nextVersion, quoteId, newQuoteNumber,
    original.project_name, original.location, original.region, original.city,
    original.type, original.modality, original.scope, original.exclusions,
    original.assumptions, original.execution_deadline, original.validity,
    original.payment_terms, original.warranties, original.quote_items,
    original.costing_references, original.utility_percentage, original.totals,
    userId
  ).run();

  const quote = await c.env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first();
  return c.json({ quote: parseQuoteRow(quote) }, 201);
});

quoteRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const quoteId = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM quotes WHERE id = ? AND tenant_id = ?'
  ).bind(quoteId, tenantId).run();

  return c.json({ success: true });
});

function parseQuoteRow(row: any): any {
  if (!row) return null;
  return {
    ...row,
    type: toFrontend.type(row.type),
    quote_items: safeParse(row.quote_items, []),
    costing_references: safeParse(row.costing_references, []),
    totals: safeParse(row.totals, null),
  };
}