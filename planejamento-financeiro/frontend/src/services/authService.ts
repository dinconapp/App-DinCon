"use client";

import { api } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  email_verified?: boolean;
  active?: boolean;
  access_token?: string;
};

export type RegisterResult = {
  status: string;
  message: string;
  email: string;
};

const SESSION_KEY = "dincon.auth.session";

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function authErrorMessage(error: unknown, fallback: string) {
  const detail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: string | { message?: string } } } }).response?.data?.detail
    : null;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && detail.message) return detail.message;
  return error instanceof Error ? error.message : fallback;
}

export function authErrorStatus(error: unknown) {
  const detail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: { status?: string } } } }).response?.data?.detail
    : null;
  return detail && typeof detail === "object" ? detail.status : null;
}

export async function signUp(name: string, email: string, phone: string, password: string) {
  const { data } = await api.post<RegisterResult>("/auth/register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password,
  });
  return data;
}

export async function verifyEmail(email: string, code: string) {
  const { data } = await api.post<{ status: string; message: string }>("/auth/verify-email", {
    email: email.trim().toLowerCase(),
    code: code.trim(),
  });
  return data;
}

export async function resendEmailCode(email: string) {
  const { data } = await api.post<{ status: string; message: string }>("/auth/resend-email-code", {
    email: email.trim().toLowerCase(),
  });
  return data;
}

export async function startPasswordReset(email: string) {
  const { data } = await api.post<{ status: string; message: string }>("/auth/password-reset/start", {
    email: email.trim().toLowerCase(),
  });
  return data;
}

export async function confirmPasswordReset(email: string, code: string, password: string) {
  const { data } = await api.post<{ status: string; message: string }>("/auth/password-reset/confirm", {
    email: email.trim().toLowerCase(),
    code: code.trim(),
    password,
  });
  return data;
}

export async function signIn(email: string, password: string) {
  const { data } = await api.post<{ access_token: string; token_type: string; user: AuthUser }>("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  const session = { ...data.user, access_token: data.access_token };
  writeSession(session);
  return session;
}

export async function validateSession() {
  const session = getSession();
  if (!session?.access_token) return null;
  const { data } = await api.get<AuthUser>("/auth/me");
  const next = { ...session, ...data };
  writeSession(next);
  return next;
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function resetPassword(email: string, password: string) {
  void email;
  void password;
  throw new Error("Use o fluxo com codigo de verificacao por SMS.");
}

export function changePassword(currentPassword: string, nextPassword: string) {
  void currentPassword;
  void nextPassword;
  throw new Error("Troca de senha ainda nao foi migrada para o backend.");
}

export function updateSessionProfile(data: { name: string; email?: string | null; phone?: string | null }) {
  const session = getSession();
  if (!session) throw new Error("Sessao expirada.");
  writeSession({
    ...session,
    name: data.name.trim(),
    email: data.email?.trim().toLowerCase() || session.email,
    phone: data.phone?.trim() || "",
  });
}
