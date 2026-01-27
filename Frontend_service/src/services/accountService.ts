import axios, { AxiosError } from 'axios';
import type {
  User,
  Unit,
  TabletSession,
  ApiError,
  LoginResponse,
  CreateUserPayload,
  UpdateUserPayload,
  CreateUnitPayload,
  UpdateUnitPayload,
  RegisterTabletPayload,
  RegisterTabletResponse,
} from '../types/account';

const API_URL = import.meta.env.VITE_ACCOUNT_API || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post<{ token: string }>('/api/auth/refresh');

        localStorage.setItem('auth_token', data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) {
    const apiError = err.response.data as ApiError;
    throw new Error(apiError.error.message);
  }
  throw err;
}

// Auth
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/api/auth/login', { username, password });
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getMe(): Promise<{ user: User }> {
  try {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout');
  } catch (err) {
    return handleError(err);
  }
}

export async function refresh(): Promise<{ token: string }> {
  try {
    const { data } = await api.post<{ token: string }>('/api/auth/refresh');
    return data;
  } catch (err) {
    return handleError(err);
  }
}

// Users
export async function listUsers(filters?: { role?: string; unitId?: string; isActive?: boolean }): Promise<User[]> {
  try {
    const { data } = await api.get<User[]>('/api/users', { params: filters });
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getUser(userId: string): Promise<User> {
  try {
    const { data } = await api.get<User>(`/api/users/${userId}`);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const { data } = await api.post<User>('/api/users', payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function createStaffOrAdmin(payload: { username: string; email?: string; password: string; role: 'admin' | 'staff' }): Promise<User> {
  try {
    const { data } = await api.post<User>('/api/users/staff', payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  try {
    const { data } = await api.patch<User>(`/api/users/${userId}`, payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await api.delete(`/api/users/${userId}`);
  } catch (err) {
    return handleError(err);
  }
}

// Units
export async function listUnits(filters?: { isActive?: boolean }): Promise<Unit[]> {
  try {
    const { data } = await api.get<Unit[]>('/api/units', { params: filters });
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getUnit(unitId: string): Promise<Unit> {
  try {
    const { data } = await api.get<Unit>(`/api/units/${unitId}`);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function createUnit(payload: CreateUnitPayload): Promise<Unit> {
  try {
    const { data } = await api.post<Unit>('/api/units', payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function updateUnit(unitId: string, payload: UpdateUnitPayload): Promise<Unit> {
  try {
    const { data } = await api.patch<Unit>(`/api/units/${unitId}`, payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteUnit(unitId: string): Promise<void> {
  try {
    await api.delete(`/api/units/${unitId}`);
  } catch (err) {
    return handleError(err);
  }
}

// Tablets
export async function listTablets(): Promise<TabletSession[]> {
  try {
    const { data } = await api.get<TabletSession[]>('/api/tablets');
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function registerTablet(payload: RegisterTabletPayload): Promise<RegisterTabletResponse> {
  try {
    const { data } = await api.post<RegisterTabletResponse>('/api/tablets/register', payload);
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function loginResident(tabletId: string, userId: string): Promise<TabletSession> {
  try {
    const { data } = await api.post<TabletSession>(`/api/tablets/${tabletId}/login`, { userId });
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function logoutResident(tabletId: string, userId: string): Promise<TabletSession> {
  try {
    const { data } = await api.post<TabletSession>(`/api/tablets/${tabletId}/logout`, { userId });
    return data;
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteTablet(tabletId: string): Promise<void> {
  try {
    await api.delete(`/api/tablets/${tabletId}`);
  } catch (err) {
    return handleError(err);
  }
}
