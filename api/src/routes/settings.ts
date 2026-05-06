import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, resolveTenant } from '../middleware/auth';
import { generateId } from '../lib/auth';

export const settingsRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

settingsRoutes.use('/*', authMiddleware, resolveTenant);

settingsRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const settings = await c.env.DB.prepare(
    'SELECT * FROM company_settings WHERE tenant_id = ?'
  ).bind(tenantId).first();

  return c.json({ settings: settings || null });
});

settingsRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT id FROM company_settings WHERE tenant_id = ?'
  ).bind(tenantId).first();

  const fields = [
    'company_name', 'rut', 'address', 'phone', 'email', 'website', 'logo_url',
    'company_giro', 'company_city', 'company_region', 'company_social_media',
    'quoter_name', 'quoter_position', 'quoter_email', 'quoter_phone',
    'bank_account_name', 'bank_account_rut', 'bank_name', 'bank_account_type',
    'bank_account_number', 'bank_email'
  ];

  if (existing) {
    const updates: string[] = [];
    const values: any[] = [];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(tenantId);
      await c.env.DB.prepare(
        `UPDATE company_settings SET ${updates.join(', ')} WHERE tenant_id = ?`
      ).bind(...values).run();
    }
  } else {
    const id = generateId();
    const values = fields.map(f => body[f] !== undefined ? body[f] : '');
    const placeholders = fields.map(() => '?').join(', ');

    await c.env.DB.prepare(
      `INSERT INTO company_settings (id, tenant_id, ${fields.join(', ')}) VALUES (?, ?, ${placeholders})`
    ).bind(id, tenantId, ...values).run();
  }

  const settings = await c.env.DB.prepare(
    'SELECT * FROM company_settings WHERE tenant_id = ?'
  ).bind(tenantId).first();

  return c.json({ settings });
});

settingsRoutes.post('/logo', async (c) => {
  const tenantId = c.get('tenantId');
  if (!tenantId) return c.json({ error: 'No tenant found' }, 400);

  const formData = await c.req.formData();
  const file = formData.get('logo') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const key = `logos/${tenantId}/${Date.now()}-${file.name}`;
  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const logoUrl = `/api/storage/${key}`;

  await c.env.DB.prepare(
    "UPDATE company_settings SET logo_url = ?, updated_at = datetime('now') WHERE tenant_id = ?"
  ).bind(logoUrl, tenantId).run();

  return c.json({ logo_url: logoUrl });
});