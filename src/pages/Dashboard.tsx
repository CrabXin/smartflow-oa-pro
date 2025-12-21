import { useEffect, useState } from "react";
import {
  FileCheck,
  Calendar,
  Bell,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import type { Meeting, Notification } from "@/data/mockData";
import {
  apiGetDashboardStats,
  apiGetDashboardRecentWorkflows,
  apiGetTodayMeetings,
  apiGetDashboardRecentNotifications,
  apiGetCurrentUser,
  type DashboardStats,
  type DashboardTask,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";

/**
 * API 接口:
 * GET /api/dashboard/stats - 获取仪表盘统计数据
 * 返回数据格式: {
 *   pendingApprovals: number,
 *   todayMeetings: number,
 *   unreadNotifications: number,
 *   totalEmployees: number,
 *   monthlyWorkflows: number,
 *   approvalRate: number
 * }
 *
 * GET /api/dashboard/recent-workflows - 获取最近流程
 * GET /api/dashboard/today-meetings - 获取今日会议
 * GET /api/dashboard/recent-notifications - 获取最近通知
 */

const workflowTypeMap: Record<string, string> = {
  leave: "请假",
  expense: "报销",
  procurement: "采购",
  travel: "出差",
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "待审批", variant: "default" },
  processing: { label: "审批中", variant: "secondary" },
  approved: { label: "已通过", variant: "outline" },
  rejected: { label: "已驳回", variant: "destructive" },
};

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingApprovals: 0,
    todayMeetings: 0,
    unreadNotifications: 0,
    totalEmployees: 0,
    monthlyWorkflows: 0,
    approvalRate: 0,
  });
  const [workflows, setWorkflows] = useState<DashboardTask[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: apiGetCurrentUser,
    enabled: !!authUser,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const [statsRes, workflowsRes, meetingsRes, notificationsRes] =
        await Promise.all([
          apiGetDashboardStats(),
          apiGetDashboardRecentWorkflows(5),
          apiGetTodayMeetings(todayStr),
          apiGetDashboardRecentNotifications(3),
        ]);
      setStats(statsRes);
      setWorkflows(workflowsRes);
      setTodayMeetings(meetingsRes);
      setRecentNotifications(notificationsRes);
      setError(null);
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "加载仪表盘数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await loadData();
    toast.success("数据已刷新");
  };

  // DashboardTask 不包含 status，所以显示所有返回的流程
  const pendingWorkflows = workflows;

  const statCards = [
    {
      title: "待审批",
      value: stats.pendingApprovals,
      icon: FileCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/workflow",
    },
    {
      title: "今日会议",
      value: stats.todayMeetings || todayMeetings.length,
      icon: Calendar,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      href: "/meetings",
    },
    {
      title: "未读通知",
      value: stats.unreadNotifications,
      icon: Bell,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      href: "/notifications",
    },
    {
      title: "员工总数",
      value: stats.totalEmployees,
      icon: Users,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      href: "/users",
    },
  ];

  const today = new Date();
  const dateText = `${today.getFullYear()}年${
    today.getMonth() + 1
  }月${today.getDate()}日`;
  const weekMap = ["日", "一", "二", "三", "四", "五", "六"];
  const weekdayText = `星期${weekMap[today.getDay()]}`;

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 via-chart-1/10 to-chart-2/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              早上好，{currentUser?.name ?? authUser?.name ?? "用户"}！
            </h2>
            <p className="mt-1 text-muted-foreground">
              今天是 {dateText}，{weekdayText}。您有 {stats.pendingApprovals}{" "}
              个待审批任务。
            </p>
            {loading && (
              <p className="mt-1 text-xs text-muted-foreground">
                正在加载最新数据...
              </p>
            )}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Monthly overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            本月概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* 流程处理量 - 柱状图 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  流程处理量
                </span>
                <span className="text-sm font-medium">
                  {stats.monthlyWorkflows} 个
                </span>
              </div>
              <ChartContainer
                config={{
                  workflows: {
                    label: "流程处理量",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[120px] w-full"
              >
                <BarChart
                  data={[
                    { name: "本周", workflows: stats.monthlyWorkflows },
                    {
                      name: "上周",
                      workflows: Math.round(stats.monthlyWorkflows * 0.85),
                    },
                    {
                      name: "上上周",
                      workflows: Math.round(stats.monthlyWorkflows * 0.7),
                    },
                  ]}
                >
                  <Bar
                    dataKey="workflows"
                    fill="var(--color-workflows)"
                    radius={[4, 4, 0, 0]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* 审批通过率 - 环形图 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  审批通过率
                </span>
                <span className="text-sm font-medium">
                  {stats.approvalRate}%
                </span>
              </div>
              <ChartContainer
                config={{
                  approved: {
                    label: "已通过",
                    color: "hsl(var(--chart-2))",
                  },
                  rejected: {
                    label: "已驳回",
                    color: "hsl(var(--destructive))",
                  },
                }}
                className="h-[120px] w-full"
              >
                <PieChart>
                  <Pie
                    data={[
                      { name: "approved", value: stats.approvalRate },
                      { name: "rejected", value: 100 - stats.approvalRate },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell key="approved" fill="var(--color-approved)" />
                    <Cell key="rejected" fill="var(--color-rejected)" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>

            {/* 平均处理时长 - 折线图 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  平均处理时长
                </span>
                <span className="text-sm font-medium">1.2 天</span>
              </div>
              <ChartContainer
                config={{
                  duration: {
                    label: "处理时长",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[120px] w-full"
              >
                <LineChart
                  data={[
                    { name: "周一", duration: 1.5 },
                    { name: "周二", duration: 1.3 },
                    { name: "周三", duration: 1.2 },
                    { name: "周四", duration: 1.1 },
                    { name: "周五", duration: 1.2 },
                  ]}
                >
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="var(--color-duration)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending workflows */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">待处理流程</CardTitle>
            <Link to="/workflow">
              <Button variant="ghost" size="sm" className="gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingWorkflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                  <p>暂无待处理流程</p>
                </div>
              ) : (
                pendingWorkflows.slice(0, 4).map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {workflow.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {workflow.assignee && <span>{workflow.assignee}</span>}
                        {workflow.assignee && workflow.createTime && (
                          <span>·</span>
                        )}
                        {workflow.createTime && (
                          <span>{workflow.createTime}</span>
                        )}
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">今日会议</CardTitle>
            <Link to="/meetings">
              <Button variant="ghost" size="sm" className="gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                  <p>今日暂无会议安排</p>
                </div>
              ) : (
                todayMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-medium">
                        {meeting.startTime}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {meeting.startTime} - {meeting.endTime}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {meeting.roomName}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">最新通知</CardTitle>
          <Link to="/notifications">
            <Button variant="ghost" size="sm" className="gap-1">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                  notification.isRead ? "bg-transparent" : "bg-primary/5"
                }`}
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                    notification.isRead ? "bg-muted" : "bg-primary"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
