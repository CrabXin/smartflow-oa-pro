import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Plane,
  Receipt,
  ShoppingCart,
  Eye,
  Check,
  X as XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import type { Workflow } from '@/data/mockData';
import { 
  apiGetPendingWorkflows, 
  apiGetMyWorkflows, 
  apiCreateWorkflow, 
  apiApproveWorkflow, 
  apiRejectWorkflow,
  type WorkflowCreatePayload,
  type WorkflowApprovePayload,
  type WorkflowRejectPayload,
} from '@/lib/api';
import { toast } from 'sonner';

/**
 * API 接口:
 * GET /api/workflows - 获取流程列表
 * 请求参数: { type?: string, status?: string, page?: number, limit?: number }
 * 返回数据: { workflows: Workflow[], total: number }
 * 
 * GET /api/workflows/my - 获取我的申请
 * GET /api/workflows/pending - 获取待我审批的流程
 * 
 * POST /api/workflows - 创建流程申请
 * 请求体: { 
 *   type: 'leave' | 'expense' | 'procurement' | 'travel',
 *   title: string,
 *   description: string,
 *   amount?: number,
 *   startDate?: string,
 *   endDate?: string
 * }
 * 返回数据: { workflow: Workflow }
 * 
 * PUT /api/workflows/:id/approve - 审批通过
 * 请求体: { comment?: string }
 * 返回数据: { workflow: Workflow }
 * 
 * PUT /api/workflows/:id/reject - 审批驳回
 * 请求体: { comment: string }
 * 返回数据: { workflow: Workflow }
 */

const workflowTypeConfig = {
  leave: { label: '请假', icon: Clock, color: 'text-chart-1' },
  expense: { label: '报销', icon: Receipt, color: 'text-chart-2' },
  procurement: { label: '采购', icon: ShoppingCart, color: 'text-chart-3' },
  travel: { label: '出差', icon: Plane, color: 'text-chart-4' },
};

