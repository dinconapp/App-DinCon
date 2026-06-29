"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, validateSession } from "@/services/authService";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.id || !session?.access_token) {
      router.replace("/login");
      return;
    }
    void validateSession()
      .then(() => setReady(true))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ready) return <div className="cf-card">Validando sessao...</div>;
  return children;
}
