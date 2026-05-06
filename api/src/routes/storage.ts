import { Hono } from 'hono';
import type { Env } from '../types';

export const storageRoutes = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userEmail: string; userRole: string; tenantId: string; tenantRole: string; };
}>();

storageRoutes.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');

  const object = await c.env.STORAGE.get(key);
  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, { headers });
});