import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";

interface PermissionProps {
  /** 权限编码，如 user:add、workflow:approve */
  value: string | string[];
  /** 有权限时渲染的内容 */
  children: ReactNode;
  /** 可选：无权限时显示的占位内容，默认不渲染任何东西 */
  fallback?: ReactNode;
}

export const Permission = ({ value, children, fallback = null }: PermissionProps) => {
  const { hasPermission } = useAuth();

  const codes = Array.isArray(value) ? value : [value];
  const allowed = codes.some((code) => hasPermission(code));

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
