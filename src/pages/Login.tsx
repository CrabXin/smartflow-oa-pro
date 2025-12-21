import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileCheck } from "lucide-react";
import { apiLogin, type LoginPayload } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => apiLogin(payload),
    onSuccess: async (data) => {
      await login({ userId: data.userId, token: data.token });
      const state = location.state as LocationState | null;
      const redirectTo =
        state?.from?.pathname && state.from.pathname !== "/login"
          ? state.from.pathname
          : "/";
      toast.success("登录成功");
      navigate(redirectTo, { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        (error as Error)?.message?.slice(0, 200) ||
        "登录失败，请检查用户名和密码";
      toast.error(message);
    },
  });

  // 已登录用户访问 /login 时自动跳转到首页
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("请输入用户名和密码");
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">SmartFlow OA 登录</CardTitle>
              <CardDescription className="mt-1">
                请输入账号和密码进入系统
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "登录中..." : "登录"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              如首次使用，请联系管理员开通账户
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


