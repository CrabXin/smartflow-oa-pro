import type {
  User as UiUser,
  Department as UiDepartment,
  Workflow as UiWorkflow,
  Meeting as UiMeeting,
  MeetingRoom as UiMeetingRoom,
  Notification as UiNotification,
} from "@/data/mockData";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ResultWrapper<T> {
  code: number;
  msg: string;
  data: T;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return {
    Authorization: `${token}`,
  };
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    // 统一处理鉴权失败：清理本地登录信息并跳转到登录页
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
        } catch {
          // ignore
        }
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    const text = await res.text().catch(() => "");
    throw new Error(
      `请求失败: ${res.status} ${res.statusText}${
        text ? ` - ${text.slice(0, 200)}` : ""
      }`,
    );
  }

  return (await res.json()) as T;
}

async function requestResult<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const result = await requestJson<ResultWrapper<T>>(path, options);
  // SmartFlow 后端示例中，有的成功 code=0，有的 code=1，这里统一视为成功
  if (result.code !== 0 && result.code !== 1) {
    throw new Error(result.msg || "接口返回错误");
  }
  return result.data;
}

// ===================== Dashboard =====================

export interface DashboardStats {
  pendingApprovals: number;
  unreadNotifications: number;
  todayMeetings: number;
  totalEmployees: number;
  monthlyWorkflows: number;
  approvalRate: number;
}

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const data = await requestResult<{
    pendingApprovals: number;
    unreadNotifications: number;
    todayMeetings: number;
    totalEmployees: number;
    monthlyWorkflows: number;
    approvalRate: number;
  }>("/api/dashboard/stats");
  return data;
}

// TaskDTO 摘要，用于仪表盘“最近流程”
export interface DashboardTask {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  owner?: string;
  createTime?: string;
  dueDate?: string;
}

interface BackendTaskDTO {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  owner?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  taskDefinitionKey?: string;
  createTime?: string;
  dueDate?: string;
  priority?: number;
  category?: string;
  formKey?: string;
  parentTaskId?: string;
}

interface BackendIPageTaskDTO {
  records: BackendTaskDTO[];
  total: number;
  size: number;
  current: number;
}

function mapTaskToDashboardTask(t: BackendTaskDTO): DashboardTask {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    assignee: t.assignee,
    owner: t.owner,
    createTime: t.createTime,
    dueDate: t.dueDate,
  };
}

export async function apiGetDashboardRecentWorkflows(
  limit = 5,
): Promise<DashboardTask[]> {
  const tasks = await requestResult<BackendTaskDTO[]>(
    `/api/dashboard/recent-workflows?limit=${limit}`,
  );
  return tasks.map(mapTaskToDashboardTask);
}

// 后端 Meeting 结构
interface BackendMeeting {
  id: number;
  title: string;
  roomId: number;
  organizerId: string;
  attendees: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: string;
  createdAt: string;
}

// 后端 MeetingRoom 结构
interface BackendMeetingRoom {
  id: number;
  name: string;
  capacity: number;
  equipment: string;
  location: string;
  description?: string;
}

function mapBackendMeetingRoom(room: BackendMeetingRoom): UiMeetingRoom {
  return {
    id: String(room.id),
    name: room.name,
    capacity: room.capacity,
    equipment: room.equipment
      ? room.equipment.split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
      : [],
    location: room.location,
  };
}

function mapBackendMeeting(
  meeting: BackendMeeting,
  roomMap?: Map<string, UiMeetingRoom>,
): UiMeeting {
  const roomId = String(meeting.roomId);
  const room = roomMap?.get(roomId);
  // 状态枚举后端未约束，这里做一个简单映射，未知时统一视为 upcoming
  const status =
    meeting.status === "ongoing" ||
    meeting.status === "completed" ||
    meeting.status === "cancelled"
      ? meeting.status
      : ("upcoming" as const);

  const attendees =
    meeting.attendees
      ?.split(/[;,，、]/)
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  return {
    id: String(meeting.id),
    title: meeting.title,
    roomId,
    roomName: room?.name ?? "",
    organizer: "", // 仅有 organizerId，具体姓名可根据实际后端再做补充
    organizerId: meeting.organizerId,
    attendees,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    description: meeting.description,
    status,
  };
}

export async function apiGetMeetingRooms(): Promise<UiMeetingRoom[]> {
  const rooms = await requestResult<BackendMeetingRoom[]>("/api/meeting-rooms");
  return rooms.map(mapBackendMeetingRoom);
}

