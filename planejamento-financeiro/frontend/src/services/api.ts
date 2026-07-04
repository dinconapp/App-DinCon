import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("dincon.auth.session");
    if (raw) {
      try {
        const session = JSON.parse(raw) as { access_token?: string };
        if (session.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
      } catch {
        // Sessao local invalida nao deve quebrar a request.
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    const method = String(error?.config?.method || "GET").toUpperCase();
    const url = String(error?.config?.url || "").replace(/^https?:\/\/[^/]+/i, "");
    const routeHint = url ? ` [${method} ${url}]` : "";
    if (typeof detail === "string") {
      return Promise.reject(new Error(`${detail}${routeHint}`));
    }
    if (detail && typeof detail === "object") {
      const message = typeof detail.message === "string" ? detail.message : "Erro na requisição.";
      return Promise.reject(new Error(`${message}${routeHint}`));
    }
    return Promise.reject(error);
  },
);
