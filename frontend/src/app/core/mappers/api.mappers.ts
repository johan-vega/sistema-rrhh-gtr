import {
  ApiResponse,
  AppNotification,
  CalendarEvent,
  HrDashboardStats,
  LeaveRequest,
  RequestCategory,
  RequestHistoryEntry,
  RequestStatus,
  Worker,
} from '../models/index';

type BackendStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

const statusMap: Record<BackendStatus, RequestStatus> = {
  PENDIENTE: 'PENDING',
  APROBADA: 'APPROVED',
  RECHAZADA: 'REJECTED',
  CANCELADA: 'CANCELLED',
};

export function apiList<T>(data: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

export function mapCategory(category: any): RequestCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? undefined,
    requires_document: Boolean(category.requires_document),
    minimum_advance_days: category.minimum_notice_days ?? category.minimum_advance_days ?? 0,
    maximum_past_days: category.maximum_past_days ?? 0,
    is_absence: Boolean(category.is_absence),
    active: Boolean(category.active),
  };
}

export function mapWorker(worker: any): Worker {
  return {
    id: worker.id,
    name: worker.first_name ?? worker.name ?? '',
    last_name: worker.last_name ?? '',
    full_name: worker.full_name ?? [worker.first_name ?? worker.name, worker.last_name].filter(Boolean).join(' '),
    email: worker.email ?? '',
    dni: worker.dni ?? '',
    area: worker.area,
    position: worker.position,
    address: worker.address ?? undefined,
    phone: worker.phone ?? undefined,
    dni_address: worker.dni_address ?? null,
    emergency_phone: worker.emergency_phone ?? null,
    worker_type: worker.worker_type ?? null,
    birth_date: worker.birth_date ?? null,
    hire_date: worker.hire_date ?? null,
    has_photo: Boolean(worker.has_photo),
    monthly_permission_limit: worker.monthly_permission_limit ?? null,
    monthly_absence_limit: worker.monthly_absence_limit ?? null,
    active: Boolean(worker.active),
    created_at: worker.created_at ?? undefined,
  };
}

export function mapHistory(history: any): RequestHistoryEntry {
  return {
    id: history.id,
    action: history.action,
    description: history.comment ?? history.action,
    user_name: history.user?.name ?? 'Sistema',
    created_at: history.created_at,
  };
}

export function mapRequest(request: any): LeaveRequest {
  return {
    id: request.id,
    employee_id: request.worker?.id ?? request.worker_id ?? 0,
    employee: request.worker ? mapWorker(request.worker) : undefined,
    category: mapCategory(request.category),
    start_date: request.start_date,
    end_date: request.end_date,
    reason: request.reason,
    status: statusMap[request.status as BackendStatus] ?? request.status,
    request_date: request.requested_at ?? request.request_date,
    response_date: request.responded_at ?? request.response_date ?? undefined,
    document_url: request.documents?.[0]?.download_url,
    document_name: request.documents?.[0]?.original_name,
    rrhh_observation: request.hr_observation ?? request.rrhh_observation ?? undefined,
    history: request.history?.map(mapHistory),
  };
}

export function mapCalendarEvent(request: any): CalendarEvent {
  const mapped = mapRequest(request);
  return {
    id: mapped.id,
    title: mapped.category.name,
    start_date: mapped.start_date,
    end_date: mapped.end_date,
    category: mapped.category.name,
    status: mapped.status,
    employee_name: mapped.employee?.full_name,
  };
}

export function mapNotification(notification: any): AppNotification {
  const data = notification.data ?? {};
  return {
    id: notification.id,
    title: data.event?.replaceAll('_', ' ') ?? 'Notificación',
    message: data.message ?? 'Tienes una nueva notificación.',
    read: Boolean(notification.read_at),
    created_at: notification.created_at,
    request_id: data.request_id,
  };
}

export function mapDashboard(data: any): HrDashboardStats {
  return {
    pending: data.pending ?? data.pending_requests ?? 0,
    approved: data.approved ?? 0,
    rejected: data.rejected ?? 0,
    cancelled: data.cancelled ?? 0,
    recent_requests: apiList(data.recent_requests).map(mapRequest),
  };
}

export function mapResponse<TSource, TTarget>(response: ApiResponse<TSource>, mapper: (data: TSource) => TTarget): ApiResponse<TTarget> {
  return { ...response, data: mapper(response.data) };
}