export async function apiGetTodayMeetings(
  date?: string,
): Promise<UiMeeting[]> {
  const targetDate =
    date ?? new Date().toISOString().split("T")[0]; /* YYYY-MM-DD */
  const [rooms, meetings] = await Promise.all([
    apiGetMeetingRooms(),
    requestResult<BackendMeeting[]>(
      `/api/dashboard/today-meetings?date=${targetDate}`,
    ),
  ]);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  return meetings.map((m) => mapBackendMeeting(m, roomMap));
}

// 仪表盘最近通知
interface BackendNotification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  link?: string;
  userId?: string;
  createdAt: string;
}

function mapBackendNotification(n: BackendNotification): UiNotification {
  return {
    id: String(n.id),
    title: n.title,
    content: n.content,
    type: n.type as UiNotification["type"],
    isRead: n.isRead,
    link: n.link || undefined,
    createdAt: n.createdAt,
  };
}

export async function apiGetDashboardRecentNotifications(
  limit = 3,
): Promise<UiNotification[]> {
  const list = await requestResult<BackendNotification[]>(
    `/api/dashboard/recent-notifications?limit=${limit}`,
  );
  return list.map(mapBackendNotification);
}

// ===================== 用户管理 =====================

interface BackendUser {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  tenantId?: string;
  password?: string;
  pictureSet?: boolean;
}

// UserInfoDTO 从 /api/users/list 返回
interface BackendUserInfoDTO {
  id: string;
  firstName?: string;
  lastName?: string;
  deptId: string; // 部门ID
  roleId: string; // 角色ID
  deptName: string; // 部门名称
  roleName: string; // 角色名称
}

interface BackendIPageUserInfoDTO {
  records: BackendUserInfoDTO[];
  total: number;
  size: number;
  current: number;
}

export interface UsersPage {
  users: UiUser[];
  total: number;
  page: number;
  pageSize: number;
}

function mapBackendUserInfoDTO(user: BackendUserInfoDTO): UiUser & {
  departmentName?: string;
  roleName?: string;
} {
  const name =
    `${user.firstName ?? ""}${user.lastName ?? ""}`.trim() || "未知用户";
  const avatar = name.slice(0, 2).toUpperCase();
  return {
    id: user.id,
    name,
    email: "", // UserInfoDTO 不包含 email，从其他地方获取或留空
    avatar,
    department: user.deptId || "", // 存储部门ID，用于更新接口
    role: (user.roleId as UiUser["role"]) || "employee", // 存储角色ID，用于更新接口
    phone: "",
    status: "active",
    createdAt: "",
    // 添加扩展字段用于显示
    departmentName: user.deptName || "",
    roleName: user.roleName || "",
  };
}

function mapBackendUser(user: BackendUser | null | undefined): UiUser {
  if (!user) {
    return {
      id: "",
      name: "未知用户",
      email: "",
      avatar: "??",
      department: "",
      role: "employee",
      phone: "",
      status: "active",
      createdAt: "",
    };
  }
  const name =
    user.displayName ||
    `${user.firstName ?? ""}${user.lastName ?? ""}` ||
    (user.email ? user.email.split("@")[0] : "未知用户");
  const avatar = name.slice(0, 2).toUpperCase();
  return {
    id: user.id || "",
    name,
    email: user.email || "",
    avatar,
    department: "",
    role: "employee",
    phone: "",
    status: "active",
    createdAt: "",
  };
}

export interface UserListQuery {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function apiGetUsers(
  query: UserListQuery,
): Promise<UsersPage> {
  const params = new URLSearchParams();
  if (query.department) params.set("department", query.department);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 50));

  const page = await requestResult<BackendIPageUserInfoDTO>(
    `/api/users/list?${params.toString()}`,
  );
  return {
    users: page.records.map(mapBackendUserInfoDTO),
    total: page.total,
    page: page.current,
    pageSize: page.size,
  };
}

// UserCreateRequest 用于创建用户
export interface UserCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
}

// UserUpdateRequest 用于更新用户（只更新部门和角色）
export interface UserUpdatePayload {
  id: string;
  oldDept: string;
  oldRole: string;
  newDept: string;
  newRole: string;
}

