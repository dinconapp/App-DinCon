"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/services/dashboardService";
import { getBalanceProjection } from "@/services/projectionService";
import type { Dashboard } from "@/types/dashboard";
import type { Projection } from "@/types/projection";

export function useDashboard(userId: string, monthKey: string) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, projectionData] = await Promise.all([getDashboard(userId, monthKey), getBalanceProjection(userId, 12)]);
      setData(dashboard);
      setProjection(projectionData);
    } catch {
      setError("Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId, monthKey]);

  return { data, projection, loading, error, reload: load };
}
