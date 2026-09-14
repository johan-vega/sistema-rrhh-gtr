// =====================================================
// USER & AUTH MODELS
// =====================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface User {
  id: number;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  dni: string;
  area?: Area;
  position?: Position;
  address?: string;
  phone?: string;
  active: boolean;
}

export type UserRole = 'worker' | 'hr';

export interface ProfileUpdatePayload {
  address?: string;
  phone?: string;
}

// =====================================================
// AREA & POSITION
// =====================================================

export interface Area {
  id: number;
  name: string;
  description?: string;
  monthly_permission_limit?: number | null;
  monthly_absence_limit?: number | null;
  active: boolean;
}

export interface Position {
  id: number;
  name: string;
  active: boolean;
}

// =====================================================
// CATEGORY
// =====================================================

export interface RequestCategory {
  id: number;
  name: string;
  description?: string;
  requires_document: boolean;
  minimum_advance_days: number;
  maximum_past_days?: number;
  is_absence?: boolean;
  active: boolean;
}

// =====================================================
// LEAVE REQUEST
// =====================================================

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee?: Worker;
  category: RequestCategory;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  request_date: string;
  response_date?: string;
  document_url?: string;
  document_name?: string;
  rrhh_observation?: string;
  history?: RequestHistoryEntry[];
}

export interface RequestHistoryEntry {
  id: number;
  action: string;
  description: string;
  user_name: string;
  created_at: string;
}

export interface CreateRequestPayload {
  category_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  document?: File;
}

export interface RejectRequestPayload {
  observation: string;
}

// =====================================================
// WORKER (RRHH view of employee)
// =====================================================

export interface Worker {
  id: number;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
  dni: string;
  area?: Area;
  position?: Position;
  address?: string;
  phone?: string;
  monthly_permission_limit?: number | null;
  monthly_absence_limit?: number | null;
  active: boolean;
  created_at?: string;
}

export interface CreateWorkerPayload {
  name: string;
  last_name: string;
  dni: string;
  email: string;
  area_id: number;
  position_id: number;
  address?: string;
  phone?: string;
  monthly_permission_limit?: number | null;
  monthly_absence_limit?: number | null;
  password: string;
}

export interface UpdateWorkerPayload {
  name?: string;
  last_name?: string;
  dni?: string;
  email?: string;
  area_id?: number;
  position_id?: number;
  address?: string;
  phone?: string;
  monthly_permission_limit?: number | null;
  monthly_absence_limit?: number | null;
}

// =====================================================
// CALENDAR
// =====================================================

export interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  category: string;
  status: RequestStatus;
  employee_name?: string;
}

// =====================================================
// NOTIFICATION
// =====================================================

export interface AppNotification {
  id: string | number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  request_id?: number;
}

// =====================================================
// API RESPONSE WRAPPERS
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    per_page: number;
  };
}

// =====================================================
// HR DASHBOARD
// =====================================================

export interface HrDashboardStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  recent_requests: LeaveRequest[];
}

// =====================================================
// FILTERS
// =====================================================

export interface RequestFilters {
  search?: string;
  category_id?: number;
  status?: RequestStatus | '';
  start_date?: string;
  end_date?: string;
}

// =====================================================
// REPORTES DE RRHH
// =====================================================

export interface HrReportSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface HrRequestReport {
  summary: HrReportSummary;
  items: LeaveRequest[];
}

export interface HrReportFilters {
  from?: string;
  to?: string;
  worker_id?: number | '';
  area_id?: number | '';
  category_id?: number | '';
  status?: RequestStatus | '';
}

export interface HrRequestAnalytics {
  total: number;
  approved: number;
  rejected: number;
  series: Array<{ label: string; value: number; color: string }>;
}
