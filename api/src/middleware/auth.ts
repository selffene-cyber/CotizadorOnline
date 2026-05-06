import { Context } from 'hono';
import { verifyToken } from '../lib/auth';
import type { Env } from '../types';

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

export async function authMiddleware(c: Context<AppBindings>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  c.set('userId', payload.sub);
  c.set('userEmail', payload.email || '');
  c.set('userRole', payload.role || 'user');
  
  await next();
}

export async function optionalAuth(c: Context<AppBindings>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (payload && payload.type === 'access') {
      c.set('userId', payload.sub);
      c.set('userEmail', payload.email || '');
      c.set('userRole', payload.role || 'user');
    }
  }
  
  await next();
}

export async function requireAdmin(c: Context<AppBindings>, next: () => Promise<void>) {
  const userRole = c.get('userRole');
  
  if (userRole !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  
  await next();
}

export async function resolveTenant(c: Context<AppBindings>, next: () => Promise<void>) {
  const userId = c.get('userId');
  const tenantId = c.req.query('tenant_id') || c.req.header('X-Tenant-ID');

  if (!tenantId) {
    const result = await c.env.DB.prepare(
      'SELECT tenant_id FROM memberships WHERE user_id = ? LIMIT 1'
    ).bind(userId).first();
    
    if (result) {
      c.set('tenantId', result.tenant_id as string);
    }
    await next();
    return;
  }

  const membership = await c.env.DB.prepare(
    'SELECT tenant_id, role FROM memberships WHERE tenant_id = ? AND user_id = ? LIMIT 1'
  ).bind(tenantId, userId).first();

  if (!membership && c.get('userRole') !== 'admin') {
    return c.json({ error: 'Forbidden: Not a member of this tenant' }, 403);
  }

  c.set('tenantId', tenantId);
  c.set('tenantRole', membership?.role as string);
  
  await next();
}