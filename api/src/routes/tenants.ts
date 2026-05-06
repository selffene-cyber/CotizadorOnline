import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../lib/auth';

export const tenantRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

tenantRoutes.use('/*', authMiddleware);

tenantRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const { name, slug } = await c.req.json();

  if (!name || !slug) {
    return c.json({ error: 'name and slug are required' }, 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM tenants WHERE slug = ?'
  ).bind(slug).first();

  if (existing) {
    return c.json({ error: 'Slug already exists' }, 409);
  }

  const id = generateId();

  await c.env.DB.prepare(
    'INSERT INTO tenants (id, name, slug, created_by) VALUES (?, ?, ?, ?)'
  ).bind(id, name, slug, userId).run();

  await c.env.DB.prepare(
    'INSERT INTO memberships (id, tenant_id, user_id, role) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), id, userId, 'owner').run();

  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
  return c.json({ tenant }, 201);
});

tenantRoutes.get('/my', async (c) => {
  const userId = c.get('userId');

  const { results } = await c.env.DB.prepare(
    `SELECT t.*, m.role as membership_role
     FROM tenants t
     JOIN memberships m ON t.id = m.tenant_id
     WHERE m.user_id = ?
     ORDER BY t.created_at DESC`
  ).bind(userId).all();

  return c.json({ tenants: results });
});

tenantRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const tenantId = c.req.param('id');

  const membership = await c.env.DB.prepare(
    'SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(tenantId, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE id = ?'
  ).bind(tenantId).first();

  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  return c.json({ tenant, membership_role: membership?.role });
});

tenantRoutes.put('/:id', async (c) => {
  const userId = c.get('userId');
  const tenantId = c.req.param('id');
  const { name, slug } = await c.req.json();

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(tenantId, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden: Only admins/owners can update' }, 403);
  }

  if (slug) {
    const existingSlug = await c.env.DB.prepare(
      'SELECT id FROM tenants WHERE slug = ? AND id != ?'
    ).bind(slug, tenantId).first();

    if (existingSlug) {
      return c.json({ error: 'Slug already exists' }, 409);
    }
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (name) { fields.push('name = ?'); values.push(name); }
  if (slug) { fields.push('slug = ?'); values.push(slug); }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(tenantId);
    await c.env.DB.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
  return c.json({ tenant });
});

// ============ MEMBERS ============

tenantRoutes.get('/:id/members', async (c) => {
  const userId = c.get('userId');
  const tenantId = c.req.param('id');

  const membership = await c.env.DB.prepare(
    'SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(tenantId, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT m.id, m.tenant_id, m.user_id, m.role, m.created_at,
            u.email, u.display_name
     FROM memberships m
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.tenant_id = ?
     ORDER BY m.created_at DESC`
  ).bind(tenantId).all();

  return c.json({ members: results });
});

tenantRoutes.post('/:id/members', async (c) => {
  const userId = c.get('userId');
  const tenantId = c.req.param('id');
  const { user_id, role } = await c.req.json();

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(tenantId, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden: Only admins/owners can add members' }, 403);
  }

  const existingMembership = await c.env.DB.prepare(
    'SELECT id FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(tenantId, user_id).first();

  if (existingMembership) {
    return c.json({ error: 'User is already a member' }, 409);
  }

  const id = generateId();
  await c.env.DB.prepare(
    'INSERT INTO memberships (id, tenant_id, user_id, role) VALUES (?, ?, ?, ?)'
  ).bind(id, tenantId, user_id, role || 'user').run();

  return c.json({ success: true, membership: { id, tenant_id: tenantId, user_id, role: role || 'user' } }, 201);
});

tenantRoutes.put('/:id/members/:userId', async (c) => {
  const currentUserId = c.get('userId');
  const tenantId = c.req.param('id');
  const targetUserId = c.req.param('userId');
  const { role } = await c.req.json();

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(tenantId, currentUserId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.DB.prepare(
    "UPDATE memberships SET role = ?, updated_at = datetime('now') WHERE tenant_id = ? AND user_id = ?"
  ).bind(role, tenantId, targetUserId).run();

  return c.json({ success: true });
});

tenantRoutes.delete('/:id/members/:userId', async (c) => {
  const currentUserId = c.get('userId');
  const tenantId = c.req.param('id');
  const targetUserId = c.req.param('userId');

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(tenantId, currentUserId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.DB.prepare(
    'DELETE FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(tenantId, targetUserId).run();

  return c.json({ success: true });
});