const API_BASE_URL = typeof window !== 'undefined'
  ? (window as any).__ENV__?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  noAuth?: boolean;
  tenantId?: string;
}

async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, noAuth = false, tenantId } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!noAuth) {
    let token = getToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  if (tenantId) {
    reqHeaders['X-Tenant-ID'] = tenantId;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !noAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      reqHeaders['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
      }
      return retryRes.json();
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T = any>(path: string, tenantId?: string) => apiRequest<T>(path, { tenantId }),
  post: <T = any>(path: string, body: any, tenantId?: string) => apiRequest<T>(path, { method: 'POST', body, tenantId }),
  put: <T = any>(path: string, body: any, tenantId?: string) => apiRequest<T>(path, { method: 'PUT', body, tenantId }),
  delete: <T = any>(path: string, tenantId?: string) => apiRequest<T>(path, { method: 'DELETE', tenantId }),

  auth: {
    register: (email: string, password: string, display_name?: string) =>
      apiRequest('/api/auth/register', { method: 'POST', body: { email, password, display_name }, noAuth: true }),

    login: (email: string, password: string) =>
      apiRequest('/api/auth/login', { method: 'POST', body: { email, password }, noAuth: true }),

    me: () => api.get('/api/auth/me'),

    updateMe: (data: { display_name?: string; photo_url?: string }) =>
      api.put('/api/auth/me', data),

    oauthGoogle: (code: string) =>
      apiRequest('/api/auth/oauth/google', { method: 'POST', body: { code }, noAuth: true }),

    oauthGithub: (code: string) =>
      apiRequest('/api/auth/oauth/github', { method: 'POST', body: { code }, noAuth: true }),
  },

  admin: {
    getAccessRequests: (status?: string) =>
      api.get(`/api/admin/access-requests${status ? `?status=${status}` : ''}`),
    getUsers: () => api.get('/api/admin/users'),
    approveRequest: (id: string) => api.post(`/api/admin/access-requests/${id}/approve`, {}),
    rejectRequest: (id: string, notes?: string) => api.post(`/api/admin/access-requests/${id}/reject`, { notes }),
    updateUserRole: (id: string, role: string) => api.put(`/api/admin/users/${id}/role`, { role }),
    deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
    getStats: () => api.get('/api/admin/stats'),
    getTenants: () => api.get('/api/admin/tenants'),
    deleteTenant: (id: string) => api.delete(`/api/admin/tenants/${id}`),
  },

  clients: {
    getAll: (tenantId?: string) => api.get('/api/clients', tenantId),
    getById: (id: string, tenantId?: string) => api.get(`/api/clients/${id}`, tenantId),
    getByRUT: (rut: string, tenantId?: string) => api.get(`/api/clients/rut/${rut}`, tenantId),
    create: (data: any, tenantId?: string) => api.post('/api/clients', data, tenantId),
    update: (id: string, data: any, tenantId?: string) => api.put(`/api/clients/${id}`, data, tenantId),
    delete: (id: string, tenantId?: string) => api.delete(`/api/clients/${id}`, tenantId),
  },

  costings: {
    getAll: (tenantId?: string) => api.get('/api/costings', tenantId),
    getById: (id: string, tenantId?: string) => api.get(`/api/costings/${id}`, tenantId),
    create: (data: any, tenantId?: string) => api.post('/api/costings', data, tenantId),
    update: (id: string, data: any, tenantId?: string) => api.put(`/api/costings/${id}`, data, tenantId),
    delete: (id: string, tenantId?: string) => api.delete(`/api/costings/${id}`, tenantId),
  },

  quotes: {
    getAll: (tenantId?: string, status?: string, clientId?: string) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (clientId) params.set('client_id', clientId);
      const qs = params.toString();
      return api.get(`/api/quotes${qs ? `?${qs}` : ''}`, tenantId);
    },
    getById: (id: string, tenantId?: string) => api.get(`/api/quotes/${id}`, tenantId),
    create: (data: any, tenantId?: string) => api.post('/api/quotes', data, tenantId),
    update: (id: string, data: any, tenantId?: string) => api.put(`/api/quotes/${id}`, data, tenantId),
    duplicate: (id: string, tenantId?: string) => api.post(`/api/quotes/${id}/duplicate`, {}, tenantId),
    delete: (id: string, tenantId?: string) => api.delete(`/api/quotes/${id}`, tenantId),
  },

  catalogs: {
    getMaterials: (tenantId?: string) => api.get('/api/catalogs/materials', tenantId),
    saveMaterials: (items: any[], tenantId?: string) => api.post('/api/catalogs/materials', items, tenantId),
    getEquipment: (tenantId?: string) => api.get('/api/catalogs/equipment', tenantId),
    saveEquipment: (items: any[], tenantId?: string) => api.post('/api/catalogs/equipment', items, tenantId),
  },

  settings: {
    get: (tenantId?: string) => api.get('/api/settings', tenantId),
    save: (data: any, tenantId?: string) => api.post('/api/settings', data, tenantId),
    uploadLogo: async (file: File, tenantId?: string) => {
      const formData = new FormData();
      formData.append('logo', file);
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['X-Tenant-ID'] = tenantId;
      delete headers['Content-Type'];

      const res = await fetch(`${API_BASE_URL}/api/settings/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error('Logo upload failed');
      return res.json();
    },
  },

  tenants: {
    create: (name: string, slug: string) => api.post('/api/tenants', { name, slug }),
    getMy: () => api.get('/api/tenants/my'),
    getById: (id: string) => api.get(`/api/tenants/${id}`),
    update: (id: string, data: { name?: string; slug?: string }) => api.put(`/api/tenants/${id}`, data),
    getMembers: (tenantId: string) => api.get(`/api/tenants/${tenantId}/members`),
    addMember: (tenantId: string, userId: string, role: string) => api.post(`/api/tenants/${tenantId}/members`, { user_id: userId, role }),
    updateMemberRole: (tenantId: string, userId: string, role: string) => api.put(`/api/tenants/${tenantId}/members/${userId}`, { role }),
    removeMember: (tenantId: string, userId: string) => api.delete(`/api/tenants/${tenantId}/members/${userId}`),
  },

  invitations: {
    create: (tenantId: string, email: string, role: string, expiresInDays?: number) =>
      api.post('/api/invitations', { tenant_id: tenantId, email, role, expires_in_days: expiresInDays }),
    getByTenant: (tenantId: string) => api.get(`/api/invitations/tenant/${tenantId}`),
    getByToken: (token: string) => api.get(`/api/invitations/token/${token}`),
    accept: (id: string) => api.post(`/api/invitations/${id}/accept`, {}),
    reject: (id: string) => api.post(`/api/invitations/${id}/reject`, {}),
    cancel: (id: string) => api.delete(`/api/invitations/${id}`),
  },
};

export { setTokens, clearTokens, getToken, API_BASE_URL };