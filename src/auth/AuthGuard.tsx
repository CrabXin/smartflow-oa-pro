import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export const AuthGuard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // 简单的占位内容，避免闪烁
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname } }}
      />
    );
  }

  return <Outlet />;
};


