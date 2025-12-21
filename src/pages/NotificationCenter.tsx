import { useState } from 'react';
import { 
  Bell, 
  CheckCheck,
  Filter,
  FileCheck,
  Calendar,
  Settings,
  Megaphone,
  Trash2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/data/mockData';
import { 
  apiGetNotifications, 
  apiMarkNotificationAsRead, 
  apiMarkAllNotificationsAsRead, 
  apiDeleteNotification,
} from '@/lib/api';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * API 接口:
 * GET /api/notifications - 获取通知列表
 * 请求参数: { type?: string, isRead?: boolean, page?: number, limit?: number }
 * 返回数据: { notifications: Notification[], total: number, unreadCount: number }
 * 
 * PUT /api/notifications/:id/read - 标记单条已读
 * 返回数据: { notification: Notification }
 * 
 * PUT /api/notifications/read-all - 全部标记已读
 * 返回数据: { success: boolean }
 * 
 * DELETE /api/notifications/:id - 删除通知
 * 返回数据: { success: boolean }
 */

const typeConfig: Record<string, { label: string; icon: typeof Bell; color: string; bgColor: string }> = {
  workflow: { label: '流程', icon: FileCheck, color: 'text-primary', bgColor: 'bg-primary/10' },
  meeting: { label: '会议', icon: Calendar, color: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  system: { label: '系统', icon: Settings, color: 'text-chart-3', bgColor: 'bg-chart-3/10' },
  announcement: { label: '公告', icon: Megaphone, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
};

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  const { data: notificationsPage, isLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', { 
      type: activeTab !== 'all' && activeTab !== 'unread' ? activeTab : undefined,
      isRead: activeTab === 'unread' ? false : undefined,
      page,
      limit: 50,
    }],
    queryFn: () => apiGetNotifications({
      type: activeTab !== 'all' && activeTab !== 'unread' 
        ? (activeTab as 'workflow' | 'meeting' | 'system' | 'announcement') 
        : undefined,
      isRead: activeTab === 'unread' ? false : undefined,
      page,
      limit: 50,
    }),
  });

  const handleRefresh = async () => {
    await refetchNotifications();
    toast.success('数据已刷新');
  };

  const notifications = notificationsPage?.notifications ?? [];
  const unreadCount = notificationsPage?.unreadCount ?? 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiMarkNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '标记失败');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiMarkAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('已全部标记为已读');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '操作失败');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => apiDeleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('通知已删除');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '删除失败');
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该通知吗？')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">通知中心</h2>
          <p className="text-sm text-muted-foreground mt-1">
            共 {unreadCount} 条未读消息
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            {markAllAsReadMutation.isPending ? '处理中...' : '全部标记已读'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(typeConfig).map(([type, config]) => {
          const count = notifications.filter(n => n.type === type && !n.isRead).length;
          return (
            <Card 
              key={type} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                activeTab === type && "ring-2 ring-primary"
              )}
              onClick={() => setActiveTab(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <config.icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{config.label}通知</p>
                      <p className="text-lg font-semibold text-foreground">{count}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs and list */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                全部
                <Badge variant="secondary">{notifications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                未读
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workflow">流程</TabsTrigger>
              <TabsTrigger value="meeting">会议</TabsTrigger>
              <TabsTrigger value="system">系统</TabsTrigger>
              <TabsTrigger value="announcement">公告</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
              <p>加载中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                      notification.isRead 
                        ? "border-border bg-transparent hover:bg-muted/50" 
                        : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg h-fit ${config.bgColor}`}>
                      <config.icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-medium",
                            notification.isRead ? "text-foreground" : "text-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.link && (
                            <Link to={notification.link}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {notification.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
