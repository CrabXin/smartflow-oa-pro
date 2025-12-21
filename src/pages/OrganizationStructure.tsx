import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Users,
  Building2,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Department, User } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { apiGetDepartments, apiGetDepartmentMembers } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * API 接口:
 * GET /api/departments - 获取部门树形结构
 * 返回数据: Department[] (树形结构)
 * 
 * POST /api/departments - 创建部门
 * 请求体: { name: string, parentId?: string, managerId: string }
 * 返回数据: { department: Department }
 * 
 * PUT /api/departments/:id - 更新部门
 * 请求体: { name?: string, parentId?: string, managerId?: string }
 * 返回数据: { department: Department }
 * 
 * DELETE /api/departments/:id - 删除部门
 * 返回数据: { success: boolean }
 * 
 * GET /api/departments/:id/members - 获取部门成员
 * 返回数据: User[]
 */

interface DepartmentNodeProps {
  department: Department;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (department: Department) => void;
  selectedId: string | null;
}

function DepartmentNode({ 
  department, 
  level, 
  expandedIds, 
  onToggle, 
  onSelect,
  selectedId 
}: DepartmentNodeProps) {
  const hasChildren = department.children && department.children.length > 0;
  const isExpanded = expandedIds.has(department.id);
  const isSelected = selectedId === department.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(department)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(department.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        
        <Building2 className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
        
        <span className="font-medium flex-1">{department.name}</span>
        
        <Badge variant="outline" className="text-xs">
          {department.memberCount} 人
        </Badge>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {department.children!.map((child) => (
            <DepartmentNode
              key={child.id}
              department={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationStructure() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: apiGetDepartments,
  });

  useEffect(() => {
    if (!selectedDepartment && departments && departments.length > 0) {
      setSelectedDepartment(departments[0]);
      setExpandedIds(new Set([departments[0].id]));
    }
  }, [departments, selectedDepartment]);

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleAddDepartment = () => {
    // TODO: 调用 POST /api/departments 创建部门
    toast.info("添加部门功能 - 请对接 POST /api/departments");
  };

  const handleEditDepartment = () => {
    // TODO: 调用 PUT /api/departments/:id 更新部门
    toast.info("编辑部门功能 - 请对接 PUT /api/departments/:id");
  };

  const handleDeleteDepartment = () => {
    // TODO: 调用 DELETE /api/departments/:id 删除部门
    toast.info("删除部门功能 - 请对接 DELETE /api/departments/:id");
  };

  const { data: selectedMembers = [] } = useQuery<User[]>({
    queryKey: ["department-members", selectedDepartment?.id],
    queryFn: () =>
      selectedDepartment
        ? apiGetDepartmentMembers(selectedDepartment.id)
        : Promise.resolve([]),
    enabled: !!selectedDepartment,
  });

  const manager = selectedMembers.length > 0 ? selectedMembers[0] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Organization tree */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">组织架构</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleAddDepartment}>
            <Plus className="h-4 w-4" />
            添加
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="space-y-1">
              {(departments ?? []).map((dept) => (
                <DepartmentNode
                  key={dept.id}
                  department={dept}
                  level={0}
                  expandedIds={expandedIds}
                  onToggle={handleToggle}
                  onSelect={setSelectedDepartment}
                  selectedId={selectedDepartment?.id || null}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department details */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {selectedDepartment?.name || '请选择部门'}
            </CardTitle>
            {selectedDepartment && (
              <p className="text-sm text-muted-foreground mt-1">
                共 {selectedMembers.length} 名成员
              </p>
            )}
          </div>
          {selectedDepartment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditDepartment}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑部门
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddDepartment}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加子部门
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleDeleteDepartment}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除部门
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {selectedDepartment ? (
            <div className="space-y-6">
              {/* Manager info */}
              {manager && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">部门负责人</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {manager.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{manager.name}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {manager.role === 'admin' ? '管理员' : manager.role === 'manager' ? '经理' : '员工'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Sub-departments */}
              {selectedDepartment.children && selectedDepartment.children.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">下级部门</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedDepartment.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedDepartment(child)}
                      >
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{child.name}</p>
                          <p className="text-sm text-muted-foreground">{child.memberCount} 人</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Department members */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  部门成员 ({selectedMembers.length})
                </h4>
                {selectedMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>暂无直属成员</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <Badge 
                          variant={member.status === 'active' ? 'default' : 'outline'}
                          className="flex-shrink-0"
                        >
                          {member.status === 'active' ? '在职' : '离职'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>请从左侧选择一个部门查看详情</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