export async function apiCreateUser(
  payload: UserCreatePayload,
): Promise<void> {
  await requestResult<BackendUser>("/api/users/add", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // 创建用户成功后不需要返回用户数据，只需要刷新列表即可
}

export async function apiUpdateUser(
  payload: UserUpdatePayload,
): Promise<void> {
  await requestResult<{ code: number; msg: string; data: object }>("/api/users/update", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteUser(id: string): Promise<void> {
  await requestResult<string>(`/api/users/delete/${id}`, {
    method: "DELETE",
  });
}

// ===================== 部门 / 组织架构 =====================

interface BackendGroup {
  id: string;
  name: string;
  type?: string;
}

// DepartmentDTO 从 /api/dept/list 返回
interface BackendDepartmentDTO {
  id: string;
  name: string;
}

export async function apiGetDepartments(): Promise<UiDepartment[]> {
  const departments = await requestResult<BackendDepartmentDTO[]>("/api/dept/list");
  // 新接口返回扁平列表，这里简单映射为扁平结构
  return departments.map<UiDepartment>((d) => ({
    id: d.id,
    name: d.name,
    parentId: null,
    managerId: "",
    memberCount: 0,
    children: [],
  }));
}

// ===================== 角色管理 =====================

// RoleDTO 从 /api/role/list 返回
interface BackendRoleDTO {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export async function apiGetRoles(): Promise<Role[]> {
  const roles = await requestResult<BackendRoleDTO[]>("/api/role/list");
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
  }));
}

export async function apiGetDepartmentMembers(
  id: string,
): Promise<UiUser[]> {
  const users = await requestResult<BackendUserInfoDTO[]>(
    `/api/dept/${id}/members`,
  );
  return users.map(mapBackendUserInfoDTO);
}

export interface DepartmentCreatePayload {
  name: string;
}

export type DepartmentUpdatePayload = Partial<DepartmentCreatePayload>;

export async function apiCreateDepartment(
  payload: DepartmentCreatePayload,
): Promise<UiDepartment> {
  const created = await requestResult<BackendGroup>("/api/dept/add", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    id: created.id,
    name: created.name,
    parentId: null,
    managerId: "",
    memberCount: 0,
    children: [],
  };
}

export async function apiUpdateDepartment(
  id: string,
  payload: DepartmentUpdatePayload,
): Promise<UiDepartment> {
  const updated = await requestResult<BackendGroup>(`/api/dept/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return {
    id: updated.id,
    name: updated.name,
    parentId: null,
    managerId: "",
    memberCount: 0,
    children: [],
  };
}

export async function apiDeleteDepartment(id: string): Promise<void> {
  await requestResult<string>(`/api/dept/${id}`, {
    method: "DELETE",
  });
}

// ===================== 流程审批（简化版） =====================

interface BackendProcessInstanceDTO {
  id: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processDefinitionName?: string;
  businessKey?: string;
  startDate?: string;
  startUserId?: string;
  startActivityId?: string;
  superProcessInstanceId?: string;
  suspended?: boolean;
  tenantId?: string;
  name?: string;
  localizedName?: string;
  description?: string;
  localizedDescription?: string;
}

interface BackendIPageProcessInstanceDTO {
  records: BackendProcessInstanceDTO[];
  total: number;
  size: number;
  current: number;
}

export interface WorkflowsPage {
  workflows: UiWorkflow[];
  total: number;
}

function mapTaskToWorkflow(t: BackendTaskDTO): UiWorkflow {
  return {
    id: t.processInstanceId || t.id,
    title: t.name || "流程",
    type: "leave",
    applicant: "",
    applicantId: t.assignee || "",
    department: "",
    status: "pending",
    createdAt: t.createTime || "",
    description: t.description || "",
    approvers: [],
  };
}

function mapProcessInstanceToWorkflow(
  p: BackendProcessInstanceDTO,
  currentUser?: UiUser,
): UiWorkflow {
  return {
    id: p.id,
    title: p.name || p.processDefinitionName || "流程",
    type: "leave",
    applicant: "", // 需要结合 /api/users 或 /api/me 才能还原
    applicantId: p.startUserId || "",
    department: "",
    status: "pending",
    createdAt: p.startDate || "",
    description: p.description || "",
    approvers: [],
  };
}

export interface WorkflowListQuery {
  type?: UiWorkflow["type"];
  status?: UiWorkflow["status"];
  page?: number;
  limit?: number;
}

export async function apiGetWorkflows(
  query: WorkflowListQuery,
): Promise<WorkflowsPage> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 50));

  const page = await requestResult<BackendIPageProcessInstanceDTO>(
    `/api/workflows?${params.toString()}`,
  );
  return {
    workflows: page.records.map((p) => mapProcessInstanceToWorkflow(p)),
    total: page.total,
  };
}

export async function apiGetMyWorkflows(
  query: Omit<WorkflowListQuery, "status">,
): Promise<WorkflowsPage> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 50));

  const page = await requestResult<BackendIPageProcessInstanceDTO>(
    `/api/workflows/my?${params.toString()}`,
  );
  return {
    workflows: page.records.map((p) => mapProcessInstanceToWorkflow(p)),
    total: page.total,
  };
}

export async function apiGetPendingWorkflows(
  query: { type?: UiWorkflow["type"]; page?: number; limit?: number },
): Promise<WorkflowsPage> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 50));

  const page = await requestResult<BackendIPageTaskDTO>(
    `/api/workflows/pending?${params.toString()}`,
  );
  return {
    workflows: page.records.map((t) => mapTaskToWorkflow(t)),
    total: page.total,
  };
}

export interface WorkflowCreatePayload {
  type: UiWorkflow["type"];
  title: string;
  description: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
}

export async function apiCreateWorkflow(
  payload: WorkflowCreatePayload,
): Promise<UiWorkflow> {
  const created = await requestResult<BackendProcessInstanceDTO>(
    "/api/workflows",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return mapProcessInstanceToWorkflow(created);
}

export interface WorkflowApprovePayload {
  comment?: string;
}

export interface WorkflowRejectPayload {
  comment: string;
}

export async function apiApproveWorkflow(
  id: string,
  payload: WorkflowApprovePayload,
): Promise<void> {
  await requestResult<string>(`/api/workflows/${id}/approve`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiRejectWorkflow(
  id: string,
  payload: WorkflowRejectPayload,
): Promise<void> {
  await requestResult<string>(`/api/workflows/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ===================== 会议预约 =====================

export interface MeetingCreatePayload {
  title: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  description: string;
}

export async function apiGetMeetings(
  params: { date?: string; roomId?: string } = {},
): Promise<UiMeeting[]> {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.roomId) search.set("roomId", params.roomId);

  const [rooms, meetings] = await Promise.all([
    apiGetMeetingRooms(),
    requestResult<BackendMeeting[]>(
      `/api/meetings${search.toString() ? `?${search.toString()}` : ""}`,
    ),
  ]);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  return meetings.map((m) => mapBackendMeeting(m, roomMap));
}

export async function apiCreateMeeting(
  payload: MeetingCreatePayload,
): Promise<UiMeeting> {
  const backendPayload = {
    ...payload,
    roomId: Number(payload.roomId),
  };
  const [rooms, meeting] = await Promise.all([
    apiGetMeetingRooms(),
    requestResult<BackendMeeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify(backendPayload),
    }),
  ]);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  return mapBackendMeeting(meeting, roomMap);
}

