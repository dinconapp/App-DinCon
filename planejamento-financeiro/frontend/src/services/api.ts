import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api",
  timeout: 12000
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
