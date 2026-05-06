import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, requireAdmin, resolveTenant } from '../middleware/auth';
import { generateId } from '../lib/auth';

export const adminRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

adminRoutes.use('/*', authMiddleware, requireAdmin);

adminRoutes.get('/access-requests', async (c) => {
  const status = c.req.query('status');
  
  let query = 'SELECT * FROM access_requests';
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY requested_at DESC';
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ requests: results });
});

adminRoutes.get('/users', async (c) => {
  const { results: users } = await c.env.DB.prepare(
    'SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC'
  ).all();

  const { results: requests } = await c.env.DB.prepare(
    'SELECT * FROM access_requests'
  ).all();

  const usersWithRequests = users.map((user: any) => {
    const accessRequest = requests.find((r: any) => r.user_id === user.id);
    return { ...user, access_request: accessRequest || null };
  });

  return c.json({ users: usersWithRequests });
});

adminRoutes.post('/access-requests/:id/approve', async (c) => {
  const requestId = c.req.param('id');
  const reviewerId = c.get('userId');

  const request = await c.env.DB.prepare(
    'SELECT user_id, email FROM access_requests WHERE id = ?'
  ).bind(requestId).first();

  if (!request) {
    return c.json({ error: 'Access request not found' }, 404);
  }

  await c.env.DB.prepare(
    'UPDATE users SET role = ? WHERE id = ?'
  ).bind('user', request.user_id).run();

  await c.env.DB.prepare(
    "UPDATE access_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?"
  ).bind(reviewerId, requestId).run();

  return c.json({ success: true });
});

adminRoutes.post('/access-requests/:id/reject', async (c) => {
  const requestId = c.req.param('id');
  const reviewerId = c.get('userId');
  const { notes } = await c.req.json();

  const request = await c.env.DB.prepare(
    'SELECT email FROM access_requests WHERE id = ?'
  ).bind(requestId).first();

  if (!request) {
    return c.json({ error: 'Access request not found' }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE access_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), notes = ? WHERE id = ?"
  ).bind(reviewerId, notes || null, requestId).run();

  return c.json({ success: true });
});

adminRoutes.put('/users/:id/role', async (c) => {
  const userId = c.req.param('id');
  const { role } = await c.req.json();

  if (!['admin', 'user'].includes(role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run();
  return c.json({ success: true });
});

adminRoutes.delete('/users/:id', async (c) => {
  const userId = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM memberships WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM access_requests WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return c.json({ success: true });
});

adminRoutes.get('/stats', async (c) => {
  const { total: totalUsers } = await c.env.DB.prepare('SELECT COUNT(*) as total FROM users').first() as any;
  const { total: totalTenants } = await c.env.DB.prepare('SELECT COUNT(*) as total FROM tenants').first() as any;
  const { total: pendingRequests } = await c.env.DB.prepare("SELECT COUNT(*) as total FROM access_requests WHERE status = 'pending'").first() as any;

  return c.json({ totalUsers, totalTenants, pendingRequests });
});

adminRoutes.get('/tenants', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT t.*, (SELECT COUNT(*) FROM memberships WHERE tenant_id = t.id) as member_count FROM tenants t ORDER BY t.created_at DESC'
  ).all();

  return c.json({ tenants: results });
});

adminRoutes.delete('/tenants/:id', async (c) => {
  const tenantId = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(tenantId).run();
  return c.json({ success: true });
});