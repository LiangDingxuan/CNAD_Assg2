export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'admin' | 'resident';
  unitId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  unitNumber: string;
  floor: number | null;
  block: string | null;
  isActive: boolean;
}

export interface TabletSession {
  tabletId: string;
  unitId: string | null;
  unitNumber: string | null;
  deviceSecret?: string;
  loggedInUsers: { id: string; username: string }[];
}

export interface ApiError {
  error: { code: string; message: string };
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'resident';
    unitId: string | null;
  };
}

export interface CreateUserPayload {
  username: string;
  email?: string;
  role: 'admin' | 'resident';
  password?: string;
  pin?: string;
  unitId?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  pin?: string;
  unitId?: string;
  isActive?: boolean;
}

export interface CreateUnitPayload {
  unitNumber: string;
  floor?: number;
  block?: string;
}

export interface UpdateUnitPayload {
  unitNumber?: string;
  floor?: number;
  block?: string;
  isActive?: boolean;
}

export interface RegisterTabletPayload {
  tabletId: string;
  unitId: string;
}

export interface RegisterTabletResponse {
  tabletId: string;
  unitId: string;
  deviceSecret: string;
}