export async function apiDeleteMeeting(id: string): Promise<void> {
  await requestResult<string>(`/api/meetings/${id}`, {
    method: "DELETE",
  });
}

export async function apiCheckMeetingAvailability(params: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<boolean> {
  const search = new URLSearchParams({
    roomId: String(params.roomId),
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
  });
  const data = await requestResult<{ available: boolean }>(
    `/api/meetings/check-availability?${search.toString()}`,
  );
  return data.available;
}

// ===================== 通知中心 =====================

interface BackendNotificationsPage {
  notifications: BackendNotification[];
  total: number;
  unreadCount: number;
}

export interface NotificationsPage {
  notifications: UiNotification[];
  total: number;
  unreadCount: number;
}

export interface NotificationListQuery {
  type?: UiNotification["type"];
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export async function apiGetNotifications(
  query: NotificationListQuery,
): Promise<NotificationsPage> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (typeof query.isRead === "boolean") {
    params.set("isRead", String(query.isRead));
  }
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 50));

  const page = await requestResult<BackendNotificationsPage>(
    `/api/notifications?${params.toString()}`,
  );
  return {
    notifications: page.notifications.map(mapBackendNotification),
    total: page.total,
    unreadCount: page.unreadCount,
  };
}

export async function apiMarkNotificationAsRead(
  id: string,
): Promise<UiNotification> {
  const notification = await requestResult<BackendNotification>(
    `/api/notifications/${id}/read`,
    { method: "PUT" },
  );
  return mapBackendNotification(notification);
}

export async function apiMarkAllNotificationsAsRead(): Promise<void> {
  await requestResult<string>("/api/notifications/read-all", {
    method: "PUT",
  });
}

export async function apiDeleteNotification(id: string): Promise<void> {
  await requestResult<string>(`/api/notifications/${id}`, {
    method: "DELETE",
  });
}

// ===================== 当前用户 / 登录（简要） =====================

export interface LoginPayload {
  username: string;
  password: string;
}

interface BackendLoginSuccessResponse {
  userId: string;
  token: string;
}

export async function apiLogin(payload: LoginPayload): Promise<BackendLoginSuccessResponse> {
  const data = await requestResult<BackendLoginSuccessResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.userId);
  return data;
}

export async function apiLogout(): Promise<void> {
  try {
    await requestResult<string>("/api/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  }
}

export async function apiGetCurrentUser(): Promise<UiUser> {
  const backendUser = await requestResult<BackendUser>("/api/me");
  return mapBackendUser(backendUser);
}


