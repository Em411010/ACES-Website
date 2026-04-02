import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try refreshing the token once
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem("accessToken", data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        window.location.href = "/";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Roles ───────────────────────────────────────────
export const rolesApi = {
  getAll: () => api.get("/roles").then((r) => r.data),
  updatePermissions: (id: string, permissions: string[]) =>
    api.put(`/roles/${id}/permissions`, { permissions }).then((r) => r.data),
};

// ─── Users ───────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  getPending: () => api.get("/users/pending").then((r) => r.data),
  approve: (id: string) => api.put(`/users/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.delete(`/users/${id}/reject`).then((r) => r.data),
  changeRole: (id: string, roleId: string) =>
    api.put(`/users/${id}/role`, { roleId }).then((r) => r.data),
  update: (id: string, payload: { firstName?: string; middleName?: string; lastName?: string; studentNumber?: string; section?: string }) =>
    api.put(`/users/${id}`, payload).then((r) => r.data),
  uploadAvatar: (id: string, formData: FormData) =>
    api.put(`/users/${id}/avatar`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  verifyPassword: (password: string) =>
    api.post("/users/verify-password", { password }).then((r) => r.data),
  passChairmanship: (payload: { password: string; newChairmanId: string; selfRoleName: "Alumni" | "Member" }) =>
    api.post("/users/pass-chairmanship", payload).then((r) => r.data),
};

// ─── Announcements ───────────────────────────────────
export const announcementsApi = {
  getAll: () => api.get("/announcements").then((r) => r.data),
  create: (payload: { title: string; content: string; isMustRead?: boolean }) =>
    api.post("/announcements", payload).then((r) => r.data),
  update: (id: string, payload: { title: string; content: string; isMustRead?: boolean }) =>
    api.put(`/announcements/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/announcements/${id}`).then((r) => r.data),
  acknowledge: (id: string) =>
    api.post(`/announcements/${id}/acknowledge`).then((r) => r.data),
};

// ─── Tasks ───────────────────────────────────────────
export const tasksApi = {
  getAll: () => api.get("/tasks").then((r) => r.data),
  create: (payload: {
    title: string;
    description: string;
    deadline: string;
    assignees?: string[];
    eventCluster?: string;
  }) => api.post("/tasks", payload).then((r) => r.data),
  updateStatus: (id: string, status: "todo" | "in-progress" | "review" | "done") =>
    api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data),
  update: (
    id: string,
    payload: {
      title: string;
      description: string;
      deadline: string;
      assignees: string[];
      eventCluster?: string;
      status: "todo" | "in-progress" | "review" | "done";
    }
  ) => api.put(`/tasks/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// ─── Events ──────────────────────────────────────────
export const eventsApi = {
  getAll: () => api.get("/events").then((r) => r.data),
  create: (name: string) => api.post("/events", { name }).then((r) => r.data),
  update: (id: string, name: string) => api.put(`/events/${id}`, { name }).then((r) => r.data),
  remove: (id: string) => api.delete(`/events/${id}`).then((r) => r.data),
};

// ─── Documents ───────────────────────────────────────
export const documentsApi = {
  getAll: () => api.get("/documents").then((r) => r.data),
  upload: (formData: FormData) =>
    api
      .post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
  download: (id: string, variant: "pdf" | "docx" = "pdf") =>
    api.get(`/documents/${id}/download/${variant}`, { responseType: "blob" }),
  preview: (id: string) => api.get(`/documents/${id}/preview`).then((r) => r.data),
  remove: (id: string) => api.delete(`/documents/${id}`).then((r) => r.data),
};

export const activitiesApi = {
  getAll: () => api.get("/activities").then((r) => r.data),
  getById: (id: string) => api.get(`/activities/${id}`).then((r) => r.data),
  create: (formData: FormData) =>
    api.post("/activities", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  update: (id: string, formData: FormData) =>
    api.put(`/activities/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  remove: (id: string) => api.delete(`/activities/${id}`).then((r) => r.data),
  selfMark: (id: string) => api.post(`/activities/${id}/self-mark`).then((r) => r.data),
  scanQR: (id: string, digitalIDHash: string) =>
    api.post(`/activities/${id}/scan`, { digitalIDHash }).then((r) => r.data),
  userAttendance: (userId: string) => api.get(`/activities/user/${userId}/attendance`).then((r) => r.data),
};

// ─── Audit Logs ──────────────────────────────────────
export const auditLogsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    module?: string;
    action?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => api.get("/audit-logs", { params }).then((r) => r.data),
  getModules: () => api.get("/audit-logs/modules").then((r) => r.data),
  getActions: () => api.get("/audit-logs/actions").then((r) => r.data),
};

// ─── Notifications ───────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get("/notifications", { params }).then((r) => r.data),
  getUnreadCount: () =>
    api.get("/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    api.put("/notifications/read-all").then((r) => r.data),
};

// ─── Global Search ───────────────────────────────────
export interface SearchResult {
  type: "member" | "announcement" | "task" | "document" | "activity";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  linkState?: Record<string, string>;
  avatar?: string | null;
  image?: string | null;
  role?: { name: string; color: string } | null;
  status?: string;
  isMustRead?: boolean;
}

export const searchApi = {
  query: (q: string) =>
    api.get<{ results: SearchResult[] }>("/search", { params: { q } }).then((r) => r.data),
};
