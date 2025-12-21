import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetCurrentUser, apiLogout, type LoginPayload } from "@/lib/api";
import type { User } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { userId: string; token: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: apiGetCurrentUser,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const login = async (data: { userId: string; token: string }) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    setToken(data.token);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setToken(null);
      queryClient.clear();
    }
  };

  const hasPermission = (permission: string): boolean => {
    // 如果没有用户，返回 false
    if (!user) {
      return false;
    }

    // 管理员拥有所有权限
    if (user.role === "admin") {
      return true;
    }

    // 这里可以根据实际需求实现权限检查逻辑
    // 例如：从用户对象中获取权限列表，或者根据角色判断
    // 目前简单实现：根据角色判断基本权限
    
    // 可以根据 permission 参数和用户角色进行更细粒度的权限控制
    // 例如：user:add, user:edit, workflow:approve 等
    
    // 暂时返回 true，实际项目中应该从后端获取用户权限列表
    // 或者根据角色映射权限
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

