'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, configureApiAuth } from './api';

type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'mockgame_admin_token';
const REFRESH_TOKEN_KEY = 'mockgame_admin_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const saveAuth = useCallback((accessToken: string, refreshToken: string) => {
    setToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearAuth();
      return null;
    }

    try {
      const response = await api<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipAuthRefresh: true,
      });
      saveAuth(response.accessToken, response.refreshToken);
      return response.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, saveAuth]);

  const fetchMe = useCallback(
    async (accessToken: string) => {
      try {
        const me = await api<User>('/auth/me', { token: accessToken });
        if (me.role !== 'ADMIN') {
          throw new Error('Admin role required');
        }
        setUser(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          return;
        }
        clearAuth();
        throw err;
      }
    },
    [clearAuth],
  );

  useEffect(() => {
    configureApiAuth({
      getToken: () => token,
      refreshSession,
      onAuthFailure: clearAuth,
    });

    return () => {
      configureApiAuth(null);
    };
  }, [token, refreshSession, clearAuth]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    fetchMe(storedToken)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthRefresh: true,
      });

      saveAuth(response.accessToken, response.refreshToken);
      await fetchMe(response.accessToken);
    },
    [fetchMe, saveAuth],
  );

  const logout = useCallback(async () => {
    const activeToken = localStorage.getItem(TOKEN_KEY);
    if (activeToken) {
      try {
        await api('/auth/logout', {
          method: 'POST',
          token: activeToken,
          skipAuthRefresh: true,
        });
      } catch {
        // Client-side clear should still happen on network/API failure.
      }
    }
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
