'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setTokens, clearTokens, getToken } from './api-client';

interface User {
  id: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ requires_approval?: boolean; access_rejected?: boolean }>;
  signUp: (email: string, password: string, display_name?: string) => Promise<{ requires_approval?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  updateUser: (data: { display_name?: string; photo_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return { requires_approval: data.requires_approval, access_rejected: data.access_rejected };
  };

  const signUp = async (email: string, password: string, display_name?: string) => {
    const data = await api.auth.register(email, password, display_name);
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    }
    return { requires_approval: data.requires_approval };
  };

  const signOut = async () => {
    setUser(null);
    clearTokens();
  };

  const signInWithGoogle = async () => {
    const apiBaseUrl = (window as any).__ENV__?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    const clientId = (window as any).__ENV__?.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&access_type=offline`;
    window.location.href = authUrl;
  };

  const signInWithGithub = async () => {
    const clientId = (window as any).__ENV__?.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    window.location.href = authUrl;
  };

  const updateUser = async (data: { display_name?: string; photo_url?: string }) => {
    const result = await api.auth.updateMe(data);
    if (result.user) {
      setUser(result.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, signInWithGithub, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}