const statusConfig = {
  pending: { label: '待审批', icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
  processing: { label: '审批中', icon: Clock, color: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  approved: { label: '已通过', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: '已驳回', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export default function WorkflowApproval() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    type: 'leave' as 'leave' | 'expense' | 'procurement' | 'travel',
    title: '',
    description: '',
    amount: '',
    startDate: '',
    endDate: '',
  });

  // Fetch workflows based on tab
  const { data: pendingWorkflowsPage } = useQuery({
    queryKey: ['workflows', 'pending', { type: typeFilter !== 'all' ? typeFilter : undefined }],
    queryFn: () => apiGetPendingWorkflows({ 
      type: typeFilter !== 'all' ? (typeFilter as 'leave' | 'expense' | 'procurement' | 'travel') : undefined,
      page: 1,
      limit: 100,
    }),
    enabled: activeTab === 'pending',
  });

  const { data: myWorkflowsPage } = useQuery({
    queryKey: ['workflows', 'my', { type: typeFilter !== 'all' ? typeFilter : undefined }],
    queryFn: () => apiGetMyWorkflows({ 
      type: typeFilter !== 'all' ? (typeFilter as 'leave' | 'expense' | 'procurement' | 'travel') : undefined,
      page: 1,
      limit: 100,
    }),
    enabled: activeTab === 'my',
  });

  const workflows = activeTab === 'pending' 
    ? (pendingWorkflowsPage?.workflows ?? [])
    : (myWorkflowsPage?.workflows ?? []);

  // Filter workflows by search query
  const filteredWorkflows = workflows.filter(w => {
    if (!searchQuery) return true;
    return w.title.includes(searchQuery) || 
           w.applicant.includes(searchQuery) ||
           w.description.includes(searchQuery);
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (payload: WorkflowCreatePayload) => apiCreateWorkflow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsCreateDialogOpen(false);
      setCreateForm({
        type: 'leave',
        title: '',
        description: '',
        amount: '',
        startDate: '',
        endDate: '',
      });
      toast.success('申请提交成功');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '提交失败');
    },
  });

  const approveWorkflowMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkflowApprovePayload }) =>
      apiApproveWorkflow(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(null);
      setApprovalComment('');
      toast.success('审批通过');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '审批失败');
    },
  });

  const rejectWorkflowMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkflowRejectPayload }) =>
      apiRejectWorkflow(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(null);
      setApprovalComment('');
      toast.success('已驳回申请');
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || '驳回失败');
    },
  });

  const handleCreate = () => {
    if (!createForm.title || !createForm.description) {
      toast.error('请填写标题和说明');
      return;
    }

    const payload: WorkflowCreatePayload = {
      type: createForm.type,
      title: createForm.title,
      description: createForm.description,
      amount: createForm.amount ? Number(createForm.amount) : undefined,
      startDate: createForm.startDate || undefined,
      endDate: createForm.endDate || undefined,
    };

    createWorkflowMutation.mutate(payload);
  };

  const handleApprove = (workflow: Workflow) => {
    const payload: WorkflowApprovePayload = {
      comment: approvalComment || undefined,
    };
    approveWorkflowMutation.mutate({ id: workflow.id, payload });
  };

  const handleReject = (workflow: Workflow) => {
    if (!approvalComment.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    const payload: WorkflowRejectPayload = {
      comment: approvalComment,
    };
    rejectWorkflowMutation.mutate({ id: workflow.id, payload });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">流程审批</h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理和审批各类流程申请
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              发起申请
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>发起新申请</DialogTitle>
              <DialogDescription>
                填写以下信息提交流程申请
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>申请类型</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(value) => setCreateForm({ ...createForm, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">请假申请</SelectItem>
                    <SelectItem value="expense">费用报销</SelectItem>
                    <SelectItem value="procurement">采购申请</SelectItem>
                    <SelectItem value="travel">出差申请</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">申请标题</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="请输入申请标题"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">申请说明</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="请详细描述申请内容"
                  rows={3}
                />
              </div>
              {(createForm.type === 'expense' || createForm.type === 'procurement') && (
                <div className="grid gap-2">
                  <Label htmlFor="amount">金额 (元)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    placeholder="请输入金额"
                  />
                </div>
              )}
              {(createForm.type === 'leave' || createForm.type === 'travel') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">开始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">结束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={createWorkflowMutation.isPending}>
                {createWorkflowMutation.isPending ? '提交中...' : '提交申请'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            待我审批
            <Badge variant="secondary" className="ml-1">
              {pendingWorkflowsPage?.total ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="my">我的申请</TabsTrigger>
          <TabsTrigger value="all">全部流程</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索流程标题、申请人..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="leave">请假</SelectItem>
                  <SelectItem value="expense">报销</SelectItem>
                  <SelectItem value="procurement">采购</SelectItem>
                  <SelectItem value="travel">出差</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workflow list */}
        <div className="mt-4 space-y-4">
          {filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无流程数据</p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkflows.map((workflow) => {
              const TypeIcon = workflowTypeConfig[workflow.type].icon;
              const StatusIcon = statusConfig[workflow.status].icon;
              const canApprove = activeTab === 'pending' && 
                (workflow.status === 'pending' || workflow.status === 'processing');
              
              return (
                <Card key={workflow.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Left indicator */}
                      <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto ${statusConfig[workflow.status].bgColor}`} />
                      
                      <div className="flex-1 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${statusConfig[workflow.status].bgColor}`}>
                                <TypeIcon className={`h-4 w-4 ${workflowTypeConfig[workflow.type].color}`} />
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{workflow.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                                  <span>{workflow.applicant}</span>
                                  <span>·</span>
                                  <span>{workflow.department}</span>
                                  <span>·</span>
                                  <span>{workflow.createdAt}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{workflow.description}</p>
                            
                            {/* Extra info */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge variant="outline">
                                {workflowTypeConfig[workflow.type].label}
                              </Badge>
                              {workflow.amount && (
                                <Badge variant="outline">
                                  ¥{workflow.amount.toLocaleString()}
                                </Badge>
                              )}
                              {workflow.startDate && workflow.endDate && (
                                <Badge variant="outline">
                                  {workflow.startDate} ~ {workflow.endDate}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig[workflow.status].bgColor}`}>
                              <StatusIcon className={`h-4 w-4 ${statusConfig[workflow.status].color}`} />
                              <span className={`text-sm font-medium ${statusConfig[workflow.status].color}`}>
                                {statusConfig[workflow.status].label}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedWorkflow(workflow)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                详情
                              </Button>
                              {canApprove && (
                                <>
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWorkflow(workflow);
                                      setApprovalComment('');
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    审批
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Approval progress */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>审批进度</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {workflow.approvers.map((approver, index) => (
                              <div key={approver.userId} className="flex items-center gap-2">
                                {index > 0 && <div className="w-8 h-0.5 bg-border" />}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                                  approver.status === 'approved' 
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : approver.status === 'rejected'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-muted border-border text-muted-foreground'
                                }`}>
                                  {approver.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                  {approver.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                                  {approver.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                  <span className="text-sm">{approver.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </Tabs>

      {/* Detail/Approval dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={(open) => !open && setSelectedWorkflow(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>流程详情</DialogTitle>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">申请人</Label>
                  <p className="mt-1 font-medium">{selectedWorkflow.applicant}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">部门</Label>
                  <p className="mt-1 font-medium">{selectedWorkflow.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请类型</Label>
                  <p className="mt-1 font-medium">{workflowTypeConfig[selectedWorkflow.type].label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请时间</Label>
                  <p className="mt-1 font-medium">{selectedWorkflow.createdAt}</p>
                </div>
                {selectedWorkflow.amount && (
                  <div>
                    <Label className="text-muted-foreground">金额</Label>
                    <p className="mt-1 font-medium">¥{selectedWorkflow.amount.toLocaleString()}</p>
                  </div>
                )}
                {selectedWorkflow.startDate && (
                  <div>
                    <Label className="text-muted-foreground">日期范围</Label>
                    <p className="mt-1 font-medium">{selectedWorkflow.startDate} ~ {selectedWorkflow.endDate}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-muted-foreground">申请说明</Label>
                <p className="mt-1">{selectedWorkflow.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">审批记录</Label>
                <div className="mt-2 space-y-2">
                  {selectedWorkflow.approvers.map((approver) => (
                    <div key={approver.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {approver.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {approver.status === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
                        {approver.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                        <span>{approver.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {approver.comment && <span className="mr-2">"{approver.comment}"</span>}
                        {approver.approvedAt && <span>{approver.approvedAt}</span>}
                        {approver.status === 'pending' && <span>待审批</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval actions */}
              {activeTab === 'pending' && (selectedWorkflow.status === 'pending' || selectedWorkflow.status === 'processing') && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div>
                    <Label htmlFor="comment">审批意见</Label>
                    <Textarea
                      id="comment"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="请输入审批意见（驳回时必填）"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleReject(selectedWorkflow)}
                      disabled={rejectWorkflowMutation.isPending}
                    >
                      <XIcon className="h-4 w-4 mr-1" />
                      {rejectWorkflowMutation.isPending ? '驳回中...' : '驳回'}
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedWorkflow)}
                      disabled={approveWorkflowMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {approveWorkflowMutation.isPending ? '审批中...' : '通过'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
