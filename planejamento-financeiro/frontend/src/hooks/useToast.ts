"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastState = { message: string; tone?: "success" | "error" } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const showToast = useCallback((message: string, tone: "success" | "error" = "success") => setToast({ message, tone }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return { toast, showToast, clearToast: () => setToast(null) };
}
