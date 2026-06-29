import type { ToastState } from "@/hooks/useToast";

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return <div className="cf-toast">{toast.message}</div>;
}
