import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { generateId } from '../lib/auth';

export const invitationRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

invitationRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { tenant_id, email, role, expires_in_days } = await c.req.json();

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(tenant_id, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden: Only admins/owners can invite' }, 403);
  }

  const token = crypto.randomUUID();
  const days = expires_in_days || 7;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO invitations (id, tenant_id, email, role, token, status, invited_by, expires_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(id, tenant_id, email, role || 'user', token, userId, expiresAt).run();

  const invitation = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ?').bind(id).first();

  return c.json({ invitation, invite_url: `${c.env.APP_URL}/invite/${token}` }, 201);
});

invitationRoutes.get('/tenant/:tenantId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const tenantId = c.req.param('tenantId');

  const membership = await c.env.DB.prepare(
    'SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(tenantId, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM invitations WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(tenantId).all();

  return c.json({ invitations: results });
});

invitationRoutes.get('/token/:token', optionalAuth, async (c) => {
  const token = c.req.param('token');

  const invitation = await c.env.DB.prepare(
    'SELECT * FROM invitations WHERE token = ?'
  ).bind(token).first();

  if (!invitation) {
    return c.json({ error: 'Invitation not found' }, 404);
  }

  if (new Date(invitation.expires_at as string) < new Date()) {
    await c.env.DB.prepare(
      "UPDATE invitations SET status = 'expired' WHERE id = ?"
    ).bind(invitation.id).run();
    return c.json({ error: 'Invitation expired' }, 410);
  }

  if (invitation.status !== 'pending') {
    return c.json({ error: `Invitation already ${invitation.status}` }, 400);
  }

  return c.json({ invitation });
});

invitationRoutes.post('/:id/accept', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const invitationId = c.req.param('id');

  const invitation = await c.env.DB.prepare(
    'SELECT * FROM invitations WHERE id = ?'
  ).bind(invitationId).first();

  if (!invitation) return c.json({ error: 'Invitation not found' }, 404);
  if (invitation.status !== 'pending') return c.json({ error: 'Invitation already processed' }, 400);
  if (new Date(invitation.expires_at as string) < new Date()) {
    return c.json({ error: 'Invitation expired' }, 410);
  }

  const user = await c.env.DB.prepare(
    'SELECT email FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user || user.email !== invitation.email) {
    return c.json({ error: 'Email does not match invitation' }, 403);
  }

  const existingMembership = await c.env.DB.prepare(
    'SELECT id FROM memberships WHERE tenant_id = ? AND user_id = ?'
  ).bind(invitation.tenant_id, userId).first();

  if (!existingMembership) {
    await c.env.DB.prepare(
      'INSERT INTO memberships (id, tenant_id, user_id, role) VALUES (?, ?, ?, ?)'
    ).bind(generateId(), invitation.tenant_id, userId, invitation.role).run();
  }

  await c.env.DB.prepare(
    "UPDATE invitations SET status = 'accepted' WHERE id = ?"
  ).bind(invitationId).run();

  return c.json({ success: true });
});

invitationRoutes.post('/:id/reject', optionalAuth, async (c) => {
  const invitationId = c.req.param('id');

  await c.env.DB.prepare(
    "UPDATE invitations SET status = 'rejected' WHERE id = ?"
  ).bind(invitationId).run();

  return c.json({ success: true });
});

invitationRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const invitationId = c.req.param('id');

  const invitation = await c.env.DB.prepare(
    'SELECT tenant_id FROM invitations WHERE id = ?'
  ).bind(invitationId).first();

  if (!invitation) return c.json({ error: 'Invitation not found' }, 404);

  const membership = await c.env.DB.prepare(
    "SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ? AND role IN ('owner', 'admin')"
  ).bind(invitation.tenant_id, userId).first();

  const isAdmin = c.get('userRole') === 'admin';
  if (!membership && !isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(invitationId).run();
  return c.json({ success: true });
});