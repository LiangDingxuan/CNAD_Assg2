import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import * as tabletService from '../services/tabletService';
import type { TabletConfig } from '../services/tabletService';

export interface TabletUser {
  id: string;
  username: string;
}

interface TabletAuthState {
  // Tablet config (admin token + tablet ID)
  tabletConfig: TabletConfig | null;
  // Currently authenticated resident
  currentUser: TabletUser | null;
  token: string | null;
  // Available profiles on this tablet
  loggedInUsers: TabletUser[];
  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;
  // Errors
  error: string | null;
}

interface TabletAuthContextValue extends TabletAuthState {
  // Setup tablet with admin credentials
  configureTablet: (tabletId: string, adminToken: string, adminUsername: string) => void;
  // Clear tablet configuration
  clearConfig: () => void;
  // Fetch available profiles
  refreshProfiles: () => Promise<void>;
  // Authenticate with PIN
  verifyPin: (userId: string, pin: string) => Promise<boolean>;
  // Clear current user session (back to profile select)
  clearSession: () => void;
  // Clear error
  clearError: () => void;
}

const TabletAuthContext = createContext<TabletAuthContextValue | null>(null);

export function TabletAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TabletAuthState>({
    tabletConfig: tabletService.getTabletConfig(),
    currentUser: null,
    token: null,
    loggedInUsers: [],
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize: load saved session and fetch profiles
  useEffect(() => {
    const init = async () => {
      const config = tabletService.getTabletConfig();
      const session = tabletService.getResidentSession();

      if (!config) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        return;
      }

      // Fetch available profiles
      try {
        const data = await tabletService.getTabletSessions(config.tabletId);
        setState((prev) => ({
          ...prev,
          tabletConfig: config,
          loggedInUsers: data.loggedInUsers,
          currentUser: session?.user || null,
          token: session?.token || null,
          isAuthenticated: !!session,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          tabletConfig: config,
          error: err instanceof Error ? err.message : 'Failed to load profiles',
          isLoading: false,
        }));
      }
    };

    init();
  }, []);

  const configureTablet = useCallback((tabletId: string, adminToken: string, adminUsername: string) => {
    tabletService.setTabletConfig(tabletId, adminToken, adminUsername);
    setState((prev) => ({
      ...prev,
      tabletConfig: { tabletId, adminToken, adminUsername },
    }));
  }, []);

  const clearConfig = useCallback(() => {
    tabletService.clearTabletConfig();
    tabletService.clearResidentSession();
    setState((prev) => ({
      ...prev,
      tabletConfig: null,
      currentUser: null,
      token: null,
      loggedInUsers: [],
      isAuthenticated: false,
      error: null,
    }));
  }, []);

  const refreshProfiles = useCallback(async () => {
    const config = state.tabletConfig || tabletService.getTabletConfig();
    if (!config) {
      setState((prev) => ({
        ...prev,
        error: 'Tablet not configured',
      }));
      return;
    }

    try {
      const data = await tabletService.getTabletSessions(config.tabletId);
      setState((prev) => ({
        ...prev,
        loggedInUsers: data.loggedInUsers,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load profiles',
      }));
    }
  }, [state.tabletConfig]);

  const verifyPin = useCallback(
    async (userId: string, pin: string): Promise<boolean> => {
      const config = state.tabletConfig || tabletService.getTabletConfig();
      if (!config) {
        setState((prev) => ({
          ...prev,
          error: 'Tablet not configured',
        }));
        return false;
      }

      try {
        const response = await tabletService.verifyPin(config.tabletId, userId, pin);

        // Save session
        const user: TabletUser = {
          id: response.user.id,
          username: response.user.username,
        };
        tabletService.setResidentSession(response.token, user);

        setState((prev) => ({
          ...prev,
          currentUser: user,
          token: response.token,
          isAuthenticated: true,
          error: null,
        }));

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'PIN verification failed';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return false;
      }
    },
    [state.tabletConfig]
  );

  const clearSession = useCallback(() => {
    tabletService.clearResidentSession();
    setState((prev) => ({
      ...prev,
      currentUser: null,
      token: null,
      isAuthenticated: false,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <TabletAuthContext.Provider
      value={{
        ...state,
        configureTablet,
        clearConfig,
        refreshProfiles,
        verifyPin,
        clearSession,
        clearError,
      }}
    >
      {children}
    </TabletAuthContext.Provider>
  );
}

export function useTabletAuth() {
  const context = useContext(TabletAuthContext);
  if (!context) {
    throw new Error('useTabletAuth must be used within a TabletAuthProvider');
  }
  return context;
}
