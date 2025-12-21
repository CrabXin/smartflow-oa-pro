/**
 * SmartFlow OA 系统类型定义
 * 
 * API 接口预留说明:
 * - GET /api/users - 获取用户列表
 * - POST /api/users - 创建用户
 * - PUT /api/users/:id - 更新用户
 * - DELETE /api/users/:id - 删除用户
 * 
 * - GET /api/departments - 获取部门列表
 * - POST /api/departments - 创建部门
 * - PUT /api/departments/:id - 更新部门
 * - DELETE /api/departments/:id - 删除部门
 * 
 * - GET /api/workflows - 获取流程列表
 * - POST /api/workflows - 创建流程申请
 * - PUT /api/workflows/:id/approve - 审批流程
 * - PUT /api/workflows/:id/reject - 驳回流程
 * 
 * - GET /api/meetings - 获取会议室预约列表
 * - POST /api/meetings - 创建会议室预约
 * - DELETE /api/meetings/:id - 取消预约
 * 
 * - GET /api/notifications - 获取通知列表
 * - PUT /api/notifications/:id/read - 标记已读
 * - PUT /api/notifications/read-all - 全部标记已读
 */

// 用户类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  role: 'admin' | 'manager' | 'employee';
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// 部门类型定义
export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string;
  memberCount: number;
  children?: Department[];
}

// 流程申请类型定义
export interface Workflow {
  id: string;
  title: string;
  type: 'leave' | 'expense' | 'procurement' | 'travel';
  applicant: string;
  applicantId: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  createdAt: string;
  description: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  approvers: {
    userId: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    approvedAt?: string;
  }[];
}

// 会议室类型定义
export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  location: string;
}

// 会议预约类型定义
export interface Meeting {
  id: string;
  title: string;
  roomId: string;
  roomName: string;
  organizer: string;
  organizerId: string;
  attendees: string[];
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// 通知类型定义
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'workflow' | 'meeting' | 'announcement';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

