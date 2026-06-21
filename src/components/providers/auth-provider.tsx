"use client";

import * as React from "react";

import { getSession, login as loginService, logout as logoutService } from "@/lib/services/auth-service";
import type { Role, SessionUser } from "@/lib/types";

interface AuthContextValue {
  session: SessionUser | null;
  loading: boolean;
  login: (values: { identifier: string; password: string; role: Role }) => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: React.ReactNode;
  initialSession?: SessionUser | null;
}) {
  const [session, setSession] = React.useState<SessionUser | null>(initialSession);
  const [loading, setLoading] = React.useState(false);

  const refreshSession = React.useCallback(() => {
    setLoading(true);
    return getSession()
      .then((nextSession) => {
        setSession(nextSession);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = React.useCallback(
    async (values: { identifier: string; password: string; role: Role }) => {
      const result = await loginService(values);
      setSession(result.session);
      return { redirectTo: result.redirectTo };
    },
    [],
  );

  const logout = React.useCallback(() => {
    return logoutService().finally(() => {
      setSession(null);
    });
  }, []);

  React.useEffect(() => {
    setSession(initialSession);
    setLoading(false);
  }, [initialSession]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
