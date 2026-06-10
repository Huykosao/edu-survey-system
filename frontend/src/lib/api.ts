// =============================================================
// EduSurvey — API Client
// Centralized fetch wrapper with auth token management
// =============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Token storage helpers
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("edu_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("edu_refresh_token");
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("edu_access_token", access);
  if (refresh) {
    localStorage.setItem("edu_refresh_token", refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem("edu_access_token");
  localStorage.removeItem("edu_refresh_token");
  localStorage.removeItem("edu_user");
}

export function setStoredUser(user: Record<string, unknown>) {
  localStorage.setItem("edu_user", JSON.stringify(user));
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("edu_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// API Error class
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Core fetch wrapper
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 — try refresh token
  if (res.status === 401) {
    const isLoginEndpoint = url.includes("/auth/login");
    const refreshToken = getRefreshToken();
    
    if (refreshToken && !isLoginEndpoint) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTokens(data.access_token, data.refresh_token);
          // Retry original request
          headers["Authorization"] = `Bearer ${data.access_token}`;
          const retryRes = await fetch(url, { ...options, headers });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => null);
            throw new ApiError(
              errData?.detail || "Request failed",
              retryRes.status,
              errData,
            );
          }
          return retryRes.json();
        }
      } catch {
        // Refresh failed — clear and redirect
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError("Session expired", 401);
      }
    }
    
    if (!isLoginEndpoint) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    const errData = await res.json().catch(() => null);
    throw new ApiError(
      errData?.detail || "Unauthorized",
      401,
      errData
    );
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new ApiError(
      errData?.detail || `HTTP Error ${res.status}`,
      res.status,
      errData,
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// =============================================================
// Auth API
// =============================================================
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{
      access_token: string;
      refresh_token?: string;
      user: Record<string, unknown>;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  me: () => apiFetch<Record<string, unknown>>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),

  refreshToken: (refreshToken: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>(
      "/auth/refresh-token",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    ),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// =============================================================
// User Management API (Admin)
// =============================================================
export const usersApi = {
  list: (params?: { role?: string; status?: string; page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiFetch<{ data: Record<string, unknown>[]; total: number }>(
      `/api/users${qs ? `?${qs}` : ""}`,
    );
  },

  get: (id: number) => apiFetch<Record<string, unknown>>(`/api/users/${id}`),

  create: (data: {
    email: string;
    full_name: string;
    password: string;
    role_ids?: number[];
    phone?: string;
    faculty_id?: number;
  }) =>
    apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  bulkCreate: (data: {
    users: {
      email: string;
      full_name: string;
      password: string;
      role_ids?: number[];
      phone?: string;
      faculty_name?: string;
    }[];
  }) =>
    apiFetch("/api/users/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),

  updateStatus: (id: number, status: string) =>
    apiFetch(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getRoles: (id: number) =>
    apiFetch<Record<string, unknown>[]>(`/api/users/${id}/roles`),

  updateRoles: (id: number, roleIds: number[]) =>
    apiFetch(`/api/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ role_ids: roleIds }),
    }),

  listLogs: () => apiFetch<Record<string, unknown>[]>("/api/system-logs"),
};

// =============================================================
// Allowed Domains API (Admin)
// =============================================================
export const allowedDomainsApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/allowed-domains"),
  create: (data: { domain: string; description?: string }) =>
    apiFetch<Record<string, unknown>>("/api/allowed-domains", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { domain: string; description?: string }) =>
    apiFetch<Record<string, unknown>>(`/api/allowed-domains/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch(`/api/allowed-domains/${id}`, { method: "DELETE" }),
};

// =============================================================
// Roles API
// =============================================================
export const rolesApi = {
  list: () => apiFetch<{ data: Record<string, unknown>[] }>("/roles"),
};

// =============================================================
// Master Data APIs (Faculties, Majors, Classes, Subjects)
// =============================================================
export const facultiesApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/faculties"),
  create: (data: { name: string }) =>
    apiFetch("/api/faculties", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name: string }) =>
    apiFetch(`/api/faculties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch(`/api/faculties/${id}`, { method: "DELETE" }),
};

export const majorsApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/majors"),
  create: (data: { name: string; faculty_id: number }) =>
    apiFetch("/api/majors", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/api/majors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => apiFetch(`/api/majors/${id}`, { method: "DELETE" }),
};

export const classesApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/classes"),
  create: (data: { name: string; major_id: number }) =>
    apiFetch("/api/classes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/api/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => apiFetch(`/api/classes/${id}`, { method: "DELETE" }),
};

export const subjectsApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/subjects"),
  create: (data: { code: string; name: string; faculty_id: number }) =>
    apiFetch("/api/subjects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/api/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => apiFetch(`/api/subjects/${id}`, { method: "DELETE" }),
};

// =============================================================
// Profile API
// =============================================================
export const profileApi = {
  get: () => apiFetch<Record<string, unknown>>("/api/profile"),
  update: (data: Record<string, unknown>) =>
    apiFetch("/api/profile", { method: "PUT", body: JSON.stringify(data) }),
  getDetails: () => apiFetch<Record<string, unknown>>("/api/profile/details"),
  updateDetails: (data: Record<string, unknown>) =>
    apiFetch("/api/profile/details", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// =============================================================
// Survey Management API
// =============================================================
export const surveysApi = {
  list: (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    const qs = query.toString();
    return apiFetch<{ data: Record<string, unknown>[]; total: number }>(
      `/api/surveys${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: number) => apiFetch<Record<string, unknown>>(`/api/surveys/${id}`),
  create: (data: Record<string, unknown>) =>
    apiFetch("/api/surveys", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiFetch(`/api/surveys/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => apiFetch(`/api/surveys/${id}`, { method: "DELETE" }),
  publish: (id: number) =>
    apiFetch(`/api/surveys/${id}/publish`, { method: "POST" }),
  close: (id: number) =>
    apiFetch(`/api/surveys/${id}/close`, { method: "POST" }),
  duplicate: (id: number) =>
    apiFetch(`/api/surveys/${id}/duplicate`, { method: "POST" }),
  mySurveys: () => apiFetch<Record<string, unknown>[]>("/api/my-surveys"),
  myCompletedSurveys: () => apiFetch<Record<string, unknown>[]>("/api/my-completed-surveys"),
  getAnalysis: (
    id: number,
    params?: { segment_type?: string; segment_value?: string },
  ) => {
    const query = new URLSearchParams();
    if (params?.segment_type) query.set("segment_type", params.segment_type);
    if (params?.segment_value) query.set("segment_value", params.segment_value);
    const qs = query.toString();
    return apiFetch<Record<string, unknown>>(
      `/api/surveys/${id}/analysis${qs ? `?${qs}` : ""}`,
    );
  },
};

// =============================================================
// Survey Response API
// =============================================================
export const responsesApi = {
  submit: (surveyId: number, data: Record<string, unknown>) =>
    apiFetch(`/api/surveys/${surveyId}/responses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  myResponse: (surveyId: number) =>
    apiFetch<Record<string, unknown> | null>(
      `/api/surveys/${surveyId}/my-response`,
    ),
  list: (surveyId: number) =>
    apiFetch<Record<string, unknown>[]>(`/api/surveys/${surveyId}/responses`),
  get: (id: number) =>
    apiFetch<Record<string, unknown>>(`/api/responses/${id}`),
};

// =============================================================
// Dashboard / Statistics API
// =============================================================
export const dashboardApi = {
  overview: () => apiFetch<Record<string, unknown>>("/api/dashboard/overview"),
  faculties: () =>
    apiFetch<Record<string, unknown>[]>("/api/dashboard/faculties"),
  subjects: () =>
    apiFetch<Record<string, unknown>[]>("/api/dashboard/subjects"),
  survey: (id: number) =>
    apiFetch<Record<string, unknown>>(`/api/dashboard/surveys/${id}`),
};

// =============================================================
// Notification API
// =============================================================
export const notificationsApi = {
  list: () => apiFetch<Record<string, unknown>[]>("/api/notifications"),
  unread: () =>
    apiFetch<Record<string, unknown>[]>("/api/notifications/unread"),
  markRead: (id: number) =>
    apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    apiFetch("/api/notifications/read-all", { method: "PATCH" }),
};

// =============================================================
// Clarification Workflow API
// =============================================================
export const clarificationsApi = {
  request: (data: {
    survey_id: number;
    lecturer_id: number;
    request_reason: string;
    deadline?: string;
  }) =>
    apiFetch("/api/clarifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listAll: () => apiFetch<Record<string, unknown>[]>("/api/clarifications"),

  listPendingApprovals: () =>
    apiFetch<Record<string, unknown>[]>("/api/responses-to-students/pending"),

  listTasks: () =>
    apiFetch<Record<string, unknown>[]>("/api/clarifications/my-tasks"),

  submit: (
    id: number,
    data: { explanation_content: string; commitment_text?: string },
  ) =>
    apiFetch(`/api/clarifications/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  approve: (id: number) =>
    apiFetch(`/api/clarifications/${id}/approve`, { method: "POST" }),

  reject: (id: number, adminComment: string) =>
    apiFetch(`/api/clarifications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ admin_comment: adminComment }),
    }),

  dispute: (id: number) =>
    apiFetch(`/api/clarifications/${id}/dispute`, { method: "POST" }),

  submitResponseToStudents: (id: number, messageContent: string) =>
    apiFetch(`/api/clarifications/${id}/responses`, {
      method: "POST",
      body: JSON.stringify({ message_content: messageContent }),
    }),

  approveResponseToStudents: (id: number) =>
    apiFetch(`/api/responses-to-students/${id}/approve`, { method: "POST" }),

  getStudentFeedbacks: () =>
    apiFetch<Record<string, unknown>[]>("/api/student-feedbacks"),
};

// =============================================================
// Improvement Announcement API
// =============================================================
export const improvementsApi = {
  create: (data: {
    survey_id?: number;
    title: string;
    content: string;
    target_roles?: string[];
  }) =>
    apiFetch("/api/improvements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: () => apiFetch<Record<string, unknown>[]>("/api/improvements"),

  get: (id: number) =>
    apiFetch<Record<string, unknown>>(`/api/improvements/${id}`),
};

// =============================================================
// AI Analysis API
// =============================================================
export const aiApi = {
  /** Chạy AI gán nhãn cho khảo sát */
  classify: (surveyId: number, roleId?: number) => {
    const qs = roleId ? `?role_id=${roleId}` : "";
    return apiFetch<{ message: string }>(
      `/api/surveys/${surveyId}/ai-classify${qs}`,
      { method: "POST" },
    );
  },

  /** Chạy AI tạo báo cáo phân tích xu hướng */
  generateReport: (surveyId: number) =>
    apiFetch<Record<string, unknown>>(`/api/surveys/${surveyId}/ai-report`, {
      method: "POST",
    }),

  /** Lấy báo cáo AI đã lưu */
  getReport: (surveyId: number) =>
    apiFetch<Record<string, unknown> | null>(
      `/api/surveys/${surveyId}/ai-report`,
    ),

  /** Lấy tổng quan AI (nhãn, sentiment) */
  getOverview: (surveyId: number) =>
    apiFetch<Record<string, unknown>>(`/api/surveys/${surveyId}/ai-overview`),
};

// =============================================================
// Labels API
// =============================================================
export const labelsApi = {
  listByRole: (roleId: number) =>
    apiFetch<Record<string, unknown>>(`/api/label/${roleId}`),

  create: (data: { role_id: number; label_name: string }) =>
    apiFetch<Record<string, unknown>>("/api/label", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
