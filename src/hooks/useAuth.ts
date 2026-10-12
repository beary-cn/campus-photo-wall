import { useCallback, useMemo } from "react";

export function useAuth() {
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("mc_user");
    window.location.reload();
  }, []);

  return useMemo(
    () => ({
      user: null as any,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      logout,
      refresh: () => Promise.resolve(),
    }),
    [logout],
  );
}
