import { Hono } from 'hono';
import type { Env } from '../types';
import { generateId, hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken } from '../lib/auth';

export const authRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

authRoutes.post('/register', async (c) => {
  const { email, password, display_name } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const id = generateId();
  const passwordHash = await hashPassword(password);
  const displayName = display_name || email;

  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, passwordHash, displayName, 'user').run();

  await c.env.DB.prepare(
    'INSERT INTO access_requests (id, user_id, email, status) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), id, email, 'pending').run();

  const accessToken = generateAccessToken(id, email, 'user');
  const refreshToken = generateRefreshToken(id);

  return c.json({
    user: { id, email, display_name: displayName, role: 'user' },
    access_token: accessToken,
    refresh_token: refreshToken,
    requires_approval: true,
  }, 201);
});

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash, display_name, role FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user || !(await comparePassword(password, user.password_hash as string))) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const accessRequest = await c.env.DB.prepare(
    'SELECT status FROM access_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1'
  ).bind(user.id).first();

  if (accessRequest && accessRequest.status === 'pending') {
    return c.json({ error: 'Your account is pending approval', requires_approval: true }, 403);
  }

  if (accessRequest && accessRequest.status === 'rejected') {
    return c.json({ error: 'Your access request was rejected', access_rejected: true }, 403);
  }

  const hasTenant = await c.env.DB.prepare(
    'SELECT tenant_id FROM memberships WHERE user_id = ? LIMIT 1'
  ).bind(user.id).first();

  const accessToken = generateAccessToken(user.id as string, user.email as string, user.role as string);
  const refreshToken = generateRefreshToken(user.id as string);

  return c.json({
    user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role },
    access_token: accessToken,
    refresh_token: refreshToken,
    has_tenant: !!hasTenant,
  });
});

authRoutes.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json();

  if (!refresh_token) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  const payload = verifyToken(refresh_token);
  if (!payload || payload.type !== 'refresh') {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, display_name, role FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const accessToken = generateAccessToken(user.id as string, user.email as string, user.role as string);
  const newRefreshToken = generateRefreshToken(user.id as string);

  return c.json({
    access_token: accessToken,
    refresh_token: newRefreshToken,
  });
});

authRoutes.post('/oauth/google', async (c) => {
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: 'Authorization code required' }, 400);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const appUrl = c.env.APP_URL || 'https://cot.piwisuite.cl';

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    return c.json({ error: 'Failed to exchange Google authorization code' }, 400);
  }

  const tokenData = await tokenResponse.json() as any;
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = await userInfoResponse.json() as any;

  if (!googleUser.email) {
    return c.json({ error: 'Failed to get Google user info' }, 400);
  }

  return c.json(await handleOAuthUser(c, 'google', googleUser.id, googleUser.email, googleUser.name || googleUser.email, googleUser.picture));
});

authRoutes.post('/oauth/github', async (c) => {
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: 'Authorization code required' }, 400);
  }

  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!tokenResponse.ok) {
    return c.json({ error: 'Failed to exchange GitHub authorization code' }, 400);
  }

  const tokenData = await tokenResponse.json() as any;
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userResponse.json() as any;

  if (!githubUser.email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = await emailsResponse.json() as any[];
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    githubUser.email = primaryEmail;
  }

  if (!githubUser.email) {
    return c.json({ error: 'Failed to get GitHub user email' }, 400);
  }

  return c.json(await handleOAuthUser(c, 'github', String(githubUser.id), githubUser.email, githubUser.name || githubUser.login, githubUser.avatar_url));
});

async function handleOAuthUser(c: any, provider: string, providerAccountId: string, email: string, displayName: string, photoUrl?: string) {
  const existingOAuth = await c.env.DB.prepare(
    'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?'
  ).bind(provider, providerAccountId).first();

  let userId: string;

  if (existingOAuth) {
    userId = existingOAuth.user_id as string;
  } else {
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      userId = existingUser.id as string;
    } else {
      userId = generateId();
      const dummyHash = await hashPassword(crypto.randomUUID());
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, display_name, photo_url, role) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, email, dummyHash, displayName, photoUrl || null, 'user').run();

      await c.env.DB.prepare(
        'INSERT INTO access_requests (id, user_id, email, status) VALUES (?, ?, ?, ?)'
      ).bind(generateId(), userId, email, 'pending').run();
    }

    await c.env.DB.prepare(
      'INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id) VALUES (?, ?, ?, ?)'
    ).bind(generateId(), userId, provider, providerAccountId).run();
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, display_name, role FROM users WHERE id = ?'
  ).bind(userId).first();

  const accessRequest = await c.env.DB.prepare(
    'SELECT status FROM access_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1'
  ).bind(userId).first();

  const hasTenant = await c.env.DB.prepare(
    'SELECT tenant_id FROM memberships WHERE user_id = ? LIMIT 1'
  ).bind(userId).first();

  const accessToken = generateAccessToken(userId, email, user?.role as string || 'user');
  const refreshToken = generateRefreshToken(userId);

  return {
    user: { id: userId, email, display_name: user?.display_name || displayName, role: user?.role || 'user' },
    access_token: accessToken,
    refresh_token: refreshToken,
    requires_approval: accessRequest?.status === 'pending',
    access_rejected: accessRequest?.status === 'rejected',
    has_tenant: !!hasTenant,
  };
}

authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const payload = verifyToken(authHeader.substring(7));
  if (!payload || payload.type !== 'access') {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, display_name, photo_url, role FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const membership = await c.env.DB.prepare(
    'SELECT m.tenant_id, m.role, t.name as tenant_name, t.slug as tenant_slug FROM memberships m JOIN tenants t ON m.tenant_id = t.id WHERE m.user_id = ? LIMIT 1'
  ).bind(payload.sub).first();

  const accessRequest = await c.env.DB.prepare(
    'SELECT status FROM access_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1'
  ).bind(payload.sub).first();

  return c.json({
    user,
    membership: membership || null,
    access_request_status: accessRequest?.status || null,
  });
});

authRoutes.put('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const payload = verifyToken(authHeader.substring(7));
  if (!payload || payload.type !== 'access') {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const { display_name, photo_url } = await c.req.json();

  const updates: string[] = [];
  const values: any[] = [];

  if (display_name !== undefined) {
    updates.push('display_name = ?');
    values.push(display_name);
  }
  if (photo_url !== undefined) {
    updates.push('photo_url = ?');
    values.push(photo_url);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(payload.sub);

  await c.env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const user = await c.env.DB.prepare(
    'SELECT id, email, display_name, photo_url, role FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  return c.json({ user });
});