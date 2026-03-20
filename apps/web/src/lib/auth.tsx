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

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  examTrack: string;
  timezone?: string;
  region?: string;
  createdAt: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type RegisterData = {
  email: string;
  password: string;
  displayName: string;
  examTrack: string;
  timezone?: string;
  region?: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'mockgame_token';
const REFRESH_TOKEN_KEY = 'mockgame_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const saveSession = useCallback((accessToken: string, refreshToken: string) => {
    setToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      clearSession();
      return null;
    }

    try {
      const resp = await api<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: storedRefreshToken },
        skipAuthRefresh: true,
      });
      saveSession(resp.accessToken, resp.refreshToken);
      return resp.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, saveSession]);

  const fetchUser = useCallback(
    async (accessToken: string) => {
      try {
        const u = await api<User>('/auth/me', { token: accessToken });
        setUser(u);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          return;
        }
        throw err;
      }
    },
    [clearSession],
  );

  useEffect(() => {
    configureApiAuth({
      getToken: () => token,
      refreshSession,
      onAuthFailure: clearSession,
    });

    return () => {
      configureApiAuth(null);
    };
  }, [token, refreshSession, clearSession]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    fetchUser(storedToken)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const resp = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthRefresh: true,
      });
      saveSession(resp.accessToken, resp.refreshToken);
      await fetchUser(resp.accessToken);
    },
    [saveSession, fetchUser],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const resp = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: data,
        skipAuthRefresh: true,
      });
      saveSession(resp.accessToken, resp.refreshToken);
      await fetchUser(resp.accessToken);
    },
    [saveSession, fetchUser],
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
        // Client-side session should still be cleared even if API call fails.
      }
    }
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem(TOKEN_KEY);
    if (!activeToken) return;
    await fetchUser(activeToken);
  }, [token, fetchUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
