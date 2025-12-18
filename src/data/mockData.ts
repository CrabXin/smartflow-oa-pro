/**
 * SmartFlow OA 系统模拟数据
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

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: '1',
    name: '张伟',
    email: 'zhangwei@company.com',
    avatar: 'ZW',
    department: '技术部',
    role: 'admin',
    phone: '13800138001',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: '李娜',
    email: 'lina@company.com',
    avatar: 'LN',
    department: '人事部',
    role: 'manager',
    phone: '13800138002',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: '王强',
    email: 'wangqiang@company.com',
    avatar: 'WQ',
    department: '技术部',
    role: 'employee',
    phone: '13800138003',
    status: 'active',
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    name: '刘芳',
    email: 'liufang@company.com',
    avatar: 'LF',
    department: '市场部',
    role: 'manager',
    phone: '13800138004',
    status: 'active',
    createdAt: '2024-03-25',
  },
  {
    id: '5',
    name: '陈明',
    email: 'chenming@company.com',
    avatar: 'CM',
    department: '财务部',
    role: 'employee',
    phone: '13800138005',
    status: 'inactive',
    createdAt: '2024-04-05',
  },
  {
    id: '6',
    name: '赵丽',
    email: 'zhaoli@company.com',
    avatar: 'ZL',
    department: '技术部',
    role: 'employee',
    phone: '13800138006',
    status: 'active',
    createdAt: '2024-05-12',
  },
];

// 模拟部门数据
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: '总经办',
    parentId: null,
    managerId: '1',
    memberCount: 5,
    children: [
      {
        id: '2',
        name: '技术部',
        parentId: '1',
        managerId: '1',
        memberCount: 15,
        children: [
          {
            id: '5',
            name: '前端组',
            parentId: '2',
            managerId: '3',
            memberCount: 6,
          },
          {
            id: '6',
            name: '后端组',
            parentId: '2',
            managerId: '6',
            memberCount: 5,
          },
          {
            id: '7',
            name: '测试组',
            parentId: '2',
            managerId: '3',
            memberCount: 4,
          },
        ],
      },
      {
        id: '3',
        name: '人事部',
        parentId: '1',
        managerId: '2',
        memberCount: 8,
      },
      {
        id: '4',
        name: '市场部',
        parentId: '1',
        managerId: '4',
        memberCount: 12,
        children: [
          {
            id: '8',
            name: '销售组',
            parentId: '4',
            managerId: '4',
            memberCount: 7,
          },
          {
            id: '9',
            name: '推广组',
            parentId: '4',
            managerId: '4',
            memberCount: 5,
          },
        ],
      },
      {
        id: '10',
        name: '财务部',
        parentId: '1',
        managerId: '5',
        memberCount: 6,
      },
    ],
  },
];

// 模拟流程数据
export const mockWorkflows: Workflow[] = [
  {
    id: '1',
    title: '年假申请 - 5天',
    type: 'leave',
    applicant: '王强',
    applicantId: '3',
    department: '技术部',
    status: 'pending',
    createdAt: '2024-12-15',
    description: '申请年假5天，用于回家探亲',
    startDate: '2024-12-25',
    endDate: '2024-12-30',
    approvers: [
      { userId: '1', name: '张伟', status: 'pending' },
      { userId: '2', name: '李娜', status: 'pending' },
    ],
  },
  {
    id: '2',
    title: '差旅报销 - ¥3,500',
    type: 'expense',
    applicant: '刘芳',
    applicantId: '4',
    department: '市场部',
    status: 'processing',
    createdAt: '2024-12-14',
    description: '上海出差差旅费用报销',
    amount: 3500,
    approvers: [
      { userId: '1', name: '张伟', status: 'approved', approvedAt: '2024-12-15', comment: '同意' },
      { userId: '5', name: '陈明', status: 'pending' },
    ],
  },
  {
    id: '3',
    title: '设备采购申请',
    type: 'procurement',
    applicant: '赵丽',
    applicantId: '6',
    department: '技术部',
    status: 'approved',
    createdAt: '2024-12-10',
    description: '申请采购开发用MacBook Pro一台',
    amount: 18999,
    approvers: [
      { userId: '1', name: '张伟', status: 'approved', approvedAt: '2024-12-11', comment: '批准' },
      { userId: '5', name: '陈明', status: 'approved', approvedAt: '2024-12-12', comment: '已确认预算' },
    ],
  },
  {
    id: '4',
    title: '出差申请 - 北京',
    type: 'travel',
    applicant: '张伟',
    applicantId: '1',
    department: '技术部',
    status: 'rejected',
    createdAt: '2024-12-08',
    description: '前往北京参加技术峰会',
    startDate: '2024-12-20',
    endDate: '2024-12-22',
    approvers: [
      { userId: '2', name: '李娜', status: 'rejected', approvedAt: '2024-12-09', comment: '与部门会议冲突' },
    ],
  },
  {
    id: '5',
    title: '病假申请 - 2天',
    type: 'leave',
    applicant: '陈明',
    applicantId: '5',
    department: '财务部',
    status: 'approved',
    createdAt: '2024-12-16',
    description: '身体不适需要休息',
    startDate: '2024-12-17',
    endDate: '2024-12-18',
    approvers: [
      { userId: '1', name: '张伟', status: 'approved', approvedAt: '2024-12-16', comment: '同意，注意休息' },
    ],
  },
];

// 模拟会议室数据
export const mockMeetingRooms: MeetingRoom[] = [
  {
    id: '1',
    name: '创新会议室',
    capacity: 10,
    equipment: ['投影仪', '白板', '视频会议系统'],
    location: 'A栋3楼',
  },
  {
    id: '2',
    name: '协作会议室',
    capacity: 6,
    equipment: ['电视屏幕', '白板'],
    location: 'A栋3楼',
  },
  {
    id: '3',
    name: '培训室',
    capacity: 30,
    equipment: ['投影仪', '麦克风', '音响', '录像设备'],
    location: 'B栋1楼',
  },
  {
    id: '4',
    name: '小型讨论室',
    capacity: 4,
    equipment: ['白板'],
    location: 'A栋2楼',
  },
];

// 模拟会议预约数据
export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: '周一技术评审会议',
    roomId: '1',
    roomName: '创新会议室',
    organizer: '张伟',
    organizerId: '1',
    attendees: ['王强', '赵丽', '前端组'],
    date: '2024-12-18',
    startTime: '09:00',
    endTime: '10:30',
    description: '评审本周技术方案',
    status: 'upcoming',
  },
  {
    id: '2',
    title: '市场策略讨论',
    roomId: '2',
    roomName: '协作会议室',
    organizer: '刘芳',
    organizerId: '4',
    attendees: ['销售组', '推广组'],
    date: '2024-12-18',
    startTime: '14:00',
    endTime: '15:30',
    description: 'Q1市场推广策略讨论',
    status: 'upcoming',
  },
  {
    id: '3',
    title: '新员工培训',
    roomId: '3',
    roomName: '培训室',
    organizer: '李娜',
    organizerId: '2',
    attendees: ['新员工'],
    date: '2024-12-19',
    startTime: '09:00',
    endTime: '12:00',
    description: '公司制度及系统使用培训',
    status: 'upcoming',
  },
  {
    id: '4',
    title: '一对一沟通',
    roomId: '4',
    roomName: '小型讨论室',
    organizer: '张伟',
    organizerId: '1',
    attendees: ['王强'],
    date: '2024-12-18',
    startTime: '16:00',
    endTime: '16:30',
    description: '季度绩效沟通',
    status: 'upcoming',
  },
];

// 模拟通知数据
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '新的审批任务',
    content: '您有一个新的请假申请待审批：王强 - 年假申请5天',
    type: 'workflow',
    isRead: false,
    createdAt: '2024-12-18 09:30',
    link: '/workflow',
  },
  {
    id: '2',
    title: '会议提醒',
    content: '您预约的"周一技术评审会议"将于今天09:00开始',
    type: 'meeting',
    isRead: false,
    createdAt: '2024-12-18 08:00',
    link: '/meetings',
  },
  {
    id: '3',
    title: '系统通知',
    content: 'SmartFlow OA系统将于本周六进行维护升级，届时系统将暂停服务2小时',
    type: 'system',
    isRead: true,
    createdAt: '2024-12-17 18:00',
  },
  {
    id: '4',
    title: '审批结果通知',
    content: '您的"设备采购申请"已通过审批',
    type: 'workflow',
    isRead: true,
    createdAt: '2024-12-12 15:30',
    link: '/workflow',
  },
  {
    id: '5',
    title: '公司公告',
    content: '关于2025年元旦放假安排的通知：12月30日-1月1日放假3天',
    type: 'announcement',
    isRead: false,
    createdAt: '2024-12-16 10:00',
  },
  {
    id: '6',
    title: '报销审批提醒',
    content: '您有一个新的差旅报销待审批：刘芳 - ¥3,500',
    type: 'workflow',
    isRead: false,
    createdAt: '2024-12-15 14:20',
    link: '/workflow',
  },
];

// 当前登录用户（模拟）
export const currentUser: User = mockUsers[0];

// 仪表盘统计数据
export const dashboardStats = {
  pendingApprovals: 3,
  todayMeetings: 3,
  unreadNotifications: 4,
  totalEmployees: 46,
  monthlyWorkflows: 28,
  approvalRate: 85,
};
