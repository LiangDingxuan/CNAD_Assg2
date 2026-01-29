import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as accountService from '../services/accountService';
import type { User } from '../types/account';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<{ role: string } | undefined>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { user } = await accountService.getMe();
      setState({ user, token: storedToken, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  const login = async (username: string, password: string) => {
    const response = await accountService.login(username, password);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    setState({
      user: response.user as User,
      token: response.token,
      isLoading: false,
      isAuthenticated: true,
    });
    return response.user;
  };

  const logout = async () => {
    try {
      await accountService.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
