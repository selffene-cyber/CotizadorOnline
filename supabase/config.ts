import { api, setTokens, clearTokens, getToken, API_BASE_URL } from '@/lib/api-client';

export { api, setTokens, clearTokens, getToken, API_BASE_URL };

export function hasValidSupabaseConfig(): boolean {
  return !!API_BASE_URL;
}

export const supabase = {
  auth: {
    getUser: async () => {
      try {
        const data = await api.auth.me();
        return { data: { user: data.user }, error: null };
      } catch {
        return { data: { user: null }, error: new Error('Not authenticated') };
      }
    },
    getSession: async () => {
      const token = getToken();
      if (!token) return { data: { session: null }, error: null };
      try {
        const data = await api.auth.me();
        return {
          data: {
            session: {
              access_token: token,
              user: data.user,
            },
          },
          error: null,
        };
      } catch {
        return { data: { session: null }, error: null };
      }
    },
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => {
      throw new Error('Use api.auth.login() instead');
    },
    signUp: async () => {
      throw new Error('Use api.auth.register() instead');
    },
    signOut: async () => {
      clearTokens();
    },
  },
  from: () => {
    throw new Error('Direct Supabase queries are no longer supported. Use api-client instead.');
  },
  rpc: () => {
    throw new Error('Supabase RPC is no longer supported. Use api-client instead.');
  },
  functions: {
    invoke: () => {
      throw new Error('Supabase Edge Functions are no longer supported. Use api-client instead.');
    },
  },
};

export function createSupabaseClient() {
  return supabase;
}