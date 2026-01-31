import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types/account';

const API_URL = import.meta.env.VITE_ACCOUNT_API || 'http://localhost:3001';

// Tablet-specific API instance with admin JWT authentication
const tabletApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Inject admin token (for tablet access) and resident token on every request
tabletApi.interceptors.request.use((config) => {
  // First priority: resident token (when resident is authenticated)
  const residentToken = localStorage.getItem('resident_token');
  if (residentToken) {
    config.headers.Authorization = `Bearer ${residentToken}`;
    return config;
  }

  // Second priority: admin token (for tablet setup/access)
  const adminToken = localStorage.getItem('tablet_admin_token');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

// Response interceptor for token refresh
tabletApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await tabletApi.post<{ token: string }>('/api/auth/refresh');
        localStorage.setItem('resident_token', data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return tabletApi(originalRequest);
      } catch {
        // Refresh failed - clear resident session
        localStorage.removeItem('resident_token');
        localStorage.removeItem('resident_user');
        // Redirect to profile select
        window.location.href = '/resident';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) {
    const apiError = err.response.data as ApiError;
    const error = new Error(apiError.error.message) as Error & { code?: string };
    error.code = apiError.error.code;
    throw error;
  }
  throw err;
}

// Types for tablet endpoints
export interface TabletUser {
  id: string;
  username: string;
}

export interface TabletSessionResponse {
  tabletId: string;
  unitId: string;
  loggedInUsers: TabletUser[];
}

export interface PinVerifyResponse {
  token: string;
  user: {
    id: string;
    username: string;
    unitId: string | null;
  };
}

export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// Admin login for tablet access
export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  try {
    const { data } = await axios.post<AdminLoginResponse>(
      `${API_URL}/api/auth/login`,
      { username, password }
    );
    return data;
  } catch (err) {
    return handleError(err);
  }
}

// Get logged-in users for this tablet (requires admin JWT)
export async function getTabletSessions(tabletId: string): Promise<TabletSessionResponse> {
  try {
    const { data } = await tabletApi.get<TabletSessionResponse>(
      `/api/tablets/${tabletId}/sessions`
    );
    return data;
  } catch (err) {
    return handleError(err);
  }
}

// Verify resident PIN (requires admin JWT)
export async function verifyPin(
  tabletId: string,
  userId: string,
  pin: string
): Promise<PinVerifyResponse> {
  try {
    const { data } = await tabletApi.post<PinVerifyResponse>(
      `/api/tablets/${tabletId}/verify-pin`,
      { userId, pin }
    );
    return data;
  } catch (err) {
    return handleError(err);
  }
}

// Refresh the resident's access token
export async function refreshResidentToken(): Promise<{ token: string }> {
  try {
    const { data } = await tabletApi.post<{ token: string }>('/api/auth/refresh');
    return data;
  } catch (err) {
    return handleError(err);
  }
}

// Configuration helpers - stores admin token for tablet access
export interface TabletConfig {
  tabletId: string;
  adminToken: string;
  adminUsername: string;
}

export function getTabletConfig(): TabletConfig | null {
  const tabletId = localStorage.getItem('tablet_id');
  const adminToken = localStorage.getItem('tablet_admin_token');
  const adminUsername = localStorage.getItem('tablet_admin_username');

  if (!tabletId || !adminToken) {
    return null;
  }

  return { tabletId, adminToken, adminUsername: adminUsername || '' };
}

export function setTabletConfig(tabletId: string, adminToken: string, adminUsername: string): void {
  localStorage.setItem('tablet_id', tabletId);
  localStorage.setItem('tablet_admin_token', adminToken);
  localStorage.setItem('tablet_admin_username', adminUsername);
}

export function clearTabletConfig(): void {
  localStorage.removeItem('tablet_id');
  localStorage.removeItem('tablet_admin_token');
  localStorage.removeItem('tablet_admin_username');
}

export function getResidentSession(): { token: string; user: TabletUser } | null {
  const token = localStorage.getItem('resident_token');
  const userStr = localStorage.getItem('resident_user');

  if (!token || !userStr) {
    return null;
  }

  try {
    const user = JSON.parse(userStr) as TabletUser;
    return { token, user };
  } catch {
    return null;
  }
}

export function setResidentSession(token: string, user: TabletUser): void {
  localStorage.setItem('resident_token', token);
  localStorage.setItem('resident_user', JSON.stringify(user));
}

export function clearResidentSession(): void {
  localStorage.removeItem('resident_token');
  localStorage.removeItem('resident_user');
}
